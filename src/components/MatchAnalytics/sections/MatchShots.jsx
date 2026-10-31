// sections/MatchShots.jsx
import { useState } from "react";
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
import { ProbabilityBar } from "./utils";
const COLORS = {
  home: "var(--color-team-home, #2e7d32)",
  away: "var(--color-team-away, #007a87)",
};

function factorial(n) {
  return n <= 1 ? 1 : n * factorial(n - 1);
}

function poissonPMF(k, lambda) {
  if (lambda <= 0) return k === 0 ? 1 : 0;
  return (Math.pow(lambda, k) * Math.exp(-lambda)) / factorial(k);
}

function poissonOverUnder(lambda, linea) {
  const k = Math.floor(linea);
  let acumulado = 0;
  for (let i = 0; i <= k; i++) acumulado += poissonPMF(i, lambda);
  return { under: acumulado, over: 1 - acumulado };
}

function DistribucionTiros({ titulo, datos, variant }) {
  const { t } = useTranslation();
  if (!datos?.mercados_over) return null;

  const entradas = Object.entries(datos.mercados_over);

  return (
    <div
      className={`match-team-market-card match-shots__distribution match-shots__distribution--${variant}`}
    >
      <div className="match-team-market-card__heading">
        <span>{titulo}</span>
      </div>
      {entradas.map(([clave, prob]) => {
        const linea = clave.replace("over_", "");
        return (
          <ProbabilityBar
            key={clave}
            label={t("matchAnalytics.analytics.results.shots.moreThanShots", {
              line: linea,
            })}
            value={prob / 100}
            accent={variant === "home" ? "green" : "cyan"}
          />
        );
      })}
    </div>
  );
}

export default function MatchShots({ resultado, numero }) {
  const { t } = useTranslation();

  const [equipoLinea, setEquipoLinea] = useState("local");
  const [tipoLinea, setTipoLinea] = useState("sot");
  const [lineaValor, setLineaValor] = useState(2.5);
  const tiros = resultado?.tiros;
  if (!resultado || !tiros) return null;

  const { sot, total } = tiros;

  // Suma de verificación
  const sumaEsperada =
    (Number(sot?.local?.valor_esperado) || 0) +
    (Number(sot?.visitante?.valor_esperado) || 0) +
    (Number(total?.local?.valor_esperado) || 0) +
    (Number(total?.visitante?.valor_esperado) || 0);

  // Si no hay datos suficientes, no renderiza nada
  if (sumaEsperada <= 0.4) {
    return null;
  }

  const chartData = [
    {
      category: t("matchAnalytics.analytics.results.shots.sontHeader"),
      local: sot?.local?.valor_esperado ?? 0,
      visitante: sot?.visitante?.valor_esperado ?? 0,
    },
    {
      category: t("matchAnalytics.analytics.results.shots.totalShotsHeader"),
      local: total?.local?.valor_esperado ?? 0,
      visitante: total?.visitante?.valor_esperado ?? 0,
    },
  ];

  const bloqueSeleccionado = tipoLinea === "sot" ? sot : total;
  const valorEsperadoSeleccionado =
    equipoLinea === "local"
      ? (bloqueSeleccionado?.local?.valor_esperado ?? 0)
      : (bloqueSeleccionado?.visitante?.valor_esperado ?? 0);
  const probabilidadLinea = poissonOverUnder(
    valorEsperadoSeleccionado,
    Number(lineaValor) || 0,
  );

  return (
    <>
      <section className="match-panel match-shots__panel">
        <div className="match-panel-title match-shots__heading">
          <div>
            <span>{t("matchAnalytics.analytics.results.shots.title")}</span>
          </div>
        </div>

        <div className="match-shots__overview">
          <table
            className="match-shots__comparison"
            aria-label={t("matchAnalytics.analytics.results.shots.title")}
          >
            <thead>
              <tr>
                <th scope="col">
                  {t("matchAnalytics.analytics.results.shots.shotTypeLabel")}
                </th>
                <th scope="col" className="match-shots__team--home">
                  {resultado.partido.local}
                </th>
                <th scope="col" className="match-shots__team--away">
                  {resultado.partido.visitante}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">
                  {t("matchAnalytics.analytics.results.shots.sontHeader")}
                </th>
                <td className="match-shots__value--home">
                  {numero(sot?.local?.valor_esperado, 1)}
                </td>
                <td className="match-shots__value--away">
                  {numero(sot?.visitante?.valor_esperado, 1)}
                </td>
              </tr>
              <tr>
                <th scope="row">
                  {t("matchAnalytics.analytics.results.shots.totalShotsHeader")}
                </th>
                <td className="match-shots__value--home">
                  {numero(total?.local?.valor_esperado, 1)}
                </td>
                <td className="match-shots__value--away">
                  {numero(total?.visitante?.valor_esperado, 1)}
                </td>
              </tr>
            </tbody>
          </table>

          <div className="match-shots__chart">
            <div className="match-shots__legend">
              <span className="match-shots__legend-item match-shots__legend-item--home">
                {resultado.partido.local}
              </span>
              <span className="match-shots__legend-item match-shots__legend-item--away">
                {resultado.partido.visitante}
              </span>
            </div>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 4, right: 8, left: -18, bottom: 0 }}
                barGap={5}
              >
                <CartesianGrid
                  strokeDasharray="4 4"
                  vertical={false}
                  stroke="#e7ebf2"
                />
                <XAxis
                  dataKey="category"
                  axisLine={false}
                  tickLine={false}
                  interval={0}
                  tick={{ fill: "#6e6e73", fontSize: 9 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#86868b", fontSize: 10 }}
                />
                <Tooltip />
                <Bar
                  dataKey="local"
                  name={resultado.partido.local}
                  fill={COLORS.home}
                  radius={[4, 4, 0, 0]}
                  maxBarSize={36}
                />
                <Bar
                  dataKey="visitante"
                  name={resultado.partido.visitante}
                  fill={COLORS.away}
                  radius={[4, 4, 0, 0]}
                  maxBarSize={36}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <details className="match-shots__disclosure match-shots__markets">
          <summary className="match-shots__disclosure-heading">
            <span>
              {t("matchAnalytics.analytics.results.shots.lineMarketsHeader")}
            </span>
          </summary>
          <div className="match-shots__market-categories">
            <section className="match-shots__market-category">
              <h4>{t("matchAnalytics.analytics.results.shots.sontHeader")}</h4>
              <div className="match-shots__distributions">
                <DistribucionTiros
                  titulo={resultado.partido.local}
                  datos={sot?.local}
                  variant="home"
                />
                <DistribucionTiros
                  titulo={resultado.partido.visitante}
                  datos={sot?.visitante}
                  variant="away"
                />
              </div>
            </section>
            <section className="match-shots__market-category">
              <h4>
                {t("matchAnalytics.analytics.results.shots.totalShotsHeader")}
              </h4>
              <div className="match-shots__distributions">
                <DistribucionTiros
                  titulo={resultado.partido.local}
                  datos={total?.local}
                  variant="home"
                />
                <DistribucionTiros
                  titulo={resultado.partido.visitante}
                  datos={total?.visitante}
                  variant="away"
                />
              </div>
            </section>
          </div>
        </details>
      </section>

      {/* SIMULADOR DE LÍNEA PERSONALIZADA */}
      <details className="match-panel match-shots__simulator">
        <summary className="match-panel-title match-shots__disclosure-heading match-shots__simulator-heading">
          <span className="match-shots__simulator-title">
            <span>
              {t("matchAnalytics.analytics.results.shots.lineSimulatorHeader")}
            </span>
            <small>
              {t(
                "matchAnalytics.analytics.results.shots.lineSimulatorSubtitle",
              )}
            </small>
          </span>
        </summary>

        <div className="match-shot-simulator-grid">
          {/* EQUIPO */}
          <div className="match-shot-field">
            <span>{t("matchAnalytics.analytics.results.shots.teamLabel")}</span>
            <div className="match-shot-toggle-group">
              <button
                type="button"
                className={`match-shot-toggle ${equipoLinea === "local" ? "is-active" : ""}`}
                onClick={() => setEquipoLinea("local")}
              >
                {resultado.partido.local}
              </button>
              <button
                type="button"
                className={`match-shot-toggle ${equipoLinea === "visitante" ? "is-active is-active--away" : ""}`}
                onClick={() => setEquipoLinea("visitante")}
              >
                {resultado.partido.visitante}
              </button>
            </div>
          </div>

          {/* TIPO DE TIRO */}
          <div className="match-shot-field">
            <span>
              {t("matchAnalytics.analytics.results.shots.shotTypeLabel")}
            </span>
            <div
              className={`match-shot-toggle-group ${equipoLinea === "visitante" ? "is-away" : ""}`}
            >
              <button
                type="button"
                className={`match-shot-toggle ${tipoLinea === "sot" ? "is-active" : ""}`}
                onClick={() => setTipoLinea("sot")}
              >
                {t("matchAnalytics.analytics.results.shots.onTargetLabel")}
              </button>
              <button
                type="button"
                className={`match-shot-toggle ${tipoLinea === "total" ? "is-active" : ""}`}
                onClick={() => setTipoLinea("total")}
              >
                {t("matchAnalytics.analytics.results.shots.totalLabel")}
              </button>
            </div>
          </div>

          {/* LÍNEA (STEPPER) */}
          <div className="match-shot-field">
            <span>{t("matchAnalytics.analytics.results.shots.lineLabel")}</span>
            <div
              className={`match-shot-stepper ${equipoLinea === "visitante" ? "is-away" : ""}`}
            >
              <button
                type="button"
                onClick={() => {
                  // Aseguramos que reste 1 desde una base limpia terminada en .5
                  setLineaValor((v) => {
                    const current = Math.round(Number(v || 0) - 0.5) + 0.5;
                    return Math.max(0.5, current - 1);
                  });
                }}
                disabled={Number(lineaValor) <= 0.5}
                title={t(
                  "matchAnalytics.analytics.results.shots.decrementButton",
                )}
              >
                -
              </button>

              <div className="match-shot-stepper__value">
                <input
                  type="text"
                  inputMode="decimal"
                  className="match-shot-stepper__input-editable"
                  value={lineaValor}
                  onChange={(e) => {
                    const val = e.target.value;
                    // Permite escribir números y puntos libremente
                    if (val === "" || /^\d*\.?\d*$/.test(val)) {
                      setLineaValor(val);
                    }
                  }}
                  onBlur={() => {
                    // Limpiamos cualquier número entero y lo convertimos al formato .5
                    const num = parseFloat(lineaValor);
                    if (isNaN(num) || num < 0.5) {
                      setLineaValor(0.5);
                    } else {
                      // Redondea al .5 más cercano
                      const normalized = Math.round(num - 0.5) + 0.5;
                      setLineaValor(normalized);
                    }
                  }}
                />
              </div>

              <button
                type="button"
                onClick={() => {
                  // Aseguramos que sume 1 desde una base limpia terminada en .5
                  setLineaValor((v) => {
                    const current = Math.round(Number(v || 0) - 0.5) + 0.5;
                    return current + 1;
                  });
                }}
                title={t(
                  "matchAnalytics.analytics.results.shots.incrementButton",
                )}
              >
                +
              </button>
            </div>
          </div>
        </div>

        <div
          className={`match-shot-result ${equipoLinea === "visitante" ? "match-shot-result--away" : ""}`}
        >
          <div className="match-shot-result__icon">🎯</div>
          <div className="match-shot-result__content">
            <span>
              {t("matchAnalytics.analytics.results.shots.estimatedProbability")}
            </span>
            <p>
              {t(
                "matchAnalytics.analytics.results.shots.predictionResultFormat",
                {
                  team:
                    equipoLinea === "local"
                      ? resultado.partido.local
                      : resultado.partido.visitante,
                  line: Number(lineaValor).toFixed(1),
                  shotType:
                    tipoLinea === "sot"
                      ? t("matchAnalytics.analytics.results.shots.shotTypeSot")
                      : t(
                          "matchAnalytics.analytics.results.shots.shotTypeTotal",
                        ),
                },
              )}
            </p>
            <small>
              {t("matchAnalytics.analytics.results.shots.expectedValueAi")}{" "}
              {numero(valorEsperadoSeleccionado, 2)}
            </small>
          </div>
          <strong>{(probabilidadLinea.over * 100).toFixed(1)}%</strong>
        </div>
      </details>
    </>
  );
}
