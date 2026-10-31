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
import { CustomTooltip, MetricCard, ProbabilityBar } from "./utils";

const COLORS = {
  positive: "#2e7d32",
  negative: "#dce3eb",
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
      <div className="match-two-columns match-goals">
        {/*  MODELO CLASICO */}
        <div className="match-panel match-goals__panel">
          <div className="match-panel-title match-goals__model-heading">
            <div>
              <h3>
                {t("matchAnalytics.analytics.results.goals.classicTitle")}
              </h3>
            </div>
          </div>

          {/* xG Clasico */}
          <div className="match-metrics-grid match-goals__metrics">
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
          <div className="match-panel-title match-goals__subheading">
            <div>
              <span>
                {t("matchAnalytics.analytics.results.goals.overUnderTag")}
              </span>

              <h3>
                {t("matchAnalytics.analytics.results.goals.overUnderTitle")}
              </h3>
            </div>
          </div>
          <div className="match-goals__probabilities">
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
          {(() => {
            const bttsYes = datosResultado.goles?.BTTS?.Yes || 0;
            const bttsNo = datosResultado.goles?.BTTS?.No || 0;

            // Determinamos cuál es mayor
            const isYesHigher = bttsYes >= bttsNo;
            const dominantValue = isYesHigher ? bttsYes : bttsNo;
            const dominantBadge = isYesHigher
              ? t("matchAnalytics.analytics.results.goals.yesBadge")
              : t("matchAnalytics.analytics.results.goals.noBadge");

            return (
              <>
                <div className="match-panel-title match-goals__subheading">
                  <div>
                    <span>
                      {t("matchAnalytics.analytics.results.goals.bttsTag")}
                    </span>
                    <h3>
                      {t("matchAnalytics.analytics.results.goals.bttsTitle")}
                    </h3>
                  </div>
                </div>
                <div className="match-pie-wrapper match-goals__btts-chart">
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
                    <strong>{porcentaje(dominantValue).toFixed(1)}%</strong>
                    <span>{dominantBadge}</span>
                  </div>
                </div>
              </>
            );
          })()}
        </div>

        {/* MODELO IA XGBOOST */}
        {datosResultado.goles?.xgboost_mercados && (
          <div className="match-panel match-goals__panel match-goals__panel--ai">
            <div className="match-panel-title match-goals__model-heading">
              <div>
                {/* <span>{t("matchAnalytics.analytics.results.goals.xgboost")}</span> */}
                <h3>{t("matchAnalytics.analytics.results.goals.xgboost")}</h3>
              </div>
            </div>

            {/* xG IA */}
            <div className="match-metrics-grid match-goals__metrics">
              <MetricCard
                label={`xG ${resultado.partido.local}`}
                value={numero(datosResultado.goles.xgboost_expected_goals_home)}
                description={t(
                  "matchAnalytics.analytics.results.goals.expectedHomeDesc",
                )}
                variant="local"
                tag={t("matchAnalytics.analytics.results.goals.tags.home")}
              />

              <MetricCard
                label={`xG ${resultado.partido.visitante}`}
                value={numero(datosResultado.goles.xgboost_expected_goals_away)}
                description={t(
                  "matchAnalytics.analytics.results.goals.expectedAwayDesc",
                )}
                variant="away"
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
                tag={t("matchAnalytics.analytics.results.goals.tags.match")}
              />
            </div>

            {/* Over/Under IA */}
            <div className="match-panel-title match-goals__subheading">
              <div>
                <span>
                  {t("matchAnalytics.analytics.results.goals.overUnderTag")}
                </span>

                <h3>
                  {t("matchAnalytics.analytics.results.goals.overUnderTitle")}
                </h3>
              </div>
            </div>
            <div className="match-goals__probabilities">
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

            {/* BTTS IA Dinámico */}
            {(() => {
              const bttsYes =
                datosResultado.goles?.xgboost_mercados?.BTTS_Yes || 0;
              const bttsNo =
                datosResultado.goles?.xgboost_mercados?.BTTS_No || 0;

              // Determinamos cuál es mayor
              const isYesHigher = bttsYes >= bttsNo;
              const dominantValue = isYesHigher ? bttsYes : bttsNo;
              const dominantBadge = isYesHigher
                ? t("matchAnalytics.analytics.results.goals.yesBadge")
                : t("matchAnalytics.analytics.results.goals.noBadge");

              return (
                <>
                  <div className="match-panel-title match-goals__subheading">
                    <div>
                      <span>
                        {t("matchAnalytics.analytics.results.goals.bttsTag")}
                      </span>
                      <h3>
                        {t("matchAnalytics.analytics.results.goals.bttsTitle")}
                      </h3>
                    </div>
                  </div>
                  <div className="match-pie-wrapper match-goals__btts-chart">
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
                      <strong>{porcentaje(dominantValue).toFixed(1)}%</strong>
                      <span>{dominantBadge}</span>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        )}
      </div>
    </>
  );
}
