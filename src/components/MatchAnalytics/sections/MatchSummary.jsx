// sections/MatchSummary.jsx
import { useTranslation } from "react-i18next";

const SUMMARY_TRANSLATION_PREFIX = "matchAnalytics.analytics.results.summary";

function getSignalLevel(probability, t) {
  if (probability >= 75) {
    return {
      label: t(`${SUMMARY_TRANSLATION_PREFIX}.levels.high`),
      className: "match-summary-signal--high",
    };
  }

  if (probability >= 65) {
    return {
      label: t(`${SUMMARY_TRANSLATION_PREFIX}.levels.strong`),
      className: "match-summary-signal--strong",
    };
  }

  return {
    label: t(`${SUMMARY_TRANSLATION_PREFIX}.levels.moderate`),
    className: "",
  };
}

export default function MatchSummary({ resumenProbabilidades, porcentaje }) {
  const { t } = useTranslation();

  if (!resumenProbabilidades) return null;

  const signals = resumenProbabilidades.top?.length
    ? resumenProbabilidades.top
    : resumenProbabilidades.principal
      ? [resumenProbabilidades.principal]
      : [];
  const trends = resumenProbabilidades.tendencias ?? [];
  const featuredSignal = signals[0];
  const otherSignals = signals.slice(1);
  const featuredProbability = featuredSignal
    ? porcentaje(featuredSignal.probabilidad)
    : 0;
  const featuredProgress = Math.max(0, Math.min(featuredProbability, 100));
  const featuredLevel = getSignalLevel(featuredProbability, t);

  return (
    <div className="match-summary">
      {featuredSignal && (
        <section
          className="match-summary-featured"
          aria-label={t(`${SUMMARY_TRANSLATION_PREFIX}.highestProbabilityTag`)}
        >
          <div className="match-summary-featured__content">
            <span className="match-summary-featured__eyebrow">
              {t(`${SUMMARY_TRANSLATION_PREFIX}.highestProbabilityTag`)}
            </span>
            <span className="match-summary-featured__category">
              {featuredSignal.categoria}
            </span>
            <h3>{featuredSignal.seleccion}</h3>
            {featuredSignal.descripcion && (
              <p>{featuredSignal.descripcion}</p>
            )}
            <span className={`match-summary-signal ${featuredLevel.className}`}>
              {featuredLevel.label}
            </span>
          </div>

          <div
            className="match-summary-featured__meter"
            role="meter"
            aria-label={featuredSignal.seleccion}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={featuredProgress}
            style={{ "--signal-progress": `${featuredProgress}%` }}
          >
            <div>
              <strong>{featuredProbability.toFixed(1)}%</strong>
              <span>
                {t(`${SUMMARY_TRANSLATION_PREFIX}.probabilityLabel`)}
              </span>
            </div>
          </div>
        </section>
      )}

      {otherSignals.length > 0 && (
        <section
          className="match-summary-others"
          aria-label={t(`${SUMMARY_TRANSLATION_PREFIX}.highestProbabilityTag`)}
        >
          {otherSignals.map((item, index) => {
            const probability = porcentaje(item.probabilidad);
            const level = getSignalLevel(probability, t);
            const progress = Math.max(0, Math.min(probability, 100));

            return (
              <article
                key={`${item.categoria}-${item.seleccion}`}
                className="match-summary-item match-summary-item--ranked"
              >
                <span className="match-summary-item__position">
                  {String(index + 2).padStart(2, "0")}
                </span>

                <div className="match-summary-item__body">
                  <span className="match-summary-item__category">
                    {item.categoria}
                  </span>
                  <strong>{item.seleccion}</strong>
                  {item.descripcion && <small>{item.descripcion}</small>}
                </div>

                <div className="match-summary-item__score">
                  <strong>{probability.toFixed(1)}%</strong>
                  <span className={`match-summary-signal ${level.className}`}>
                    {level.label}
                  </span>
                </div>

                <div
                  className="match-summary-item__progress"
                  aria-hidden="true"
                  style={{ "--signal-progress": `${progress}%` }}
                >
                  <span />
                </div>
              </article>
            );
          })}
        </section>
      )}

      <div className="match-summary-bottom">
        <section className="match-summary-insights">
          <h3 className="match-summary-title">
            {t(`${SUMMARY_TRANSLATION_PREFIX}.readingTitle`)}
          </h3>

          {trends.length > 0 ? (
            trends.map((trend, index) => (
              <div
                key={`${trend}-${index}`}
                className="match-summary-insight"
              >
                <span aria-hidden="true" />
                <p>{trend}</p>
              </div>
            ))
          ) : (
            <div className="match-summary-insight">
              <span aria-hidden="true" />
              <p>{t(`${SUMMARY_TRANSLATION_PREFIX}.noTrends`)}</p>
            </div>
          )}
        </section>

        {(resumenProbabilidades.marcador ||
          resumenProbabilidades.marcadorAi) && (
          <section className="match-summary-scores">
            {resumenProbabilidades.marcador && (
              <article className="match-summary-score">
                <span>
                  {t(`${SUMMARY_TRANSLATION_PREFIX}.mostProbableScoreTag`)}
                </span>
                <strong>{resumenProbabilidades.marcador.marcador}</strong>
                <small>
                  {t(`${SUMMARY_TRANSLATION_PREFIX}.probabilityPercentage`, {
                    percentage: porcentaje(
                      resumenProbabilidades.marcador.probabilidad,
                    ).toFixed(1),
                  })}
                </small>
              </article>
            )}

            {resumenProbabilidades.marcadorAi && (
              <article className="match-summary-score-ia">
                <span>
                  {t(`${SUMMARY_TRANSLATION_PREFIX}.mostProbableScoreTagAi`)}
                </span>
                <strong>{resumenProbabilidades.marcadorAi.marcador}</strong>
                <small>
                  {t(`${SUMMARY_TRANSLATION_PREFIX}.probabilityPercentage`, {
                    percentage: porcentaje(
                      resumenProbabilidades.marcadorAi.probabilidad,
                    ).toFixed(1),
                  })}
                </small>
              </article>
            )}
          </section>
        )}
      </div>

      <aside className="match-summary-disclaimer">
        <span aria-hidden="true">i</span>
        <p>
          <strong>
            {t(`${SUMMARY_TRANSLATION_PREFIX}.disclaimerTitle`)}
          </strong>{" "}
          {t(`${SUMMARY_TRANSLATION_PREFIX}.disclaimerText`)}
        </p>
      </aside>
    </div>
  );
}
