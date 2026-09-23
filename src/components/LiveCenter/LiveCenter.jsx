import axios from "axios";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useTranslation } from "react-i18next";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { useCompetition } from "../../context/CompetitionContext";
import { getTeamLogo } from "../../utils/teamLogos";

import "./LiveCenter.css";

const API_URL = "";

const NORMAL_REFRESH_SECONDS = 60;

const LIVE_UI_REFRESH_SECONDS = 20;

const DETAIL_REFRESH_SECONDS = 90;

// UTILIDADES

const number = (value, fallback = 0) => {
  const n = Number(value);

  return Number.isFinite(n) ? n : fallback;
};

const percentage = (value) => {
  return `${(number(value) * 100).toFixed(1)}%`;
};

const formatStat = (value, suffix = "") => {
  if (value === null || value === undefined) {
    return "—";
  }

  return `${value}${suffix}`;
};

const isLiveStatus = (status) => {
  return ["1H", "HT", "2H", "ET", "BT", "P", "SUSP", "INT"].includes(status);
};

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

const normalizeStreamText = (value) => {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
};

const streamMatchesMatch = (stream, match) => {
  if (!stream || !match) {
    return false;
  }

  if (
    stream.sportsdb_event_id &&
    match.sportsdb_event_id &&
    String(stream.sportsdb_event_id) === String(match.sportsdb_event_id)
  ) {
    return true;
  }

  if (
    stream.fixture_id &&
    match.fixture_id &&
    String(stream.fixture_id) === String(match.fixture_id)
  ) {
    return true;
  }

  const sameDate = !stream.date || stream.date === match.date_local;
  const sameHome =
    normalizeStreamText(stream.home) === normalizeStreamText(match.home?.name);
  const sameAway =
    normalizeStreamText(stream.away) === normalizeStreamText(match.away?.name);

  return sameDate && sameHome && sameAway;
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
function LiveMatchCard({
  match,
  selected,
  onClick,
  stream,
  onWatch,
  competitionName,
}) {
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

        <b className={live ? "live-score-number" : ""}>
          {match.home?.goals ?? "-"}
        </b>
      </div>

      <div className="live-match-card__team">
        <TeamBadge team={match.away} />

        <strong>{match.away?.name}</strong>

        <b className={live ? "live-score-number" : ""}>
          {match.away?.goals ?? "-"}
        </b>
      </div>

      {live && (
        <div className="live-match-card__live-strip">
          <span />

          <strong>LIVE DATA</strong>

          <small>API-Football</small>
        </div>
      )}

      <div className="live-match-card__footer">
        <span>
          {match.date_local ? `${formatMatchDate(match.date_local)} · ` : ""}

          {match.venue?.name || competitionName || "Competición"}
        </span>
      </div>

      {/* ::::: Se comenta temporalmente ::::: */}

      {/* {stream && !finished && (
        <button
          type="button"
          className="live-match-card__watch"
          onClick={(event) => {
            event.stopPropagation();
            onWatch?.();
          }}
        >
          <span>{live ? "●" : "▶"}</span>
          Ver aquí
          <small>
            {stream.source_count} fuente{stream.source_count === 1 ? "" : "s"}
          </small>
        </button>
      )} */}
    </article>
  );
}

// STAT
function LiveStatRow({ label, home, away, suffix = "" }) {
  const homeValue = number(home);

  const awayValue = number(away);

  const total = homeValue + awayValue;

  const homeWidth = total > 0 ? (homeValue / total) * 100 : 50;

  return (
    <div className="live-stat-row">
      <div className="live-stat-row__values">
        <strong>{formatStat(home, suffix)}</strong>

        <span>{label}</span>

        <strong>{formatStat(away, suffix)}</strong>
      </div>

      <div className="live-stat-row__bar">
        <span
          style={{
            width: `${homeWidth}%`,
          }}
        />

        <span
          style={{
            width: `${100 - homeWidth}%`,
          }}
        />
      </div>
    </div>
  );
}

// EVENTO
const getEventIcon = (event) => {
  if (event.type === "Goal") {
    return "⚽";
  }

  if (event.type === "Card") {
    if (String(event.detail).toLowerCase().includes("red")) {
      return "🟥";
    }

    return "🟨";
  }

  if (event.type === "subst" || event.type === "Subst") {
    return "↔";
  }

  if (event.type === "Var") {
    return "VAR";
  }

  return "•";
};

// PRINCIPAL
function LiveCenter({ onSeleccionarPartido }) {
  // Hook de traduccion
  const { t } = useTranslation();

  const navigate = useNavigate();
  const { competition, competitionId } = useCompetition();

  const [scope, setScope] = useState("live");

  const [matches, setMatches] = useState([]);

  const [streams, setStreams] = useState([]);

  const [selectedFixture, setSelectedFixture] = useState(null);

  // Partido seleccionado desde TheSportsDB
  const [selectedScheduleMatch, setSelectedScheduleMatch] = useState(null);

  // Resolviendo ID entre proveedores
  const [resolvingFixture, setResolvingFixture] = useState(false);

  const [liveMeta, setLiveMeta] = useState({
    overlayActive: false,
    overlayAvailable: false,
    stale: false,
    quota: null,
    providerRefreshSeconds: 300,
  });

  const [detail, setDetail] = useState(null);

  const [loadingMatches, setLoadingMatches] = useState(true);

  const [loadingDetail, setLoadingDetail] = useState(false);

  const [error, setError] = useState("");

  const [countdown, setCountdown] = useState(NORMAL_REFRESH_SECONDS);

  const [lastUpdated, setLastUpdated] = useState(null);

  // AI
  const [aiQuestion, setAiQuestion] = useState("");

  const [aiMessages, setAiMessages] = useState([]);

  const [aiLoading, setAiLoading] = useState(false);

  // Transmisiones configuradas en GoalX
  const loadStreams = useCallback(async () => {
    try {
      if (!competitionId) {
        setStreams([]);
        return;
      }

      const { data } = await axios.get(`${API_URL}/api/streams`, {
        params: { competition: competitionId },
      });

      setStreams(Array.isArray(data?.streams) ? data.streams : []);
    } catch (requestError) {
      console.error("GoalX streams:", requestError);
      setStreams([]);
    }
  }, [competitionId]);

  // PARTIDOS
  // THE SPORTS DB
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

        setLiveMeta({
          overlayActive: Boolean(data.overlay_active),

          overlayAvailable: Boolean(data.overlay_available),

          stale: Boolean(data.overlay_stale),

          quota: data.quota || null,

          providerRefreshSeconds: data.provider_refresh_seconds || 300,
        });

        setCountdown(data.ui_refresh_seconds || NORMAL_REFRESH_SECONDS);

        setLastUpdated(new Date());

        setError("");
      } catch (requestError) {
        console.error(requestError);

        setError(
          requestError?.response?.data?.detail ||
            requestError?.message ||
            "No fue posible actualizar Live Center.",
        );
      } finally {
        setLoadingMatches(false);
      }
    },

    [scope, competitionId],
  );

  // SELECCIONAR PARTIDO
  // TheSportsDB
  //      ↓
  // resolver
  //      ↓
  // API-Football fixture_id
  // const seleccionarPartido = async (match) => {
  //   if (!match || resolvingFixture) {
  //     return;
  //   }

  //   setSelectedScheduleMatch(match);

  //   setAiMessages([]);

  //   setAiQuestion("");

  //   setError("");

  //   // YA TENEMOS FIXTURE ID
  //   if (match.fixture_id) {
  //     setSelectedFixture(match.fixture_id);

  //     return;
  //   }

  //   // SI TODAVÍA NO TENEMOS FIXTURE ID
  //   // resolver bajo demanda.
  //   setResolvingFixture(true);

  //   try {
  //     const { data } = await axios.post(
  //       `${API_URL}/api/live/resolve`,

  //       {
  //         competition: competitionId,
  //         event_id: match.sportsdb_event_id,

  //         date: match.date_local,

  //         home: match.home?.name,

  //         away: match.away?.name,
  //       },
  //     );

  //     if (!data?.success || !data?.fixture_id) {
  //       throw new Error("No fue posible identificar el fixture.");
  //     }

  //     setSelectedFixture(data.fixture_id);
  //   } catch (requestError) {
  //     console.error(requestError);

  //     setError(
  //       requestError?.response?.data?.detail ||
  //         "Live Intelligence todavía no está disponible para este partido.",
  //     );
  //   } finally {
  //     setResolvingFixture(false);
  //   }
  // };

  const seleccionarPartido = async (match) => {
    if (!match || resolvingFixture) {
      return;
    }

    setSelectedScheduleMatch(match);

    setAiMessages([]);

    setAiQuestion("");

    setError("");

    onSeleccionarPartido?.({
      home: match.home?.name || "",
      away: match.away?.name || "",
    });

    if (scope === "today" || scope === "upcoming" || scope === "next") {
      return;
    }

    if (match.fixture_id) {
      setSelectedFixture(match.fixture_id);

      return;
    }

    setResolvingFixture(true);

    try {
      const { data } = await axios.post(`${API_URL}/api/live/resolve`, {
        event_id: match.sportsdb_event_id,
        date: match.date_local,
        home: match.home?.name,
        away: match.away?.name,
      });

      if (!data?.success || !data?.fixture_id) {
        throw new Error("No fue posible identificar el fixture.");
      }

      setSelectedFixture(data.fixture_id);
    } catch (requestError) {
      console.error(requestError);

      setError(
        requestError?.response?.data?.detail ||
          "Live Intelligence todavía no está disponible para este partido.",
      );
    } finally {
      setResolvingFixture(false);
    }
  };

  // DETALLE
  const loadDetail = useCallback(
    async (fixtureId, silent = false) => {
      if (!fixtureId) {
        return;
      }

      if (!silent) {
        setLoadingDetail(true);
      }

      try {
        const { data } = await axios.get(`${API_URL}/api/live/${fixtureId}`, {
          params: { competition: competitionId },
        });

        if (!data?.success) {
          throw new Error("No fue posible obtener el partido.");
        }

        setDetail(data.data);

        const liveDetail = data.data;

        setMatches((current) =>
          current.map((match) => {
            if (
              match.fixture_id !== liveDetail.fixture_id &&
              match.fixture_id !== liveDetail.id
            ) {
              return match;
            }

            return {
              ...match,

              live_verified: ["1H", "HT", "2H", "ET", "BT", "P"].includes(
                liveDetail?.status?.short,
              ),

              status: liveDetail.status,

              home: {
                ...match.home,

                goals: liveDetail?.home?.goals,
              },

              away: {
                ...match.away,

                goals: liveDetail?.away?.goals,
              },
            };
          }),
        );

        setLastUpdated(new Date());
      } catch (requestError) {
        console.error(requestError);

        setError(
          requestError?.response?.data?.detail ||
            requestError?.message ||
            "No fue posible actualizar el partido.",
        );
      } finally {
        setLoadingDetail(false);
      }
    },
    [competitionId],
  );

  useEffect(() => {
    setMatches([]);
    setStreams([]);
    setSelectedFixture(null);
    setSelectedScheduleMatch(null);
    setDetail(null);
    setAiMessages([]);
    setAiQuestion("");
    setError("");
    setCountdown(NORMAL_REFRESH_SECONDS);
    setLastUpdated(null);
  }, [competitionId]);

  useEffect(() => {
    loadStreams();
  }, [loadStreams]);

  // TheSportsDB
  // 1 request cada 5 minutos
  // Y SE DETIENE cuando estamos viendo un partido.
  useEffect(() => {
    loadMatches();

    if (selectedFixture) {
      return undefined;
    }

    const intervalSeconds = liveMeta.overlayActive
      ? LIVE_UI_REFRESH_SECONDS
      : NORMAL_REFRESH_SECONDS;

    const interval = window.setInterval(
      () => {
        loadMatches(true);
      },

      intervalSeconds * 1000,
    );

    return () => window.clearInterval(interval);
  }, [loadMatches, selectedFixture, liveMeta.overlayActive]);

  // API-Football
  // 1 request / minuto
  useEffect(() => {
    if (!selectedFixture) {
      return undefined;
    }

    loadDetail(selectedFixture);

    const interval = window.setInterval(
      () => {
        loadDetail(selectedFixture, true);
      },

      DETAIL_REFRESH_SECONDS * 1000,
    );

    return () => window.clearInterval(interval);
  }, [selectedFixture, loadDetail]);

  // COUNTDOWN
  useEffect(() => {
    const timer = window.setInterval(
      () => {
        setCountdown((current) => {
          if (current <= 1) {
            return selectedFixture
              ? LIVE_UI_REFRESH_SECONDS
              : NORMAL_REFRESH_SECONDS;
          }

          return current - 1;
        });
      },

      1000,
    );

    return () => window.clearInterval(timer);
  }, [selectedFixture]);

  // CAMBIAR SCOPE
  const changeScope = (nextScope) => {
    setScope(nextScope);

    setSelectedFixture(null);

    setSelectedScheduleMatch(null);

    setDetail(null);

    setAiMessages([]);

    setAiQuestion("");

    setError("");
  };

  // STATS
  const getStat = (side, name) => {
    return detail?.statistics?.[side]?.values?.[name] ?? null;
  };

  // INTELLIGENCE
  const intelligence = detail?.intelligence || {};

  const momentum = intelligence?.momentum || {
    home: 50,
    away: 50,
    trend: [],
  };

  const shift = intelligence?.probability_shift;

  const signals = intelligence?.signals || [];

  // AI
  const askAI = async (forcedQuestion = "") => {
    const question = String(forcedQuestion || aiQuestion).trim();

    if (!question || !selectedFixture || aiLoading) {
      return;
    }

    setAiMessages((current) => [
      ...current,
      {
        role: "user",

        content: question,
      },
    ]);

    setAiQuestion("");

    setAiLoading(true);

    try {
      const { data } = await axios.post(
        `${API_URL}/api/live/${selectedFixture}/ai`,
        {
          question,
        },
        {
          params: { competition: competitionId },
        },
      );

      if (!data?.success) {
        throw new Error("No fue posible consultar MatchLab AI.");
      }

      setAiMessages((current) => [
        ...current,
        {
          role: "assistant",

          content: data.answer,

          provider: data.provider,
        },
      ]);
    } catch (requestError) {
      setAiMessages((current) => [
        ...current,
        {
          role: "assistant",

          content:
            requestError?.response?.data?.detail ||
            "MatchLab AI no está disponible en este momento.",

          error: true,
        },
      ]);
    } finally {
      setAiLoading(false);
    }
  };

  // LOGOS
  const homeLogo = useMemo(
    () => (detail ? getTeamLogo(detail.home?.name) || detail.home?.logo : null),
    [detail],
  );

  const awayLogo = useMemo(
    () => (detail ? getTeamLogo(detail.away?.name) || detail.away?.logo : null),
    [detail],
  );

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

              <button
                type="button"
                className={scope === "upcoming" ? "active" : ""}
                onClick={() => changeScope("upcoming")}
              >
                {t("liveCenter.nextMatches")}
              </button>

              <button
                type="button"
                className={scope === "next" ? "active" : ""}
                onClick={() => changeScope("next")}
              >
                {t("liveCenter.nextMatchday")}
              </button>
            </div>

            <div className="live-engine-status">
              <div className="live-engine-status__radar">
                <span />
                <span />

                <strong>
                  {liveMeta.overlayActive
                    ? t("liveCenter.statusLive")
                    : t("liveCenter.statusReady")}
                </strong>
              </div>

              <div>
                <span>{t("liveCenter.engine")}</span>

                <strong>
                  {liveMeta.overlayActive
                    ? t("liveCenter.overlayActive")
                    : t("liveCenter.overlayWaiting")}
                </strong>

                <small>
                  {liveMeta.overlayActive
                    ? `${t("liveCenter.overlayLive")} ${liveMeta.providerRefreshSeconds}s`
                    : t("liveCenter.overlayKickoff")}
                </small>
              </div>
            </div>

            <div className="live-toolbar__refresh">
              <span>{t("liveCenter.refresh")}</span>
              <strong>{countdown}s</strong>

              <button
                type="button"
                onClick={() => {
                  loadMatches();
                  if (selectedFixture) {
                    loadDetail(selectedFixture);
                  }
                }}
              >
                ↻
              </button>
            </div>
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

            <span className="live-provider-strip__connector">→</span>

            <div>
              <span className="live-provider-strip__dot live-provider-strip__dot--ai" />

              <div>
                <strong>{t("liveCenter.matchLab.title")}</strong>

                <small>{t("liveCenter.matchLab.model")}</small>
              </div>
            </div>
          </div>

          {liveMeta.quota && (
            <div
              className={`live-quota ${
                liveMeta.quota.remaining === 0 ? "live-quota--empty" : ""
              }`}
            >
              <div className="live-quota__status">
                <span />

                <div>
                  <strong>{t("liveCenter.apiFootball.title")}</strong>

                  <small>{t("liveCenter.liveOverlay")}</small>
                </div>
              </div>

              <div className="live-quota__right">
                {liveMeta.quota.limit !== null && (
                  <>
                    <strong>
                      {liveMeta.quota.remaining ?? "—"}
                      {" / "}
                      {liveMeta.quota.limit}
                    </strong>

                    <small>{t("liveCenter.availableRequests")}</small>
                  </>
                )}
              </div>
            </div>
          )}

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
                {matches.map((match) => {
                  const stream = streams.find((item) =>
                    streamMatchesMatch(item, match),
                  );

                  return (
                    <LiveMatchCard
                      key={match.id}
                      match={match}
                      selected={selectedScheduleMatch?.id === match.id}
                      stream={stream}
                      competitionName={competition?.name}
                      onWatch={() =>
                        navigate(
                          `/ver-partido/${encodeURIComponent(stream.id)}?competition=${encodeURIComponent(competitionId)}`,
                          {
                            state: { match, competitionId },
                          },
                        )
                      }
                      onClick={() => seleccionarPartido(match)} // Se comenta por lo pronto
                    />
                  );
                })}
              </div>
            )}

            {!loadingMatches && matches.length === 0 && (
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

          {resolvingFixture && (
            <div className="live-resolving">
              <div className="live-resolving__radar">
                <span />

                <span />

                <strong>{t("liveCenter.matches.live")}</strong>
              </div>

              <div>
                <span>{t("liveCenter.matchLab.live")}</span>

                <h3>{t("liveCenter.matchLab.activatingLiveIntelligence")}</h3>

                <p>{t("liveCenter.matches.linkingMatchWithProvider")}</p>
              </div>
            </div>
          )}

          {/* DETALLE */}
          {selectedFixture && (
            <div className="live-analysis">
              {loadingDetail && !detail ? (
                <div className="live-detail-loading">
                  <span /> {t("liveCenter.processingLiveIntelligence")}
                </div>
              ) : (
                detail && (
                  <>
                    {/* SCOREBOARD */}
                    <section className="live-scoreboard">
                      <div className="live-scoreboard__top">
                        <span>{t("liveCenter.scoreboard.titleLive")}</span>

                        <div>
                          <span className="live-toolbar__live-dot" />

                          {detail.status?.short === "HT" ? (
                            <span className="uppercase">
                              {t("liveCenter.scoreboard.halfTime")}
                            </span>
                          ) : (
                            `${detail.status?.elapsed || 0}'`
                          )}
                        </div>
                      </div>

                      <div className="live-scoreboard__main">
                        <div className="live-score-team">
                          <span>{t("liveCenter.scoreboard.home")}</span>

                          <div className="live-score-team__logo">
                            {homeLogo && (
                              <img src={homeLogo} alt={detail.home?.name} />
                            )}
                          </div>

                          <h3>{detail.home?.name}</h3>
                        </div>

                        <div className="live-score">
                          <span>{detail.status?.elapsed || 0}'</span>

                          <div>
                            <strong>{detail.home?.goals ?? 0}</strong>

                            <b>-</b>

                            <strong>{detail.away?.goals ?? 0}</strong>
                          </div>

                          <small>
                            {detail.venue?.name ||
                              competition?.name ||
                              t("liveCenter.common.defaultCompetition")}
                          </small>
                        </div>

                        <div className="live-score-team">
                          <span>{t("liveCenter.scoreboard.away")}</span>

                          <div className="live-score-team__logo live-score-team__logo--away">
                            {awayLogo && (
                              <img src={awayLogo} alt={detail.away?.name} />
                            )}
                          </div>

                          <h3>{detail.away?.name}</h3>
                        </div>
                      </div>

                      <div className="live-scoreboard__meta">
                        <span>
                          {t("liveCenter.scoreboard.referee")}{" "}
                          <strong>
                            {" "}
                            {detail.referee ||
                              t("liveCenter.scoreboard.unaviable")}
                          </strong>
                        </span>

                        <span>
                          {t("liveCenter.scoreboard.updated")}{" "}
                          <strong>
                            {" "}
                            {lastUpdated
                              ? lastUpdated.toLocaleTimeString("es-MX")
                              : "—"}
                          </strong>
                        </span>
                      </div>
                    </section>

                    {/* MOMENTUM */}
                    <section className="live-panel live-momentum">
                      <div className="live-panel__heading">
                        <div>
                          <span>{t("liveCenter.momentum.liveMomentum")}</span>

                          <h3>{t("liveCenter.momentum.matchMomentum")}</h3>

                          <p>{momentum.window}</p>
                        </div>

                        <div className="live-ai-badge">
                          ML{" "}
                          <span>{t("liveCenter.momentum.intelligence")}</span>
                        </div>
                      </div>

                      <div className="live-momentum__teams">
                        <div>
                          <strong>{detail.home?.name}</strong>

                          <b>{number(momentum.home).toFixed(1)}%</b>
                        </div>

                        <div>
                          <strong>{detail.away?.name}</strong>

                          <b>{number(momentum.away).toFixed(1)}%</b>
                        </div>
                      </div>

                      <div className="live-momentum__bar">
                        <span
                          style={{
                            width: `${momentum.home}%`,
                          }}
                        />

                        <span
                          style={{
                            width: `${momentum.away}%`,
                          }}
                        />

                        <i />
                      </div>

                      {momentum.trend?.length >= 2 && (
                        <div className="live-momentum-chart">
                          <ResponsiveContainer width="100%" height={240}>
                            <LineChart data={momentum.trend}>
                              <CartesianGrid
                                strokeDasharray="4 4"
                                vertical={false}
                                stroke="#e8edf2"
                              />

                              <XAxis
                                dataKey="minute"
                                tickFormatter={(value) => `${value}'`}
                                axisLine={false}
                                tickLine={false}
                              />

                              <YAxis
                                domain={[0, 100]}
                                tickFormatter={(value) => `${value}%`}
                                axisLine={false}
                                tickLine={false}
                              />

                              <Tooltip
                                formatter={(value) =>
                                  `${Number(value).toFixed(1)}%`
                                }
                                labelFormatter={(value) =>
                                  t("liveCenter.momentum.minuteTooltip", {
                                    value,
                                  })
                                }
                              />

                              <Line
                                type="monotone"
                                dataKey="home"
                                name={detail.home?.name}
                                stroke="#20c997"
                                strokeWidth={3}
                                dot={false}
                              />

                              <Line
                                type="monotone"
                                dataKey="away"
                                name={detail.away?.name}
                                stroke="#38bdf8"
                                strokeWidth={3}
                                dot={false}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      )}
                    </section>

                    {/* STATS + SIGNALS */}
                    <div className="live-two-column">
                      <section className="live-panel">
                        <div className="live-panel__heading">
                          <div>
                            <span>{t("liveCenter.stats.liveStats")}</span>

                            <h3>{t("liveCenter.stats.matchData")}</h3>
                          </div>
                        </div>

                        <LiveStatRow
                          label={t("liveCenter.stats.possession")}
                          home={getStat("home", "Ball Possession")}
                          away={getStat("away", "Ball Possession")}
                          suffix="%"
                        />

                        <LiveStatRow
                          label={t("liveCenter.stats.shots")}
                          home={getStat("home", "Total Shots")}
                          away={getStat("away", "Total Shots")}
                        />

                        <LiveStatRow
                          label={t("liveCenter.stats.shotsOnGoal")}
                          home={getStat("home", "Shots on Goal")}
                          away={getStat("away", "Shots on Goal")}
                        />

                        <LiveStatRow
                          label={t("liveCenter.stats.corners")}
                          home={getStat("home", "Corner Kicks")}
                          away={getStat("away", "Corner Kicks")}
                        />

                        <LiveStatRow
                          label={t("liveCenter.stats.fouls")}
                          home={getStat("home", "Fouls")}
                          away={getStat("away", "Fouls")}
                        />

                        <LiveStatRow
                          label={t("liveCenter.stats.yellowCards")}
                          home={getStat("home", "Yellow Cards")}
                          away={getStat("away", "Yellow Cards")}
                        />
                      </section>

                      <section className="live-panel">
                        <div className="live-panel__heading">
                          <div>
                            <span>{t("liveCenter.stats.signalDetector")}</span>

                            <h3>{t("liveCenter.stats.matchSignals")}</h3>
                          </div>
                        </div>

                        <div className="live-signals">
                          {signals.length > 0 ? (
                            signals.map((signal, index) => (
                              <article
                                key={`${signal.type}-${index}`}
                                className={`live-signal live-signal--${signal.level}`}
                              >
                                <span>
                                  {String(index + 1).padStart(2, "0")}
                                </span>

                                <div>
                                  <strong>{signal.title}</strong>

                                  <p>{signal.description}</p>
                                </div>
                              </article>
                            ))
                          ) : (
                            <div className="live-signal-empty">
                              {t("liveCenter.stats.noDominantSignal")}
                            </div>
                          )}
                        </div>
                      </section>
                    </div>

                    {/* PREMATCH VS LIVE */}
                    {shift && (
                      <section className="live-panel">
                        <div className="live-panel__heading">
                          <div>
                            <span className="uppercase">
                              {t("liveCenter.prematch.title")}
                            </span>

                            <h3>{t("liveCenter.prematch.heading")}</h3>

                            <p>{t("liveCenter.prematch.description")}</p>
                          </div>
                        </div>

                        <div className="live-shift-grid">
                          {[
                            {
                              key: "home",
                              label: detail.home?.name,
                            },
                            {
                              key: "draw",
                              label: t("liveCenter.prematch.draw"), // <-- Traducido aquí
                            },
                            {
                              key: "away",
                              label: detail.away?.name,
                            },
                          ].map((option) => {
                            const item = shift[option.key];

                            return (
                              <article
                                key={option.key}
                                className="live-shift-card"
                              >
                                <span>{option.label}</span>

                                <div className="live-shift-card__probabilities">
                                  <div>
                                    <small>
                                      {t("liveCenter.prematch.pre")}
                                    </small>
                                    <strong>{percentage(item.prematch)}</strong>
                                  </div>

                                  <b>→</b>

                                  <div>
                                    <small>
                                      {t("liveCenter.prematch.live")}
                                    </small>
                                    <strong>{percentage(item.live)}</strong>
                                  </div>
                                </div>

                                <div
                                  className={`live-shift-change ${
                                    item.change >= 0
                                      ? "live-shift-change--up"
                                      : "live-shift-change--down"
                                  }`}
                                >
                                  {item.change >= 0 ? "▲" : "▼"}{" "}
                                  {Math.abs(item.change * 100).toFixed(1)}{" "}
                                  {t("liveCenter.prematch.percentagePoints")}
                                </div>
                              </article>
                            );
                          })}
                        </div>

                        <div className="live-model-note">
                          {t("liveCenter.prematch.note")}
                        </div>
                      </section>
                    )}

                    {/* TIMELINE */}
                    <section className="live-panel">
                      <div className="live-panel__heading">
                        <div>
                          <span>{t("liveCenter.timeline.title")}</span>
                          <h3>{t("liveCenter.timeline.heading")}</h3>
                        </div>

                        <small>
                          {t("liveCenter.timeline.eventsCount", {
                            count: detail.events?.length || 0,
                          })}
                        </small>
                      </div>

                      <div className="live-timeline">
                        {detail.events?.length > 0 ? (
                          [...detail.events].reverse().map((event, index) => (
                            <article
                              key={`${event.elapsed}-${index}`}
                              className="live-timeline-event"
                            >
                              <div className="live-timeline-event__minute">
                                {event.elapsed || 0}'
                                {event.extra ? `+${event.extra}` : ""}
                              </div>

                              <div className="live-timeline-event__line">
                                <span />
                              </div>

                              <div className="live-timeline-event__icon">
                                {getEventIcon(event)}
                              </div>

                              <div className="live-timeline-event__content">
                                <strong>
                                  {event.player || event.team || event.type}
                                </strong>

                                <span>{event.detail}</span>

                                {event.assist && (
                                  <small>
                                    {t("liveCenter.timeline.assist", {
                                      name: event.assist,
                                    })}
                                  </small>
                                )}
                              </div>
                            </article>
                          ))
                        ) : (
                          <div className="live-timeline-empty">
                            {t("liveCenter.timeline.emptyState")}
                          </div>
                        )}
                      </div>
                    </section>

                    {/* AI */}
                    <section className="live-ai">
                      <div className="live-ai__header">
                        <div className="live-ai__identity">
                          <div className="live-ai__logo">✦</div>

                          <div>
                            <span>{t("liveCenter.ai.title")}</span>

                            <h3>{t("liveCenter.ai.heading")}</h3>

                            <p>{t("liveCenter.ai.description")}</p>
                          </div>
                        </div>

                        <div className="live-ai__status">
                          <span /> {t("liveCenter.ai.status")}
                        </div>
                      </div>

                      <div className="live-ai__suggestions">
                        {[
                          t("liveCenter.ai.suggestions.q1"),
                          t("liveCenter.ai.suggestions.q2"),
                          t("liveCenter.ai.suggestions.q3"),
                          t("liveCenter.ai.suggestions.q4"),
                        ].map((question, index) => (
                          <button
                            key={index}
                            type="button"
                            disabled={aiLoading}
                            onClick={() => askAI(question)}
                          >
                            {question}
                          </button>
                        ))}
                      </div>

                      <div className="live-ai__conversation">
                        {aiMessages.length === 0 ? (
                          <div className="live-ai__welcome">
                            <span>✦</span>

                            <div>
                              <strong>{t("liveCenter.ai.welcomeTitle")}</strong>

                              <p>{t("liveCenter.ai.welcomeText")}</p>
                            </div>
                          </div>
                        ) : (
                          aiMessages.map((message, index) => (
                            <div
                              key={`${message.role}-${index}`}
                              className={`live-ai-message live-ai-message--${message.role}`}
                            >
                              <span>
                                {message.role === "assistant"
                                  ? "✦"
                                  : t("liveCenter.ai.userRole")}
                              </span>

                              <div>
                                {message.content}

                                {message.provider && (
                                  <small>
                                    {message.provider === "openai"
                                      ? t("liveCenter.ai.providerOpenAI")
                                      : t("liveCenter.ai.providerLocal")}
                                  </small>
                                )}
                              </div>
                            </div>
                          ))
                        )}

                        {aiLoading && (
                          <div className="live-ai-thinking">
                            <span />
                            <span />
                            <span /> {t("liveCenter.ai.thinking")}
                          </div>
                        )}
                      </div>

                      <div className="live-ai__input">
                        <input
                          value={aiQuestion}
                          onChange={(event) =>
                            setAiQuestion(event.target.value)
                          }
                          onKeyDown={(event) => {
                            if (event.key === "Enter") {
                              askAI();
                            }
                          }}
                          placeholder={t("liveCenter.ai.placeholder")}
                        />

                        <button
                          type="button"
                          disabled={!aiQuestion.trim() || aiLoading}
                          onClick={() => askAI()}
                        >
                          →
                        </button>
                      </div>

                      <div className="live-ai__disclaimer">
                        {t("liveCenter.ai.disclaimer")}
                      </div>
                    </section>
                  </>
                )
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default LiveCenter;
