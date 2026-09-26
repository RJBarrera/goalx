// sections/MatchCards.jsx
import { useTranslation } from "react-i18next";
import { MetricCard, ProbabilityBar, SectionHeader } from "./utils";

export default function MatchCards({ resultado, datosResultado, numero }) {
  const { t } = useTranslation();

  // Si los datos aún no existen, no renderizamos nada
  if (!resultado || !datosResultado?.goles) return null;

  return (
    <>
      <SectionHeader
        code="YC"
        eyebrow={t("matchAnalytics.analytics.results.cards.eyebrow")}
        title={t("matchAnalytics.analytics.results.cards.title")}
        description={t("matchAnalytics.analytics.results.cards.description", {
          referee: resultado.partido.arbitro,
        })}
      />
      <div className="match-two-columns">
        {/* MODELO CLASICO */}
        <div className="match-panel">
          <div className="match-panel-title">
            <div>
              <span>
                {t("matchAnalytics.analytics.results.cards.subtitle")}
              </span>
              <h3>{t("matchAnalytics.analytics.results.cards.model_h")}</h3>
            </div>
          </div>

          <div style={{ marginTop: "1.5rem" }}>
            <MetricCard
              label={t("matchAnalytics.analytics.results.cards.expectedCards")}
              value={numero(datosResultado.tarjetas.expected_total, 1)}
              description={t(
                "matchAnalytics.analytics.results.cards.refereeAdjusted",
                { referee: resultado.partido.arbitro },
              )}
              variant="card"
              tag={t("matchAnalytics.analytics.results.cards.tags.match")}
            />

            <div style={{ marginTop: "1.5rem" }}>
              <ProbabilityBar
                label={t("matchAnalytics.analytics.results.cards.over45")}
                value={datosResultado.tarjetas?.["Over 4.5"]}
                accent="orange"
              />
              <ProbabilityBar
                label={t("matchAnalytics.analytics.results.cards.under45")}
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
                  {t("matchAnalytics.analytics.results.cards.subtitleAi")}
                </span>
                <h3>
                  {t("matchAnalytics.analytics.results.cards.recentTrend")}
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
                tag={t("matchAnalytics.analytics.results.cards.tags.xgboost")}
              />

              {/* Modelo de probabilidades */}
              {datosResultado.tarjetas.xgboost_over_4_5 !== undefined && (
                <div style={{ marginTop: "1.5rem" }}>
                  <ProbabilityBar
                    label={t("matchAnalytics.analytics.results.cards.over45")}
                    value={datosResultado.tarjetas.xgboost_over_4_5}
                    accent="orange"
                  />
                  <ProbabilityBar
                    label={t("matchAnalytics.analytics.results.cards.under45")}
                    value={datosResultado.tarjetas.xgboost_under_4_5}
                    accent="slate"
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
