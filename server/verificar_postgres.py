"""Revisión de solo lectura: PostgreSQL y, si existe, el CSV anterior.

Ejemplos:
  python verificar_postgres.py
  python verificar_postgres.py --competition liga-mx
"""

import argparse
import os
from pathlib import Path

import pandas as pd
from dotenv import load_dotenv

SERVER_DIR = Path(__file__).resolve().parent
load_dotenv(SERVER_DIR / ".env", override=False)

from competition_config import (
    DEFAULT_COMPETITION_ID,
    get_competition,
    list_competitions,
)
from postgres_history_repository import PostgresHistoryRepository, COLUMNS


def csv_path_for(competition_id):
    conf = get_competition(competition_id)
    if competition_id == DEFAULT_COMPETITION_ID:
        custom = os.getenv("MATCHLAB_HISTORY_PATH", "").strip()
        if custom:
            return Path(custom)
    root = os.getenv("GOALX_DATA_ROOT", "").strip()
    if root:
        return Path(root) / competition_id / conf["history_filename"]
    if competition_id == DEFAULT_COMPETITION_ID:
        return SERVER_DIR / conf["seed_history_filename"]
    return SERVER_DIR / "data" / competition_id / conf["history_filename"]


def id_set(df):
    if "fixture_id" not in df.columns:
        return set()
    return set(
        pd.to_numeric(df["fixture_id"], errors="coerce").dropna().astype("int64")
    )


def inspect_competition(cid):
    repo = PostgresHistoryRepository(cid)
    repo.validate()
    dataframe = repo.load_history()
    minimum = int(get_competition(cid).get("model_min_matches", 1))
    ids = id_set(dataframe)
    nulls = {
        c: int(dataframe[c].isna().sum()) for c in COLUMNS if c in dataframe.columns
    }
    print(f"\n[{cid}] Tabla: {repo.label}")
    print(f"  Registros PG: {len(dataframe)} | fixture_id distintos: {len(ids)}")
    print(f"  Umbral del modelo: {minimum} | Suficientes: {len(dataframe) >= minimum}")
    if any(nulls.values()):
        print("  Nulos PG:", {k: v for k, v in nulls.items() if v})
    csv = csv_path_for(cid)
    if csv.is_file():
        old = pd.read_csv(csv)
        old_ids = id_set(old)
        missing = old_ids - ids
        added = ids - old_ids
        print(f"  CSV anterior: {len(old)} registros")
        print(f"  Solo en CSV: {len(missing)} | Solo en PostgreSQL: {len(added)}")
        if missing:
            print("  EJEMPLOS faltantes en PostgreSQL:", sorted(missing)[:10])
    else:
        print("  CSV anterior: no encontrado (comparación omitida)")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--competition", default="all")
    args = parser.parse_args()
    ids = (
        [args.competition]
        if args.competition != "all"
        else [c["id"] for c in list_competitions()]
    )
    failed = []
    for cid in ids:
        try:
            inspect_competition(cid)
        except Exception as exc:
            failed.append(cid)
            print(f"\n[{cid}] ERROR: {type(exc).__name__}: {exc}")
    if failed:
        raise SystemExit(f'Fallaron: {", ".join(failed)}')


if __name__ == "__main__":
    main()
