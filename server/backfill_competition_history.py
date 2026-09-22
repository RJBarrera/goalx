import argparse
import os
import re
import time
import unicodedata
from datetime import datetime, timezone
from difflib import SequenceMatcher
from pathlib import Path

import pandas as pd
import requests
from dotenv import load_dotenv

from competition_config import get_competition
from match_history_service import HISTORY_COLUMNS, MatchHistoryService

SERVER_DIR = Path(__file__).resolve().parent
PROJECT_DIR = SERVER_DIR.parent

load_dotenv(SERVER_DIR / ".env")
load_dotenv(PROJECT_DIR / ".env")

API_FOOTBALL_BASE_URL = "https://v3.football.api-sports.io"
SPORTSDB_BASE_URL = "https://www.thesportsdb.com/api/v1/json"

FINAL_STATUSES = {
    "FT",
    "AET",
    "PEN",
    "MATCH FINISHED",
    "FINISHED",
}

SPORTSDB_STAT_ALIASES = {
    "corners": {
        "corner kicks",
        "corners",
        "corner",
    },
    "yellow_cards": {
        "yellow cards",
        "yellow card",
    },
    "red_cards": {
        "red cards",
        "red card",
    },
}


def _safe_int(value, default=0):
    if value is None or value == "":
        return default

    try:
        return int(float(value))
    except (TypeError, ValueError):
        return default


def _int_or_none(value):
    if value is None or value == "":
        return None

    try:
        return int(float(value))
    except (TypeError, ValueError):
        return None


def _normalize_text(value):
    value = unicodedata.normalize(
        "NFD",
        str(value or ""),
    )
    value = "".join(char for char in value if unicodedata.category(char) != "Mn")
    value = value.casefold()
    value = re.sub(r"[^a-z0-9]+", " ", value)
    return " ".join(value.split())


def _team_similarity(left, right):
    left = _normalize_text(left)
    right = _normalize_text(right)

    if not left or not right:
        return 0.0

    if left == right:
        return 1.0

    if left in right or right in left:
        return 0.92

    return SequenceMatcher(
        None,
        left,
        right,
    ).ratio()


def _season_label(competition, season):
    season = int(season)

    if competition.get("season_mode") == "european":
        return f"{season}-{season + 1}"

    return str(season)


def _event_date(event):
    timestamp = str(event.get("strTimestamp") or "").strip()

    if timestamp:
        return timestamp

    date_value = str(
        event.get("dateEventLocal") or event.get("dateEvent") or ""
    ).strip()

    time_value = str(
        event.get("strTimeLocal") or event.get("strTime") or "00:00:00"
    ).strip()

    if not date_value:
        return ""

    if len(time_value) == 5:
        time_value = f"{time_value}:00"

    return f"{date_value}T{time_value}"


def _date_only(value):
    if not value:
        return ""

    try:
        parsed = pd.to_datetime(
            value,
            errors="coerce",
            utc=True,
        )

        if pd.isna(parsed):
            return str(value)[:10]

        return parsed.date().isoformat()

    except Exception:
        return str(value)[:10]


def _event_finished(event):
    status = _normalize_text(event.get("strStatus"))
    home_score = _int_or_none(event.get("intHomeScore"))
    away_score = _int_or_none(event.get("intAwayScore"))

    if status.upper() in FINAL_STATUSES:
        return True

    if status in {
        "match finished",
        "finished",
        "ft",
        "aet",
        "pen",
    }:
        return True

    if home_score is None or away_score is None:
        return False

    date_value = _event_date(event)

    if not date_value:
        return True

    try:
        parsed = pd.to_datetime(
            date_value,
            errors="coerce",
            utc=True,
        )

        if pd.isna(parsed):
            return True

        return parsed.to_pydatetime() <= datetime.now(timezone.utc)

    except Exception:
        return True


def _event_signature(date_value, home, away):
    return (
        _date_only(date_value),
        _normalize_text(home),
        _normalize_text(away),
    )


def _load_existing(path):
    if not path.exists():
        return pd.DataFrame(columns=HISTORY_COLUMNS)

    df = pd.read_csv(path)

    for column in HISTORY_COLUMNS:
        if column not in df.columns:
            df[column] = None

    return df[HISTORY_COLUMNS].copy()


def _fixture_ids(df):
    values = set()

    if "fixture_id" not in df.columns:
        return values

    for value in df["fixture_id"].dropna().tolist():
        text = str(value).strip()

        if text.endswith(".0") and text[:-2].isdigit():
            text = text[:-2]

        if text:
            values.add(text)

    return values


def _existing_signatures(df):
    signatures = set()

    if df.empty:
        return signatures

    for _, row in df.iterrows():
        signatures.add(
            _event_signature(
                row.get("date"),
                row.get("home_team"),
                row.get("away_team"),
            )
        )

    return signatures


def _extract_api_football_id(event, event_stats):
    candidates = [
        event.get("idApiFootball"),
        event.get("idAPIfootball"),
        event.get("idAPIFootball"),
    ]

    for stat in event_stats or []:
        candidates.extend(
            [
                stat.get("idApiFootball"),
                stat.get("idAPIfootball"),
                stat.get("idAPIFootball"),
            ]
        )

    for value in candidates:
        value = str(value or "").strip()

        if value and value.isdigit():
            return value

    return None


def _sportsdb_stats(event_stats):
    output = {
        "home_corners": None,
        "away_corners": None,
        "home_yellow": None,
        "away_yellow": None,
        "home_red": 0,
        "away_red": 0,
    }

    for stat in event_stats or []:
        stat_name = _normalize_text(stat.get("strStat"))
        home_value = _int_or_none(stat.get("intHome"))
        away_value = _int_or_none(stat.get("intAway"))

        if stat_name in SPORTSDB_STAT_ALIASES["corners"]:
            output["home_corners"] = home_value
            output["away_corners"] = away_value

        elif stat_name in SPORTSDB_STAT_ALIASES["yellow_cards"]:
            output["home_yellow"] = home_value
            output["away_yellow"] = away_value

        elif stat_name in SPORTSDB_STAT_ALIASES["red_cards"]:
            output["home_red"] = _safe_int(home_value)
            output["away_red"] = _safe_int(away_value)

    return output


def _required_market_stats_complete(stats):
    required = [
        stats.get("home_corners"),
        stats.get("away_corners"),
        stats.get("home_yellow"),
        stats.get("away_yellow"),
    ]

    return all(value is not None for value in required)


def _extract_api_team_stats(statistics, target_team_name):
    best = None
    best_score = 0.0

    for team_stats in statistics or []:
        api_team_name = str((team_stats.get("team") or {}).get("name") or "").strip()

        score = _team_similarity(
            target_team_name,
            api_team_name,
        )

        if score > best_score:
            best_score = score
            best = team_stats

    if best is None or best_score < 0.62:
        return None

    values = {}

    for item in best.get("statistics") or []:
        values[str(item.get("type") or "").strip()] = item.get("value")

    return {
        "team": (best.get("team") or {}).get("name"),
        "score": best_score,
        "corners": _int_or_none(values.get("Corner Kicks")),
        "yellow": _int_or_none(values.get("Yellow Cards")),
        "red": _safe_int(values.get("Red Cards")),
    }


def _merge_missing_stats(primary, fallback_home, fallback_away):
    merged = {
        **primary,
    }

    if fallback_home:
        if merged.get("home_corners") is None:
            merged["home_corners"] = fallback_home.get("corners")

        if merged.get("home_yellow") is None:
            merged["home_yellow"] = fallback_home.get("yellow")

        if merged.get("home_red") in {None, 0}:
            merged["home_red"] = _safe_int(fallback_home.get("red"))

    if fallback_away:
        if merged.get("away_corners") is None:
            merged["away_corners"] = fallback_away.get("corners")

        if merged.get("away_yellow") is None:
            merged["away_yellow"] = fallback_away.get("yellow")

        if merged.get("away_red") in {None, 0}:
            merged["away_red"] = _safe_int(fallback_away.get("red"))

    return merged


class SportsDBClient:
    def __init__(self, api_key, delay_seconds=2.1):
        self.api_key = str(api_key or "123").strip() or "123"
        self.delay_seconds = max(0.0, float(delay_seconds))
        self.session = requests.Session()
        self.requests_made = 0

    def get(self, endpoint, params=None):
        response = self.session.get(
            f"{SPORTSDB_BASE_URL}/{self.api_key}/{endpoint}",
            params=params or {},
            timeout=30,
        )

        self.requests_made += 1

        if response.status_code == 429:
            raise RuntimeError(
                "TheSportsDB respondió 429. Espera un minuto y vuelve a intentar."
            )

        if not response.ok:
            raise RuntimeError(f"TheSportsDB respondió HTTP {response.status_code}.")

        payload = response.json()

        if self.delay_seconds:
            time.sleep(self.delay_seconds)

        return payload

    def season_events(self, league_id, season_label):
        payload = self.get(
            "eventsseason.php",
            params={
                "id": league_id,
                "s": season_label,
            },
        )

        return payload.get("events") or []

    def round_events(self, league_id, season_label, round_number):
        payload = self.get(
            "eventsround.php",
            params={
                "id": league_id,
                "s": season_label,
                "r": int(round_number),
            },
        )

        return payload.get("events") or []

    def event_stats(self, event_id):
        payload = self.get(
            "lookupeventstats.php",
            params={"id": event_id},
        )

        return payload.get("eventstats") or []


class ApiFootballClient:
    def __init__(self, api_key, delay_seconds=6.5):
        self.api_key = str(api_key or "").strip()
        self.delay_seconds = max(0.0, float(delay_seconds))
        self.session = requests.Session()
        self.remaining = None
        self.requests_made = 0
        self._date_cache = {}

    @property
    def available(self):
        return bool(self.api_key)

    def get(self, path, params=None):
        if not self.available:
            raise RuntimeError("API_FOOTBALL_KEY no está configurada.")

        response = self.session.get(
            f"{API_FOOTBALL_BASE_URL}{path}",
            headers={
                "x-apisports-key": self.api_key,
                "Accept": "application/json",
            },
            params=params or {},
            timeout=30,
        )

        self.requests_made += 1

        remaining = response.headers.get("x-ratelimit-requests-remaining")

        if remaining is not None:
            try:
                self.remaining = int(remaining)
            except ValueError:
                self.remaining = None

        if not response.ok:
            raise RuntimeError(f"API-Football respondió HTTP {response.status_code}.")

        payload = response.json()
        errors = payload.get("errors")

        if errors:
            raise RuntimeError(f"API-Football: {errors}")

        if self.delay_seconds:
            time.sleep(self.delay_seconds)

        return payload.get("response") or []

    def fixtures_by_date(self, date_value, timezone_name):
        key = (date_value, timezone_name)

        if key in self._date_cache:
            return self._date_cache[key]

        fixtures = self.get(
            "/fixtures",
            params={
                "date": date_value,
                "timezone": timezone_name,
            },
        )

        self._date_cache[key] = fixtures
        return fixtures


def _discover_sportsdb_events(
    client,
    competition,
    seasons,
    round_scan,
):
    unique = {}

    for season in seasons:
        season_label = _season_label(
            competition,
            season,
        )

        print(f"📅 TheSportsDB: {competition['name']} " f"temporada {season_label}...")

        try:
            events = client.season_events(
                competition["sportsdb_league_id"],
                season_label,
            )
        except Exception as error:
            print(f"   ⚠️ No fue posible consultar la temporada: {error}")
            events = []

        print(f"   📦 eventsseason: {len(events)} eventos.")

        if len(events) == 15:
            print("   ℹ️ TheSportsDB Free limita eventsseason a 15 resultados.")

        for event in events:
            event_id = str(event.get("idEvent") or "").strip()

            if event_id:
                unique[event_id] = event

        if round_scan <= 0:
            continue

        print(f"   🔎 Escaneando rondas 1-{round_scan} " "para ampliar el histórico...")

        for round_number in range(1, round_scan + 1):
            try:
                round_events = client.round_events(
                    competition["sportsdb_league_id"],
                    season_label,
                    round_number,
                )
            except Exception as error:
                print(f"      ⚠️ Ronda {round_number}: {error}")
                continue

            if not round_events:
                continue

            added = 0

            for event in round_events:
                event_id = str(event.get("idEvent") or "").strip()

                if not event_id:
                    continue

                if event_id not in unique:
                    added += 1

                unique[event_id] = event

            print(
                f"      Ronda {round_number}: "
                f"{len(round_events)} eventos, {added} nuevos."
            )

    events = list(unique.values())
    events = [event for event in events if _event_finished(event)]
    events.sort(
        key=lambda event: _event_date(event),
        reverse=True,
    )

    return events


def _find_api_fixture(
    client,
    competition,
    event,
):
    date_value = _date_only(_event_date(event))

    if not date_value:
        return None

    fixtures = client.fixtures_by_date(
        date_value,
        competition["timezone"],
    )

    home_name = event.get("strHomeTeam")
    away_name = event.get("strAwayTeam")

    best_fixture = None
    best_score = 0.0

    for fixture in fixtures:
        league_id = (fixture.get("league") or {}).get("id")

        if league_id != competition["api_football_league_id"]:
            continue

        teams = fixture.get("teams") or {}
        api_home = (teams.get("home") or {}).get("name")
        api_away = (teams.get("away") or {}).get("name")

        home_score = _team_similarity(
            home_name,
            api_home,
        )
        away_score = _team_similarity(
            away_name,
            api_away,
        )

        score = (home_score + away_score) / 2

        if score > best_score:
            best_score = score
            best_fixture = fixture

    if best_fixture is None or best_score < 0.68:
        return None

    return best_fixture


def _build_row(
    event,
    stats,
    fixture_id,
    history_service,
    api_fixture=None,
):
    home_name = str(event.get("strHomeTeam") or "Desconocido").strip()
    away_name = str(event.get("strAwayTeam") or "Desconocido").strip()

    home_name = history_service.normalize_team_name(home_name)
    away_name = history_service.normalize_team_name(away_name)

    home_goals = _int_or_none(event.get("intHomeScore"))
    away_goals = _int_or_none(event.get("intAwayScore"))

    if home_goals is None or away_goals is None:
        return None

    if not _required_market_stats_complete(stats):
        return None

    home_corners = _safe_int(stats.get("home_corners"))
    away_corners = _safe_int(stats.get("away_corners"))
    home_yellow = _safe_int(stats.get("home_yellow"))
    away_yellow = _safe_int(stats.get("away_yellow"))
    home_red = _safe_int(stats.get("home_red"))
    away_red = _safe_int(stats.get("away_red"))

    home_cards = home_yellow + home_red
    away_cards = away_yellow + away_red

    referee = str(event.get("strReferee") or "").strip()

    if not referee and api_fixture:
        referee = str((api_fixture.get("fixture") or {}).get("referee") or "").strip()

    if not referee:
        referee = "Desconocido"

    return {
        "fixture_id": fixture_id,
        "date": _event_date(event),
        "referee": referee,
        "home_team": home_name,
        "away_team": away_name,
        "home_goals": home_goals,
        "away_goals": away_goals,
        "home_corners": home_corners,
        "away_corners": away_corners,
        "total_corners": home_corners + away_corners,
        "home_cards": home_cards,
        "away_cards": away_cards,
        "total_cards": home_cards + away_cards,
    }


def backfill(
    competition_id,
    seasons,
    limit,
    api_delay,
    sportsdb_delay,
    sportsdb_only,
    reserve_api_requests,
    round_scan,
):
    competition = get_competition(competition_id)

    sportsdb_key = (
        os.getenv(
            "SPORTSDB_API_KEY",
            "123",
        ).strip()
        or "123"
    )

    api_football_key = os.getenv(
        "API_FOOTBALL_KEY",
        "",
    ).strip()

    history_service = MatchHistoryService(competition=competition)

    runtime_path = history_service.history_path
    seed_path = history_service.seed_history_path

    existing = _load_existing(runtime_path)
    existing_ids = _fixture_ids(existing)
    existing_signatures = _existing_signatures(existing)

    sportsdb = SportsDBClient(
        api_key=sportsdb_key,
        delay_seconds=sportsdb_delay,
    )

    api_football = ApiFootballClient(
        api_key=api_football_key,
        delay_seconds=api_delay,
    )

    print(f"🏆 Competición: {competition['name']}")
    print("🟢 Fuente primaria: TheSportsDB")

    if sportsdb_only:
        print("🟡 API-Football fallback: DESACTIVADO")
    elif api_football.available:
        print("🟢 API-Football fallback: ACTIVO")
    else:
        print(
            "🟡 API-Football fallback: NO CONFIGURADO. "
            "Se guardarán solamente partidos completos con TheSportsDB."
        )

    events = _discover_sportsdb_events(
        client=sportsdb,
        competition=competition,
        seasons=seasons,
        round_scan=round_scan,
    )

    candidates = []

    for event in events:
        signature = _event_signature(
            _event_date(event),
            event.get("strHomeTeam"),
            event.get("strAwayTeam"),
        )

        if signature in existing_signatures:
            continue

        candidates.append(event)

    if limit > 0:
        candidates = candidates[:limit]

    print(f"📚 Registros existentes: {len(existing)}")
    print(f"📦 Eventos TheSportsDB encontrados: {len(events)}")
    print(f"📥 Partidos a procesar: {len(candidates)}")

    rows = []
    pending = []

    summary = {
        "sportsdb_complete": 0,
        "api_fallback_attempted": 0,
        "api_fallback_complete": 0,
        "duplicates": 0,
        "pending": 0,
    }

    for index, event in enumerate(candidates, start=1):
        event_id = str(event.get("idEvent") or "").strip()
        home = str(event.get("strHomeTeam") or "Local").strip()
        away = str(event.get("strAwayTeam") or "Visitante").strip()

        print(
            f"\n[{index}/{len(candidates)}] "
            f"{home} vs {away} "
            f"(TheSportsDB {event_id})"
        )

        try:
            event_stats = sportsdb.event_stats(event_id)
        except Exception as error:
            event_stats = []
            print(f"   ⚠️ TheSportsDB stats no disponibles: {error}")

        stats = _sportsdb_stats(event_stats)
        api_fixture_id = _extract_api_football_id(
            event,
            event_stats,
        )

        provisional_fixture_id = api_fixture_id or f"tsdb-{event_id}"

        if provisional_fixture_id in existing_ids:
            summary["duplicates"] += 1
            print("   ↩️ Ya existe en el CSV. Se omite.")
            continue

        api_fixture = None
        source = "TheSportsDB"

        if _required_market_stats_complete(stats):
            summary["sportsdb_complete"] += 1
            print("   ✅ TheSportsDB entregó córners y tarjetas completos.")

        else:
            missing = []

            if stats.get("home_corners") is None or stats.get("away_corners") is None:
                missing.append("córners")

            if stats.get("home_yellow") is None or stats.get("away_yellow") is None:
                missing.append("tarjetas")

            print("   ℹ️ TheSportsDB incompleto para: " + ", ".join(missing) + ".")

            can_use_api = not sportsdb_only and api_football.available

            if (
                can_use_api
                and api_football.remaining is not None
                and api_football.remaining <= reserve_api_requests
            ):
                can_use_api = False
                print(
                    "   🛑 API-Football fallback detenido para reservar "
                    f"{reserve_api_requests} consultas."
                )

            if can_use_api:
                summary["api_fallback_attempted"] += 1

                try:
                    if not api_fixture_id:
                        api_fixture = _find_api_fixture(
                            client=api_football,
                            competition=competition,
                            event=event,
                        )

                        if api_fixture:
                            api_fixture_id = (
                                str(
                                    (api_fixture.get("fixture") or {}).get("id") or ""
                                ).strip()
                                or None
                            )

                    if api_fixture_id:
                        print(
                            f"   🔄 API-Football fallback fixture {api_fixture_id}..."
                        )

                        api_statistics = api_football.get(
                            "/fixtures/statistics",
                            params={
                                "fixture": api_fixture_id,
                            },
                        )

                        fallback_home = _extract_api_team_stats(
                            api_statistics,
                            home,
                        )
                        fallback_away = _extract_api_team_stats(
                            api_statistics,
                            away,
                        )

                        stats = _merge_missing_stats(
                            stats,
                            fallback_home,
                            fallback_away,
                        )

                        if _required_market_stats_complete(stats):
                            source = "TheSportsDB + API-Football"
                            summary["api_fallback_complete"] += 1
                            print("   ✅ Estadísticas completadas con API-Football.")
                        else:
                            print(
                                "   ⚠️ API-Football tampoco entregó todas las estadísticas."
                            )

                    else:
                        print(
                            "   ⚠️ No fue posible relacionar el evento con API-Football."
                        )

                except Exception as error:
                    print(f"   ⚠️ API-Football fallback no disponible: {error}")

        final_fixture_id = api_fixture_id or provisional_fixture_id

        if final_fixture_id in existing_ids:
            summary["duplicates"] += 1
            print("   ↩️ Fixture ya existente. Se omite.")
            continue

        row = _build_row(
            event=event,
            stats=stats,
            fixture_id=final_fixture_id,
            history_service=history_service,
            api_fixture=api_fixture,
        )

        if row is None:
            summary["pending"] += 1
            pending.append(
                {
                    "sportsdb_event_id": event_id,
                    "api_football_fixture_id": api_fixture_id,
                    "home": home,
                    "away": away,
                }
            )
            print("   ⏳ Queda pendiente: faltan estadísticas obligatorias.")
            continue

        rows.append(row)
        existing_ids.add(str(final_fixture_id))
        existing_signatures.add(
            _event_signature(
                row["date"],
                row["home_team"],
                row["away_team"],
            )
        )

        print(f"   💾 Registro preparado ({source}).")

    if rows:
        new_df = pd.DataFrame(
            rows,
            columns=HISTORY_COLUMNS,
        )

        final_df = pd.concat(
            [existing, new_df],
            ignore_index=True,
        )

        # El fixture_id puede provenir de dos proveedores.
        # La firma fecha+equipos evita duplicados aunque cambie el ID.
        final_df["_signature"] = final_df.apply(
            lambda row: "|".join(
                _event_signature(
                    row.get("date"),
                    row.get("home_team"),
                    row.get("away_team"),
                )
            ),
            axis=1,
        )

        final_df = final_df.drop_duplicates(
            subset=["_signature"],
            keep="last",
        ).drop(columns=["_signature"])

        final_df["date"] = pd.to_datetime(
            final_df["date"],
            errors="coerce",
            utc=True,
        )

        final_df = final_df.sort_values("date")

        final_df["date"] = final_df["date"].apply(
            lambda value: (value.isoformat() if pd.notna(value) else "")
        )

        runtime_path.parent.mkdir(
            parents=True,
            exist_ok=True,
        )

        final_df.to_csv(
            runtime_path,
            index=False,
        )

        if seed_path.resolve() != runtime_path.resolve():
            seed_path.parent.mkdir(
                parents=True,
                exist_ok=True,
            )

            final_df.to_csv(
                seed_path,
                index=False,
            )

        history_service.mark_dataset_dirty()

        print(
            f"\n✅ Se agregaron {len(rows)} partidos. "
            f"Total actual: {len(final_df)}."
        )
        print(f"📂 Runtime: {runtime_path}")
        print(f"📦 Seed: {seed_path}")

    else:
        print("\nℹ️ No se agregaron nuevos registros.")

    print("\n================ RESUMEN ================")
    print(f"TheSportsDB completos:       {summary['sportsdb_complete']}")
    print(f"Fallback API intentados:     {summary['api_fallback_attempted']}")
    print(f"Fallback API completados:    {summary['api_fallback_complete']}")
    print(f"Duplicados omitidos:         {summary['duplicates']}")
    print(f"Pendientes por estadísticas: {summary['pending']}")
    print(f"Requests TheSportsDB:        {sportsdb.requests_made}")
    print(f"Requests API-Football:       {api_football.requests_made}")

    if api_football.remaining is not None:
        print("Cuota API-Football restante: " f"{api_football.remaining}")

    if pending:
        print("\nPendientes:")

        for item in pending:
            print(
                " - "
                f"{item['home']} vs {item['away']} "
                f"| TSDB {item['sportsdb_event_id']} "
                f"| API {item['api_football_fixture_id'] or 'N/D'}"
            )


def parse_args():
    parser = argparse.ArgumentParser(
        description=(
            "Completa de forma incremental el histórico de una competición. "
            "Usa TheSportsDB como fuente principal y API-Football solamente "
            "como fallback para estadísticas faltantes."
        )
    )

    parser.add_argument(
        "--competition",
        default="champions",
        help="ID configurado en competition_config.py.",
    )

    parser.add_argument(
        "--seasons",
        nargs="+",
        type=int,
        default=[2022, 2023, 2024],
        help=("Años de inicio de temporada. En Champions, 2024 = 2024-2025."),
    )

    parser.add_argument(
        "--limit",
        type=int,
        default=40,
        help="Máximo de partidos nuevos a procesar en esta ejecución.",
    )

    parser.add_argument(
        "--delay",
        type=float,
        default=6.5,
        help="Segundos entre llamadas de API-Football.",
    )

    parser.add_argument(
        "--sportsdb-delay",
        type=float,
        default=2.1,
        help=(
            "Segundos entre llamadas de TheSportsDB. "
            "2.1 protege el límite gratuito aproximado de 30/min."
        ),
    )

    parser.add_argument(
        "--sportsdb-only",
        action="store_true",
        help=(
            "No usa API-Football. Sirve para medir primero cuántos partidos "
            "puede completar TheSportsDB por sí solo."
        ),
    )

    parser.add_argument(
        "--reserve-api-requests",
        type=int,
        default=5,
        help=(
            "Cuando API-Football reporta esta cantidad restante o menos, "
            "se detienen los fallbacks."
        ),
    )

    parser.add_argument(
        "--round-scan",
        type=int,
        default=20,
        help=(
            "Además de eventsseason, consulta rondas 1..N en TheSportsDB "
            "para superar el límite de 15 eventos del plan Free. "
            "Usa 0 para desactivarlo."
        ),
    )

    return parser.parse_args()


if __name__ == "__main__":
    args = parse_args()

    backfill(
        competition_id=args.competition,
        seasons=args.seasons,
        limit=max(0, args.limit),
        api_delay=max(0.0, args.delay),
        sportsdb_delay=max(0.0, args.sportsdb_delay),
        sportsdb_only=bool(args.sportsdb_only),
        reserve_api_requests=max(
            0,
            args.reserve_api_requests,
        ),
        round_scan=max(0, args.round_scan),
    )
