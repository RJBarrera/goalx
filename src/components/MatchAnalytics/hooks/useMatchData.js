import { useMemo } from "react";
import { useTranslation } from "react-i18next";

const COLORS = {
  local: "#21cfa1",
  draw: "#94a3b8",
  away: "#38bdf8",
  corner: "#f59e0b",
  localAi: "#0284c7",
  drawAi: "#7dd3fc",
  awayAi: "#0ea5e9",
};

// Utilidades
const porcentaje = (valor) => {
  return Number(valor || 0) * 100;
};

export default function useMatchData(resultado) {
  const { t } = useTranslation();

  return useMemo(() => {
    if (!resultado) {
      return null;
    }

    const goles = resultado.goles || {};
    const corners = resultado.corners || {};
    const tarjetas = resultado.tarjetas || {};

    // 1x2
    const resultado1X2 = [
      {
        name: resultado.partido?.local || "Local",
        value: porcentaje(goles?.["1X2"]?.Home),
        color: COLORS.local,
      },

      {
        name: t("matchAnalytics.analytics.results.market1x2.draw"),
        value: porcentaje(goles?.["1X2"]?.Draw),
        color: COLORS.draw,
      },

      {
        name: resultado.partido?.visitante || "Visitante",
        value: porcentaje(goles?.["1X2"]?.Away),
        color: COLORS.away,
      },
    ];

    // 1x2 IA
    const resultado1X2Ai = [
      {
        name: resultado.partido?.local || "Local",
        value: porcentaje(goles?.xgboost_1X2?.Home),
        color: COLORS.localAi,
      },
      {
        name: t("matchAnalytics.analytics.results.market1x2.draw"),
        value: porcentaje(goles?.xgboost_1X2?.Draw),
        color: COLORS.drawAi,
      },
      {
        name: resultado.partido?.visitante || "Visitante",
        value: porcentaje(goles?.xgboost_1X2?.Away),
        color: COLORS.awayAi,
      },
    ];

    // Marcadores (Modelo Clasico)
    const topMarcadores = Object.entries(goles?.Top_Scores || {}).map(
      ([marcador, probabilidad]) => ({
        marcador,
        probabilidad: porcentaje(probabilidad),
      }),
    );

    // Marcadores (Modelo IA)
    const topMarcadoresAi = Object.entries(goles?.Top_Scores_AI || {}).map(
      ([marcador, probabilidad]) => ({
        marcador,
        probabilidad: porcentaje(probabilidad),
      }),
    );

    // BTTS Clasico
    const ambosAnotan = [
      {
        name: t("matchAnalytics.analytics.results.goals.yesBadge"),
        value: porcentaje(goles?.BTTS?.Yes),
      },
      {
        name: t("matchAnalytics.analytics.results.goals.noBadge"),
        value: porcentaje(goles?.BTTS?.No),
      },
    ];

    // BTTS IA
    const ambosAnotanAi = [
      {
        name: t("matchAnalytics.analytics.results.goals.yesBadge"),
        value: porcentaje(goles?.xgboost_mercados?.BTTS_Yes),
      },
      {
        name: t("matchAnalytics.analytics.results.goals.noBadge"),
        value: porcentaje(goles?.xgboost_mercados?.BTTS_No),
      },
    ];

    // Córners Equipos
    const cornersEquipos = [
      {
        name: resultado.partido?.local || "Local",
        esperado: Number(corners?.expected_home || 0),
      },

      {
        name: resultado.partido?.visitante || "Visitante",
        esperado: Number(corners?.expected_away || 0),
      },
    ];

    // Córner Equipos (Modelo IA)
    const cornersEquiposAi = [
      {
        name: resultado.partido?.local || "Local",
        esperado: Number(corners?.xgboost?.expected_home || 0),
      },
      {
        name: resultado.partido?.visitante || "Visitante",
        esperado: Number(corners?.xgboost?.expected_away || 0),
      },
    ];

    // Escenario Dominante
    const ganador = [...resultado1X2].sort((a, b) => b.value - a.value)[0];
    const ganadorAi = [...resultado1X2Ai].sort((a, b) => b.value - a.value)[0];

    return {
      goles,
      corners,
      tarjetas,

      resultado1X2,
      resultado1X2Ai,
      topMarcadores,
      topMarcadoresAi,
      ambosAnotan,
      ambosAnotanAi,
      cornersEquipos,
      cornersEquiposAi,
      ganador,
      ganadorAi,
    };
  }, [resultado, t]);
}
