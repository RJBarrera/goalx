// sections/MatchCorners.jsx
import { useTranslation } from "react-i18next";
import { ProbabilityBar, SectionHeader } from "./utils";

const AI_FIRST_HALF_FACTOR = 0.47;
const BAR_ACCENTS = { home: "green", away: "cyan", neutral: "slate" };

const MATCH_MARKETS = [
  { labelKey: "over95", marketKey: "Over 9.5", accent: "green" },
  { labelKey: "under95", marketKey: "Under 9.5", accent: "slate" },
  { labelKey: "over45H1", marketKey: "Over 4.5 1H", accent: "green" },
  { labelKey: "under45H1", marketKey: "Under 4.5 1H", accent: "slate" },
];

const TEAM_MARKETS = {
  home: [
    { labelKey: "homeOver45", marketKey: "Home_Over_4.5", accent: "home" },
    { labelKey: "homeUnder45", marketKey: "Home_Under_4.5", accent: "neutral" },
    { labelKey: "homeOver55", marketKey: "Home_Over_5.5", accent: "home" },
    { labelKey: "homeUnder55", marketKey: "Home_Under_5.5", accent: "neutral" },
  ],
  away: [
    { labelKey: "awayOver35", marketKey: "Away_Over_3.5", accent: "away" },
    { labelKey: "awayUnder35", marketKey: "Away_Under_3.5", accent: "neutral" },
    { labelKey: "awayOver45", marketKey: "Away_Over_4.5", accent: "away" },
    { labelKey: "awayUnder45", marketKey: "Away_Under_4.5", accent: "neutral" },
  ],
};

function ProbabilitySet({ title, data, markets, t }) {
  return (
    <div className="match-corners__market-card">
      <h4>{title}</h4>
      {markets.map(({ labelKey, marketKey, accent }) => (
        <ProbabilityBar
          key={marketKey}
          label={t(`matchAnalytics.analytics.results.corners.${labelKey}`)}
          value={data?.[marketKey]}
          accent={BAR_ACCENTS[accent] || accent}
        />
      ))}
    </div>
  );
}

export default function MatchCorners({ resultado, datosResultado, numero }) {
  const { t } = useTranslation();
  const corners = datosResultado?.corners;
  const aiCorners = corners?.xgboost;
  const hasAi = Boolean(aiCorners);
  const totalClassic = Number(corners?.expected_total) || 0;
  const totalAi = Number(aiCorners?.expected_total) || 0;

  if (!resultado || !corners || (totalClassic <= 0 && totalAi <= 0)) {
    return null;
  }

  const rows = [
    {
      key: "total",
      label: t("matchAnalytics.analytics.results.corners.title"),
      classic: corners.expected_total,
      ai: aiCorners?.expected_total,
    },
    {
      key: "first-half",
      label: t("matchAnalytics.analytics.results.corners.firstHalf"),
      classic: corners.expected_1H,
      // The AI payload does not include a first-half estimate; keep the existing approximation.
      ai: aiCorners
        ? Number(aiCorners.expected_total) * AI_FIRST_HALF_FACTOR
        : undefined,
    },
    {
      label: resultado.partido.local,
      classic: corners.expected_home,
      ai: aiCorners?.expected_home,
      variant: "home",
    },
    {
      label: resultado.partido.visitante,
      classic: corners.expected_away,
      ai: aiCorners?.expected_away,
      variant: "away",
    },
  ];

  return (
    <div className="match-corners">
      <section className="match-panel match-corners__comparison">
        <div className="match-corners__table-wrap">
          <table
            className="match-corners__table"
            aria-label={t("matchAnalytics.analytics.results.corners.title")}
          >
            <thead>
              <tr>
                <th scope="col">
                  {t("matchAnalytics.analytics.results.corners.metricHeader")}
                </th>
                <th scope="col">
                  {t(
                    "matchAnalytics.analytics.results.corners.marketTeam.classicTitle",
                  )}
                </th>
                {hasAi && (
                  <th scope="col">
                    {t(
                      "matchAnalytics.analytics.results.corners.marketTeam.aiTitle",
                    )}
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.key || row.label}
                  className={
                    `match-corners__row${row.variant ? ` match-corners__row--${row.variant}` : ""}${row.key ? ` match-corners__row--${row.key}` : ""}`
                  }
                >
                  <th scope="row">{row.label}</th>
                  <td
                    className={
                      row.variant ? `match-corners__value--${row.variant}` : ""
                    }
                  >
                    {row.classic == null ? "—" : numero(row.classic, 1)}
                  </td>
                  {hasAi && (
                    <td
                      className={
                        row.variant ? `match-corners__value--${row.variant}` : ""
                      }
                    >
                      {row.ai == null ? "—" : numero(row.ai, 1)}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <details className="match-corners__disclosure">
        <summary className="match-corners__disclosure-heading">
          {t("matchAnalytics.analytics.results.corners.marketsDisclosure")}
        </summary>

        <div className="match-corners__details">
          <section className="match-corners__market-section">
            <h3>
              {t("matchAnalytics.analytics.results.corners.matchMarketsTitle")}
            </h3>
            <div className="match-corners__model-grid">
              <ProbabilitySet
                title={t(
                  "matchAnalytics.analytics.results.corners.marketTeam.classicTitle",
                )}
                data={corners}
                markets={MATCH_MARKETS}
                t={t}
              />
              {hasAi && (
                <ProbabilitySet
                  title={t(
                    "matchAnalytics.analytics.results.corners.marketTeam.aiTitle",
                  )}
                  data={aiCorners}
                  markets={MATCH_MARKETS}
                  t={t}
                />
              )}
            </div>
          </section>

          <section className="match-corners__market-section">
            <SectionHeader
              code="TM"
              eyebrow={t(
                "matchAnalytics.analytics.results.corners.marketTeam.eyebrow",
              )}
              title={t(
                "matchAnalytics.analytics.results.corners.marketTeam.title",
              )}
              description={t(
                "matchAnalytics.analytics.results.corners.marketTeam.description",
              )}
            />

            <div className="match-corners__teams">
              {[
                {
                  key: "home",
                  label: t("matchAnalytics.analytics.results.fixture.localLabel"),
                  name: resultado.partido.local,
                  markets: TEAM_MARKETS.home,
                },
                {
                  key: "away",
                  label: t(
                    "matchAnalytics.analytics.results.fixture.visitorLabel",
                  ),
                  name: resultado.partido.visitante,
                  markets: TEAM_MARKETS.away,
                },
              ].map((team) => (
                <section
                  className={`match-corners__team match-corners__team--${team.key}`}
                  key={team.key}
                >
                  <div className="match-corners__team-heading">
                    <span>{team.label}</span>
                    <h4>{team.name}</h4>
                  </div>
                  <div className="match-corners__model-grid">
                    <ProbabilitySet
                      title={t(
                        "matchAnalytics.analytics.results.corners.marketTeam.statisticSub",
                      )}
                      data={corners}
                      markets={team.markets}
                      t={t}
                    />
                    {hasAi && (
                      <ProbabilitySet
                        title={t(
                          "matchAnalytics.analytics.results.corners.marketTeam.xgboostSub",
                        )}
                        data={aiCorners}
                        markets={team.markets}
                        t={t}
                      />
                    )}
                  </div>
                </section>
              ))}
            </div>
          </section>
        </div>
      </details>
    </div>
  );
}
