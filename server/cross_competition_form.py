import bisect
import re
import unicodedata

import numpy as np
import pandas as pd

from competition_config import COMPETITION_ALIASES, COMPETITION_EQUIVALENCES
from ml_models import (
    FEATURES_MODELO,
    RECENT_MATCH_WINDOW,
    preparar_features_al_vuelo,
)


CROSS_COMPETITION_FORM_WEIGHT = 0.25

_TEAM_FEATURES = {
    "avg_gf_10": 0,
    "avg_gc_10": 1,
    "avg_tarjetas_10": 2,
    "avg_corners_10": 3,
    "avg_corners_contra_10": 4,
    "avg_sot_10": 5,
    "avg_shots_total_10": 6,
    "puntos_10": 7,
}

_MATCH_COLUMNS = {
    "date",
    "home_team",
    "away_team",
    "home_goals",
    "away_goals",
    "competition_id",
}


def _normalized_name(value):
    value = unicodedata.normalize("NFD", str(value or ""))
    value = "".join(
        character
        for character in value
        if unicodedata.category(character) != "Mn"
    )
    value = value.casefold()
    value = re.sub(r"[^a-z0-9]+", " ", value)
    return " ".join(value.split())


_TEAM_ALIAS_LOOKUP = {}
for _aliases in COMPETITION_ALIASES.values():
    for _alias, _canonical in _aliases.items():
        _TEAM_ALIAS_LOOKUP.setdefault(
            _normalized_name(_alias),
            _canonical,
        )


def canonical_team_name(value, competition_id):
    value = str(value or "").strip()
    equivalences = COMPETITION_EQUIVALENCES.get(competition_id, {})
    value = equivalences.get(value, value)
    value = _TEAM_ALIAS_LOOKUP.get(_normalized_name(value), value)
    return _normalized_name(value)


class CrossCompetitionForm:
    def __init__(self, history):
        missing = sorted(_MATCH_COLUMNS.difference(history.columns))
        if missing:
            raise ValueError(
                "Faltan columnas para el contexto entre competencias: "
                + ", ".join(missing)
            )

        history = history.copy()
        history["date"] = pd.to_datetime(
            history["date"],
            utc=True,
            format="mixed",
            errors="coerce",
        )

        self._events_by_team = {}
        stat_columns = (
            "home_goals",
            "away_goals",
            "home_cards",
            "away_cards",
            "home_corners",
            "away_corners",
            "home_sont",
            "away_sont",
            "home_shots_total",
            "away_shots_total",
        )
        for column in stat_columns:
            if column not in history:
                history[column] = np.nan
            history[column] = pd.to_numeric(history[column], errors="coerce")

        history = history.dropna(
            subset=[
                "date",
                "home_team",
                "away_team",
                "home_goals",
                "away_goals",
            ]
        )

        for match in history.itertuples(index=False):
            row = match._asdict()
            competition_id = str(row["competition_id"])
            for side, opponent in (("home", "away"), ("away", "home")):
                team = canonical_team_name(row[f"{side}_team"], competition_id)
                goals_for = row[f"{side}_goals"]
                goals_against = row[f"{opponent}_goals"]
                points = (
                    3
                    if goals_for > goals_against
                    else 1
                    if goals_for == goals_against
                    else 0
                )
                stats = [
                    goals_for,
                    goals_against,
                    row[f"{side}_cards"],
                    row[f"{side}_corners"],
                    row[f"{opponent}_corners"],
                    row[f"{side}_sont"],
                    row[f"{side}_shots_total"],
                    points,
                ]
                self._events_by_team.setdefault(team, []).append(
                    (row["date"], competition_id, stats)
                )

        self._dates_by_team = {}
        for team, events in self._events_by_team.items():
            events.sort(key=lambda event: event[0])
            self._dates_by_team[team] = [event[0] for event in events]

    def add_features(
        self,
        features,
        competition_id,
        weight=CROSS_COMPETITION_FORM_WEIGHT,
    ):
        result = features.copy().reset_index(drop=True)
        if result.empty or not self._events_by_team:
            return result

        if not 0 <= weight <= 1:
            raise ValueError("El peso del contexto debe estar entre 0 y 1.")

        dates = pd.to_datetime(
            result["date"],
            utc=True,
            format="mixed",
            errors="coerce",
        )

        for row_index, row in result.iterrows():
            match_date = dates.iloc[row_index]
            if pd.isna(match_date):
                continue

            for side in ("home", "away"):
                team = canonical_team_name(row[f"{side}_team"], competition_id)
                events = self._events_by_team.get(team, [])
                if not events:
                    continue

                insertion = bisect.bisect_left(
                    self._dates_by_team[team],
                    match_date,
                )
                recent = []
                for event in reversed(events[:insertion]):
                    if event[1] == competition_id:
                        continue
                    recent.append(event[2])
                    if len(recent) == RECENT_MATCH_WINDOW:
                        break

                if not recent:
                    continue

                stats = np.asarray(recent, dtype=float)
                for feature, column_index in _TEAM_FEATURES.items():
                    values = stats[:, column_index]
                    available = values[np.isfinite(values)]
                    if not len(available):
                        continue

                    cross_value = (
                        float(np.nansum(values))
                        if feature == "puntos_10"
                        else float(available.mean())
                    )
                    feature_name = f"{side}_{feature}"
                    baseline_value = result.at[row_index, feature_name]
                    if pd.isna(baseline_value):
                        baseline_value = 0.0
                    result.at[row_index, feature_name] = (
                        (1 - weight) * float(baseline_value)
                        + weight * cross_value
                    )

        return result


def prepare_prediction_features(
    history,
    home_team,
    away_team,
    competition_id,
    cross_competition_form,
    as_of=None,
):
    if history.empty:
        raise ValueError("No hay historial para preparar la predicción.")

    prediction_date = as_of or pd.Timestamp.now(tz="UTC")
    prediction_date = pd.to_datetime(prediction_date, utc=True)

    future_match = history.iloc[-1].copy()
    fixture_ids = pd.to_numeric(history["fixture_id"], errors="coerce").dropna()
    next_fixture_id = int(fixture_ids.max()) + 1 if not fixture_ids.empty else 1
    existing_ids = set(history["fixture_id"].dropna().tolist())
    while next_fixture_id in existing_ids:
        next_fixture_id += 1

    future_match["fixture_id"] = next_fixture_id
    future_match["date"] = prediction_date
    future_match["home_team"] = home_team
    future_match["away_team"] = away_team

    prediction_history = pd.concat(
        [history, pd.DataFrame([future_match])],
        ignore_index=True,
    )
    base_features = preparar_features_al_vuelo(prediction_history)
    prediction_features = base_features[
        base_features["fixture_id"] == next_fixture_id
    ].tail(1)
    if prediction_features.empty:
        raise RuntimeError("No se pudieron preparar las variables del partido.")

    contextual_features = (
        cross_competition_form.add_features(base_features, competition_id)
        if cross_competition_form is not None
        else base_features
    )
    contextual_prediction = contextual_features[
        contextual_features["fixture_id"] == next_fixture_id
    ].tail(1)
    if contextual_prediction.empty:
        raise RuntimeError(
            "No se pudieron preparar las variables de forma entre competencias."
        )
    base_prediction = prediction_features[FEATURES_MODELO].reset_index(drop=True)
    goal_prediction = contextual_prediction[FEATURES_MODELO].reset_index(drop=True)
    for prediction in (base_prediction, goal_prediction):
        prediction.loc[
            0,
            ["home_dias_descanso", "away_dias_descanso"],
        ] = 7.0

    return base_prediction, goal_prediction
