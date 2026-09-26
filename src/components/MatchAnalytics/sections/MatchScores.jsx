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
import { CustomTooltip } from "./utils";

const COLORS = {
  local: "#21cfa1",
  draw: "#94a3b8",
  away: "#38bdf8",
  positive: "#22c55e",
  negative: "#dce3eb",
  corner: "#f59e0b",
  card: "#eab308",
};

export default function MatchScores({ resultado, datosResultado }) {
  const { t } = useTranslation();

  // Si los datos aún no existen, no renderizamos nada
  if (!resultado || !datosResultado?.goles) return null;

  return (
    <div className="match-two-columns">
      {/* MARCADOR CLASICO (POISSON) */}
      <div className="match-panel match-panel--scores">
        <div className="match-panel-title">
          <div>
            <span>{t("matchAnalytics.analytics.results.scores.tag")}</span>
            <h3>
              {t("matchAnalytics.analytics.results.scores.topResultsTitle")}
            </h3>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={datosResultado.topMarcadores}>
            <CartesianGrid
              strokeDasharray="4 4"
              vertical={false}
              stroke="#e7ebf2"
            />
            <XAxis dataKey="marcador" axisLine={false} tickLine={false} />
            <YAxis
              axisLine={false}
              tickLine={false}
              tickFormatter={(value) => `${value}%`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="probabilidad"
              name={t(
                "matchAnalytics.analytics.results.scores.probabilityName",
              )}
              fill={COLORS.local}
              radius={[8, 8, 0, 0]}
              barSize={48}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* MARCADOR EXACTO IA */}
      {datosResultado.topMarcadoresAi &&
        datosResultado.topMarcadoresAi.length > 0 && (
          <div className="match-panel match-panel--scores">
            <div className="match-panel-title">
              <div>
                <span>
                  {t("matchAnalytics.analytics.results.scores.tagAi")}
                </span>
                <h3>
                  {t(
                    "matchAnalytics.analytics.results.scores.topResultsTitleAi",
                  )}
                </h3>
              </div>
            </div>

            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={datosResultado.topMarcadoresAi}>
                <CartesianGrid
                  strokeDasharray="4 4"
                  vertical={false}
                  stroke="#e7ebf2"
                />
                <XAxis dataKey="marcador" axisLine={false} tickLine={false} />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="probabilidad"
                  name={t(
                    "matchAnalytics.analytics.results.scores.probabilityName",
                  )}
                  fill={COLORS.away}
                  radius={[8, 8, 0, 0]}
                  barSize={48}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
    </div>
  );
}
