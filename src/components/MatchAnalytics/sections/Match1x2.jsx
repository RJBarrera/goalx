import { useTranslation } from "react-i18next";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CustomTooltip } from "./utils";

export default function Match1x2({ datosResultado }) {
  const { t } = useTranslation();

  if (!datosResultado) return null;

  const outcomes = [
    {
      label: t("matchAnalytics.analytics.results.fixture.localLabel"),
      variant: "home",
    },
    {
      label: t("matchAnalytics.analytics.results.market1x2.draw"),
      variant: "draw",
    },
    {
      label: t("matchAnalytics.analytics.results.fixture.visitorLabel"),
      variant: "away",
    },
  ];

  const renderChart = (data) => (
    <div className="match-1x2-model__chart">
      <ResponsiveContainer width="100%" height={190}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 4, right: 12, bottom: 2, left: 8 }}
        >
          <CartesianGrid
            strokeDasharray="3 5"
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
            width={100}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar
            dataKey="value"
            name={t(
              "matchAnalytics.analytics.results.market1x2.probabilityName",
            )}
            radius={[0, 5, 5, 0]}
            barSize={20}
          >
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );

  const renderWinner = (winner, description) => (
    <div
      className="match-1x2-winner"
      style={{ "--match-winner-color": winner.color }}
    >
      <div>
        <span className="match-1x2-winner__label">
          {t("matchAnalytics.analytics.results.market1x2.dominantScenario")}
        </span>
        <strong className="match-1x2-winner__name">{winner.name}</strong>
      </div>
      <strong className="match-1x2-winner__value">
        {winner.value.toFixed(1)}%
      </strong>
      <p className="match-1x2-winner__description">{description}</p>
    </div>
  );

  return (
    <div className="match-1x2">
      <div
        className="match-1x2-legend"
        role="list"
        aria-label={t("matchAnalytics.analytics.results.market1x2.description")}
      >
        {outcomes.map((outcome) => (
          <span
            key={outcome.variant}
            className={`match-1x2-legend__item match-1x2-legend__item--${outcome.variant}`}
            role="listitem"
          >
            {outcome.label}
          </span>
        ))}
      </div>

      <div className="match-1x2-models">
        <section className="match-1x2-model">
          <header className="match-1x2-model__heading">
            <h3>
              {t("matchAnalytics.analytics.results.market1x2.classicLabel")}
            </h3>
            <span className="match-1x2-model__type">
              {t("matchAnalytics.analytics.results.market1x2.probabilityName")}
            </span>
          </header>
          {renderChart(datosResultado.resultado1X2)}
          {renderWinner(
            datosResultado.ganador,
            t("matchAnalytics.analytics.results.market1x2.dominantDescription"),
          )}
        </section>

        {datosResultado.resultado1X2Ai?.[0]?.value > 0 && (
          <section className="match-1x2-model match-1x2-model--ai">
            <header className="match-1x2-model__heading">
              <h3>
                {t("matchAnalytics.analytics.results.market1x2.aiLabel")}
              </h3>
              <span className="match-1x2-model__type match-1x2-model__type--ai">
                XGBoost
              </span>
            </header>
            {renderChart(datosResultado.resultado1X2Ai)}
            {renderWinner(
              datosResultado.ganadorAi,
              t("matchAnalytics.analytics.results.market1x2.descAi"),
            )}
          </section>
        )}
      </div>
    </div>
  );
}
