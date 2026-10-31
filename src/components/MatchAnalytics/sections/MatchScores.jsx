// sections/MatchScores.jsx
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

const SCORE_COLORS = {
  classic: "var(--color-team-home, #2e7d32)",
  ai: "var(--color-team-away, #007a87)",
};

function ScoreComparisonTooltip({ active, payload, label }) {
  if (!active || !payload?.length) {
    return null;
  }

  const availableScores = payload.filter(
    (item) => item.value !== null && item.value !== undefined,
  );

  if (!availableScores.length) {
    return null;
  }

  return (
    <div className="match-chart-tooltip">
      {label && <div className="match-chart-tooltip-label">{label}</div>}
      {availableScores.map((item) => (
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

export default function MatchScores({ resultado, datosResultado }) {
  const { t } = useTranslation();

  if (!resultado || !datosResultado?.goles) return null;

  const classicScores = datosResultado.topMarcadores || [];
  const aiScores = datosResultado.topMarcadoresAi || [];
  const hasClassicScores = classicScores.length > 0;
  const hasAiScores = aiScores.length > 0;
  if (!hasClassicScores && !hasAiScores) return null;

  const scoresByName = new Map();

  classicScores.forEach(({ marcador, probabilidad }) => {
    const score = String(marcador);
    scoresByName.set(score, {
      ...scoresByName.get(score),
      marcador: score,
      classic: probabilidad,
    });
  });

  aiScores.forEach(({ marcador, probabilidad }) => {
    const score = String(marcador);
    scoresByName.set(score, {
      ...scoresByName.get(score),
      marcador: score,
      ai: probabilidad,
    });
  });

  const comparisonData = [...scoresByName.values()]
    .map((score) => ({
      ...score,
      classic: score.classic ?? null,
      ai: score.ai ?? null,
    }))
    .sort(
      (a, b) =>
        Math.max(b.classic ?? 0, b.ai ?? 0) -
        Math.max(a.classic ?? 0, a.ai ?? 0),
    );
  const chartHeight = Math.max(260, comparisonData.length * 38 + 68);
  const scoreBars = (
    <>
      {hasClassicScores && (
        <Bar
          dataKey="classic"
          name={t("matchAnalytics.analytics.results.scores.classicModel")}
          fill={SCORE_COLORS.classic}
          radius={[4, 4, 0, 0]}
          maxBarSize={28}
        />
      )}
      {hasAiScores && (
        <Bar
          dataKey="ai"
          name={t("matchAnalytics.analytics.results.scores.aiModel")}
          fill={SCORE_COLORS.ai}
          radius={[4, 4, 0, 0]}
          maxBarSize={28}
        />
      )}
    </>
  );

  return (
    <section className="match-panel match-panel--scores match-scores__panel">
      <header className="match-scores__comparison-heading">
        <h3>
          {t("matchAnalytics.analytics.results.scores.comparisonTitle")}
        </h3>
        <div className="match-scores__legend" role="list">
          {hasClassicScores && (
            <span
              className="match-scores__legend-item match-scores__legend-item--classic"
              role="listitem"
            >
              {t("matchAnalytics.analytics.results.scores.classicModel")}
            </span>
          )}
          {hasAiScores && (
            <span
              className="match-scores__legend-item match-scores__legend-item--ai"
              role="listitem"
            >
              {t("matchAnalytics.analytics.results.scores.aiModel")}
            </span>
          )}
        </div>
      </header>

      <p className="match-scores__note">
        {t("matchAnalytics.analytics.results.scores.comparisonNote")}
      </p>

      <div className="match-scores__chart match-scores__chart--desktop">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={comparisonData}
            margin={{ top: 12, right: 12, bottom: 0, left: 0 }}
            barCategoryGap="24%"
            barGap={5}
          >
            <CartesianGrid
              strokeDasharray="3 5"
              vertical={false}
              stroke="#e8ebef"
            />
            <XAxis
              dataKey="marcador"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#6e6e73", fontSize: 11 }}
              tickMargin={10}
            />
            <YAxis
              width={42}
              axisLine={false}
              tickLine={false}
              tickFormatter={(value) => `${value}%`}
              tick={{ fill: "#86868b", fontSize: 10 }}
              tickMargin={8}
            />
            <Tooltip content={<ScoreComparisonTooltip />} />
            {scoreBars}
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div
        className="match-scores__chart match-scores__chart--mobile"
        style={{ height: chartHeight }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={comparisonData}
            layout="vertical"
            margin={{ top: 8, right: 12, bottom: 4, left: 0 }}
            barCategoryGap="24%"
            barGap={4}
          >
            <CartesianGrid
              strokeDasharray="3 5"
              horizontal={false}
              stroke="#e8ebef"
            />
            <XAxis
              type="number"
              domain={[0, "auto"]}
              tickFormatter={(value) => `${value}%`}
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#86868b", fontSize: 10 }}
              tickMargin={8}
            />
            <YAxis
              dataKey="marcador"
              type="category"
              width={56}
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#1d1d1f", fontSize: 12, fontWeight: 600 }}
            />
            <Tooltip content={<ScoreComparisonTooltip />} />
            {hasClassicScores && (
              <Bar
                dataKey="classic"
                name={t(
                  "matchAnalytics.analytics.results.scores.classicModel",
                )}
                fill={SCORE_COLORS.classic}
                radius={[0, 4, 4, 0]}
                maxBarSize={13}
              />
            )}
            {hasAiScores && (
              <Bar
                dataKey="ai"
                name={t("matchAnalytics.analytics.results.scores.aiModel")}
                fill={SCORE_COLORS.ai}
                radius={[0, 4, 4, 0]}
                maxBarSize={13}
              />
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
