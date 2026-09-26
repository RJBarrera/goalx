// sections/MatchSummary.jsx
import { useTranslation } from "react-i18next";
import { SectionHeader } from "./utils";

export default function MatchSummary({ resumenProbabilidades, porcentaje }) {
  const { t } = useTranslation();

  // Si los datos aún no existen, no renderizamos nada
  if (!resumenProbabilidades) return null;

  return (
    <>
      <SectionHeader
        code="TOP"
        eyebrow={t("matchAnalytics.analytics.results.summary.eyebrow")}
        title={t("matchAnalytics.analytics.results.summary.title")}
        description={t("matchAnalytics.analytics.results.summary.description")}
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
              {porcentaje(resumenProbabilidades.principal.probabilidad).toFixed(
                1,
              )}
              %
            </strong>

            <span>
              {t("matchAnalytics.analytics.results.summary.probabilityLabel")}
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
            nivel = t("matchAnalytics.analytics.results.summary.levels.high");
          } else if (probability >= 65) {
            nivel = t("matchAnalytics.analytics.results.summary.levels.strong");
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
                    t("matchAnalytics.analytics.results.summary.levels.high")
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
            {t("matchAnalytics.analytics.results.summary.readingTitle")}
          </span>

          {resumenProbabilidades.tendencias.length > 0 ? (
            resumenProbabilidades.tendencias.map((tendencia, index) => (
              <div
                key={`${tendencia}-${index}`}
                className="match-summary-insight"
              >
                <span />

                <p>{tendencia}</p>
              </div>
            ))
          ) : (
            <div className="match-summary-insight">
              <span />

              <p>{t("matchAnalytics.analytics.results.summary.noTrends")}</p>
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

            <strong>{resumenProbabilidades.marcador.marcador}</strong>

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
            {t("matchAnalytics.analytics.results.summary.disclaimerTitle")}
          </strong>{" "}
          {t("matchAnalytics.analytics.results.summary.disclaimerText")}
        </p>
      </div>
    </>
  );
}
