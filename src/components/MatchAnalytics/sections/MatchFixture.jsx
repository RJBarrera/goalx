// sections/MatchFixture.jsx
import { useTranslation } from "react-i18next";

// Iniciales del equipo cuando no hay logo
const obtenerInicialesEquipo = (nombre = "") => {
  const texto = String(nombre).trim();

  if (!texto) {
    return "?";
  }

  const palabras = texto
    .replace(/[.-]/g, " ")
    .split(/\s+/)
    .map((item) => item.trim())
    .filter(Boolean);

  if (palabras.length === 1) {
    return palabras[0].slice(0, 2).toUpperCase();
  }

  return `${palabras[0]?.[0] || ""}${palabras[1]?.[0] || ""}`.toUpperCase();
};

export default function MatchFixture({ resultado, logoLocal, logoVisitante }) {
  const { t } = useTranslation();

  // Si los datos aún no existen, no renderizamos nada
  if (!resultado) return null;

  return (
    <>
      <div className="match-fixture-card__topline">
        <span>{t("matchAnalytics.analytics.results.fixture.kicker")}</span>

        <div>
          <span className="match-live-dot" />{" "}
          {t("matchAnalytics.analytics.results.fixture.processed")}
        </div>
      </div>

      <div className="match-fixture-card__main">
        {/* LOCAL */}
        <div className="match-team">
          <span className="match-team-label">
            {t("matchAnalytics.analytics.results.fixture.localLabel")}
          </span>

          <div className="match-team-emblem">
            {logoLocal ? (
              <img
                src={logoLocal}
                alt={resultado.partido.local}
                className="match-team-emblem-image"
              />
            ) : (
              <span className="match-team-emblem-fallback">
                {obtenerInicialesEquipo(resultado.partido.local)}
              </span>
            )}
          </div>

          <h2>{resultado.partido.local}</h2>
        </div>

        {/* CENTRO */}
        <div className="match-fixture-center">
          <span>
            {t("matchAnalytics.analytics.results.fixture.predictionLabel")}
          </span>

          <strong>{t("matchAnalytics.analytics.results.fixture.vs")}</strong>

          <div className="match-fixture-referee">
            <span>
              {t("matchAnalytics.analytics.results.fixture.refereeLabel")}
            </span>

            <b>
              {resultado.partido?.arbitro?.toLowerCase() === "desconocido"
                ? t("matchAnalytics.analytics.results.fixture.unknownReferee")
                : resultado.partido.arbitro}
            </b>
          </div>
        </div>

        {/* VISITANTE */}
        <div className="match-team">
          <span className="match-team-label">
            {t("matchAnalytics.analytics.results.fixture.visitorLabel")}
          </span>

          <div className="match-team-emblem match-team-emblem--away">
            {logoVisitante ? (
              <img
                src={logoVisitante}
                alt={resultado.partido.visitante}
                className="match-team-emblem-image"
              />
            ) : (
              <span className="match-team-emblem-fallback">
                {obtenerInicialesEquipo(resultado.partido.visitante)}
              </span>
            )}
          </div>

          <h2>{resultado.partido.visitante}</h2>
        </div>
      </div>
    </>
  );
}
