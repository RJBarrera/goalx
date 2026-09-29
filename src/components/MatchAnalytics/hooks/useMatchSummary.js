// hooks/useMatchSummary.js
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

// SELECCIONAR LA MAYOR PROBABILIDAD DE UN MERCADO
const obtenerMayorProbabilidad = (categoria, opciones, descripcion = "") => {
  const validas = opciones
    .filter((opcion) => Number.isFinite(Number(opcion.probabilidad)))
    .map((opcion) => ({
      ...opcion,
      probabilidad: Number(opcion.probabilidad),
    }))
    .sort((a, b) => b.probabilidad - a.probabilidad);

  if (validas.length === 0) {
    return null;
  }

  return {
    categoria,
    descripcion,
    ...validas[0],
  };
};

export default function useMatchSummary(resultado, datosResultado) {
  const { t } = useTranslation();

  return useMemo(() => {
    if (!resultado || !datosResultado) return null;

    const { goles = {}, corners = {}, tarjetas = {} } = datosResultado;
    const { local, visitante, arbitro } = resultado.partido;

    const candidatos = [];

    // Funcion auxiliar para eliminar el codigo repetitivo
    const evaluarMercado = (categoria, opciones, descripcion) => {
      const mayor = obtenerMayorProbabilidad(categoria, opciones, descripcion);
      if (mayor) candidatos.push(mayor);
    };

    // 1X2
    evaluarMercado(
      t("matchAnalytics.analytics.results.summaryKeys.matchResult"),
      [
        {
          seleccion: t(
            "matchAnalytics.analytics.results.summaryKeys.teamWins",
            { team: local },
          ),
          probabilidad: goles?.["1X2"]?.Home,
          tipo: "resultado",
        },
        {
          seleccion: t("matchAnalytics.analytics.results.summaryKeys.draw"),
          probabilidad: goles?.["1X2"]?.Draw,
          tipo: "resultado",
        },
        {
          seleccion: t(
            "matchAnalytics.analytics.results.summaryKeys.teamWins",
            { team: visitante },
          ),
          probabilidad: goles?.["1X2"]?.Away,
          tipo: "resultado",
        },
      ],
      t("matchAnalytics.analytics.results.summaryKeys.finalMatchResultDesc"),
    );

    // GOLES 1.5
    evaluarMercado(
      t("matchAnalytics.analytics.results.summaryKeys.totalGoals15"),
      [
        {
          seleccion: t(
            "matchAnalytics.analytics.results.summaryKeys.overGoals",
            { count: "1.5" },
          ),
          probabilidad: goles?.Over_Under?.["Over 1.5"],
          tipo: "goles",
        },
        {
          seleccion: t(
            "matchAnalytics.analytics.results.summaryKeys.underGoals",
            { count: "1.5" },
          ),
          probabilidad: goles?.Over_Under?.["Under 1.5"],
          tipo: "goles",
        },
      ],
      t("matchAnalytics.analytics.results.summaryKeys.mainGoalsLineDesc"),
    );

    // GOLES 2.5
    evaluarMercado(
      t("matchAnalytics.analytics.results.summaryKeys.totalGoals25"),
      [
        {
          seleccion: t(
            "matchAnalytics.analytics.results.summaryKeys.overGoals",
            { count: "2.5" },
          ),
          probabilidad: goles?.Over_Under?.["Over 2.5"],
          tipo: "goles",
        },
        {
          seleccion: t(
            "matchAnalytics.analytics.results.summaryKeys.underGoals",
            { count: "2.5" },
          ),
          probabilidad: goles?.Over_Under?.["Under 2.5"],
          tipo: "goles",
        },
      ],
      t("matchAnalytics.analytics.results.summaryKeys.mainGoalsLineDesc"),
    );

    // BTTS
    evaluarMercado(
      t("matchAnalytics.analytics.results.summaryKeys.btts"),
      [
        {
          seleccion: t("matchAnalytics.analytics.results.summaryKeys.bttsYes"),
          probabilidad: goles?.BTTS?.Yes,
          tipo: "goles",
        },
        {
          seleccion: t("matchAnalytics.analytics.results.summaryKeys.bttsNo"),
          probabilidad: goles?.BTTS?.No,
          tipo: "goles",
        },
      ],
      t("matchAnalytics.analytics.results.summaryKeys.bttsMarketDesc"),
    );

    // CÓRNERS TOTALES
    evaluarMercado(
      t("matchAnalytics.analytics.results.summaryKeys.corners"),
      [
        {
          seleccion: t(
            "matchAnalytics.analytics.results.summaryKeys.overCorners",
            { count: "9.5" },
          ),
          probabilidad: corners?.["Over 9.5"],
          tipo: "corners",
        },
        {
          seleccion: t(
            "matchAnalytics.analytics.results.summaryKeys.underCorners",
            { count: "9.5" },
          ),
          probabilidad: corners?.["Under 9.5"],
          tipo: "corners",
        },
      ],
      t("matchAnalytics.analytics.results.summaryKeys.cornersMarketDesc"),
    );

    // CÓRNERS PRIMERA MITAD
    evaluarMercado(
      t("matchAnalytics.analytics.results.summaryKeys.corners1T"),
      [
        {
          seleccion: t(
            "matchAnalytics.analytics.results.summaryKeys.overCorners",
            { count: "4.5" },
          ),
          probabilidad: corners?.["Over 4.5 1H"],
          tipo: "corners",
        },
        {
          seleccion: t(
            "matchAnalytics.analytics.results.summaryKeys.underCorners",
            { count: "4.5" },
          ),
          probabilidad: corners?.["Under 4.5 1H"],
          tipo: "corners",
        },
      ],
      t("matchAnalytics.analytics.results.summaryKeys.cornersMarketDesc1T"),
    );

    // CÓRNERS LOCAL 4.5
    evaluarMercado(
      t("matchAnalytics.analytics.results.summaryKeys.teamCornersTitle", {
        team: local,
      }),
      [
        {
          seleccion: t(
            "matchAnalytics.analytics.results.summaryKeys.teamOverCorners",
            { team: local, count: "4.5" },
          ),
          probabilidad: corners?.["Home_Over_4.5"],
          tipo: "corners",
        },
        {
          seleccion: t(
            "matchAnalytics.analytics.results.summaryKeys.teamUnderCorners",
            { team: local, count: "4.5" },
          ),
          probabilidad: corners?.["Home_Under_4.5"],
          tipo: "corners",
        },
      ],
      t(
        "matchAnalytics.analytics.results.summaryKeys.homeIndividualMarketDesc",
      ),
    );

    // CÓRNERS LOCAL 5.5
    evaluarMercado(
      t("matchAnalytics.analytics.results.summaryKeys.teamLineTitle", {
        team: local,
        count: "5.5",
      }),
      [
        {
          seleccion: t(
            "matchAnalytics.analytics.results.summaryKeys.teamOverCorners",
            { team: local, count: "5.5" },
          ),
          probabilidad: corners?.["Home_Over_5.5"],
          tipo: "corners",
        },
        {
          seleccion: t(
            "matchAnalytics.analytics.results.summaryKeys.teamUnderCorners",
            { team: local, count: "5.5" },
          ),
          probabilidad: corners?.["Home_Under_5.5"],
          tipo: "corners",
        },
      ],
      t(
        "matchAnalytics.analytics.results.summaryKeys.homeIndividualMarketDesc",
      ),
    );

    // CÓRNERS VISITANTE 3.5
    evaluarMercado(
      t("matchAnalytics.analytics.results.summaryKeys.teamCornersTitle", {
        team: visitante,
      }),
      [
        {
          seleccion: t(
            "matchAnalytics.analytics.results.summaryKeys.teamOverCorners",
            { team: visitante, count: "3.5" },
          ),
          probabilidad: corners?.["Away_Over_3.5"],
          tipo: "corners",
        },
        {
          seleccion: t(
            "matchAnalytics.analytics.results.summaryKeys.teamUnderCorners",
            { team: visitante, count: "3.5" },
          ),
          probabilidad: corners?.["Away_Under_3.5"],
          tipo: "corners",
        },
      ],
      t(
        "matchAnalytics.analytics.results.summaryKeys.awayIndividualMarketDesc",
      ),
    );

    // CÓRNERS VISITANTE 4.5
    evaluarMercado(
      t("matchAnalytics.analytics.results.summaryKeys.teamLineTitle", {
        team: visitante,
        count: "4.5",
      }),
      [
        {
          seleccion: t(
            "matchAnalytics.analytics.results.summaryKeys.teamOverCorners",
            { team: visitante, count: "4.5" },
          ),
          probabilidad: corners?.["Away_Over_4.5"],
          tipo: "corners",
        },
        {
          seleccion: t(
            "matchAnalytics.analytics.results.summaryKeys.teamUnderCorners",
            { team: visitante, count: "4.5" },
          ),
          probabilidad: corners?.["Away_Under_4.5"],
          tipo: "corners",
        },
      ],
      t(
        "matchAnalytics.analytics.results.summaryKeys.awayIndividualMarketDesc",
      ),
    );

    // TARJETAS
    const refereeName =
      arbitro?.toLowerCase() === "desconocido"
        ? t("sportsSelect.unknownReferee")
        : arbitro;

    evaluarMercado(
      t("matchAnalytics.analytics.results.summaryKeys.cards"),
      [
        {
          seleccion: t(
            "matchAnalytics.analytics.results.summaryKeys.overCards",
            { count: "4.5" },
          ),
          probabilidad: tarjetas?.["Over 4.5"],
          tipo: "tarjetas",
        },
        {
          seleccion: t(
            "matchAnalytics.analytics.results.summaryKeys.underCards",
            { count: "4.5" },
          ),
          probabilidad: tarjetas?.["Under 4.5"],
          tipo: "tarjetas",
        },
      ],
      t("matchAnalytics.analytics.results.summaryKeys.refereeAdjustedDesc", {
        referee: refereeName,
      }),
    );

    // LIMPIAR
    const ordenados = candidatos
      .filter((item) => item.probabilidad >= 0 && item.probabilidad <= 1)
      .sort((a, b) => b.probabilidad - a.probabilidad);

    const top = ordenados.slice(0, 5);
    const principal = top[0] || null;

    // MARCADOR EXACTO MÁS PROBABLE (Clasico)
    const marcador =
      Object.entries(goles?.Top_Scores || {})
        .map(([score, probability]) => ({
          marcador: score,
          probabilidad: Number(probability),
        }))
        .sort((a, b) => b.probabilidad - a.probabilidad)[0] || null;

    // MARCADOR EXACTO MAS PROBABLE (XGBOOST IA)
    const marcadorAi =
      Object.entries(goles?.Top_Scores_AI || {})
        .map(([score, probability]) => ({
          marcador: score,
          probabilidad: Number(probability),
        }))
        .sort((a, b) => b.probabilidad - a.probabilidad)[0] || null;

    // TENDENCIAS (Mantenemos las clasicas y sumamos las de IA)
    const totalXg =
      Number(goles?.expected_goals_home || 0) +
      Number(goles?.expected_goals_away || 0);
    const totalCorners = Number(corners?.expected_total || 0);
    const totalCards = Number(tarjetas?.expected_total || 0);

    // Variables de IA
    const totalXgAi =
      Number(goles?.xgboost_expected_goals_home || 0) +
      Number(goles?.xgboost_expected_goals_away || 0);
    const probBttsAi = Number(goles?.xgboost_mercados?.BTTS_Yes || 0);
    const probOver95CornersAi = Number(corners?.xgboost?.["Over 9.5"] || 0);

    const tendencias = [];

    // Tendencias Clasicas
    if (totalXg >= 2.8)
      tendencias.push(
        t(
          "matchAnalytics.analytics.results.summaryKeys.trends.highOffensiveProduction",
          { value: "2.8" },
        ),
      );
    if (totalXg <= 2.1)
      tendencias.push(
        t(
          "matchAnalytics.analytics.results.summaryKeys.trends.lowOffensiveProduction",
          { value: "2.1" },
        ),
      );
    if (totalCorners >= 9.5)
      tendencias.push(
        t(
          "matchAnalytics.analytics.results.summaryKeys.trends.highCornersExpectation",
          { value: "9.5" },
        ),
      );
    if (totalCards >= 4.5)
      tendencias.push(
        t(
          "matchAnalytics.analytics.results.summaryKeys.trends.highCardsExpectation",
          { value: "4.5" },
        ),
      );

    // Tendencias (IA)
    if (totalXgAi >= 2.8) {
      tendencias.push(
        t(
          "matchAnalytics.analytics.results.summaryKeys.trends.highOffensiveProductionAi",
        ),
      );
    } else if (totalXgAi <= 2.0) {
      tendencias.push(
        t(
          "matchAnalytics.analytics.results.summaryKeys.trends.lowOffensiveProductionAi",
        ),
      );
    }

    if (probBttsAi >= 0.6) {
      tendencias.push(
        t("matchAnalytics.analytics.results.summaryKeys.trends.highBttsAi"),
      );
    }

    if (probOver95CornersAi >= 0.6) {
      tendencias.push(
        t(
          "matchAnalytics.analytics.results.summaryKeys.trends.highCornersExpectationAi",
        ),
      );
    }

    return { top, principal, marcador, marcadorAi, tendencias };
  }, [resultado, datosResultado, t]);
}
