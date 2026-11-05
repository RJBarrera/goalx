import axios from "axios";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { useCompetition } from "../../context/CompetitionContext";
import { getTeamLogo } from "../../utils/teamLogos";
import "./LiveCenter.css";

const API_URL = "";
const NORMAL_REFRESH_SECONDS = 300;

// UTILIDADES Y TARJETAS
const formatMatchDate = (dateValue) => {
  if (!dateValue) {
    return "";
  }

  try {
    const date = new Date(`${dateValue}T12:00:00`);

    return new Intl.DateTimeFormat("es-MX", {
      weekday: "short",
      day: "2-digit",
      month: "short",
    }).format(date);
  } catch {
    return dateValue;
  }
};

// STATUS
function LiveStatus({ match }) {
  const status = match?.status?.short;
  const minute = match?.status?.elapsed;
  const live =
    match?.live_verified ||
    ["1H", "HT", "2H", "ET", "BT", "P", "INT", "SUSP", "LIVE"].includes(status);

  if (live) {
    return (
      <span className="live-status live-status--active">
        <span />
        {status === "HT" ? "DESCANSO" : minute ? `${minute}'` : "EN VIVO"}
      </span>
    );
  }

  if (["FT", "AET", "PEN"].includes(status)) {
    return <span className="live-status live-status--finished">FINAL</span>;
  }

  if (match?.live_candidate) {
    return (
      <span className="live-status live-status--standby">
        <span /> POR INICIAR
      </span>
    );
  }

  return (
    <span className="live-status live-status--scheduled">
      {match?.time_local || "NS"}
    </span>
  );
}

// ESCUDO
function TeamBadge({ team }) {
  const localLogo = getTeamLogo(team?.name);
  const logo = localLogo || team?.logo;

  return (
    <div className="live-team-badge">
      {logo ? (
        <img src={logo} alt={team?.name} />
      ) : (
        <span>
          {String(team?.name || "?")
            .trim()
            .slice(0, 2)
            .toUpperCase()}
        </span>
      )}
    </div>
  );
}

// MATCH CARD
function LiveMatchCard({ match, selected, onClick, competitionName }) {
  const live = match?.live_verified;

  const finished = ["FT", "AET", "PEN"].includes(match?.status?.short);

  return (
    <article
      className={[
        "live-match-card",
        selected ? "live-match-card--selected" : "",
        live ? "live-match-card--live" : "",
        finished ? "live-match-card--finished" : "",
      ].join(" ")}
      onClick={onClick}
    >
      <div className="live-match-card__top">
        <LiveStatus match={match} />
        <span>{match.league?.round}</span>
      </div>

      <div className="live-match-card__team">
        <TeamBadge team={match.home} />
        <strong>{match.home?.name}</strong>
      </div>

      <div className="live-match-card__team">
        <TeamBadge team={match.away} />
        <strong>{match.away?.name}</strong>
      </div>

      <div className="live-match-card__footer">
        <span>
          {match.date_local ? `${formatMatchDate(match.date_local)} · ` : ""}

          {match.venue?.name || competitionName || "Competición"}
        </span>
      </div>
    </article>
  );
}

// PRINCIPAL
function LiveCenter({ onSeleccionarPartido }) {
  const { t } = useTranslation();
  const { competition, competitionId } = useCompetition();
  const [scope, setScope] = useState("live");
  const [matches, setMatches] = useState([]);
  const [selectedScheduleMatch, setSelectedScheduleMatch] = useState(null);
  const [loadingMatches, setLoadingMatches] = useState(true);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(NORMAL_REFRESH_SECONDS);

  // Calendario desde TheSportsDB.
  const loadMatches = useCallback(
    async (silent = false) => {
      if (!silent) {
        setLoadingMatches(true);
      }

      try {
        const { data } = await axios.get(
          `${API_URL}/api/live`,

          {
            params: {
              scope,
              competition: competitionId,
            },
          },
        );

        if (!data?.success) {
          throw new Error("No fue posible cargar Live Center.");
        }

        const nextMatches = Array.isArray(data.matches) ? data.matches : [];
        setMatches(nextMatches);

        setCountdown(data.ui_refresh_seconds || NORMAL_REFRESH_SECONDS);

        setError("");
      } catch (requestError) {
        console.error(requestError);

        setError(
          "No pudimos actualizar el calendario. " +
            "TheSportsDB está tardando en responder. " +
            "Intenta nuevamente en unos minutos.",
        );
      } finally {
        setLoadingMatches(false);
      }
    },

    [scope, competitionId],
  );

  const seleccionarPartido = (match) => {
    if (!match) return;

    setSelectedScheduleMatch(match);
    setError("");
    onSeleccionarPartido?.({
      home: match.home?.name || "",
      away: match.away?.name || "",
    });
  };

  useEffect(() => {
    setMatches([]);
    setSelectedScheduleMatch(null);
    setError("");
    setCountdown(NORMAL_REFRESH_SECONDS);
  }, [competitionId]);

  useEffect(() => {
    if (!competitionId) {
      return undefined;
    }

    // Consulta inicial
    loadMatches();

    // Actualizaciones posteriores
    const interval = window.setInterval(() => {
      loadMatches(true);
    }, NORMAL_REFRESH_SECONDS * 1000);

    return () => {
      window.clearInterval(interval);
    };
  }, [loadMatches, competitionId]);

  // Contador visual de actualización

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCountdown((current) =>
        current <= 1 ? NORMAL_REFRESH_SECONDS : current - 1,
      );
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  const changeScope = (nextScope) => {
    setScope(nextScope);
    setSelectedScheduleMatch(null);
    setError("");
  };

  const sectionTitle = useMemo(() => {
    if (scope === "live") {
      return t("liveCenter.sectionTitles.live");
    }

    if (scope === "today") {
      return t("liveCenter.sectionTitles.today");
    }

    if (scope === "upcoming") {
      return t("liveCenter.sectionTitles.upcoming");
    }

    if (scope === "next") {
      const round = matches?.[0]?.league?.round;
      return round
        ? t("liveCenter.sectionTitles.nextWithRound", { round })
        : competition?.next_scope_label ||
            t("liveCenter.sectionTitles.nextFallback");
    }

    return t("liveCenter.sectionTitles.default");
  }, [scope, matches, competition?.next_scope_label, t]);

  const emptyState = useMemo(() => {
    const compName =
      competition?.name || t("liveCenter.emptyStates.defaultCompetition");
    const nextLabel = String(
      competition?.next_scope_label ||
        t("liveCenter.emptyStates.defaultNextScope"),
    ).toLowerCase();

    if (scope === "live") {
      return {
        badge: t("liveCenter.emptyStates.liveBadge"),
        title: t("liveCenter.emptyStates.liveTitle", { competition: compName }),
        description: t("liveCenter.emptyStates.liveDescription"),
      };
    }

    if (scope === "today") {
      return {
        badge: t("liveCenter.emptyStates.todayBadge"),
        title: t("liveCenter.emptyStates.todayTitle", {
          competition: compName,
        }),
        description: t("liveCenter.emptyStates.todayDescription", {
          nextLabel,
        }),
      };
    }

    return {
      badge: t("liveCenter.emptyStates.upcomingBadge"),
      title: t("liveCenter.emptyStates.upcomingTitle", { nextLabel }),
      description: t("liveCenter.emptyStates.upcomingDescription", {
        competition: compName,
      }),
    };
  }, [scope, competition?.name, competition?.next_scope_label, t]);

  // RENDER
  return (
    <section id="en-vivo" className="live-center">
      {/* BODY */}
      <div className="live-center__body">
        <div className="live-center__shell">
          {/* TOOLBAR */}
          <div className="live-toolbar">
            <div className="live-toolbar__tabs">
              <button
                type="button"
                className={scope === "live" ? "active" : ""}
                onClick={() => changeScope("live")}
              >
                <span className="live-toolbar__live-dot" />
                {t("liveCenter.liveStream")}
              </button>

              <button
                type="button"
                className={scope === "today" ? "active" : ""}
                onClick={() => changeScope("today")}
              >
                {t("liveCenter.todaysMatches")}
              </button>

              {/* <button
                type="button"
                className={scope === "upcoming" ? "active" : ""}
                onClick={() => changeScope("upcoming")}
              >
                {t("liveCenter.nextMatches")}
              </button> */}

              <button
                type="button"
                className={scope === "next" ? "active" : ""}
                onClick={() => changeScope("next")}
              >
                {t("liveCenter.nextMatches")}
              </button>
            </div>

            {/* <div className="live-toolbar__refresh">
              <span>{t("liveCenter.refresh")}</span>
              <strong>{countdown}s</strong>

              <button
                type="button"
                onClick={() => {
                  loadMatches();
                }}
              >
                ↻
              </button>
            </div> */}
          </div>

          <div className="live-provider-strip">
            <div>
              <span className="live-provider-strip__dot live-provider-strip__dot--schedule" />
              <div>
                <strong>{t("liveCenter.sportsDB.title")}</strong>
                <small>
                  {t("liveCenter.sportsDB.calendar")}{" "}
                  {competition?.name || t("liveCenter.common.competition")}
                </small>
              </div>
            </div>
            <span className="live-provider-strip__connector">→</span>
            <div>
              <span className="live-provider-strip__dot live-provider-strip__dot--live" />
              <div>
                <strong className="live-cuota-apifot">
                  {t("liveCenter.apiFootball.title")}
                </strong>
                <small>{t("liveCenter.apiFootball.liveOnDemand")}</small>
              </div>
            </div>
          </div>

          {/* ERROR */}
          {error && (
            <div className="live-error">
              <strong>{t("liveCenter.liveCenter")}</strong>
              <span>{error}</span>
            </div>
          )}

          {/* MATCHES */}
          <div className="live-match-section">
            <div className="live-section-title">
              <div>
                <span>
                  {t("liveCenter.matches.competitionName", {
                    name:
                      competition?.name ||
                      t("liveCenter.common.defaultCompetition"),
                  })}
                </span>
                <h3>{sectionTitle}</h3>
              </div>
              <small>
                {t("liveCenter.matches.matchesCount", {
                  count: matches.length,
                })}
              </small>
            </div>

            {loadingMatches && (
              <div className="live-match-loading">
                <span />
                <span />
                <span />

                <p>
                  {t("liveCenter.matches.search", {
                    competitionName:
                      competition?.name || t("liveCenter.common.competition"),
                  })}
                </p>
              </div>
            )}

            {!loadingMatches && matches.length > 0 && (
              <div className="live-match-grid">
                {matches.map((match) => (
                  <LiveMatchCard
                    key={match.id}
                    match={match}
                    selected={selectedScheduleMatch?.id === match.id}
                    competitionName={competition?.name}
                    onClick={() => seleccionarPartido(match)}
                  />
                ))}
              </div>
            )}

            {!loadingMatches && !error && matches.length === 0 && (
              <div className="live-empty">
                <div className="live-empty__radar">
                  <span />
                  <span />
                  <span />
                  <strong>{emptyState.badge}</strong>
                </div>
                <h3>{emptyState.title}</h3>
                <p>{emptyState.description}</p>
                {scope === "live" && (
                  <button type="button" onClick={() => changeScope("today")}>
                    {t("liveCenter.matches.viewTodayMatches")}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export default LiveCenter;
