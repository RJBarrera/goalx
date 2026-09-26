// sections/MatchGoals.jsx
import { useTranslation } from "react-i18next";
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import {
  CustomTooltip,
  MetricCard,
  ProbabilityBar,
  SectionHeader,
} from "./utils";

const COLORS = {
  local: "#21cfa1",
  draw: "#94a3b8",
  away: "#38bdf8",
  positive: "#22c55e",
  negative: "#dce3eb",
  corner: "#f59e0b",
  card: "#eab308",
};

export default function MatchGoals({
  resultado,
  datosResultado,
  numero,
  porcentaje,
}) {
  const { t } = useTranslation();

  // Si los datos aún no existen, no renderizamos nada
  if (!resultado || !datosResultado?.goles) return null;

  return (
    <>
      <SectionHeader
        code="xG"
        eyebrow={t("matchAnalytics.analytics.results.goals.eyebrow")}
        title={t("matchAnalytics.analytics.results.goals.title")}
        description={t("matchAnalytics.analytics.results.goals.description")}
      />
      <div className="match-two-columns">
        {/*  MODELO CLASICO */}
        <div className="match-panel">
          <div
            className="match-panel-title"
            style={{
              borderBottom: "1px solid #e2e8f0",
              paddingBottom: "1rem",
              marginBottom: "1.5rem",
            }}
          >
            <div>
              <h3>
                {t("matchAnalytics.analytics.results.goals.classicTitle")}
              </h3>
            </div>
          </div>

          {/* xG Clasico */}
          <div
            className="match-metrics-grid"
            style={{ marginBottom: "2.5rem" }}
          >
            <MetricCard
              label={`xG ${resultado.partido.local}`}
              value={numero(datosResultado.goles.expected_goals_home)}
              description={t(
                "matchAnalytics.analytics.results.goals.expectedHomeDesc",
              )}
              variant="local"
              tag={t("matchAnalytics.analytics.results.goals.tags.home")}
            />
            <MetricCard
              label={`xG ${resultado.partido.visitante}`}
              value={numero(datosResultado.goles.expected_goals_away)}
              description={t(
                "matchAnalytics.analytics.results.goals.expectedAwayDesc",
              )}
              variant="away"
              tag={t("matchAnalytics.analytics.results.goals.tags.away")}
            />
            <MetricCard
              label={t("matchAnalytics.analytics.results.goals.totalXgLabel")}
              value={numero(
                Number(datosResultado.goles.expected_goals_home) +
                  Number(datosResultado.goles.expected_goals_away),
              )}
              description={t(
                "matchAnalytics.analytics.results.goals.jointExpectation",
              )}
              tag={t("matchAnalytics.analytics.results.goals.tags.match")}
            />
          </div>

          {/* Over/Under Clasico */}
          <div className="match-panel-title">
            <div>
              <span>
                {t("matchAnalytics.analytics.results.goals.overUnderTag")}
              </span>

              <h3>
                {t("matchAnalytics.analytics.results.goals.overUnderTitle")}
              </h3>
            </div>
          </div>
          <div style={{ marginBottom: "2.5rem" }}>
            <ProbabilityBar
              label={t("matchAnalytics.analytics.results.goals.over15")}
              value={datosResultado.goles?.Over_Under?.["Over 1.5"]}
            />

            <ProbabilityBar
              label={t("matchAnalytics.analytics.results.goals.under15")}
              value={datosResultado.goles?.Over_Under?.["Under 1.5"]}
              accent="slate"
            />

            <ProbabilityBar
              label={t("matchAnalytics.analytics.results.goals.over25")}
              value={datosResultado.goles?.Over_Under?.["Over 2.5"]}
              accent="cyan"
            />

            <ProbabilityBar
              label={t("matchAnalytics.analytics.results.goals.under25")}
              value={datosResultado.goles?.Over_Under?.["Under 2.5"]}
              accent="purple"
            />
          </div>

          {/* BTTS Clasico */}
          <div className="match-panel-title">
            <div>
              <span>{t("matchAnalytics.analytics.results.goals.bttsTag")}</span>
              <h3>{t("matchAnalytics.analytics.results.goals.bttsTitle")}</h3>
            </div>
          </div>
          <div className="match-pie-wrapper" style={{ height: "240px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={datosResultado.ambosAnotan}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={60}
                  outerRadius={85}
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
                {porcentaje(datosResultado.goles?.BTTS?.Yes).toFixed(1)}%
              </strong>
              <span>
                {t("matchAnalytics.analytics.results.goals.yesBadge")}
              </span>
            </div>
          </div>
        </div>

        {/* MODELO IA XGBOOST */}
        {datosResultado.goles?.xgboost_mercados && (
          <div
            className="match-panel"
            style={{ borderTop: "4px solid var(--cyan-500)" }}
          >
            <div
              className="match-panel-title"
              style={{
                borderBottom: "1px solid #e2e8f0",
                paddingBottom: "1rem",
                marginBottom: "1.5rem",
              }}
            >
              <div>
                {/* <span>{t("matchAnalytics.analytics.results.goals.xgboost")}</span> */}
                <h3>{t("matchAnalytics.analytics.results.goals.xgboost")}</h3>
              </div>
            </div>

            {/* xG IA */}
            <div
              className="match-metrics-grid"
              style={{ marginBottom: "2.5rem" }}
            >
              <MetricCard
                label={`xG ${resultado.partido.local}`}
                value={numero(datosResultado.goles.xgboost_expected_goals_home)}
                description={t(
                  "matchAnalytics.analytics.results.goals.expectedHomeDesc",
                )}
                variant="cyan"
                tag={t("matchAnalytics.analytics.results.goals.tags.home")}
              />

              <MetricCard
                label={`xG ${resultado.partido.visitante}`}
                value={numero(datosResultado.goles.xgboost_expected_goals_away)}
                description={t(
                  "matchAnalytics.analytics.results.goals.expectedAwayDesc",
                )}
                variant="cyan"
                tag={t("matchAnalytics.analytics.results.goals.tags.away")}
              />

              <MetricCard
                label={t("matchAnalytics.analytics.results.goals.totalXgLabel")}
                value={numero(
                  Number(datosResultado.goles.xgboost_expected_goals_home) +
                    Number(datosResultado.goles.xgboost_expected_goals_away),
                )}
                description={t(
                  "matchAnalytics.analytics.results.goals.jointExpectation",
                )}
                variant="cyan"
                tag={t("matchAnalytics.analytics.results.goals.tags.match")}
              />
            </div>

            {/* Over/Under IA */}
            <div className="match-panel-title">
              <div>
                <span>
                  {t("matchAnalytics.analytics.results.goals.overUnderTag")}
                </span>

                <h3>
                  {t("matchAnalytics.analytics.results.goals.overUnderTitle")}
                </h3>
              </div>
            </div>
            <div style={{ marginBottom: "2.5rem" }}>
              <ProbabilityBar
                label={t("matchAnalytics.analytics.results.goals.over15")}
                value={datosResultado.goles.xgboost_mercados["Over 1.5"]}
              />

              <ProbabilityBar
                label={t("matchAnalytics.analytics.results.goals.under15")}
                value={datosResultado.goles.xgboost_mercados["Under 1.5"]}
                accent="slate"
              />

              <ProbabilityBar
                label={t("matchAnalytics.analytics.results.goals.over25")}
                value={datosResultado.goles.xgboost_mercados["Over 2.5"]}
                accent="cyan"
              />

              <ProbabilityBar
                label={t("matchAnalytics.analytics.results.goals.under25")}
                value={datosResultado.goles.xgboost_mercados["Under 2.5"]}
                accent="purple"
              />
            </div>

            {/* BTTS IA */}
            <div className="match-panel-title">
              <div>
                <span>
                  {t("matchAnalytics.analytics.results.goals.bttsTag")}
                </span>
                <h3>{t("matchAnalytics.analytics.results.goals.bttsTitle")}</h3>
              </div>
            </div>
            <div className="match-pie-wrapper" style={{ height: "240px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={datosResultado.ambosAnotanAi}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={60}
                    outerRadius={85}
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
                    datosResultado.goles.xgboost_mercados.BTTS_Yes,
                  ).toFixed(1)}
                  %
                </strong>
                <span>
                  {t("matchAnalytics.analytics.results.goals.yesBadge")}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
