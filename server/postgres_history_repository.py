"""Repositorio PostgreSQL para los históricos usados por el motor de GoalPicks."""

import json
import os
import re
from datetime import datetime, timezone

import pandas as pd

TABLES = {
    "liga-mx": "historial_ligamx_2023",
    "liga-mx-f": "historial_ligamx_f",
    "laliga": "historial_laliga",
    "ligue-1": "historial_ligue1",
    "premier-league": "historial_premier",
    "bundesliga": "historial_bundesliga",
    "serie-a": "historial_seriea",
    "champions": "historial_champions",
    "conference-league": "historial_conference_league",
    "europa-league": "historial_europa_league",
}
COLUMNS = [
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
]
IDENT = re.compile(r"^[a-z_][a-z0-9_]*$")


class PostgresHistoryRepository:
    def __init__(self, competition_id):
        try:
            import psycopg
            from psycopg import sql
        except ImportError as exc:
            raise RuntimeError(
                "Instala psycopg[binary] desde server/requirements.txt"
            ) from exc
        self.psycopg = psycopg
        self.sql = sql
        self.dsn = (
            os.getenv("GOALX_POSTGRES_URL", "").strip()
            or os.getenv("DATABASE_URL", "").strip()
        )
        if not self.dsn:
            raise RuntimeError("Falta GOALX_POSTGRES_URL o DATABASE_URL en el backend")
        self.schema = os.getenv("GOALX_POSTGRES_SCHEMA", "public").strip().lower()
        names = TABLES.copy()
        custom = os.getenv("GOALX_HISTORY_TABLE_MAP", "").strip()
        if custom:
            overrides = json.loads(custom)
            if not isinstance(overrides, dict):
                raise ValueError("GOALX_HISTORY_TABLE_MAP debe ser un objeto JSON")
            names.update(overrides)
        self.table = names.get(competition_id)
        if not isinstance(self.table, str) or not IDENT.fullmatch(self.table):
            raise ValueError(f"No existe un mapeo SQL válido para {competition_id}")
        if not IDENT.fullmatch(self.schema):
            raise ValueError("GOALX_POSTGRES_SCHEMA inválido")
        self.label = f"{self.schema}.{self.table}"
        self.table_sql = sql.Identifier(self.schema, self.table)
        self.cols_sql = sql.SQL(", ").join(map(sql.Identifier, COLUMNS))

    def _connect(self):
        return self.psycopg.connect(self.dsn, connect_timeout=10)

    def validate(self):
        with self._connect() as conn, conn.cursor() as cur:
            cur.execute(
                "SELECT column_name FROM information_schema.columns "
                "WHERE table_schema=%s AND table_name=%s",
                (self.schema, self.table),
            )
            existing = {r[0] for r in cur.fetchall()}
        missing = [col for col in COLUMNS if col not in existing]
        if missing:
            raise RuntimeError(
                f"Tabla {self.label} inexistente o sin columnas: {', '.join(missing)}"
            )

    def load_history(self):
        query = self.sql.SQL(
            "SELECT {} FROM {} ORDER BY date ASC NULLS LAST, fixture_id ASC"
        ).format(self.cols_sql, self.table_sql)
        with self._connect() as conn, conn.cursor() as cur:
            cur.execute(query)
            rows = cur.fetchall()
        df = pd.DataFrame(rows, columns=COLUMNS)
        if not df.empty:
            df["date"] = df["date"].map(
                lambda value: (
                    value.isoformat() if isinstance(value, datetime) else value
                )
            )
        return df

    def has_fixture(self, fixture_id):
        query = self.sql.SQL("SELECT 1 FROM {} WHERE fixture_id=%s LIMIT 1").format(
            self.table_sql
        )
        with self._connect() as conn, conn.cursor() as cur:
            cur.execute(query, (int(fixture_id),))
            return cur.fetchone() is not None

    def insert_finished_match(self, row):
        values = [row.get(col) for col in COLUMNS]
        date_index = COLUMNS.index("date")
        date = values[date_index]
        if isinstance(date, str):
            date = datetime.fromisoformat(date.replace("Z", "+00:00"))
        if isinstance(date, datetime) and date.tzinfo is None:
            date = date.replace(tzinfo=timezone.utc)
        values[date_index] = date
        args_sql = self.sql.SQL(", ").join(self.sql.Placeholder() for _ in COLUMNS)
        query = self.sql.SQL(
            "INSERT INTO {} ({}) VALUES ({}) "
            "ON CONFLICT (fixture_id) DO NOTHING RETURNING fixture_id"
        ).format(self.table_sql, self.cols_sql, args_sql)
        with self._connect() as conn, conn.cursor() as cur:
            cur.execute(query, values)
            return cur.fetchone() is not None

    def revision(self):
        query = self.sql.SQL(
            "SELECT COUNT(*)::bigint, MAX(fixture_id), MAX(date) FROM {}"
        ).format(self.table_sql)
        with self._connect() as conn, conn.cursor() as cur:
            cur.execute(query)
            count, last_id, last_date = cur.fetchone()
        return [
            int(count),
            int(last_id) if last_id is not None else None,
            last_date.isoformat() if last_date is not None else None,
        ]

    def stats(self):
        query = self.sql.SQL(
            "SELECT DISTINCT EXTRACT(YEAR FROM date AT TIME ZONE 'UTC')::int AS year "
            "FROM {} WHERE date IS NOT NULL ORDER BY year"
        ).format(self.table_sql)
        with self._connect() as conn, conn.cursor() as cur:
            cur.execute(query)
            years = [row[0] for row in cur.fetchall()]
        rev = self.revision()
        return {"records": rev[0], "years": years, "revision": rev}
