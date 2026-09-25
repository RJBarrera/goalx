import pandas as pd
import numpy as np
import xgboost as xgb
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder

FEATURES_MODELO = [
    "home_avg_gf_5",
    "home_avg_gc_5",
    "home_avg_tarjetas_5",
    "away_avg_gf_5",
    "away_avg_gc_5",
    "away_avg_tarjetas_5",
]


def preparar_features_al_vuelo(df):
    """
    Toma el DataFrame crudo y calcula variables avanzadas en memoria.
    No modifica la base de datos original.
    """

    # Copia en memoria para no alterar el df
    df_ml = df.copy()

    # Que la fecha sea tipo datetime y ordenar cronologicamente
    df_ml["date"] = pd.to_datetime(df_ml["date"], utc=True, format="mixed")
    df_ml = df_ml.sort_values("date")

    # Calcular promedios (Ultimos 5 partidos) para cada equipo
    # Creamos un dataframe temporal apilando locales y visitantes para calcular rachas
    equipos_stats = []

    for equipo in set(df_ml["home_team"]).union(set(df_ml["away_team"])):
        # Partidos donde jugo el equipo
        partidos_equipo = df_ml[
            (df_ml["home_team"] == equipo) | (df_ml["away_team"] == equipo)
        ].copy()

        # Calcular goles a favor y en contra en cada partido para este equipo
        partidos_equipo["goles_favor"] = np.where(
            partidos_equipo["home_team"] == equipo,
            partidos_equipo["home_goals"],
            partidos_equipo["away_goals"],
        )
        partidos_equipo["goles_contra"] = np.where(
            partidos_equipo["home_team"] == equipo,
            partidos_equipo["away_goals"],
            partidos_equipo["home_goals"],
        )
        partidos_equipo["tarjetas_recibidas"] = np.where(
            partidos_equipo["home_team"] == equipo,
            partidos_equipo["home_cards"],
            partidos_equipo["away_cards"],
        )

        # Promedio de los ultimos 5 partidos
        partidos_equipo["avg_gf_5"] = (
            partidos_equipo["goles_favor"].shift(1).rolling(5, min_periods=1).mean()
        )
        partidos_equipo["avg_gc_5"] = (
            partidos_equipo["goles_contra"].shift(1).rolling(5, min_periods=1).mean()
        )
        partidos_equipo["avg_tarjetas_5"] = (
            partidos_equipo["tarjetas_recibidas"]
            .shift(1)
            .rolling(5, min_periods=1)
            .mean()
        )

        partidos_equipo["equipo_objetivo"] = equipo
        equipos_stats.append(
            partidos_equipo[
                [
                    "fixture_id",
                    "equipo_objetivo",
                    "avg_gf_5",
                    "avg_gc_5",
                    "avg_tarjetas_5",
                ]
            ]
        )

    # Unir las estadisticas calculadas de vuelta al DataFrame principal
    df_stats = pd.concat(equipos_stats)

    # Unir para el equipo local
    df_ml = df_ml.merge(
        df_stats.rename(
            columns={
                "equipo_objetivo": "home_team",
                "avg_gf_5": "home_avg_gf_5",
                "avg_gc_5": "home_avg_gc_5",
                "avg_tarjetas_5": "home_avg_tarjetas_5",
            }
        ),
        on=["fixture_id", "home_team"],
        how="left",
    )

    # Unir para el equipo visitante
    df_ml = df_ml.merge(
        df_stats.rename(
            columns={
                "equipo_objetivo": "away_team",
                "avg_gf_5": "away_avg_gf_5",
                "avg_gc_5": "away_avg_gc_5",
                "avg_tarjetas_5": "away_avg_tarjetas_5",
            }
        ),
        on=["fixture_id", "away_team"],
        how="left",
    )

    # Llenar valores nulos (para los primeros partidos de la temporada)
    df_ml = df_ml.fillna(0)

    return df_ml


def entrenar_xgboost_tarjetas(df_crudo):
    """
    Entrena un modelo XGBoost para predecir el total de tarjetas.
    """

    df_features = preparar_features_al_vuelo(df_crudo)

    # Seleccionar las variables predictoras (X) y el objetivo (y)
    X = df_features[FEATURES_MODELO]
    y = df_features["total_cards"]

    # Entrenar el modelo
    modelo_xgb = xgb.XGBRegressor(
        objective="reg:squarederror", n_estimators=100, learning_rate=0.1, max_depth=4
    )

    modelo_xgb.fit(X, y)
    # print(" ✅ Modelo XGBoost entrenado y listo en memoria.")

    return modelo_xgb


def entrenar_xgboost_tarjetas_probabilidad(df_crudo):
    """
    Entrena un modelo XGBClassifier para predecir la probabilidad de +4.5 tarjetas.
    """

    df_features = preparar_features_al_vuelo(df_crudo)

    # Seleccionar las variables predictoras (X) y el objetivo (y)
    X = df_features[FEATURES_MODELO]
    # Ahora es binario: 1 si total_cards > 4.5, 0 si no
    y = (df_features["total_cards"] > 4.5).astype(int)

    # print("🧠 Entrenando modelo XGBoost Classifier (Over/Under 4.5)...")
    modelo_xgb_clasificador = xgb.XGBClassifier(
        objective="binary:logistic",
        n_estimators=100,
        learning_rate=0.1,
        max_depth=4,
        eval_metric="logloss",
    )

    modelo_xgb_clasificador.fit(X, y)
    # print(" ✅ Modelo XGBoost de tarjetas entrenado.")

    return modelo_xgb_clasificador


def entrenar_xgboost_marcadores(df_crudo):
    """
    Entrena un XGBClassifier multiclase para predecir el marcador exacto.
    """

    df_features = preparar_features_al_vuelo(df_crudo)

    # Pasar el marcador en texto
    df_features["marcador_str"] = (
        df_features["home_goals"].astype(int).astype(str)
        + "-"
        + df_features["away_goals"].astype(int).astype(str)
    )

    # Transforma los marcadores a clases numericas para XGBoost
    le = LabelEncoder()
    y = le.fit_transform(df_features["marcador_str"])

    # Variables predictoras (ultimos 5 partidos)
    X = df_features[FEATURES_MODELO]

    modelo_xgb_marcadores = xgb.XGBClassifier(
        objective="multi:softprob",  # Probabilidades para multiples clases
        n_estimators=100,
        learning_rate=0.1,
        max_depth=4,
        eval_metric="mlogloss",
    )

    modelo_xgb_marcadores.fit(X, y)
    # print(" ✅ Modelo XGBoost de Marcadores entrenado.")

    # Retornamos modelo y LabelEncoder
    return modelo_xgb_marcadores, le
