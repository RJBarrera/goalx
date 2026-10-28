import axios from "axios";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useCompetition } from "../../context/CompetitionContext";
import { exportMatchReport } from "../../utils/exportMatchReport";
import { getTeamLogo } from "../../utils/teamLogos";
import ExportPdfButton from "../ExportPdfButton/ExportPdfButton";
import useMatchData from "./hooks/useMatchData";
import useMatchPrediction from "./hooks/useMatchPrediction";
import useMatchSummary from "./hooks/useMatchSummary";
import "./MatchAnalytics.css";
import CollapsibleSection from "./sections/CollapsibleSection";
import Match1x2 from "./sections/Match1x2";
import MatchCards from "./sections/MatchCards";
import MatchCorners from "./sections/MatchCorners";
import MatchFixture from "./sections/MatchFixture";
import MatchForm from "./sections/MatchForm";
import MatchGoals from "./sections/MatchGoals";
import MatchQuickNav from "./sections/MatchQuickNav";
import MatchScores from "./sections/MatchScores";
import MatchShots from "./sections/MatchShots";
import MatchSummary from "./sections/MatchSummary";

const API_URL = "";

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

  // Analizar Partido
  const { resultado, setResultado, loading, error, setError, analizarPartido } =
    useMatchPrediction(competitionId, form);

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

        if (!data?.success)
          throw new Error("No fue posible cargar los catálogos.");
        if (!mounted) return;

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
        if (mounted) setLoadingCatalogos(false);
      }
    };

    setCatalogos({ equipos: [], arbitros: [] });
    setModelStatus({ ready: true, records: 0, minimumRecords: 0, message: "" });
    setForm({ local: "", visitante: "", arbitro: "" });

    setResultado(null);
    setError("");

    cargarCatalogos();

    return () => {
      mounted = false;
    };
  }, [competitionId, setError, setResultado]);

  useEffect(() => {
    if (!partidoSeleccionado) return;

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

  // Datos para gráficas
  const datosResultado = useMatchData(resultado);

  // RESUMEN DE MAYORES PROBABILIDADES
  const resumenProbabilidades = useMatchSummary(resultado, datosResultado);

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

  // Validacion de Tiros
  const tieneDatosTiros = useMemo(() => {
    const tiros = resultado?.tiros;
    if (!tiros) return false;

    const totalSot =
      (Number(tiros.sot?.local?.valor_esperado) || 0) +
      (Number(tiros.sot?.visitante?.valor_esperado) || 0);

    const totalTiros =
      (Number(tiros.total?.local?.valor_esperado) || 0) +
      (Number(tiros.total?.visitante?.valor_esperado) || 0);

    const sumaTotal = totalSot + totalTiros;

    // Si el backend devuelve 0 usa `> 0`.
    // Si devuelve 0.1 por defecto para cada equipo, entonces 0.4
    return sumaTotal > 0.4;
  }, [resultado]);

  // Validacion de Corners
  const tieneDatosCorners = useMemo(() => {
    const corners = datosResultado?.corners;
    if (!corners) return false;
    const clasico = Number(corners.expected_total) || 0;
    const ai = Number(corners.xgboost?.expected_total) || 0;
    return clasico > 0 || ai > 0;
  }, [datosResultado]);

  // Validacion de Tarjetas
  const tieneDatosTarjetas = useMemo(() => {
    const tarjetas = datosResultado?.tarjetas;
    if (!tarjetas) return false;
    const clasico = Number(tarjetas.expected_total) || 0;
    const ai = Number(tarjetas.xgboost_expected_total) || 0;
    return clasico > 0 || ai > 0;
  }, [datosResultado]);

  // Control de estado de apertura de secciones
  const [seccionesAbiertas, setSeccionesAbiertas] = useState({
    "1x2": true,
    goals: true,
    shots: true,
    corners: true,
    cards: true,
    summary: true,
  });

  const toggleSeccion = (clave, estado) => {
    setSeccionesAbiertas((prev) => ({
      ...prev,
      [clave]: estado !== undefined ? estado : !prev[clave],
    }));
  };

  // Índice dinámico: solo incluye secciones que tienen datos válidos
  const itemsIndice = useMemo(() => {
    const items = [
      {
        id: "sec-1x2",
        key: "1x2",
        label: t("matchAnalytics.analytics.results.market1x2.eyebrow"),
        code: "1X2",
      },
      {
        id: "sec-goals",
        key: "goals",
        label: t("matchAnalytics.analytics.results.goals.eyebrow"),
        code: "xG",
      },
    ];

    if (tieneDatosTiros) {
      items.push({
        id: "sec-shots",
        key: "shots",
        label: t("matchAnalytics.analytics.results.shots.eyebrow"),
        code: "SH",
      });
    }
    if (tieneDatosCorners) {
      items.push({
        id: "sec-corners",
        key: "corners",
        label: t("matchAnalytics.analytics.results.corners.eyebrow"),
        code: "CK",
      });
    }
    if (tieneDatosTarjetas) {
      items.push({
        id: "sec-cards",
        key: "cards",
        label: t("matchAnalytics.analytics.results.cards.title"),
        code: "YC",
      });
    }
    if (resumenProbabilidades) {
      items.push({
        id: "sec-summary",
        key: "summary",
        label: t("matchAnalytics.analytics.results.summary.eyebrow"),
        code: "TOP",
        codeClass: "match-quick-nav__code--cyan",
      });
    }

    return items;
  }, [
    tieneDatosTiros,
    tieneDatosCorners,
    tieneDatosTarjetas,
    resumenProbabilidades,
    t,
  ]);

  // Scroll suave hacia la sección y apertura automatica si estaba minimizada
  const irASeccion = (item) => {
    // Asegurar que la seccion se expanda si estaba cerrada
    toggleSeccion(item.key, true);

    // Esperar a que React monte/despliegue el DOM antes de medir su posicion
    setTimeout(() => {
      const elemento = document.getElementById(item.id);
      if (!elemento) return;

      // Altura del dock flotante + margen superior
      const headerOffset = 90;
      const elementPosition = elemento.getBoundingClientRect().top;
      const offsetPosition =
        elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }, 80);
  };

  // Verifica si las secciones visibles estan colapsadas
  const todasColapsadas = useMemo(() => {
    return Object.values(seccionesAbiertas).every((abierto) => !abierto);
  }, [seccionesAbiertas]);

  // Alterna entre colapsar todas o restaurar todas abiertas
  const alternarTodasLasSecciones = () => {
    const nuevoEstado = todasColapsadas; // Si están todas cerradas, las abre; si hay alguna abierta, las cierra todas
    setSeccionesAbiertas({
      "1x2": nuevoEstado,
      goals: nuevoEstado,
      shots: nuevoEstado,
      corners: nuevoEstado,
      cards: nuevoEstado,
      summary: nuevoEstado,
    });
  };

  // Render
  return (
    <main className="match-page">
      {/* CONTENIDO PRINCIPAL */}
      <div className="match-main-area">
        <div className="match-shell">
          {/* FORMULARIO */}
          <section id="prediccion" className="match-prediction-block">
            <MatchForm
              competition={competition}
              form={form}
              catalogos={catalogos}
              actualizarCampo={actualizarCampo}
              analizarPartido={analizarPartido}
              loading={loading}
              loadingCatalogos={loadingCatalogos}
              errorCatalogos={errorCatalogos}
              modelStatus={modelStatus}
              error={error}
            />
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
                    <MatchFixture
                      resultado={resultado}
                      logoLocal={logoLocal}
                      logoVisitante={logoVisitante}
                    />
                  </section>

                  {/* DOCK FLOTANTE */}
                  <MatchQuickNav
                    items={itemsIndice}
                    onSelect={irASeccion}
                    onToggleAll={alternarTodasLasSecciones}
                    isAllCollapsed={todasColapsadas}
                  />

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
                  <CollapsibleSection
                    id="sec-1x2"
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
                    isOpen={seccionesAbiertas["1x2"]}
                    isForcedOpen={exportingPdf}
                    onToggle={(abierto) => toggleSeccion("1x2", abierto)}
                  >
                    <Match1x2 datosResultado={datosResultado} />
                  </CollapsibleSection>

                  {/* GOLES */}
                  <CollapsibleSection
                    id="sec-goals"
                    code="xG"
                    eyebrow={t(
                      "matchAnalytics.analytics.results.goals.eyebrow",
                    )}
                    title={t("matchAnalytics.analytics.results.goals.title")}
                    description={t(
                      "matchAnalytics.analytics.results.goals.description",
                    )}
                    isOpen={seccionesAbiertas.goals}
                    isForcedOpen={exportingPdf}
                    onToggle={(abierto) => toggleSeccion("goals", abierto)}
                  >
                    <MatchGoals
                      resultado={resultado}
                      datosResultado={datosResultado}
                      numero={numero}
                      porcentaje={porcentaje}
                    />

                    {/* MARCADOR EXACTO - COMPARATIVA */}
                    <MatchScores
                      resultado={resultado}
                      datosResultado={datosResultado}
                    />
                  </CollapsibleSection>

                  {/* TIROS */}
                  {tieneDatosTiros && (
                    <CollapsibleSection
                      id="sec-shots"
                      code="SH"
                      eyebrow={t(
                        "matchAnalytics.analytics.results.shots.eyebrow",
                      )}
                      title={t("matchAnalytics.analytics.results.shots.title")}
                      description={t(
                        "matchAnalytics.analytics.results.shots.description",
                      )}
                      isOpen={seccionesAbiertas.shots}
                      isForcedOpen={exportingPdf}
                      onToggle={(abierto) => toggleSeccion("shots", abierto)}
                    >
                      <MatchShots
                        resultado={resultado}
                        datosResultado={datosResultado}
                        numero={numero}
                      />
                    </CollapsibleSection>
                  )}

                  {/* CÓRNERS */}
                  {tieneDatosCorners && (
                    <CollapsibleSection
                      id="sec-corners"
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
                      isOpen={seccionesAbiertas.corners}
                      isForcedOpen={exportingPdf}
                      onToggle={(abierto) => toggleSeccion("corners", abierto)}
                    >
                      <MatchCorners
                        resultado={resultado}
                        datosResultado={datosResultado}
                        numero={numero}
                      />
                    </CollapsibleSection>
                  )}

                  {/* TARJETAS */}
                  {tieneDatosTarjetas && (
                    <CollapsibleSection
                      id="sec-cards"
                      code="YC"
                      eyebrow={t(
                        "matchAnalytics.analytics.results.cards.eyebrow",
                      )}
                      title={t("matchAnalytics.analytics.results.cards.title")}
                      description={t(
                        "matchAnalytics.analytics.results.cards.description",
                        {
                          referee: resultado.partido.arbitro,
                        },
                      )}
                      isOpen={seccionesAbiertas.cards}
                      isForcedOpen={exportingPdf}
                      onToggle={(abierto) => toggleSeccion("cards", abierto)}
                    >
                      <MatchCards
                        resultado={resultado}
                        datosResultado={datosResultado}
                        numero={numero}
                      />
                    </CollapsibleSection>
                  )}

                  {/* RESUMEN FINAL */}
                  {resumenProbabilidades && (
                    <CollapsibleSection
                      id="sec-summary"
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
                      isOpen={seccionesAbiertas.summary}
                      isForcedOpen={exportingPdf}
                      onToggle={(abierto) => toggleSeccion("summary", abierto)}
                    >
                      <MatchSummary
                        resumenProbabilidades={resumenProbabilidades}
                        porcentaje={porcentaje}
                      />
                    </CollapsibleSection>
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
