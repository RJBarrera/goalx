// sections/MatchCorners.jsx
import { useTranslation } from "react-i18next";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { MetricCard, ProbabilityBar, SectionHeader } from "./utils";

const COLORS = {
  away: "#38bdf8",
  corner: "#f59e0b",
};

export default function MatchCorners({ resultado, datosResultado, numero }) {
  const { t } = useTranslation();

  // Si los datos aún no existen, no renderizamos nada
  if (!resultado || !datosResultado?.goles) return null;

  return (
    <>
      {/* HEADER PRINCIPAL */}
      <SectionHeader
        code="CK"
        eyebrow={t("matchAnalytics.analytics.results.corners.eyebrow")}
        title={t("matchAnalytics.analytics.results.corners.title")}
        description={t("matchAnalytics.analytics.results.corners.description")}
      />

      <div className="match-two-columns">
        {/* MODELO CLASICO */}
        <div className="match-panel">
          <div className="match-panel-title">
            <div>
              <span>
                {t(
                  "matchAnalytics.analytics.results.corners.marketTeam.classicTitle",
                )}
              </span>
            </div>
          </div>

          <div className="match-metrics-grid match-metrics-grid--four">
            <MetricCard
              label={t(
                "matchAnalytics.analytics.results.corners.expectedBarName",
              )}
              value={numero(datosResultado.corners.expected_total, 1)}
              description={t(
                "matchAnalytics.analytics.results.corners.fullMatch",
              )}
              variant="corner"
              // tag={t("matchAnalytics.analytics.results.corners.tags.total")}
            />

            <MetricCard
              label={t("matchAnalytics.analytics.results.corners.firstHalf")}
              value={numero(datosResultado.corners.expected_1H, 1)}
              description={t(
                "matchAnalytics.analytics.results.corners.firstHalfDesc",
              )}
              variant="corner"
              // tag={t("matchAnalytics.analytics.results.corners.tags.firstHalf")}
            />

            <MetricCard
              label={resultado.partido.local}
              value={numero(datosResultado.corners.expected_home, 1)}
              description={t(
                "matchAnalytics.analytics.results.corners.expectedHomeDesc",
              )}
              variant="local"
              // tag={t("matchAnalytics.analytics.results.corners.tags.home")}
            />

            <MetricCard
              label={resultado.partido.visitante}
              value={numero(datosResultado.corners.expected_away, 1)}
              description={t(
                "matchAnalytics.analytics.results.corners.expectedAwayDesc",
              )}
              variant="away"
              // tag={t("matchAnalytics.analytics.results.corners.tags.away")}
            />
          </div>

          {/* Grafica */}
          <div style={{ height: "200px", marginBottom: "2rem" }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={datosResultado.cornersEquipos}>
                <CartesianGrid
                  strokeDasharray="4 4"
                  vertical={false}
                  stroke="#e7ebf2"
                />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
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

          {/* LÍNEAS CÓRNERS */}
          <div className="match-panel">
            <ProbabilityBar
              label={t("matchAnalytics.analytics.results.corners.over95")}
              value={datosResultado.corners?.["Over 9.5"]}
              accent="orange"
            />
            <ProbabilityBar
              label={t("matchAnalytics.analytics.results.corners.under95")}
              value={datosResultado.corners?.["Under 9.5"]}
              accent="slate"
            />

            <ProbabilityBar
              label={t("matchAnalytics.analytics.results.corners.over45H1")}
              value={datosResultado.corners?.["Over 4.5 1H"]}
              accent="cyan"
            />
            <ProbabilityBar
              label={t("matchAnalytics.analytics.results.corners.under45H1")}
              value={datosResultado.corners?.["Under 4.5 1H"]}
              accent="purple"
            />
          </div>
        </div>

        {/* MODELO IA (XGBOOST) */}
        {datosResultado.corners?.xgboost && (
          <div className="match-panel">
            <div className="match-panel-title">
              <div>
                <span>
                  {t(
                    "matchAnalytics.analytics.results.corners.marketTeam.aiTitle",
                  )}
                </span>
              </div>
            </div>

            <div className="match-metrics-grid match-metrics-grid--four">
              <MetricCard
                label={t(
                  "matchAnalytics.analytics.results.corners.expectedBarName",
                )}
                value={numero(datosResultado.corners.xgboost.expected_total, 1)}
                description={t(
                  "matchAnalytics.analytics.results.corners.fullMatch",
                )}
                variant="cyan"
                // tag={t("matchAnalytics.analytics.results.corners.tags.total")}
              />

              <MetricCard
                label={t("matchAnalytics.analytics.results.corners.firstHalf")}
                value={numero(
                  datosResultado.corners.xgboost.expected_total * 0.47,
                  1,
                )}
                description={t(
                  "matchAnalytics.analytics.results.corners.firstHalfDesc",
                )}
                variant="cyan"
                // tag={t("matchAnalytics.analytics.results.corners.tags.firstHalf")}
              />

              <MetricCard
                label={resultado.partido.local}
                value={numero(datosResultado.corners.xgboost.expected_home, 1)}
                description={t(
                  "matchAnalytics.analytics.results.corners.expectedHomeDesc",
                )}
                variant="cyan"
                // tag={t("matchAnalytics.analytics.results.corners.tags.home")}
              />

              <MetricCard
                label={resultado.partido.visitante}
                value={numero(datosResultado.corners.xgboost.expected_away, 1)}
                description={t(
                  "matchAnalytics.analytics.results.corners.expectedAwayDesc",
                )}
                variant="cyan"
                // tag={t("matchAnalytics.analytics.results.corners.tags.away")}
              />
            </div>

            {/* Grafica */}
            <div style={{ height: "200px", marginBottom: "2rem" }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={datosResultado.cornersEquiposAi}>
                  <CartesianGrid
                    strokeDasharray="4 4"
                    vertical={false}
                    stroke="#e7ebf2"
                  />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Bar
                    dataKey="esperado"
                    name={t(
                      "matchAnalytics.analytics.results.corners.expectedBarName",
                    )}
                    fill={COLORS.away}
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* LÍNEAS CÓRNERS */}
            <div className="match-panel">
              <ProbabilityBar
                label={t("matchAnalytics.analytics.results.corners.over95")}
                value={datosResultado.corners.xgboost["Over 9.5"]}
                accent="orange"
              />
              <ProbabilityBar
                label={t("matchAnalytics.analytics.results.corners.under95")}
                value={datosResultado.corners.xgboost["Under 9.5"]}
                accent="slate"
              />
              <div style={{ margin: "1rem 0" }} />
              <ProbabilityBar
                label={t("matchAnalytics.analytics.results.corners.over45H1")}
                value={datosResultado.corners.xgboost["Over 4.5 1H"]}
                accent="cyan"
              />
              <ProbabilityBar
                label={t("matchAnalytics.analytics.results.corners.under45H1")}
                value={datosResultado.corners.xgboost["Under 4.5 1H"]}
                accent="purple"
              />
            </div>
          </div>
        )}
      </div>

      {/* COMPARATIVA DE MERCADOS POR EQUIPO */}
      <div style={{ marginTop: "3rem" }}>
        <SectionHeader
          code="TM"
          eyebrow={t(
            "matchAnalytics.analytics.results.corners.marketTeam.eyebrow",
          )}
          title={t("matchAnalytics.analytics.results.corners.marketTeam.title")}
          description={t(
            "matchAnalytics.analytics.results.corners.marketTeam.description",
          )}
        />

        {/* COMPARATIVA EQUIPO LOCAL */}
        <div className="match-team-market-card__heading">
          <span>
            {t("matchAnalytics.analytics.results.fixture.localLabel")}
          </span>
          <h3>{resultado.partido.local}</h3>
        </div>

        <div className="match-two-columns" style={{ marginBottom: "2.5rem" }}>
          {/* Local Clasico */}
          <div className="match-team-market-card">
            <div className="match-team-market-card__heading">
              <span>
                {t(
                  "matchAnalytics.analytics.results.corners.marketTeam.statisticSub",
                )}
              </span>
            </div>
            <ProbabilityBar
              label={t("matchAnalytics.analytics.results.corners.homeOver45")}
              value={datosResultado.corners?.["Home_Over_4.5"]}
              accent="cyan"
            />
            <ProbabilityBar
              label={t("matchAnalytics.analytics.results.corners.homeUnder45")}
              value={datosResultado.corners?.["Home_Under_4.5"]}
              accent="slate"
            />
            <ProbabilityBar
              label={t("matchAnalytics.analytics.results.corners.homeOver55")}
              value={datosResultado.corners?.["Home_Over_5.5"]}
              accent="cyan"
            />
            <ProbabilityBar
              label={t("matchAnalytics.analytics.results.corners.homeUnder55")}
              value={datosResultado.corners?.["Home_Under_5.5"]}
              accent="purple"
            />
          </div>

          {/* Local XGBoost */}
          {datosResultado.corners?.xgboost && (
            <div className="match-team-market-card">
              <div className="match-team-market-card__heading">
                <span>
                  {t(
                    "matchAnalytics.analytics.results.corners.marketTeam.xgboostSub",
                  )}
                </span>
              </div>
              <ProbabilityBar
                label={t("matchAnalytics.analytics.results.corners.homeOver45")}
                value={datosResultado.corners.xgboost["Home_Over_4.5"]}
                accent="cyan"
              />
              <ProbabilityBar
                label={t(
                  "matchAnalytics.analytics.results.corners.homeUnder45",
                )}
                value={datosResultado.corners.xgboost["Home_Under_4.5"]}
                accent="slate"
              />
              <ProbabilityBar
                label={t("matchAnalytics.analytics.results.corners.homeOver55")}
                value={datosResultado.corners.xgboost["Home_Over_5.5"]}
                accent="cyan"
              />
              <ProbabilityBar
                label={t(
                  "matchAnalytics.analytics.results.corners.homeUnder55",
                )}
                value={datosResultado.corners.xgboost["Home_Under_5.5"]}
                accent="purple"
              />
            </div>
          )}
        </div>

        {/* COMPARATIVA EQUIPO VISITANTE */}
        <div className="match-team-market-card__heading">
          <span>
            {t("matchAnalytics.analytics.results.fixture.visitorLabel")}
          </span>
          <h3>{resultado.partido.visitante}</h3>
        </div>
        <div className="match-two-columns">
          {/* Visitante Clasico */}
          <div className="match-team-market-card">
            <div className="match-team-market-card__heading">
              <span>
                {t(
                  "matchAnalytics.analytics.results.corners.marketTeam.statisticSub",
                )}
              </span>
            </div>
            <ProbabilityBar
              label={t("matchAnalytics.analytics.results.corners.awayOver35")}
              value={datosResultado.corners?.["Away_Over_3.5"]}
              accent="cyan"
            />
            <ProbabilityBar
              label={t("matchAnalytics.analytics.results.corners.awayUnder35")}
              value={datosResultado.corners?.["Away_Under_3.5"]}
              accent="slate"
            />
            <ProbabilityBar
              label={t("matchAnalytics.analytics.results.corners.awayOver45")}
              value={datosResultado.corners?.["Away_Over_4.5"]}
              accent="cyan"
            />
            <ProbabilityBar
              label={t("matchAnalytics.analytics.results.corners.awayUnder45")}
              value={datosResultado.corners?.["Away_Under_4.5"]}
              accent="purple"
            />
          </div>

          {/* Visitante XGBoost */}
          {datosResultado.corners?.xgboost && (
            <div className="match-team-market-card">
              <div className="match-team-market-card__heading">
                <span>
                  {t(
                    "matchAnalytics.analytics.results.corners.marketTeam.xgboostSub",
                  )}
                </span>
              </div>
              <ProbabilityBar
                label={t("matchAnalytics.analytics.results.corners.awayOver35")}
                value={datosResultado.corners.xgboost["Away_Over_3.5"]}
                accent="cyan"
              />
              <ProbabilityBar
                label={t(
                  "matchAnalytics.analytics.results.corners.awayUnder35",
                )}
                value={datosResultado.corners.xgboost["Away_Under_3.5"]}
                accent="slate"
              />
              <ProbabilityBar
                label={t("matchAnalytics.analytics.results.corners.awayOver45")}
                value={datosResultado.corners.xgboost["Away_Over_4.5"]}
                accent="cyan"
              />
              <ProbabilityBar
                label={t(
                  "matchAnalytics.analytics.results.corners.awayUnder45",
                )}
                value={datosResultado.corners.xgboost["Away_Under_4.5"]}
                accent="purple"
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
}
