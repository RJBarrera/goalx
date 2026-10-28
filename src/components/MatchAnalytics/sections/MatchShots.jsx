// sections/MatchShots.jsx
import { useMemo, useState } from "react";
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
import { MetricCard, ProbabilityBar } from "./utils";
const COLORS = { home: "#37e3a6", away: "#38bdf8" };

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

function DistribucionTiros({ titulo, datos }) {
  const { t } = useTranslation();
  if (!datos?.mercados_over) return null;

  const entradas = Object.entries(datos.mercados_over);

  return (
    <div className="match-team-market-card">
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
            accent="cyan"
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

  const chartSot = [
    {
      name: resultado.partido.local,
      esperado: sot?.local?.valor_esperado ?? 0,
    },
    {
      name: resultado.partido.visitante,
      esperado: sot?.visitante?.valor_esperado ?? 0,
    },
  ];

  const chartTotal = [
    {
      name: resultado.partido.local,
      esperado: total?.local?.valor_esperado ?? 0,
    },
    {
      name: resultado.partido.visitante,
      esperado: total?.visitante?.valor_esperado ?? 0,
    },
  ];

  const valorEsperadoSeleccionado = useMemo(() => {
    const bloque = tipoLinea === "sot" ? sot : total;
    if (!bloque) return 0;
    return equipoLinea === "local"
      ? (bloque.local?.valor_esperado ?? 0)
      : (bloque.visitante?.valor_esperado ?? 0);
  }, [equipoLinea, tipoLinea, sot, total]);

  const probabilidadLinea = useMemo(
    () => poissonOverUnder(valorEsperadoSeleccionado, Number(lineaValor) || 0),
    [valorEsperadoSeleccionado, lineaValor],
  );

  return (
    <>
      <div className="match-two-columns">
        {/* TIROS A PUERTA */}
        <div className="match-panel">
          <div className="match-panel-title">
            <div>
              <span>
                {t("matchAnalytics.analytics.results.shots.sontHeader")}
              </span>
            </div>
          </div>

          <div className="match-metrics-grid">
            <MetricCard
              label={resultado.partido.local}
              value={numero(sot?.local?.valor_esperado, 1)}
              description={t(
                "matchAnalytics.analytics.results.shots.sontDescription",
              )}
              variant="local"
            />
            <MetricCard
              label={resultado.partido.visitante}
              value={numero(sot?.visitante?.valor_esperado, 1)}
              description={t(
                "matchAnalytics.analytics.results.shots.sontDescription",
              )}
              variant="away"
            />
          </div>

          <div style={{ height: "180px", margin: "1.5rem 0" }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartSot}>
                <CartesianGrid
                  strokeDasharray="4 4"
                  vertical={false}
                  stroke="#e7ebf2"
                />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip />
                <Bar
                  dataKey="esperado"
                  name={t(
                    "matchAnalytics.analytics.results.shots.expectedBarName",
                  )}
                  fill={COLORS.home}
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="match-two-columns">
            <DistribucionTiros
              titulo={resultado.partido.local}
              datos={sot?.local}
            />
            <DistribucionTiros
              titulo={resultado.partido.visitante}
              datos={sot?.visitante}
            />
          </div>
        </div>

        {/* TIROS TOTALES */}
        <div className="match-panel">
          <div className="match-panel-title">
            <div>
              <span>
                {t("matchAnalytics.analytics.results.shots.totalShotsHeader")}
              </span>
            </div>
          </div>

          <div className="match-metrics-grid">
            <MetricCard
              label={resultado.partido.local}
              value={numero(total?.local?.valor_esperado, 1)}
              description={t(
                "matchAnalytics.analytics.results.shots.totalShotsDescription",
              )}
              variant="local"
            />
            <MetricCard
              label={resultado.partido.visitante}
              value={numero(total?.visitante?.valor_esperado, 1)}
              description={t(
                "matchAnalytics.analytics.results.shots.totalShotsDescription",
              )}
              variant="away"
            />
          </div>

          <div style={{ height: "180px", margin: "1.5rem 0" }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartTotal}>
                <CartesianGrid
                  strokeDasharray="4 4"
                  vertical={false}
                  stroke="#e7ebf2"
                />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip />
                <Bar
                  dataKey="esperado"
                  name={t(
                    "matchAnalytics.analytics.results.shots.expectedBarName",
                  )}
                  fill={COLORS.away}
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="match-two-columns">
            <DistribucionTiros
              titulo={resultado.partido.local}
              datos={total?.local}
            />
            <DistribucionTiros
              titulo={resultado.partido.visitante}
              datos={total?.visitante}
            />
          </div>
        </div>
      </div>

      {/* SIMULADOR DE LÍNEA PERSONALIZADA */}
      <div className="match-panel" style={{ marginTop: "2rem" }}>
        <div className="match-panel-title match-panel-title--center">
          <div>
            <span>
              {t("matchAnalytics.analytics.results.shots.lineSimulatorHeader")}
            </span>
            <h3>
              {t(
                "matchAnalytics.analytics.results.shots.lineSimulatorSubtitle",
              )}
            </h3>
          </div>
        </div>

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
            <div className="match-shot-stepper">
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
      </div>
    </>
  );
}
