import threading
import time

import pandas as pd

from competition_config import (
    DEFAULT_COMPETITION_ID,
    get_competition,
    list_competitions,
)
from dataset_sync_service import DatasetSyncService
from live_service import LiveFootballService
from match_history_service import MatchHistoryService
from prediccion_ligamx import (
    DixonColesModel,
    SpecialMarketsModel,
)
from ml_models import (
    entrenar_xgboost_tarjetas,
    entrenar_xgboost_tarjetas_probabilidad,
    entrenar_xgboost_marcadores,
)

REQUIRED_DATASET_COLUMNS = [
    "home_team",
    "away_team",
    "referee",
    "home_goals",
    "away_goals",
    "home_corners",
    "away_corners",
    "total_corners",
    "home_cards",
    "away_cards",
    "total_cards",
    "date",
]


def _unique_values(series):
    values = {}

    for value in series:
        if pd.isna(value):
            continue

        text = str(value).strip()

        if not text:
            continue

        normalized = text.casefold()

        if normalized in {
            "nan",
            "null",
            "none",
            "n/a",
        }:
            continue

        if normalized not in values:
            values[normalized] = text

    result = list(values.values())
    result.sort(key=lambda item: item.casefold())

    return result


class CompetitionRuntime:
    def __init__(
        self,
        competition,
    ):
        self.competition = competition
        self.state = {
            "df": None,
            "dc_model": None,
            "spec_model": None,
            "xgb_tarjetas": None,
            "equipos": [],
            "arbitros": [],
            "model_ready": False,
            "dataset_records": 0,
            "model_min_matches": int(competition.get("model_min_matches", 1)),
            "model_message": "Motor estadístico pendiente de inicialización.",
        }
        self.model_lock = threading.RLock()
        self.initialized = False

        self.live_service = LiveFootballService(
            competition=competition,
        )
        self.history_service = MatchHistoryService(
            competition=competition,
        )
        self.dataset_sync_service = DatasetSyncService(
            live_service=self.live_service,
            history_service=self.history_service,
            competition=competition,
        )


class CompetitionManager:
    def __init__(self):
        self._runtimes = {}
        self._lock = threading.RLock()

    def list_competitions(self):
        return list_competitions()

    def get_runtime(
        self,
        competition_id=None,
    ):
        competition = get_competition(competition_id)
        competition_id = competition["id"]

        with self._lock:
            runtime = self._runtimes.get(competition_id)

            if runtime is None:
                runtime = CompetitionRuntime(competition)
                self._runtimes[competition_id] = runtime

            return runtime

    def initialize_models(
        self,
        competition_id=None,
        force=False,
    ):
        runtime = self.get_runtime(competition_id)

        with runtime.model_lock:
            if runtime.initialized and not force:
                return runtime.state

            history_path = runtime.history_service.history_path

            print("\n" + "=" * 50)
            print(
                "⚽ GOALX - INICIANDO MOTOR ESTADÍSTICO",
                runtime.competition["name"],
            )
            print("=" * 50)
            print(f"📂 CSV: {history_path}")

            if not history_path.is_file():
                raise FileNotFoundError(f"No se encontró el CSV: {history_path}")

            df = pd.read_csv(history_path)

            missing = [
                column
                for column in REQUIRED_DATASET_COLUMNS
                if column not in df.columns
            ]

            if missing:
                raise RuntimeError(
                    "Faltan columnas obligatorias: " + ", ".join(missing)
                )

            if not df.empty:
                df["home_team"] = df["home_team"].apply(
                    runtime.history_service.normalize_team_name
                )
                df["away_team"] = df["away_team"].apply(
                    runtime.history_service.normalize_team_name
                )

                equipos = _unique_values(
                    pd.concat(
                        [
                            df["home_team"],
                            df["away_team"],
                        ],
                        ignore_index=True,
                    )
                )

                arbitros = _unique_values(df["referee"])
                arbitros = [
                    referee
                    for referee in arbitros
                    if referee.casefold() != "desconocido"
                ]
                arbitros.insert(0, "Desconocido")
            else:
                equipos = []
                arbitros = ["Desconocido"]

            records = len(df)
            minimum = int(runtime.competition.get("model_min_matches", 1))

            runtime.state["df"] = df
            runtime.state["equipos"] = equipos
            runtime.state["arbitros"] = arbitros
            runtime.state["dataset_records"] = records
            runtime.state["model_min_matches"] = minimum
            runtime.state["dc_model"] = None
            runtime.state["spec_model"] = None
            runtime.state["model_ready"] = False

            print(f"✅ Partidos cargados: {records}")
            print(f"✅ Equipos disponibles: {len(equipos)}")
            print(f"✅ Árbitros disponibles: {len(arbitros)}")

            if records < minimum:
                missing_records = max(0, minimum - records)
                runtime.state["model_message"] = (
                    f"El histórico de {runtime.competition['name']} "
                    f"tiene {records} partidos. Se requieren al menos "
                    f"{minimum} para habilitar el motor estadístico. "
                    f"Faltan {missing_records}."
                )
                runtime.initialized = True
                runtime.history_service.mark_models_clean()

                print(
                    "🟡 MOTOR EN ESPERA:",
                    runtime.state["model_message"],
                )

                return runtime.state

            print("⚙️ Entrenando Dixon-Coles...")
            started = time.time()
            dc_model = DixonColesModel()
            dc_model.fit(df.copy())
            print(
                "   ✅ Dixon-Coles preparado en " f"{time.time() - started:.2f} segundos."
            )

            print("⚙️ Preparando mercados de córners y tarjetas...")
            started = time.time()
            spec_model = SpecialMarketsModel()
            spec_model.fit(df.copy())
            print(
                "   ✅ Mercados especiales preparados en "
                f"{time.time() - started:.2f} segundos."
            )

            print("⚙️ Entrenando modelo XGBoost para tarjetas...")
            started = time.time()
            xgb_model = entrenar_xgboost_tarjetas(df.copy())
            xgb_clasificador = entrenar_xgboost_tarjetas_probabilidad(df.copy())
            print("  ✅ XGBoost de tarjetas preparado en " f"{time.time() - started:.2f} segundos.")

            print("⚙️ Entrenando modelo XGBoost para marcadores...")
            started = time.time()
            xgb_marcadores, le_marcadores = entrenar_xgboost_marcadores(df.copy())
            print(
                f"  ✅ XGBoost de Marcadores preparado en {time.time() - started:.2f} seg."
            )

            runtime.state["dc_model"] = dc_model
            runtime.state["spec_model"] = spec_model
            runtime.state["xgb_tarjetas"] = xgb_model
            runtime.state["xgb_tarjetas_clasificador"] = xgb_clasificador
            runtime.state["xgb_marcadores"] = xgb_marcadores
            runtime.state["le_marcadores"] = le_marcadores
            runtime.state["model_ready"] = True
            runtime.state["model_message"] = (
                f"Motor estadístico de {runtime.competition['name']} listo."
            )
            runtime.initialized = True

            runtime.history_service.mark_models_clean()

            print(f"🟢 MOTOR {runtime.competition['name']} LISTO\n")

            return runtime.state

    def ensure_models_fresh(
        self,
        competition_id=None,
    ):
        runtime = self.get_runtime(competition_id)

        if not runtime.initialized:
            self.initialize_models(runtime.competition["id"])
            return True

        if not runtime.history_service.is_dirty():
            return False

        with runtime.model_lock:
            if not runtime.history_service.is_dirty():
                return False

            print(
                "🔄 Reentrenando modelos de",
                runtime.competition["name"],
            )
            self.initialize_models(
                runtime.competition["id"],
                force=True,
            )
            return True

    def preload_default(self):
        self.initialize_models(DEFAULT_COMPETITION_ID)

    def runtimes_for_dataset_sync(self):
        runtimes = []

        for competition in list_competitions():
            config = get_competition(competition["id"])

            if not config.get("dataset_sync_enabled", False):
                continue

            runtimes.append(self.get_runtime(config["id"]))

        return runtimes
