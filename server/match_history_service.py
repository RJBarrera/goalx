import json
import os
import shutil
import threading

from datetime import (
    datetime,
    timezone,
)

from pathlib import Path

import pandas as pd

# RUTAS
SERVER_DIR = Path(__file__).resolve().parent
SEED_HISTORY_PATH = SERVER_DIR / "historial_ligamx_2023.csv"


# COLUMNAS DEL DATASET
HISTORY_COLUMNS = [
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
]

# ESTADOS FINALES
FINAL_STATUSES = {
    "FT",
    "AET",
    "PEN",
}

# ESTADO DEFAULT
DEFAULT_STATE = {
    "last_update": None,
    "last_fixture_id": None,
    "last_match": None,
    "last_result": None,
    "records_added_total": 0,
    "dataset_dirty": False,
    "model_last_refresh": None,
    "last_sync": None,
    "last_sync_status": None,
    "last_sync_message": None,
    "pending_fixtures": {},
}

# Diccionario de traducción temporal en caliente
EQUIVALENCIAS = {"Atlante": "Mazatlán"}

# HELPERS
def _utc_now():

    return datetime.now(timezone.utc).isoformat()


def _fixture_key(
    value,
):

    if value is None:
        return ""

    try:

        if pd.isna(value):

            return ""

    except Exception:

        pass

    text = str(value).strip()

    # Pandas puede convertir 123456 -> 123456.0
    if text.endswith(".0") and text[:-2].isdigit():

        text = text[:-2]

    return text


def _to_int(
    value,
):

    if value is None:
        return None

    try:

        return int(float(value))

    except (
        TypeError,
        ValueError,
    ):

        return None


# SERVICIO
class MatchHistoryService:

    def __init__(
        self,
    ):

        # LOCAL
        # server/historial_ligamx_2023.csv

        # RAILWAY
        # MATCHLAB_HISTORY_PATH=/data/historial_ligamx_2023.csv
        # ====================================================
        configured_history = os.getenv("MATCHLAB_HISTORY_PATH")

        if configured_history:
            self.history_path = Path(configured_history)

        else:
            self.history_path = SEED_HISTORY_PATH

        configured_state = os.getenv("MATCHLAB_DATASET_STATE_PATH")

        if configured_state:
            self.state_path = Path(configured_state)

        else:
            self.state_path = self.history_path.parent / "dataset_state.json"

        self.highlights_path = self.history_path.parent / "season_highlights.json"

        self._lock = threading.RLock()
        self._initialize_storage()

    # INICIALIZAR STORAGE
    def _initialize_storage(
        self,
    ):

        with self._lock:
            self.history_path.parent.mkdir(
                parents=True,
                exist_ok=True,
            )

            self.state_path.parent.mkdir(
                parents=True,
                exist_ok=True,
            )

            # Copiar el historico base del repositorio.
            if not self.history_path.exists() and SEED_HISTORY_PATH.exists():

                if self.history_path.resolve() != SEED_HISTORY_PATH.resolve():

                    shutil.copy2(
                        SEED_HISTORY_PATH,
                        self.history_path,
                    )

            # SI NO EXISTE NADA
            if not self.history_path.exists():

                pd.DataFrame(columns=HISTORY_COLUMNS).to_csv(
                    self.history_path,
                    index=False,
                )

            self._validate_schema()

            if not self.state_path.exists():
                self._write_state(DEFAULT_STATE.copy())

            if not self.highlights_path.exists():
                self._write_highlights_state(
                    {
                        "version": 1,
                        "fixtures": {},
                    }
                )

    # VALIDAR CSV
    def _validate_schema(
        self,
    ):

        df = pd.read_csv(
            self.history_path,
            nrows=1,
        )

        missing = [column for column in HISTORY_COLUMNS if column not in df.columns]

        if missing:

            raise RuntimeError(
                "El histórico no tiene la estructura "
                "esperada. Columnas faltantes: " + ", ".join(missing)
            )

    # STATE
    def _read_state(
        self,
    ):

        try:

            with open(
                self.state_path,
                "r",
                encoding="utf-8",
            ) as file:

                data = json.load(file)

            return {
                **DEFAULT_STATE,
                **data,
            }

        except Exception:
            return DEFAULT_STATE.copy()

    def _write_state(
        self,
        state,
    ):

        temp_path = self.state_path.with_suffix(".json.tmp")

        with open(
            temp_path,
            "w",
            encoding="utf-8",
        ) as file:

            json.dump(
                state,
                file,
                ensure_ascii=False,
                indent=2,
            )

        os.replace(
            temp_path,
            self.state_path,
        )

    # Leer estado de destacados
    def _read_highlights_state(
        self,
    ):

        try:

            with open(
                self.highlights_path,
                "r",
                encoding="utf-8",
            ) as file:

                data = json.load(file)

            fixtures = data.get("fixtures") or {}

            if not isinstance(fixtures, dict):
                fixtures = {}

            return {
                "version": 1,
                "fixtures": fixtures,
            }

        except Exception:
            return {
                "version": 1,
                "fixtures": {},
            }

    # Guardar estado de destacados
    def _write_highlights_state(
        self,
        state,
    ):

        temp_path = self.highlights_path.with_suffix(".json.tmp")

        with open(
            temp_path,
            "w",
            encoding="utf-8",
        ) as file:

            json.dump(
                state,
                file,
                ensure_ascii=False,
                indent=2,
            )

        os.replace(
            temp_path,
            self.highlights_path,
        )

    # Obtener competencia actual
    def _current_competition(
        self,
    ):

        now = datetime.now(timezone.utc)
        year = now.year

        if now.month >= 7:
            name = f"Apertura {year}"
            start = pd.Timestamp(f"{year}-07-01", tz="UTC")
            end = pd.Timestamp(f"{year + 1}-01-01", tz="UTC")

        else:
            name = f"Clausura {year}"
            start = pd.Timestamp(f"{year}-01-01", tz="UTC")
            end = pd.Timestamp(f"{year}-07-01", tz="UTC")

        return {
            "name": name,
            "year": year,
            "start": start,
            "end": end,
        }

    # Guardar goles y asistencias del partido
    def _register_highlight_fixture(
        self,
        detail,
    ):

        fixture_id = detail.get("fixture_id") or detail.get("id")
        date = detail.get("date")

        if not fixture_id or not date:
            return

        home = detail.get("home") or {}
        away = detail.get("away") or {}

        home_name = str(home.get("name") or "").strip()
        away_name = str(away.get("name") or "").strip()
        players = {}

        def get_player(player_name, team_name):

            player_name = str(player_name or "").strip()
            team_name = str(team_name or "").strip()

            if not player_name:
                return None

            key = f"{team_name}|{player_name}".casefold()

            if key not in players:
                players[key] = {
                    "name": player_name,
                    "team": team_name,
                    "goals": 0,
                    "assists": 0,
                }

            return players[key]

        for event in detail.get("events") or []:

            if str(event.get("type") or "").strip() != "Goal":
                continue

            event_detail = str(event.get("detail") or "").casefold()

            if "missed penalty" in event_detail:
                continue

            team_name = str(event.get("team") or "").strip()
            player_name = event.get("player")
            assist_name = event.get("assist")

            if player_name and "own goal" not in event_detail:
                player = get_player(player_name, team_name)

                if player:
                    player["goals"] += 1

            if assist_name and "own goal" not in event_detail:
                assistant = get_player(assist_name, team_name)

                if assistant:
                    assistant["assists"] += 1

        state = self._read_highlights_state()
        fixtures = state.setdefault("fixtures", {})
        existing_fixture = fixtures.get(str(fixture_id)) or {}

        if existing_fixture.get("players") and not players:
            return

        fixtures[str(fixture_id)] = {
            "fixture_id": int(fixture_id),
            "date": date,
            "home": home_name,
            "away": away_name,
            "players": players,
        }

        self._write_highlights_state(state)

    # LEER CSV
    def _read_history(
        self,
    ):

        return pd.read_csv(self.history_path)

    # ES FINAL
    def is_finished(
        self,
        detail,
    ):

        status = detail.get(
            "status",
            {},
        ).get("short")

        return status in FINAL_STATUSES

    # PARTIDO EXISTE
    def has_fixture(
        self,
        fixture_id,
    ):

        fixture_id = _fixture_key(fixture_id)

        if not fixture_id:

            return False

        with self._lock:

            df = self._read_history()

            existing = {
                _fixture_key(value) for value in df["fixture_id"].dropna().tolist()
            }

            return fixture_id in existing

    # EXTRAER ESTADISTICA
    def _stat(
        self,
        detail,
        side,
        name,
    ):

        values = (
            detail.get(
                "statistics",
                {},
            )
            .get(
                side,
                {},
            )
            .get(
                "values",
                {},
            )
        )

        if name not in values:

            return None

        return _to_int(values.get(name))

    # TARJETAS
    def _cards(
        self,
        detail,
        side,
    ):
        """
        IMPORTANTE:

        Esta función concentra la regla de tarjetas
        del histórico.

        Se contabiliza:

        Yellow Cards + Red Cards

        Si tu extractor histórico original aplicaba
        otra regla, esta es la ÚNICA función que
        necesitarías ajustar.
        """

        yellow = self._stat(
            detail,
            side,
            "Yellow Cards",
        )

        # Yellow Cards sí debe existir.
        if yellow is None:

            return None

        red = self._stat(
            detail,
            side,
            "Red Cards",
        )

        # API-Football puede omitir Red Cards cuando es 0.
        if red is None:

            red = 0

        return yellow + red

    # CONSTRUIR FILA
    def _build_row(
        self,
        detail,
    ):

        fixture_id = detail.get("fixture_id") or detail.get("id")
        date = detail.get("date")
        referee = str(detail.get("referee") or "Desconocido").strip()

        home = detail.get("home") or {}
        away = detail.get("away") or {}

        local = str(home.get("name") or "Desconocido").strip()

        visitante = str(away.get("name") or "Desconocido").strip()

        home_name = EQUIVALENCIAS.get(
            local,
            local,
        )

        away_name = EQUIVALENCIAS.get(
            visitante,
            visitante,
        )
        
        home_goals = _to_int(
            detail.get(
                "home",
                {},
            ).get("goals")
        )

        away_goals = _to_int(
            detail.get(
                "away",
                {},
            ).get("goals")
        )

        home_corners = self._stat(
            detail,
            "home",
            "Corner Kicks",
        )

        away_corners = self._stat(
            detail,
            "away",
            "Corner Kicks",
        )

        home_cards = self._cards(
            detail,
            "home",
        )

        away_cards = self._cards(
            detail,
            "away",
        )

        # VALIDACIONES
        missing = []

        if not fixture_id:
            missing.append("fixture_id")

        if not date:
            missing.append("date")

        if not home_name:
            missing.append("home_team")

        if not away_name:
            missing.append("away_team")

        if home_goals is None:
            missing.append("home_goals")

        if away_goals is None:
            missing.append("away_goals")

        if home_corners is None:
            missing.append("home_corners")

        if away_corners is None:
            missing.append("away_corners")

        if home_cards is None:
            missing.append("home_cards")

        if away_cards is None:
            missing.append("away_cards")

        if missing:

            return (
                None,
                missing,
            )

        # TOTALS
        total_corners = home_corners + away_corners
        total_cards = home_cards + away_cards
        row = {
            "fixture_id": int(fixture_id),
            "date": date,
            "referee": referee,
            "home_team": home_name,
            "away_team": away_name,
            "home_goals": home_goals,
            "away_goals": away_goals,
            "home_corners": home_corners,
            "away_corners": away_corners,
            "total_corners": total_corners,
            "home_cards": home_cards,
            "away_cards": away_cards,
            "total_cards": total_cards,
        }

        return (
            row,
            [],
        )

    # PARTIDOS PENDIENTE
    def _register_pending(
        self,
        fixture_id,
        detail,
        missing,
    ):

        state = self._read_state()
        key = _fixture_key(fixture_id)
        pending = state.get("pending_fixtures") or {}
        pending[key] = {
            "fixture_id": fixture_id,
            "home": detail.get(
                "home",
                {},
            ).get("name"),
            "away": detail.get(
                "away",
                {},
            ).get("name"),
            "missing": missing,
            "updated_at": _utc_now(),
        }

        state["pending_fixtures"] = pending
        state["last_sync_status"] = "pending"
        state["last_sync_message"] = (
            "Partido finalizado pero faltan " "datos para incorporarlo."
        )

        self._write_state(state)

    # GUARDAR PARTIDO
    def save_finished_match(
        self,
        detail,
    ):

        if not self.is_finished(detail):

            return {
                "action": "ignored",
                "reason": "not_finished",
            }

        fixture_id = detail.get("fixture_id") or detail.get("id")

        if not fixture_id:

            return {
                "action": "pending",
                "reason": "fixture_id_missing",
            }

        with self._lock:

            # Guardamos jugadores del partido
            self._register_highlight_fixture(detail)

            # NO DUPLICAR
            if self.has_fixture(fixture_id):
                return {
                    "action": "duplicate",
                    "fixture_id": fixture_id,
                }

            # CONSTRUIR
            (
                row,
                missing,
            ) = self._build_row(detail)

            if missing:

                self._register_pending(
                    fixture_id,
                    detail,
                    missing,
                )

                return {
                    "action": "pending",
                    "fixture_id": fixture_id,
                    "missing": missing,
                }

            # LEER CSV HISTORICO
            df = self._read_history()

            # CONSERVAR EXACTAMENTE EL ORDEN DEL CSV EXISTENTE
            existing_columns = list(df.columns)

            new_row = {
                column: row.get(
                    column,
                    pd.NA,
                )
                for column in existing_columns
            }

            df = pd.concat(
                [
                    df,
                    pd.DataFrame([new_row]),
                ],
                ignore_index=True,
            )

            # ESCRITURA
            temp_path = self.history_path.with_suffix(".csv.tmp")

            df.to_csv(
                temp_path,
                index=False,
            )

            os.replace(
                temp_path,
                self.history_path,
            )

            # ESTADO
            state = self._read_state()
            state["last_update"] = _utc_now()
            state["last_fixture_id"] = int(fixture_id)
            state["last_match"] = f"{row['home_team']} " f"vs " f"{row['away_team']}"
            state["last_result"] = f"{row['home_goals']}" "-" f"{row['away_goals']}"
            state["records_added_total"] = (
                int(state.get("records_added_total") or 0) + 1
            )

            # MODELOS AHORA ESTÁN DESACTUALIZADOS
            state["dataset_dirty"] = True
            state["last_sync_status"] = "saved"
            state["last_sync_message"] = "Partido incorporado al histórico."

            # QUITAR PENDIENTE
            pending = state.get("pending_fixtures") or {}
            pending.pop(
                _fixture_key(fixture_id),
                None,
            )

            state["pending_fixtures"] = pending
            self._write_state(state)

            return {
                "action": "saved",
                "fixture_id": int(fixture_id),
                "row": row,
                "records": len(df),
            }

    # Obtener destacados de la competencia actual
    def get_season_highlights(
        self,
    ):

        competition = self._current_competition()
        start = competition["start"]
        end = competition["end"]

        with self._lock:
            df = self._read_history()
            highlights_state = self._read_highlights_state()

        season_df = df.copy()

        if not season_df.empty:
            season_df["_date"] = season_df["date"].apply(
                lambda value: pd.to_datetime(
                    value,
                    errors="coerce",
                    utc=True,
                )
            )

            season_df = season_df[
                (season_df["_date"] >= start)
                & (season_df["_date"] < end)
            ].copy()

        best_matches = []

        if not season_df.empty:
            season_df["_home_goals"] = pd.to_numeric(
                season_df["home_goals"],
                errors="coerce",
            )
            season_df["_away_goals"] = pd.to_numeric(
                season_df["away_goals"],
                errors="coerce",
            )

            season_df = season_df.dropna(
                subset=[
                    "_home_goals",
                    "_away_goals",
                ]
            )

            season_df["_total_goals"] = (
                season_df["_home_goals"]
                + season_df["_away_goals"]
            )
            season_df["_goal_difference"] = (
                season_df["_home_goals"]
                - season_df["_away_goals"]
            ).abs()

            season_df = season_df.sort_values(
                by=[
                    "_total_goals",
                    "_goal_difference",
                    "_date",
                ],
                ascending=[
                    False,
                    True,
                    False,
                ],
            ).head(4)

            for _, row in season_df.iterrows():
                fixture_key = _fixture_key(row.get("fixture_id"))

                best_matches.append(
                    {
                        "fixture_id": (
                            int(fixture_key)
                            if fixture_key.isdigit()
                            else fixture_key
                        ),
                        "date": (
                            row["_date"].isoformat()
                            if not pd.isna(row["_date"])
                            else None
                        ),
                        "home": {
                            "name": str(row.get("home_team") or ""),
                            "goals": int(row["_home_goals"]),
                        },
                        "away": {
                            "name": str(row.get("away_team") or ""),
                            "goals": int(row["_away_goals"]),
                        },
                        "total_goals": int(row["_total_goals"]),
                        "total_corners": _to_int(row.get("total_corners")),
                        "total_cards": _to_int(row.get("total_cards")),
                    }
                )

        aggregated = {}

        for fixture in (highlights_state.get("fixtures") or {}).values():
            fixture_date = pd.to_datetime(
                fixture.get("date"),
                errors="coerce",
                utc=True,
            )

            if pd.isna(fixture_date):
                continue

            if not start <= fixture_date < end:
                continue

            for player in (fixture.get("players") or {}).values():
                name = str(player.get("name") or "").strip()
                team = str(player.get("team") or "").strip()

                if not name:
                    continue

                key = f"{team}|{name}".casefold()

                if key not in aggregated:
                    aggregated[key] = {
                        "name": name,
                        "team": team,
                        "goals": 0,
                        "assists": 0,
                    }

                aggregated[key]["goals"] += int(
                    player.get("goals") or 0
                )
                aggregated[key]["assists"] += int(
                    player.get("assists") or 0
                )

        players = list(aggregated.values())
        players.sort(
            key=lambda item: (
                -item["goals"],
                -item["assists"],
                item["name"].casefold(),
            )
        )

        best_players = [
            {
                "name": player["name"],
                "team": {
                    "name": player["team"],
                },
                "goals": player["goals"],
                "assists": player["assists"],
                "contributions": (
                    player["goals"]
                    + player["assists"]
                ),
            }
            for player in players[:4]
        ]

        slides = []
        total = max(
            len(best_players),
            len(best_matches),
        )

        for index in range(total):

            if index < len(best_players):
                slides.append(
                    {
                        "type": "player",
                        "badge": (
                            "TOP GOLEADOR"
                            if index == 0
                            else "JUGADOR DESTACADO"
                        ),
                        "player": best_players[index],
                    }
                )

            if index < len(best_matches):
                slides.append(
                    {
                        "type": "match",
                        "badge": "PARTIDO DESTACADO",
                        "match": best_matches[index],
                    }
                )

        return {
            "competition": competition["name"],
            "season": competition["year"],
            "matches_count": len(best_matches),
            "players_count": len(best_players),
            "slides": slides,
            "count": len(slides),
        }

    # DATASET DIRTY
    def is_dirty(
        self,
    ):

        with self._lock:
            state = self._read_state()
            return bool(state.get("dataset_dirty"))

    # MODELO ACTUALIZADO
    def mark_models_clean(
        self,
    ):

        with self._lock:
            state = self._read_state()
            state["dataset_dirty"] = False
            state["model_last_refresh"] = _utc_now()
            self._write_state(state)

    # ESTADO DEL DATASET
    def get_status(
        self,
    ):

        with self._lock:
            df = self._read_history()
            state = self._read_state()
            years = []

            if "date" in df.columns and not df.empty:
                parsed_dates = pd.to_datetime(
                    df["date"],
                    errors="coerce",
                    utc=True,
                )

                years = sorted(
                    parsed_dates.dt.year.dropna().astype(int).unique().tolist()
                )

            return {
                "history_path": str(self.history_path),
                "records": len(df),
                "years": years,
                "dataset_dirty": bool(state.get("dataset_dirty")),
                "last_update": state.get("last_update"),
                "last_fixture_id": state.get("last_fixture_id"),
                "last_match": state.get("last_match"),
                "last_result": state.get("last_result"),
                "records_added_total": state.get(
                    "records_added_total",
                    0,
                ),
                "model_last_refresh": state.get("model_last_refresh"),
                "pending_fixtures": list(
                    (state.get("pending_fixtures") or {}).values()
                ),
            }

    # OBTENER PARTIDOS PENDIENTES
    def get_pending_fixture_ids(
        self,
    ):

        with self._lock:
            state = self._read_state()
            pending = state.get("pending_fixtures") or {}
            fixture_ids = []

            for item in pending.values():
                fixture_id = item.get("fixture_id")

                if fixture_id is None:
                    continue

                try:

                    fixture_ids.append(int(fixture_id))

                except (
                    TypeError,
                    ValueError,
                ):

                    continue

            return fixture_ids
