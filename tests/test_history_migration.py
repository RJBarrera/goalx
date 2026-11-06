"""Pruebas sin Railway: cambian solo el adaptador, no hacen INSERT reales."""

import importlib.util
import os
import sys
import tempfile
import types
import unittest
from datetime import datetime, timezone
from pathlib import Path
from unittest.mock import patch

BASE = Path(__file__).resolve().parents[1] / "server"


def import_service():
    # En el proyecto real competition_config importa competitions.py.
    # La prueba simula solo la configuración y evita depender de ese archivo.
    conf = types.ModuleType("competition_config")
    conf.DEFAULT_COMPETITION_ID = "liga-mx"
    conf.COMPETITION_EQUIVALENCES = {"liga-mx": {}}

    def get_competition(cid=None):
        return {
            "id": cid or "liga-mx",
            "name": "Liga MX",
            "seed_history_filename": "test_seed.csv",
            "history_filename": "historial_ligamx_2023.csv",
            "seed_highlights_filename": "test_seed_highlights.json",
            "highlights_filename": "season_highlights.json",
            "season_mode": "split_calendar",
        }

    conf.get_competition = get_competition
    repo_module = types.ModuleType("postgres_history_repository")

    class FakeRepo:
        def __init__(self, competition_id):
            self.label = "public.historial_ligamx_2023"
            self.rows = []
            self.validated = False

        def validate(self):
            self.validated = True

        def load_history(self):
            import pandas as pd

            return pd.DataFrame(
                self.rows,
                columns=[
                    "fixture_id",
                    "date",
                    "referee",
                    "home_team",
                    "away_team",
                    "home_goals",
                    "away_goals",
                    "home_corners",
                    "away_corners",
                    "total_corners",
                    "home_cards",
                    "away_cards",
                    "total_cards",
                    "home_sont",
                    "away_sont",
                    "home_shots_off",
                    "away_shots_off",
                    "home_shots_total",
                    "away_shots_total",
                ],
            )

        def has_fixture(self, fid):
            return any(r["fixture_id"] == int(fid) for r in self.rows)

        def insert_finished_match(self, row):
            if self.has_fixture(row["fixture_id"]):
                return False
            self.rows.append(row)
            return True

        def revision(self):
            return [
                len(self.rows),
                max((r["fixture_id"] for r in self.rows), default=None),
                max((r["date"] for r in self.rows), default=None),
            ]

        def stats(self):
            return {
                "records": len(self.rows),
                "years": [2026] if self.rows else [],
                "revision": self.revision(),
            }

    repo_module.PostgresHistoryRepository = FakeRepo
    with patch.dict(
        sys.modules,
        {
            "competition_config": conf,
            "postgres_history_repository": repo_module,
        },
    ):
        spec = importlib.util.spec_from_file_location(
            "migrated_history_test", BASE / "match_history_service.py"
        )
        mod = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(mod)
    return mod, repo_module


def fixture():
    return {
        "fixture_id": 777,
        "date": "2026-11-06T20:00:00+00:00",
        "status": {"short": "FT"},
        "referee": "Ejemplo",
        "home": {"name": "Toluca", "goals": 2},
        "away": {"name": "Necaxa", "goals": 1},
        "statistics": {
            "home": {
                "values": {
                    "Corner Kicks": 5,
                    "Yellow Cards": 2,
                    "Shots on Goal": 4,
                    "Total Shots": 9,
                }
            },
            "away": {
                "values": {
                    "Corner Kicks": 3,
                    "Yellow Cards": 1,
                    "Shots on Goal": 2,
                    "Total Shots": 5,
                }
            },
        },
        "events": [],
    }


class TestHistoryMigration(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.env = patch.dict(
            os.environ,
            {
                "GOALX_HISTORY_BACKEND": "postgres",
                "MATCHLAB_HISTORY_PATH": str(self.root / "matches.csv"),
                "MATCHLAB_DATASET_STATE_PATH": str(self.root / "state.json"),
            },
        )
        self.env.start()
        self.addCleanup(self.env.stop)
        self.module, repo_module = import_service()
        self.repo_patcher = patch.dict(
            sys.modules, {"postgres_history_repository": repo_module}
        )
        self.repo_patcher.start()
        self.addCleanup(self.repo_patcher.stop)
        self.service = self.module.MatchHistoryService()

    def test_csv_mode_remains_available_for_rollback(self):
        with patch.dict(os.environ, {"GOALX_HISTORY_BACKEND": "csv"}):
            fallback = self.module.MatchHistoryService()
        self.assertTrue((self.root / "matches.csv").exists())
        self.assertEqual(fallback.history_backend, "csv")
        self.assertEqual(
            list(fallback.load_history().columns), self.module.HISTORY_COLUMNS
        )

    def test_does_not_create_csv(self):
        self.assertFalse((self.root / "matches.csv").exists())
        self.assertTrue((self.root / "state.json").exists())
        self.assertTrue(self.service.postgres_repository.validated)

    def test_insert_and_duplicate(self):
        first = self.service.save_finished_match(fixture())
        second = self.service.save_finished_match(fixture())
        self.assertEqual(first["action"], "saved")
        self.assertEqual(first["records"], 1)
        self.assertEqual(second["action"], "duplicate")
        self.assertEqual(self.service.get_status()["records"], 1)
        self.assertFalse((self.root / "matches.csv").exists())

    def test_revision_detects_external_updates(self):
        baseline = self.service.get_history_revision()
        self.service.mark_models_clean(expected_revision=baseline)
        self.assertFalse(self.service.is_dirty())
        self.service.postgres_repository.insert_finished_match(
            self.service._build_row(fixture())[0]
        )
        self.assertTrue(self.service.is_dirty())

    def test_missing_stats_goes_pending_without_insert(self):
        bad = fixture()
        bad["statistics"]["home"]["values"].pop("Corner Kicks")
        result = self.service.save_finished_match(bad)
        self.assertEqual(result["action"], "pending")
        self.assertFalse(self.service.postgres_repository.rows)
        self.assertIn(777, self.service.get_pending_fixture_ids())


if __name__ == "__main__":
    unittest.main()
