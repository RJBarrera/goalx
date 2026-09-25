import axios from "axios";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useCompetition } from "../../context/CompetitionContext";
import { exportMatchReport } from "../../utils/exportMatchReport";
import { getTeamLogo } from "../../utils/teamLogos";
import ExportPdfButton from "../ExportPdfButton/ExportPdfButton";
import SportsSelect from "../SportsSelect/SportsSelect";
import "./MatchAnalytics.css";

const API_URL = "";
const COLORS = {
  local: "#21cfa1",
  draw: "#94a3b8",
  away: "#38bdf8",
  positive: "#22c55e",
  negative: "#dce3eb",
  corner: "#f59e0b",
  card: "#eab308",
};

// Utilidades
const porcentaje = (valor) => {
  return Number(valor || 0) * 100;
};

const numero = (valor, decimales = 2) => {
  const n = Number(valor);

  if (!Number.isFinite(n)) {
    return "0.00";
  }

  return n.toFixed(decimales);
};

// Iniciales del equipo cuando no hay logo
const obtenerInicialesEquipo = (nombre = "") => {
  const texto = String(nombre).trim();

  if (!texto) {
    return "?";
  }

  const palabras = texto
    .replace(/[.-]/g, " ")
    .split(/\s+/)
    .map((item) => item.trim())
    .filter(Boolean);

  if (palabras.length === 1) {
    return palabras[0].slice(0, 2).toUpperCase();
  }

  return `${palabras[0]?.[0] || ""}${palabras[1]?.[0] || ""}`.toUpperCase();
};

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

// Barra de probabildad
function ProbabilityBar({ label, value, accent = "green" }) {
  const percent = Math.max(0, Math.min(100, porcentaje(value)));

  return (
    <div className="match-probability-row">
      <div className="match-probability-header">
        <span>{label}</span>

        <strong>{percent.toFixed(1)}%</strong>
      </div>

      <div className="match-probability-track">
        <div
          className={`match-probability-fill match-probability-fill--${accent}`}
          style={{
            width: `${percent}%`,
          }}
        />
      </div>
    </div>
  );
}

// Métrica
function MetricCard({ label, value, description, variant = "default", tag }) {
  return (
    <article className={`match-metric-card match-metric-card--${variant}`}>
      <div className="match-metric-card__top">
        <div className="match-metric-label">{label}</div>

        {tag && <span className="match-metric-tag">{tag}</span>}
      </div>

      <div className="match-metric-value">{value}</div>

      {description && (
        <div className="match-metric-description">{description}</div>
      )}
    </article>
  );
}

// Encabezado de sección
function SectionHeader({ code, eyebrow, title, description }) {
  return (
    <div className="match-section-heading">
      <div className="match-section-heading__code">{code}</div>

      <div>
        <span className="match-section-eyebrow">{eyebrow}</span>

        <h2>{title}</h2>

        {description && <p>{description}</p>}
      </div>
    </div>
  );
}

// Tooltip
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className="match-chart-tooltip">
      {label && <div className="match-chart-tooltip-label">{label}</div>}

      {payload.map((item) => (
        <div
          key={`${item.name}-${item.value}`}
          className="match-chart-tooltip-value"
        >
          <span>{item.name}</span>

          <strong>{Number(item.value).toFixed(1)}%</strong>
        </div>
      ))}
    </div>
  );
}

// Componente Principal
function MatchAnalytics({ partidoSeleccionado }) {
  // Hook de traduccion
  const { t } = useTranslation();

  const { competition, competitionId } = useCompetition();

  // Reporte PDF
  const reportRef = useRef(null);

  // Formulario
  const [form, setForm] = useState({
    local: "",
    visitante: "",
    arbitro: "",
  });

  // Catálogos
  const [catalogos, setCatalogos] = useState({
    equipos: [],
    arbitros: [],
  });
  const [loadingCatalogos, setLoadingCatalogos] = useState(true);
  const [errorCatalogos, setErrorCatalogos] = useState("");
  const [modelStatus, setModelStatus] = useState({
    ready: true,
    records: 0,
    minimumRecords: 0,
    message: "",
  });

  // Resultado
  const [resultado, setResultado] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // PDF
  const [exportingPdf, setExportingPdf] = useState(false);

  // Cargar Catálogos
  useEffect(() => {
    if (!competitionId) {
      return undefined;
    }

    let mounted = true;

    const cargarCatalogos = async () => {
      setLoadingCatalogos(true);

      setErrorCatalogos("");

      try {
        const { data } = await axios.get(`${API_URL}/api/catalogos`, {
          params: { competition: competitionId },
        });

        if (!data?.success) {
          throw new Error("No fue posible cargar los catálogos.");
        }

        if (!mounted) {
          return;
        }

        setCatalogos({
          equipos: Array.isArray(data.equipos) ? data.equipos : [],
          arbitros: Array.isArray(data.arbitros) ? data.arbitros : [],
        });

        setModelStatus({
          ready: data?.model ? Boolean(data.model.ready) : true,
          records: Number(data?.model?.records || 0),
          minimumRecords: Number(data?.model?.minimum_records || 0),
          message: String(data?.model?.message || ""),
        });
      } catch (requestError) {
        console.error("Error cargando catálogos:", requestError);

        setErrorCatalogos(
          requestError?.response?.data?.detail ||
            requestError?.message ||
            "No fue posible conectarse con Python.",
        );
      } finally {
        if (mounted) {
          setLoadingCatalogos(false);
        }
      }
    };

    setCatalogos({ equipos: [], arbitros: [] });
    setModelStatus({
      ready: true,
      records: 0,
      minimumRecords: 0,
      message: "",
    });
    setForm({ local: "", visitante: "", arbitro: "" });
    setResultado(null);
    setError("");
    cargarCatalogos();

    return () => {
      mounted = false;
    };
  }, [competitionId]);

  useEffect(() => {
    if (!partidoSeleccionado) {
      return;
    }

    setForm((current) => ({
      ...current,
      local: partidoSeleccionado.local || "",
      visitante: partidoSeleccionado.visitante || "",
    }));
  }, [partidoSeleccionado]);

  // Actualizar Campo
  const actualizarCampo = (campo, valor) => {
    setForm((prev) => ({
      ...prev,
      [campo]: valor,
    }));

    if (error) {
      setError("");
    }
  };

  // Analizar Partido
  const analizarPartido = async (event) => {
    event.preventDefault();

    const local = form.local.trim();
    const visitante = form.visitante.trim();
    const arbitro = form.arbitro.trim();

    // Validación
    if (!local || !visitante || !arbitro) {
      setError("Selecciona el equipo local, visitante y árbitro.");
      return;
    }

    if (
      local.toLocaleLowerCase("es-MX") === visitante.toLocaleLowerCase("es-MX")
    ) {
      setError("El equipo local y visitante deben ser diferentes.");
      return;
    }

    // Petición
    setLoading(true);
    setError("");

    try {
      const { data } = await axios.post(`${API_URL}/api/prediccion`, {
        competition: competitionId,
        local,
        visitante,
        arbitro,
      });

      if (!data?.success) {
        throw new Error(
          data?.message || "No fue posible calcular la predicción.",
        );
      }

      setResultado(data);

      // Scroll Resultados
      setTimeout(() => {
        document.getElementById("analitica")?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 150);
    } catch (requestError) {
      console.error("Error calculando predicción:", requestError);

      setResultado(null);

      setError(
        requestError?.response?.data?.detail ||
          requestError?.message ||
          "No fue posible comunicarse con el motor de predicción.",
      );
    } finally {
      setLoading(false);
    }
  };

  // Datos para gráficas
  const datosResultado = useMemo(() => {
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

    // BTTS
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

    // Escenario Dominante
    const ganador = [...resultado1X2].sort((a, b) => b.value - a.value)[0];

    return {
      goles,
      corners,
      tarjetas,

      resultado1X2,
      topMarcadores,
      topMarcadoresAi,
      ambosAnotan,
      cornersEquipos,
      ganador,
    };
  }, [resultado, t]);

  // RESUMEN DE MAYORES PROBABILIDADES
  const resumenProbabilidades = useMemo(() => {
    if (!resultado || !datosResultado) {
      return null;
    }

    const goles = datosResultado.goles || {};
    const corners = datosResultado.corners || {};
    const tarjetas = datosResultado.tarjetas || {};

    const candidatos = [];

    const local = resultado.partido.local;
    const visitante = resultado.partido.visitante;

    // 1X2
    candidatos.push(
      obtenerMayorProbabilidad(
        t("matchAnalytics.analytics.results.summaryKeys.matchResult"),
        [
          {
            seleccion: t(
              "matchAnalytics.analytics.results.summaryKeys.teamWins",
              {
                team: local,
              },
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
              {
                team: visitante,
              },
            ),
            probabilidad: goles?.["1X2"]?.Away,
            tipo: "resultado",
          },
        ],
        t("matchAnalytics.analytics.results.summaryKeys.finalMatchResultDesc"),
      ),
    );

    // GOLES 1.5
    candidatos.push(
      obtenerMayorProbabilidad(
        t("matchAnalytics.analytics.results.summaryKeys.totalGoals15"),
        [
          {
            seleccion: t(
              "matchAnalytics.analytics.results.summaryKeys.overGoals",
              {
                count: "1.5",
              },
            ),
            probabilidad: goles?.Over_Under?.["Over 1.5"],
            tipo: "goles",
          },
          {
            seleccion: t(
              "matchAnalytics.analytics.results.summaryKeys.underGoals",
              {
                count: "1.5",
              },
            ),
            probabilidad: goles?.Over_Under?.["Under 1.5"],
            tipo: "goles",
          },
        ],
        t("matchAnalytics.analytics.results.summaryKeys.mainGoalsLineDesc"),
      ),
    );

    // GOLES 2.5
    candidatos.push(
      obtenerMayorProbabilidad(
        t("matchAnalytics.analytics.results.summaryKeys.totalGoals25"),
        [
          {
            seleccion: t(
              "matchAnalytics.analytics.results.summaryKeys.overGoals",
              {
                count: "2.5",
              },
            ),
            probabilidad: goles?.Over_Under?.["Over 2.5"],
            tipo: "goles",
          },
          {
            seleccion: t(
              "matchAnalytics.analytics.results.summaryKeys.underGoals",
              {
                count: "2.5",
              },
            ),
            probabilidad: goles?.Over_Under?.["Under 2.5"],
            tipo: "goles",
          },
        ],
        t("matchAnalytics.analytics.results.summaryKeys.mainGoalsLineDesc"),
      ),
    );

    // BTTS
    candidatos.push(
      obtenerMayorProbabilidad(
        t("matchAnalytics.analytics.results.summaryKeys.btts"),
        [
          {
            seleccion: t(
              "matchAnalytics.analytics.results.summaryKeys.bttsYes",
            ),
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
      ),
    );

    // CÓRNERS TOTALES
    candidatos.push(
      obtenerMayorProbabilidad(
        t("matchAnalytics.analytics.results.summaryKeys.corners"),
        [
          {
            seleccion: t(
              "matchAnalytics.analytics.results.summaryKeys.overCorners",
              {
                count: "9.5",
              },
            ),
            probabilidad: corners?.["Over 9.5"],
            tipo: "corners",
          },
          {
            seleccion: t(
              "matchAnalytics.analytics.results.summaryKeys.underCorners",
              {
                count: "9.5",
              },
            ),
            probabilidad: corners?.["Under 9.5"],
            tipo: "corners",
          },
        ],
        t("matchAnalytics.analytics.results.summaryKeys.cornersMarketDesc"),
      ),
    );

    // CÓRNERS PRIMERA MITAD
    candidatos.push(
      obtenerMayorProbabilidad(
        t("matchAnalytics.analytics.results.summaryKeys.corners1T"),
        [
          {
            seleccion: t(
              "matchAnalytics.analytics.results.summaryKeys.overCorners",
              {
                count: "4.5",
              },
            ),
            probabilidad: corners?.["Over 4.5 1H"],
            tipo: "corners",
          },
          {
            seleccion: t(
              "matchAnalytics.analytics.results.summaryKeys.underCorners",
              {
                count: "4.5",
              },
            ),
            probabilidad: corners?.["Under 4.5 1H"],
            tipo: "corners",
          },
        ],
        t("matchAnalytics.analytics.results.summaryKeys.cornersMarketDesc1T"),
      ),
    );

    // CÓRNERS LOCAL 4.5
    candidatos.push(
      obtenerMayorProbabilidad(
        t("matchAnalytics.analytics.results.summaryKeys.teamCornersTitle", {
          team: local,
        }),
        [
          {
            seleccion: t(
              "matchAnalytics.analytics.results.summaryKeys.teamOverCorners",
              {
                team: local,
                count: "4.5",
              },
            ),
            probabilidad: corners?.["Home_Over_4.5"],
            tipo: "corners",
          },
          {
            seleccion: t(
              "matchAnalytics.analytics.results.summaryKeys.teamUnderCorners",
              {
                team: local,
                count: "4.5",
              },
            ),
            probabilidad: corners?.["Home_Under_4.5"],
            tipo: "corners",
          },
        ],
        t(
          "matchAnalytics.analytics.results.summaryKeys.homeIndividualMarketDesc",
        ),
      ),
    );

    // CÓRNERS LOCAL 5.5
    candidatos.push(
      obtenerMayorProbabilidad(
        t("matchAnalytics.analytics.results.summaryKeys.teamLineTitle", {
          team: local,
          count: "5.5",
        }),
        [
          {
            seleccion: t(
              "matchAnalytics.analytics.results.summaryKeys.teamOverCorners",
              {
                team: local,
                count: "5.5",
              },
            ),
            probabilidad: corners?.["Home_Over_5.5"],
            tipo: "corners",
          },
          {
            seleccion: t(
              "matchAnalytics.analytics.results.summaryKeys.teamUnderCorners",
              {
                team: local,
                count: "5.5",
              },
            ),
            probabilidad: corners?.["Home_Under_5.5"],
            tipo: "corners",
          },
        ],
        t(
          "matchAnalytics.analytics.results.summaryKeys.homeIndividualMarketDesc",
        ),
      ),
    );

    // CÓRNERS VISITANTE 3.5
    candidatos.push(
      obtenerMayorProbabilidad(
        t("matchAnalytics.analytics.results.summaryKeys.teamCornersTitle", {
          team: visitante,
        }),
        [
          {
            seleccion: t(
              "matchAnalytics.analytics.results.summaryKeys.teamOverCorners",
              {
                team: visitante,
                count: "3.5",
              },
            ),
            probabilidad: corners?.["Away_Over_3.5"],
            tipo: "corners",
          },
          {
            seleccion: t(
              "matchAnalytics.analytics.results.summaryKeys.teamUnderCorners",
              {
                team: visitante,
                count: "3.5",
              },
            ),
            probabilidad: corners?.["Away_Under_3.5"],
            tipo: "corners",
          },
        ],
        t(
          "matchAnalytics.analytics.results.summaryKeys.awayIndividualMarketDesc",
        ),
      ),
    );

    // CÓRNERS VISITANTE 4.5
    candidatos.push(
      obtenerMayorProbabilidad(
        t("matchAnalytics.analytics.results.summaryKeys.teamLineTitle", {
          team: visitante,
          count: "4.5",
        }),
        [
          {
            seleccion: t(
              "matchAnalytics.analytics.results.summaryKeys.teamOverCorners",
              {
                team: visitante,
                count: "4.5",
              },
            ),
            probabilidad: corners?.["Away_Over_4.5"],
            tipo: "corners",
          },
          {
            seleccion: t(
              "matchAnalytics.analytics.results.summaryKeys.teamUnderCorners",
              {
                team: visitante,
                count: "4.5",
              },
            ),
            probabilidad: corners?.["Away_Under_4.5"],
            tipo: "corners",
          },
        ],
        t(
          "matchAnalytics.analytics.results.summaryKeys.awayIndividualMarketDesc",
        ),
      ),
    );

    // TARJETAS
    const refereeName =
      resultado.partido?.arbitro?.toLowerCase() === "desconocido"
        ? t("sportsSelect.unknownReferee")
        : resultado.partido.arbitro;

    candidatos.push(
      obtenerMayorProbabilidad(
        t("matchAnalytics.analytics.results.summaryKeys.cards"),
        [
          {
            seleccion: t(
              "matchAnalytics.analytics.results.summaryKeys.overCards",
              {
                count: "4.5",
              },
            ),
            probabilidad: tarjetas?.["Over 4.5"],
            tipo: "tarjetas",
          },
          {
            seleccion: t(
              "matchAnalytics.analytics.results.summaryKeys.underCards",
              {
                count: "4.5",
              },
            ),
            probabilidad: tarjetas?.["Under 4.5"],
            tipo: "tarjetas",
          },
        ],
        t("matchAnalytics.analytics.results.summaryKeys.refereeAdjustedDesc", {
          referee: refereeName,
        }),
      ),
    );

    // LIMPIAR
    const ordenados = candidatos
      .filter(Boolean)
      .filter((item) => item.probabilidad >= 0 && item.probabilidad <= 1)
      .sort((a, b) => b.probabilidad - a.probabilidad);

    // TOP 5
    const top = ordenados.slice(0, 5);

    // SEÑAL PRINCIPAL
    const principal = top[0] || null;

    // MARCADOR EXACTO MÁS PROBABLE
    const marcador =
      Object.entries(goles?.Top_Scores || {})
        .map(([score, probability]) => ({
          marcador: score,

          probabilidad: Number(probability),
        }))
        .sort((a, b) => b.probabilidad - a.probabilidad)[0] || null;

    // TENDENCIA GENERAL
    const totalXg =
      Number(goles?.expected_goals_home || 0) +
      Number(goles?.expected_goals_away || 0);

    const tendencias = [];

    if (totalXg >= 2.8) {
      tendencias.push(
        t(
          "matchAnalytics.analytics.results.summaryKeys.trends.highOffensiveProduction",
          { value: "2.8" },
        ),
      );
    }

    if (totalXg <= 2.1) {
      tendencias.push(
        t(
          "matchAnalytics.analytics.results.summaryKeys.trends.lowOffensiveProduction",
          { value: "2.1" },
        ),
      );
    }

    if (Number(corners?.expected_total || 0) >= 9.5) {
      tendencias.push(
        t(
          "matchAnalytics.analytics.results.summaryKeys.trends.highCornersExpectation",
          { value: "9.5" },
        ),
      );
    }

    if (Number(tarjetas?.expected_total || 0) >= 4.5) {
      tendencias.push(
        t(
          "matchAnalytics.analytics.results.summaryKeys.trends.highCardsExpectation",
          { value: "4.5" },
        ),
      );
    }

    return {
      top,
      principal,
      marcador,
      tendencias,
    };
  }, [resultado, datosResultado, t]);

  // Logos de los equipos del resultado
  const logoLocal = useMemo(() => {
    const equipo = resultado?.partido?.local;

    if (!equipo) {
      return null;
    }

    return getTeamLogo(equipo);
  }, [resultado]);

  const logoVisitante = useMemo(() => {
    const equipo = resultado?.partido?.visitante;

    if (!equipo) {
      return null;
    }

    return getTeamLogo(equipo);
  }, [resultado]);

  // Exportar a PDF
  const exportarPdf = async () => {
    if (!resultado || !reportRef.current) {
      return;
    }

    setExportingPdf(true);

    try {
      await exportMatchReport({
        element: reportRef.current,
        local: resultado.partido.local,
        visitante: resultado.partido.visitante,
      });
    } catch (exportError) {
      console.error("Error generando PDF:", exportError);

      setError(
        exportError?.message || "No fue posible generar el reporte PDF.",
      );
    } finally {
      setExportingPdf(false);
    }
  };

  // Render
  return (
    <main className="match-page">
      {/* CONTENIDO PRINCIPAL */}
      <div className="match-main-area">
        <div className="match-shell">
          {/* FORMULARIO */}
          <section id="prediccion" className="match-prediction-block">
            <div className="match-prediction-block__heading">
              <div>
                <span className="match-block-kicker">
                  {competition?.name ||
                    t("matchAnalytics.form.defaultCompetition")}
                </span>

                <h2>{t("matchAnalytics.form.title")}</h2>

                <p>{t("matchAnalytics.form.subtitle")}</p>
              </div>
            </div>

            <form onSubmit={analizarPartido}>
              <div className="match-form-grid">
                {/* EQUIPO LOCAL */}
                <SportsSelect
                  label={t("matchAnalytics.form.localLabel")}
                  badge={t("matchAnalytics.form.localBadge")}
                  value={form.local}
                  options={catalogos.equipos}
                  placeholder={t("matchAnalytics.form.localPlaceholder")}
                  searchPlaceholder={t("matchAnalytics.form.searchPlaceholder")}
                  loading={loadingCatalogos}
                  disabledValues={[form.visitante]}
                  variant="green"
                  showTeamLogo
                  onChange={(value) => actualizarCampo("local", value)}
                />

                {/* VS */}
                <div className="match-versus">
                  <span>{t("matchAnalytics.form.vs")}</span>
                </div>

                {/* EQUIPO VISITANTE */}
                <SportsSelect
                  label={t("matchAnalytics.form.visitorLabel")}
                  badge={t("matchAnalytics.form.visitorBadge")}
                  value={form.visitante}
                  options={catalogos.equipos}
                  placeholder={t("matchAnalytics.form.visitorPlaceholder")}
                  searchPlaceholder={t("matchAnalytics.form.searchPlaceholder")}
                  loading={loadingCatalogos}
                  disabledValues={[form.local]}
                  variant="cyan"
                  showTeamLogo
                  onChange={(value) => actualizarCampo("visitante", value)}
                />

                {/* ÁRBITRO */}
                <SportsSelect
                  label={t("matchAnalytics.form.refereeLabel")}
                  badge={t("matchAnalytics.form.refereeBadge")}
                  value={form.arbitro}
                  options={catalogos.arbitros}
                  placeholder={t("matchAnalytics.form.refereePlaceholder")}
                  searchPlaceholder={t(
                    "matchAnalytics.form.searchRefereePlaceholder",
                  )}
                  loading={loadingCatalogos}
                  variant="yellow"
                  onChange={(value) => actualizarCampo("arbitro", value)}
                />
              </div>

              {!loadingCatalogos && !errorCatalogos && !modelStatus.ready && (
                <div className="match-model-notice">
                  <div className="match-model-notice__icon">↻</div>

                  <div>
                    <strong>
                      {t("matchAnalytics.form.modelPreparingTitle")}
                    </strong>
                    <span>
                      {modelStatus.message ||
                        t("matchAnalytics.form.modelPreparingMessage", {
                          competition:
                            competition?.name ||
                            t("matchAnalytics.form.thisCompetition"),
                        })}
                    </span>

                    {modelStatus.minimumRecords > 0 && (
                      <small>
                        {t("matchAnalytics.form.recordsProgress", {
                          records: modelStatus.records,
                          minimum: modelStatus.minimumRecords,
                        })}
                      </small>
                    )}
                  </div>
                </div>
              )}

              {/* ERROR CATÁLOGOS */}
              {errorCatalogos && (
                <div className="match-error">
                  <div className="match-error__icon">!</div>

                  <div>
                    <strong>
                      {t("matchAnalytics.form.connectionErrorTitle")}
                    </strong>

                    {/* <span>{errorCatalogos}</span> */}
                  </div>
                </div>
              )}

              {/* ERROR GENERAL */}
              {error && (
                <div className="match-error">
                  <div className="match-error__icon">!</div>

                  <div>
                    <strong>
                      {t("matchAnalytics.form.analysisErrorTitle")}
                    </strong>

                    {/* <span>{error}</span> */}
                  </div>
                </div>
              )}

              {/* ACCIONES */}
              <div className="match-search-actions">
                <div className="match-data-note"></div>

                <button
                  type="submit"
                  className="match-analyze-button"
                  disabled={
                    loading ||
                    loadingCatalogos ||
                    Boolean(errorCatalogos) ||
                    !modelStatus.ready
                  }
                >
                  {loading ? (
                    <>
                      <span className="match-spinner" />{" "}
                      {t("matchAnalytics.form.processingButton")}
                    </>
                  ) : (
                    <>
                      {t("matchAnalytics.form.executeButton")}{" "}
                      <span className="match-analyze-button__arrow">→</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </section>

          {/* ANALÍTICA */}
          <section id="analitica" className="match-analysis-area">
            {/* EMPTY */}
            {!resultado && !loading && (
              <div className="match-empty-state">
                <div className="match-empty-state__visual">
                  <div className="match-empty-radar">
                    <span className="match-empty-radar__one" />
                    <span className="match-empty-radar__two" />
                    <span className="match-empty-radar__three" />

                    <strong>%</strong>
                  </div>
                </div>

                <span className="match-block-kicker">
                  {t("matchAnalytics.analytics.empty.kicker")}
                </span>

                <h2>{t("matchAnalytics.analytics.empty.title")}</h2>

                <p>{t("matchAnalytics.analytics.empty.subtitle")}</p>

                <div className="match-empty-state__markets">
                  <span>
                    {t("matchAnalytics.analytics.empty.marketResult")}
                  </span>
                  <span>{t("matchAnalytics.analytics.empty.marketGoals")}</span>
                  <span>
                    {t("matchAnalytics.analytics.empty.marketCorners")}
                  </span>
                  <span>{t("matchAnalytics.analytics.empty.marketCards")}</span>
                  <span>
                    {t("matchAnalytics.analytics.empty.marketScores")}
                  </span>
                </div>
              </div>
            )}

            {/* LOADING */}
            {loading && (
              <div className="match-processing">
                <div className="match-processing__pitch">
                  <span />
                  <span />
                  <span />
                </div>

                <span className="match-block-kicker">
                  {t("matchAnalytics.analytics.loading.kicker")}
                </span>
                <h2>{t("matchAnalytics.analytics.loading.title")}</h2>
                <p>{t("matchAnalytics.analytics.loading.subtitle")}</p>
              </div>
            )}

            {/* RESULTADOS */}
            {resultado && datosResultado && !loading && (
              <>
                {/* FUERA DEL PDF */}
                <div className="match-results-toolbar">
                  <div className="match-results-toolbar__info">
                    <span className="match-results-toolbar__status">
                      <span />{" "}
                      {t("matchAnalytics.analytics.results.toolbar.status")}
                    </span>

                    <div>
                      <strong>
                        {t("matchAnalytics.analytics.results.toolbar.title")}
                      </strong>

                      <small>
                        {t("matchAnalytics.analytics.results.toolbar.subtitle")}
                      </small>
                    </div>
                  </div>

                  <ExportPdfButton
                    loading={exportingPdf}
                    onClick={exportarPdf}
                  />
                </div>

                {/* CONTENIDO DEL PDF */}
                <div ref={reportRef} className="match-results">
                  {/* MATCH ANALYSIS */}
                  <section className="match-fixture-card">
                    <div className="match-fixture-card__topline">
                      <span>
                        {t("matchAnalytics.analytics.results.fixture.kicker")}
                      </span>

                      <div>
                        <span className="match-live-dot" />{" "}
                        {t(
                          "matchAnalytics.analytics.results.fixture.processed",
                        )}
                      </div>
                    </div>

                    <div className="match-fixture-card__main">
                      {/* LOCAL */}
                      <div className="match-team">
                        <span className="match-team-label">
                          {t(
                            "matchAnalytics.analytics.results.fixture.localLabel",
                          )}
                        </span>

                        <div className="match-team-emblem">
                          {logoLocal ? (
                            <img
                              src={logoLocal}
                              alt={resultado.partido.local}
                              className="match-team-emblem-image"
                            />
                          ) : (
                            <span className="match-team-emblem-fallback">
                              {obtenerInicialesEquipo(resultado.partido.local)}
                            </span>
                          )}
                        </div>

                        <h2>{resultado.partido.local}</h2>
                      </div>

                      {/* CENTRO */}
                      <div className="match-fixture-center">
                        <span>
                          {t(
                            "matchAnalytics.analytics.results.fixture.predictionLabel",
                          )}
                        </span>

                        <strong>
                          {t("matchAnalytics.analytics.results.fixture.vs")}
                        </strong>

                        <div className="match-fixture-referee">
                          <span>
                            {t(
                              "matchAnalytics.analytics.results.fixture.refereeLabel",
                            )}
                          </span>

                          <b>
                            {resultado.partido?.arbitro?.toLowerCase() ===
                            "desconocido"
                              ? t(
                                  "matchAnalytics.analytics.results.fixture.unknownReferee",
                                )
                              : resultado.partido.arbitro}
                          </b>
                        </div>
                      </div>

                      {/* VISITANTE */}
                      <div className="match-team">
                        <span className="match-team-label">
                          {t(
                            "matchAnalytics.analytics.results.fixture.visitorLabel",
                          )}
                        </span>

                        <div className="match-team-emblem match-team-emblem--away">
                          {logoVisitante ? (
                            <img
                              src={logoVisitante}
                              alt={resultado.partido.visitante}
                              className="match-team-emblem-image"
                            />
                          ) : (
                            <span className="match-team-emblem-fallback">
                              {obtenerInicialesEquipo(
                                resultado.partido.visitante,
                              )}
                            </span>
                          )}
                        </div>

                        <h2>{resultado.partido.visitante}</h2>
                      </div>
                    </div>
                  </section>

                  {/* H2H */}
                  {resultado?.h2h?.resumen && (
                    <section className="match-h2h-card">
                      <div className="match-h2h-icon">
                        {t("matchAnalytics.analytics.results.h2h.icon")}
                      </div>

                      <div className="match-h2h-card__content">
                        <span>
                          {t("matchAnalytics.analytics.results.h2h.title")}
                        </span>

                        <p>
                          {t("matchAnalytics.analytics.results.h2h.summary", {
                            partidos: resultado.h2h.resumen.partidos,
                            goles: resultado.h2h.resumen.goles,
                            corners: resultado.h2h.resumen.corners,
                            tarjetas: resultado.h2h.resumen.tarjetas,
                          })}
                        </p>
                      </div>

                      <div className="match-h2h-card__badge">
                        {t("matchAnalytics.analytics.results.h2h.badge")}
                      </div>
                    </section>
                  )}

                  {/* RESULTADO 1X2 */}
                  <section className="match-dashboard-section">
                    <SectionHeader
                      code="1X2"
                      eyebrow={t(
                        "matchAnalytics.analytics.results.market1x2.eyebrow",
                      )}
                      title={t(
                        "matchAnalytics.analytics.results.market1x2.title",
                      )}
                      description={t(
                        "matchAnalytics.analytics.results.market1x2.description",
                      )}
                    />

                    <div className="match-result-layout">
                      <div className="match-chart-card">
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart
                            data={datosResultado.resultado1X2}
                            layout="vertical"
                            margin={{
                              top: 10,
                              right: 30,
                              bottom: 10,
                              left: 20,
                            }}
                          >
                            <CartesianGrid
                              strokeDasharray="4 4"
                              horizontal={false}
                              stroke="#e6ebf1"
                            />

                            <XAxis
                              type="number"
                              domain={[0, 100]}
                              tickFormatter={(value) => `${value}%`}
                              axisLine={false}
                              tickLine={false}
                            />

                            <YAxis
                              dataKey="name"
                              type="category"
                              width={120}
                              axisLine={false}
                              tickLine={false}
                            />

                            <Tooltip content={<CustomTooltip />} />

                            <Bar
                              dataKey="value"
                              name={t(
                                "matchAnalytics.analytics.results.market1x2.probabilityName",
                              )}
                              radius={[0, 8, 8, 0]}
                              barSize={28}
                            >
                              {datosResultado.resultado1X2.map((entry) => (
                                <Cell key={entry.name} fill={entry.color} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>

                      <aside className="match-insight-card">
                        <div className="match-insight-card__label">
                          {t(
                            "matchAnalytics.analytics.results.market1x2.dominantScenario",
                          )}
                        </div>

                        <strong>
                          {datosResultado.ganador.value.toFixed(1)}%
                        </strong>

                        <h3>{datosResultado.ganador.name}</h3>

                        <div className="match-insight-divider" />

                        <p>
                          {t(
                            "matchAnalytics.analytics.results.market1x2.dominantDescription",
                          )}
                        </p>
                      </aside>
                    </div>
                  </section>

                  {/* GOLES */}
                  <section className="match-dashboard-section">
                    <SectionHeader
                      code="xG"
                      eyebrow={t(
                        "matchAnalytics.analytics.results.goals.eyebrow",
                      )}
                      title={t("matchAnalytics.analytics.results.goals.title")}
                      description={t(
                        "matchAnalytics.analytics.results.goals.description",
                      )}
                    />

                    <div className="match-metrics-grid">
                      <MetricCard
                        label={`xG ${resultado.partido.local}`}
                        value={numero(datosResultado.goles.expected_goals_home)}
                        description={t(
                          "matchAnalytics.analytics.results.goals.expectedHomeDesc",
                        )}
                        variant="local"
                        tag={t(
                          "matchAnalytics.analytics.results.goals.tags.home",
                        )}
                      />

                      <MetricCard
                        label={`xG ${resultado.partido.visitante}`}
                        value={numero(datosResultado.goles.expected_goals_away)}
                        description={t(
                          "matchAnalytics.analytics.results.goals.expectedAwayDesc",
                        )}
                        variant="away"
                        tag={t(
                          "matchAnalytics.analytics.results.goals.tags.away",
                        )}
                      />

                      <MetricCard
                        label={t(
                          "matchAnalytics.analytics.results.goals.totalXgLabel",
                        )}
                        value={numero(
                          Number(datosResultado.goles.expected_goals_home) +
                            Number(datosResultado.goles.expected_goals_away),
                        )}
                        description={t(
                          "matchAnalytics.analytics.results.goals.jointExpectation",
                        )}
                        tag={t(
                          "matchAnalytics.analytics.results.goals.tags.match",
                        )}
                      />
                    </div>

                    <div className="match-two-columns">
                      {/* OVER / UNDER */}
                      <div className="match-panel">
                        <div className="match-panel-title">
                          <div>
                            <span>
                              {t(
                                "matchAnalytics.analytics.results.goals.overUnderTag",
                              )}
                            </span>

                            <h3>
                              {t(
                                "matchAnalytics.analytics.results.goals.overUnderTitle",
                              )}
                            </h3>
                          </div>
                        </div>

                        <ProbabilityBar
                          label={t(
                            "matchAnalytics.analytics.results.goals.over15",
                          )}
                          value={datosResultado.goles?.Over_Under?.["Over 1.5"]}
                        />

                        <ProbabilityBar
                          label={t(
                            "matchAnalytics.analytics.results.goals.under15",
                          )}
                          value={
                            datosResultado.goles?.Over_Under?.["Under 1.5"]
                          }
                          accent="slate"
                        />

                        <ProbabilityBar
                          label={t(
                            "matchAnalytics.analytics.results.goals.over25",
                          )}
                          value={datosResultado.goles?.Over_Under?.["Over 2.5"]}
                          accent="cyan"
                        />

                        <ProbabilityBar
                          label={t(
                            "matchAnalytics.analytics.results.goals.under25",
                          )}
                          value={
                            datosResultado.goles?.Over_Under?.["Under 2.5"]
                          }
                          accent="purple"
                        />
                      </div>

                      {/* BTTS */}
                      <div className="match-panel">
                        <div className="match-panel-title">
                          <div>
                            <span>
                              {t(
                                "matchAnalytics.analytics.results.goals.bttsTag",
                              )}
                            </span>

                            <h3>
                              {t(
                                "matchAnalytics.analytics.results.goals.bttsTitle",
                              )}
                            </h3>
                          </div>
                        </div>

                        <div className="match-pie-wrapper">
                          <ResponsiveContainer width="100%" height={240}>
                            <PieChart>
                              <Pie
                                data={datosResultado.ambosAnotan}
                                dataKey="value"
                                nameKey="name"
                                innerRadius={68}
                                outerRadius={96}
                                paddingAngle={4}
                              >
                                <Cell fill={COLORS.positive} />

                                <Cell fill={COLORS.negative} />
                              </Pie>

                              <Tooltip content={<CustomTooltip />} />

                              <Legend />
                            </PieChart>
                          </ResponsiveContainer>

                          <div className="match-pie-center">
                            <strong>
                              {porcentaje(
                                datosResultado.goles?.BTTS?.Yes,
                              ).toFixed(1)}
                              %
                            </strong>

                            <span>
                              {t(
                                "matchAnalytics.analytics.results.goals.yesBadge",
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* MARCADOR EXACTO - COMPARATIVA */}
                    <div className="match-two-columns">
                      {/* MARCADOR CLASICO (POISSON) */}
                      <div className="match-panel match-panel--scores">
                        <div className="match-panel-title">
                          <div>
                            <span>
                              {t("matchAnalytics.analytics.results.scores.tag")}
                            </span>
                            <h3>
                              {t(
                                "matchAnalytics.analytics.results.scores.topResultsTitle",
                              )}
                            </h3>
                          </div>
                        </div>

                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={datosResultado.topMarcadores}>
                            <CartesianGrid
                              strokeDasharray="4 4"
                              vertical={false}
                              stroke="#e7ebf2"
                            />
                            <XAxis
                              dataKey="marcador"
                              axisLine={false}
                              tickLine={false}
                            />
                            <YAxis
                              axisLine={false}
                              tickLine={false}
                              tickFormatter={(value) => `${value}%`}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar
                              dataKey="probabilidad"
                              name={t(
                                "matchAnalytics.analytics.results.scores.probabilityName",
                              )}
                              fill={COLORS.local}
                              radius={[8, 8, 0, 0]}
                              barSize={48}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>

                      {/* MARCADOR EXACTO IA */}
                      {datosResultado.topMarcadoresAi &&
                        datosResultado.topMarcadoresAi.length > 0 && (
                          <div className="match-panel match-panel--scores">
                            <div className="match-panel-title">
                              <div>
                                <span>
                                  {t(
                                    "matchAnalytics.analytics.results.scores.tagAi",
                                  )}
                                </span>
                                <h3>
                                  {t(
                                    "matchAnalytics.analytics.results.scores.topResultsTitleAi",
                                  )}
                                </h3>
                              </div>
                            </div>

                            <ResponsiveContainer width="100%" height={300}>
                              <BarChart data={datosResultado.topMarcadoresAi}>
                                <CartesianGrid
                                  strokeDasharray="4 4"
                                  vertical={false}
                                  stroke="#e7ebf2"
                                />
                                <XAxis
                                  dataKey="marcador"
                                  axisLine={false}
                                  tickLine={false}
                                />
                                <YAxis
                                  axisLine={false}
                                  tickLine={false}
                                  tickFormatter={(value) => `${value}%`}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar
                                  dataKey="probabilidad"
                                  name={t(
                                    "matchAnalytics.analytics.results.scores.probabilityName",
                                  )}
                                  fill={COLORS.away}
                                  radius={[8, 8, 0, 0]}
                                  barSize={48}
                                />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        )}
                    </div>
                  </section>

                  {/* CÓRNERS */}
                  <section className="match-dashboard-section">
                    <SectionHeader
                      code="CK"
                      eyebrow={t(
                        "matchAnalytics.analytics.results.corners.eyebrow",
                      )}
                      title={t(
                        "matchAnalytics.analytics.results.corners.title",
                      )}
                      description={t(
                        "matchAnalytics.analytics.results.corners.description",
                      )}
                    />

                    <div className="match-metrics-grid match-metrics-grid--four">
                      <MetricCard
                        label={t(
                          "matchAnalytics.analytics.results.corners.totalExpected",
                        )}
                        value={numero(datosResultado.corners.expected_total, 1)}
                        description={t(
                          "matchAnalytics.analytics.results.corners.fullMatch",
                        )}
                        variant="corner"
                        tag={t(
                          "matchAnalytics.analytics.results.corners.tags.total",
                        )}
                      />

                      <MetricCard
                        label={t(
                          "matchAnalytics.analytics.results.corners.firstHalf",
                        )}
                        value={numero(datosResultado.corners.expected_1H, 1)}
                        description={t(
                          "matchAnalytics.analytics.results.corners.firstHalfDesc",
                        )}
                        variant="corner"
                        tag={t(
                          "matchAnalytics.analytics.results.corners.tags.firstHalf",
                        )}
                      />

                      <MetricCard
                        label={resultado.partido.local}
                        value={numero(datosResultado.corners.expected_home, 1)}
                        description={t(
                          "matchAnalytics.analytics.results.corners.expectedHomeDesc",
                        )}
                        variant="local"
                        tag={t(
                          "matchAnalytics.analytics.results.corners.tags.home",
                        )}
                      />

                      <MetricCard
                        label={resultado.partido.visitante}
                        value={numero(datosResultado.corners.expected_away, 1)}
                        description={t(
                          "matchAnalytics.analytics.results.corners.expectedAwayDesc",
                        )}
                        variant="away"
                        tag={t(
                          "matchAnalytics.analytics.results.corners.tags.away",
                        )}
                      />
                    </div>

                    <div className="match-two-columns">
                      {/* LÍNEAS CÓRNERS */}
                      <div className="match-panel">
                        <ProbabilityBar
                          label={t(
                            "matchAnalytics.analytics.results.corners.over95",
                          )}
                          value={datosResultado.corners?.["Over 9.5"]}
                          accent="orange"
                        />

                        <ProbabilityBar
                          label={t(
                            "matchAnalytics.analytics.results.corners.under95",
                          )}
                          value={datosResultado.corners?.["Under 9.5"]}
                          accent="slate"
                        />

                        <ProbabilityBar
                          label={t(
                            "matchAnalytics.analytics.results.corners.over45H1",
                          )}
                          value={datosResultado.corners?.["Over 4.5 1H"]}
                          accent="cyan"
                        />

                        <ProbabilityBar
                          label={t(
                            "matchAnalytics.analytics.results.corners.under45H1",
                          )}
                          value={datosResultado.corners?.["Under 4.5 1H"]}
                          accent="purple"
                        />
                      </div>

                      {/* GRÁFICA CÓRNERS */}
                      <div className="match-panel">
                        <ResponsiveContainer width="100%" height={260}>
                          <BarChart data={datosResultado.cornersEquipos}>
                            <CartesianGrid
                              strokeDasharray="4 4"
                              vertical={false}
                              stroke="#e7ebf2"
                            />

                            <XAxis
                              dataKey="name"
                              axisLine={false}
                              tickLine={false}
                            />

                            <YAxis axisLine={false} tickLine={false} />

                            <Tooltip />

                            <Bar
                              dataKey="esperado"
                              name={t(
                                "matchAnalytics.analytics.results.corners.expectedBarName",
                              )}
                              fill={COLORS.corner}
                              radius={[8, 8, 0, 0]}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* MERCADOS POR EQUIPO */}
                    <div className="match-team-markets">
                      {/* LOCAL */}
                      <div className="match-team-market-card">
                        <div className="match-team-market-card__heading">
                          <span>
                            {t(
                              "matchAnalytics.analytics.results.fixture.localLabel",
                            )}
                          </span>

                          <h3>{resultado.partido.local}</h3>
                        </div>

                        <ProbabilityBar
                          label={t(
                            "matchAnalytics.analytics.results.corners.homeOver45",
                          )}
                          value={datosResultado.corners?.["Home_Over_4.5"]}
                        />

                        <ProbabilityBar
                          label={t(
                            "matchAnalytics.analytics.results.corners.homeUnder45",
                          )}
                          value={datosResultado.corners?.["Home_Under_4.5"]}
                          accent="slate"
                        />

                        <ProbabilityBar
                          label={t(
                            "matchAnalytics.analytics.results.corners.homeOver55",
                          )}
                          value={datosResultado.corners?.["Home_Over_5.5"]}
                          accent="cyan"
                        />

                        <ProbabilityBar
                          label={t(
                            "matchAnalytics.analytics.results.corners.homeUnder55",
                          )}
                          value={datosResultado.corners?.["Home_Under_5.5"]}
                          accent="purple"
                        />
                      </div>

                      {/* VISITANTE */}
                      <div className="match-team-market-card">
                        <div className="match-team-market-card__heading">
                          <span>
                            {t(
                              "matchAnalytics.analytics.results.fixture.visitorLabel",
                            )}
                          </span>

                          <h3>{resultado.partido.visitante}</h3>
                        </div>

                        <ProbabilityBar
                          label={t(
                            "matchAnalytics.analytics.results.corners.awayOver35",
                          )}
                          value={datosResultado.corners?.["Away_Over_3.5"]}
                          accent="cyan"
                        />

                        <ProbabilityBar
                          label={t(
                            "matchAnalytics.analytics.results.corners.awayUnder35",
                          )}
                          value={datosResultado.corners?.["Away_Under_3.5"]}
                          accent="slate"
                        />

                        <ProbabilityBar
                          label={t(
                            "matchAnalytics.analytics.results.corners.awayOver45",
                          )}
                          value={datosResultado.corners?.["Away_Over_4.5"]}
                        />

                        <ProbabilityBar
                          label={t(
                            "matchAnalytics.analytics.results.corners.awayUnder45",
                          )}
                          value={datosResultado.corners?.["Away_Under_4.5"]}
                          accent="purple"
                        />
                      </div>
                    </div>
                  </section>

                  {/* TARJETAS */}
                  <section className="match-dashboard-section">
                    <SectionHeader
                      code="YC"
                      eyebrow={t(
                        "matchAnalytics.analytics.results.cards.eyebrow",
                      )}
                      title={t("matchAnalytics.analytics.results.cards.title")}
                      description={t(
                        "matchAnalytics.analytics.results.cards.description",
                        { referee: resultado.partido.arbitro },
                      )}
                    />

                    <div className="match-two-columns">
                      {/* MODELO CLASICO */}
                      <div className="match-panel">
                        <div className="match-panel-title">
                          <div>
                            <span>
                              {t(
                                "matchAnalytics.analytics.results.cards.subtitle",
                              )}
                            </span>
                            <h3>
                              {t(
                                "matchAnalytics.analytics.results.cards.model_h",
                              )}
                            </h3>
                          </div>
                        </div>

                        <div style={{ marginTop: "1.5rem" }}>
                          <MetricCard
                            label={t(
                              "matchAnalytics.analytics.results.cards.expectedCards",
                            )}
                            value={numero(
                              datosResultado.tarjetas.expected_total,
                              1,
                            )}
                            description={t(
                              "matchAnalytics.analytics.results.cards.refereeAdjusted",
                              { referee: resultado.partido.arbitro },
                            )}
                            variant="card"
                            tag={t(
                              "matchAnalytics.analytics.results.cards.tags.match",
                            )}
                          />

                          <div style={{ marginTop: "1.5rem" }}>
                            <ProbabilityBar
                              label={t(
                                "matchAnalytics.analytics.results.cards.over45",
                              )}
                              value={datosResultado.tarjetas?.["Over 4.5"]}
                              accent="orange"
                            />
                            <ProbabilityBar
                              label={t(
                                "matchAnalytics.analytics.results.cards.under45",
                              )}
                              value={datosResultado.tarjetas?.["Under 4.5"]}
                              accent="slate"
                            />
                          </div>
                        </div>
                      </div>

                      {/* MODELO XGBOOST (IA) */}
                      {datosResultado.tarjetas.xgboost_expected_total && (
                        <div className="match-panel">
                          <div className="match-panel-title">
                            <div>
                              <span>
                                {t(
                                  "matchAnalytics.analytics.results.cards.subtitleAi",
                                )}
                              </span>
                              <h3>
                                {t(
                                  "matchAnalytics.analytics.results.cards.recentTrend",
                                )}
                              </h3>
                            </div>
                          </div>

                          <div style={{ marginTop: "1.5rem" }}>
                            <MetricCard
                              label={t(
                                "matchAnalytics.analytics.results.cards.expectedCardsAi",
                              )}
                              value={numero(
                                datosResultado.tarjetas.xgboost_expected_total,
                                1,
                              )}
                              description={t(
                                "matchAnalytics.analytics.results.cards.recentDescription",
                              )}
                              variant="cyan"
                              tag={t(
                                "matchAnalytics.analytics.results.cards.tags.xgboost",
                              )}
                            />

                            {/* Modelo de probabilidades */}
                            {datosResultado.tarjetas.xgboost_over_4_5 !==
                              undefined && (
                              <div style={{ marginTop: "1.5rem" }}>
                                <ProbabilityBar
                                  label={t(
                                    "matchAnalytics.analytics.results.cards.over45",
                                  )}
                                  value={
                                    datosResultado.tarjetas.xgboost_over_4_5
                                  }
                                  accent="orange"
                                />
                                <ProbabilityBar
                                  label={t(
                                    "matchAnalytics.analytics.results.cards.under45",
                                  )}
                                  value={
                                    datosResultado.tarjetas.xgboost_under_4_5
                                  }
                                  accent="slate"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </section>

                  {/* RESUMEN FINAL */}
                  {resumenProbabilidades && (
                    <section className="match-dashboard-section match-summary-section">
                      <SectionHeader
                        code="TOP"
                        eyebrow={t(
                          "matchAnalytics.analytics.results.summary.eyebrow",
                        )}
                        title={t(
                          "matchAnalytics.analytics.results.summary.title",
                        )}
                        description={t(
                          "matchAnalytics.analytics.results.summary.description",
                        )}
                      />

                      {/* PRINCIPAL */}
                      {resumenProbabilidades.principal && (
                        <div className="match-summary-highlight">
                          <div className="match-summary-highlight__content">
                            <span className="match-summary-highlight__eyebrow">
                              {t(
                                "matchAnalytics.analytics.results.summary.highestProbabilityTag",
                              )}
                            </span>

                            <h3>{resumenProbabilidades.principal.seleccion}</h3>

                            {/* <p>{resumenProbabilidades.principal.categoria}</p> */}
                          </div>

                          <div className="match-summary-highlight__probability">
                            <strong>
                              {porcentaje(
                                resumenProbabilidades.principal.probabilidad,
                              ).toFixed(1)}
                              %
                            </strong>

                            <span>
                              {t(
                                "matchAnalytics.analytics.results.summary.probabilityLabel",
                              )}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* TOP SEÑALES */}
                      <div className="match-summary-ranking">
                        {resumenProbabilidades.top.map((item, index) => {
                          const probability = porcentaje(item.probabilidad);

                          let nivel = t(
                            "matchAnalytics.analytics.results.summary.levels.moderate",
                          );

                          if (probability >= 75) {
                            nivel = t(
                              "matchAnalytics.analytics.results.summary.levels.high",
                            );
                          } else if (probability >= 65) {
                            nivel = t(
                              "matchAnalytics.analytics.results.summary.levels.strong",
                            );
                          }

                          return (
                            <article
                              key={`${item.categoria}-${item.seleccion}`}
                              className="match-summary-item"
                            >
                              <div className="match-summary-item__position">
                                {String(index + 1).padStart(2, "0")}
                              </div>

                              <div className="match-summary-item__body">
                                <span>{item.categoria}</span>

                                <strong>{item.seleccion}</strong>

                                <small>{item.descripcion}</small>
                              </div>

                              <div className="match-summary-item__score">
                                <strong>{probability.toFixed(1)}%</strong>

                                <span
                                  className={`match-summary-signal ${
                                    nivel ===
                                    t(
                                      "matchAnalytics.analytics.results.summary.levels.high",
                                    )
                                      ? "match-summary-signal--high"
                                      : nivel ===
                                          t(
                                            "matchAnalytics.analytics.results.summary.levels.strong",
                                          )
                                        ? "match-summary-signal--strong"
                                        : ""
                                  }`}
                                >
                                  {nivel}
                                </span>
                              </div>
                            </article>
                          );
                        })}
                      </div>

                      {/* LECTURA GENERAL */}
                      <div className="match-summary-bottom">
                        <div className="match-summary-insights">
                          <span className="match-summary-title">
                            {t(
                              "matchAnalytics.analytics.results.summary.readingTitle",
                            )}
                          </span>

                          {resumenProbabilidades.tendencias.length > 0 ? (
                            resumenProbabilidades.tendencias.map(
                              (tendencia, index) => (
                                <div
                                  key={`${tendencia}-${index}`}
                                  className="match-summary-insight"
                                >
                                  <span />

                                  <p>{tendencia}</p>
                                </div>
                              ),
                            )
                          ) : (
                            <div className="match-summary-insight">
                              <span />

                              <p>
                                {t(
                                  "matchAnalytics.analytics.results.summary.noTrends",
                                )}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* MARCADOR */}
                        {resumenProbabilidades.marcador && (
                          <div className="match-summary-score">
                            <span>
                              {t(
                                "matchAnalytics.analytics.results.summary.mostProbableScoreTag",
                              )}
                            </span>

                            <strong>
                              {resumenProbabilidades.marcador.marcador}
                            </strong>

                            <small>
                              {t(
                                "matchAnalytics.analytics.results.summary.probabilityPercentage",
                                {
                                  percentage: porcentaje(
                                    resumenProbabilidades.marcador.probabilidad,
                                  ).toFixed(1),
                                },
                              )}
                            </small>
                          </div>
                        )}
                      </div>

                      {/* NOTA */}
                      <div className="match-summary-disclaimer">
                        <span>i</span>

                        <p>
                          <strong>
                            {t(
                              "matchAnalytics.analytics.results.summary.disclaimerTitle",
                            )}
                          </strong>{" "}
                          {t(
                            "matchAnalytics.analytics.results.summary.disclaimerText",
                          )}
                        </p>
                      </div>
                    </section>
                  )}

                  {/* FOOTER */}
                  <footer className="match-results-footer">
                    <span className="match-live-dot" />{" "}
                    {t("matchAnalytics.analytics.results.footerText")}
                  </footer>
                </div>
              </>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}

export default MatchAnalytics;
