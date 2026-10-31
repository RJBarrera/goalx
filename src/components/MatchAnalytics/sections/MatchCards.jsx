// sections/MatchCards.jsx
import { useTranslation } from "react-i18next";

function ProbabilityCell({ value, variant }) {
  const numericValue = Number(value);
  const percent =
    value === null || value === undefined || !Number.isFinite(numericValue)
      ? null
      : Math.max(0, Math.min(100, numericValue * 100));

  if (percent === null) {
    return <span className="match-cards__unavailable">—</span>;
  }

  return (
    <div className={`match-cards__probability match-cards__probability--${variant}`}>
      <strong>{percent.toFixed(1)}%</strong>
      <span className="match-cards__track" aria-hidden="true">
        <span style={{ width: `${percent}%` }} />
      </span>
    </div>
  );
}

export default function MatchCards({ resultado, datosResultado, numero }) {
  const { t } = useTranslation();
  const tarjetas = datosResultado?.tarjetas;
  const totalClasico = Number(tarjetas?.expected_total) || 0;
  const totalAi = Number(tarjetas?.xgboost_expected_total) || 0;
  const hasClassic = totalClasico > 0;
  const hasAi = totalAi > 0;

  if (!resultado || !tarjetas || (!hasClassic && !hasAi)) {
    return null;
  }

  const models = [
    hasClassic && {
      key: "classic",
      subtitle: t("matchAnalytics.analytics.results.cards.subtitle"),
      title: t("matchAnalytics.analytics.results.cards.model_h"),
      expected: tarjetas.expected_total,
      context: t(
        "matchAnalytics.analytics.results.cards.refereeAdjusted",
        { referee: resultado.partido.arbitro },
      ),
      over: tarjetas["Over 4.5"],
      under: tarjetas["Under 4.5"],
    },
    hasAi && {
      key: "ai",
      subtitle: t("matchAnalytics.analytics.results.cards.subtitleAi"),
      title: t("matchAnalytics.analytics.results.cards.recentTrend"),
      expected: tarjetas.xgboost_expected_total,
      context: t("matchAnalytics.analytics.results.cards.recentDescription"),
      over: tarjetas.xgboost_over_4_5,
      under: tarjetas.xgboost_under_4_5,
    },
  ].filter(Boolean);

  const rows = [
    {
      key: "expected",
      label: t("matchAnalytics.analytics.results.cards.expectedCards"),
      type: "expected",
    },
    {
      key: "over",
      label: t("matchAnalytics.analytics.results.cards.over45"),
      type: "probability",
    },
    {
      key: "under",
      label: t("matchAnalytics.analytics.results.cards.under45"),
      type: "probability",
    },
  ];

  return (
    <section className="match-panel match-cards">
      <div className="match-cards__table-wrap">
        <table
          className="match-cards__table"
          aria-label={t("matchAnalytics.analytics.results.cards.title")}
        >
          <thead>
            <tr>
              <th scope="col">
                {t("matchAnalytics.analytics.results.cards.metricHeader")}
              </th>
              {models.map((model) => (
                <th
                  scope="col"
                  className={`match-cards__model-heading match-cards__model-heading--${model.key}`}
                  key={model.key}
                >
                  <span>{model.subtitle}</span>
                  <strong>{model.title}</strong>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                className={`match-cards__row match-cards__row--${row.key}`}
                key={row.key}
              >
                <th scope="row">{row.label}</th>
                {models.map((model) => (
                  <td key={model.key}>
                    {row.type === "expected" ? (
                      <div
                        className={`match-cards__expected match-cards__expected--${model.key}`}
                      >
                        <strong>{numero(model.expected, 1)}</strong>
                        <small>{model.context}</small>
                      </div>
                    ) : (
                      <ProbabilityCell
                        value={model[row.key]}
                        variant={row.key}
                      />
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
