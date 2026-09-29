import pandas as pd
import numpy as np
import xgboost as xgb
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder

FEATURES_MODELO = [
    "home_avg_gf_5",
    "home_avg_gc_5",
    "home_avg_tarjetas_5",
    "home_avg_corners_5",
    "home_avg_corners_contra_5",
    "home_puntos_5",
    "home_dias_descanso",
    "away_avg_gf_5",
    "away_avg_gc_5",
    "away_avg_tarjetas_5",
    "away_avg_corners_5",
    "away_avg_corners_contra_5",
    "away_puntos_5",
    "away_dias_descanso",
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

        # Calcular Goles y Tarjetas
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

        # CORNERS
        partidos_equipo["corners_favor"] = np.where(
            partidos_equipo["home_team"] == equipo,
            partidos_equipo["home_corners"],
            partidos_equipo["away_corners"],
        )
        partidos_equipo["corners_contra"] = np.where(
            partidos_equipo["home_team"] == equipo,
            partidos_equipo["away_corners"],
            partidos_equipo["home_corners"],
        )

        # DESCANSO Y PUNTOS
        partidos_equipo["dias_descanso"] = (
            partidos_equipo["date"].diff().dt.days.fillna(7)
        )  # Asumimos 7 dias por defecto al inicio
        partidos_equipo["puntos_obtenidos"] = np.select(
            [
                partidos_equipo["goles_favor"] > partidos_equipo["goles_contra"],
                partidos_equipo["goles_favor"] == partidos_equipo["goles_contra"],
            ],
            [3, 1],
            default=0,
        )

        # PROMEDIOS Y ACUMULADOS
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
        partidos_equipo["avg_corners_5"] = (
            partidos_equipo["corners_favor"].shift(1).rolling(5, min_periods=1).mean()
        )
        partidos_equipo["avg_corners_contra_5"] = (
            partidos_equipo["corners_contra"].shift(1).rolling(5, min_periods=1).mean()
        )
        partidos_equipo["puntos_5"] = (
            partidos_equipo["puntos_obtenidos"].shift(1).rolling(5, min_periods=1).sum()
        )  # Suma de puntos, no promedio

        partidos_equipo["equipo_objetivo"] = equipo
        equipos_stats.append(
            partidos_equipo[
                [
                    "fixture_id",
                    "equipo_objetivo",
                    "avg_gf_5",
                    "avg_gc_5",
                    "avg_tarjetas_5",
                    "avg_corners_5",
                    "avg_corners_contra_5",
                    "puntos_5",
                    "dias_descanso",
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
                "avg_corners_5": "home_avg_corners_5",
                "avg_corners_contra_5": "home_avg_corners_contra_5",
                "puntos_5": "home_puntos_5",
                "dias_descanso": "home_dias_descanso",
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
                "avg_corners_5": "away_avg_corners_5",
                "avg_corners_contra_5": "away_avg_corners_contra_5",
                "puntos_5": "away_puntos_5",
                "dias_descanso": "away_dias_descanso",
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

    modelo_xgb_clasificador = xgb.XGBClassifier(
        objective="binary:logistic",
        n_estimators=100,
        learning_rate=0.1,
        max_depth=4,
        eval_metric="logloss",
    )

    modelo_xgb_clasificador.fit(X, y)

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

    # Retornamos modelo y LabelEncoder
    return modelo_xgb_marcadores, le


def entrenar_xgboost_goles(df_crudo):
    """
    Entrena dos modelos XGBRegressor para predecir los goles esperados (xG)
    del equipo local y del equipo visitante.
    """

    df_features = preparar_features_al_vuelo(df_crudo)

    # Variables predictoras
    X = df_features[FEATURES_MODELO]
    y_home = df_features["home_goals"]
    y_away = df_features["away_goals"]

    modelo_xgb_goles_home = xgb.XGBRegressor(
        objective="reg:squarederror", n_estimators=100, learning_rate=0.1, max_depth=4
    )
    modelo_xgb_goles_home.fit(X, y_home)

    modelo_xgb_goles_away = xgb.XGBRegressor(
        objective="reg:squarederror", n_estimators=100, learning_rate=0.1, max_depth=4
    )
    modelo_xgb_goles_away.fit(X, y_away)

    return modelo_xgb_goles_home, modelo_xgb_goles_away


def entrenar_xgboost_goles_mercados(df_crudo):
    """
    Entrena modelos XGBClassifier para predecir probabilidades de Over/Under y BTTS.
    """

    df_features = preparar_features_al_vuelo(df_crudo)

    X = df_features[FEATURES_MODELO]

    # Objetivos binarios (1 si se cumple, 0 si no)
    y_ou15 = (df_features["home_goals"] + df_features["away_goals"] > 1.5).astype(int)
    y_ou25 = (df_features["home_goals"] + df_features["away_goals"] > 2.5).astype(int)
    y_btts = ((df_features["home_goals"] > 0) & (df_features["away_goals"] > 0)).astype(
        int
    )

    clf_params = {
        "objective": "binary:logistic",
        "n_estimators": 100,
        "learning_rate": 0.1,
        "max_depth": 4,
        "eval_metric": "logloss",
    }

    modelo_ou15 = xgb.XGBClassifier(**clf_params).fit(X, y_ou15)
    modelo_ou25 = xgb.XGBClassifier(**clf_params).fit(X, y_ou25)
    modelo_btts = xgb.XGBClassifier(**clf_params).fit(X, y_btts)

    return modelo_ou15, modelo_ou25, modelo_btts


def entrenar_xgboost_corners(df_crudo):
    """
    Entrena modelos XGBoost para córners esperados y el mercado Over 9.5
    """

    df_features = preparar_features_al_vuelo(df_crudo)
    X = df_features[FEATURES_MODELO]

    # Objetivos
    y_home = df_features["home_corners"]
    y_away = df_features["away_corners"]
    y_ou95 = (df_features["total_corners"] > 9.5).astype(int)

    modelo_xgb_corners_home = xgb.XGBRegressor(
        objective="reg:squarederror", n_estimators=100, learning_rate=0.1, max_depth=4
    ).fit(X, y_home)
    modelo_xgb_corners_away = xgb.XGBRegressor(
        objective="reg:squarederror", n_estimators=100, learning_rate=0.1, max_depth=4
    ).fit(X, y_away)

    modelo_xgb_corners_ou95 = xgb.XGBClassifier(
        objective="binary:logistic",
        n_estimators=100,
        learning_rate=0.1,
        max_depth=4,
        eval_metric="logloss",
    ).fit(X, y_ou95)

    return modelo_xgb_corners_home, modelo_xgb_corners_away, modelo_xgb_corners_ou95


def entrenar_xgboost_corners_mercados(df_crudo):
    """
    Entrena modelos XGBClassifier para las líneas individuales de córners de cada equipo.
    """

    df_features = preparar_features_al_vuelo(df_crudo)
    X = df_features[FEATURES_MODELO]

    # Objetivos binarios para las 4 lineas principales
    y_h45 = (df_features["home_corners"] > 4.5).astype(int)
    y_h55 = (df_features["home_corners"] > 5.5).astype(int)
    y_a35 = (df_features["away_corners"] > 3.5).astype(int)
    y_a45 = (df_features["away_corners"] > 4.5).astype(int)

    clf_params = {
        "objective": "binary:logistic",
        "n_estimators": 100,
        "learning_rate": 0.1,
        "max_depth": 4,
    }

    mod_h45 = xgb.XGBClassifier(**clf_params).fit(X, y_h45)
    mod_h55 = xgb.XGBClassifier(**clf_params).fit(X, y_h55)
    mod_a35 = xgb.XGBClassifier(**clf_params).fit(X, y_a35)
    mod_a45 = xgb.XGBClassifier(**clf_params).fit(X, y_a45)

    return mod_h45, mod_h55, mod_a35, mod_a45


def entrenar_xgboost_1x2(df_crudo):
    """
    Entrena modelos XGBoost para 1x2
    """

    df_features = preparar_features_al_vuelo(df_crudo)

    X = df_features[FEATURES_MODELO]

    # 0 = Local, 1 = Empate, 2 = Visitante
    condiciones = [
        df_features["home_goals"] > df_features["away_goals"],
        df_features["home_goals"] == df_features["away_goals"],
    ]
    y = np.select(condiciones, [0, 1], default=2)

    modelo_1x2 = xgb.XGBClassifier(
        objective="multi:softprob",
        num_class=3,
        n_estimators=100,
        learning_rate=0.1,
        max_depth=4,
    ).fit(X, y)

    return modelo_1x2
