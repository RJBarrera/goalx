// sections/Match1x2.jsx
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
import { CustomTooltip, SectionHeader } from "./utils";

export default function Match1x2({ datosResultado }) {
  const { t } = useTranslation();

  // Si los datos aún no existen, no renderizamos nada
  if (!datosResultado) return null;

  return (
    <>
      <SectionHeader
        code="1X2"
        eyebrow={t("matchAnalytics.analytics.results.market1x2.eyebrow")}
        title={t("matchAnalytics.analytics.results.market1x2.title")}
        description={t(
          "matchAnalytics.analytics.results.market1x2.description",
        )}
      />

      {/* MODELO CLASICO */}
      <div>
        <span className="match-team-label">
          {t("matchAnalytics.analytics.results.market1x2.classicLabel")}
        </span>
      </div>

      <div className="match-result-layout" style={{ marginBottom: "3rem" }}>
        <div className="match-chart-card">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart
              data={datosResultado.resultado1X2}
              layout="vertical"
              margin={{ top: 10, right: 30, bottom: 10, left: 20 }}
            >
              <CartesianGrid
                strokeDasharray="4 4"
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
                width={120}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="value"
                name={t(
                  "matchAnalytics.analytics.results.market1x2.probabilityName",
                )}
                radius={[0, 8, 8, 0]}
                barSize={28}
              >
                {datosResultado.resultado1X2.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <aside className="match-insight-card">
          <div className="match-insight-card__label">
            {t("matchAnalytics.analytics.results.market1x2.dominantScenario")}
          </div>
          <strong>{datosResultado.ganador.value.toFixed(1)}%</strong>
          <h3>{datosResultado.ganador.name}</h3>
          <div className="match-insight-divider" />
          <p>
            {t(
              "matchAnalytics.analytics.results.market1x2.dominantDescription",
            )}
          </p>
        </aside>
      </div>

      {/* MODELO IA (XGBOOST)*/}
      {datosResultado.resultado1X2Ai &&
        datosResultado.resultado1X2Ai[0].value > 0 && (
          <>
            <div style={{ marginBottom: "1rem" }}>
              <span className="match-team-label">
                {t("matchAnalytics.analytics.results.market1x2.aiLabel")}
              </span>
            </div>

            <div className="match-result-layout">
              <div className="match-chart-card">
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart
                    data={datosResultado.resultado1X2Ai}
                    layout="vertical"
                    margin={{ top: 10, right: 30, bottom: 10, left: 20 }}
                  >
                    <CartesianGrid
                      strokeDasharray="4 4"
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
                      width={120}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar
                      dataKey="value"
                      name={t(
                        "matchAnalytics.analytics.results.market1x2.probabilityName",
                      )}
                      radius={[0, 8, 8, 0]}
                      barSize={28}
                    >
                      {datosResultado.resultado1X2Ai.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <aside className="match-insight-card-ai">
                <div className="match-insight-card-ai__label">
                  {t("matchAnalytics.analytics.results.market1x2.trendAi")}
                </div>
                <strong>{datosResultado.ganadorAi.value.toFixed(1)}%</strong>
                <h3>{datosResultado.ganadorAi.name}</h3>
                <div className="match-insight-divider-ai" />
                <p>{t("matchAnalytics.analytics.results.market1x2.descAi")}</p>
              </aside>
            </div>
          </>
        )}
    </>
  );
}
