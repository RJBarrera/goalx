import axios from "axios";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation, useParams } from "react-router-dom";

import Footer from "../../components/Footer/Footer";
import Navbar from "../../components/Navbar/Navbar";
import { useCompetition } from "../../context/CompetitionContext";
import { getTeamLogo } from "../../utils/teamLogos";

import "./WatchMatch.css";

const API_URL = "";

const isLiveStatus = (status) => {
  return ["1H", "HT", "2H", "ET", "BT", "P", "SUSP", "INT", "LIVE"].includes(
    status,
  );
};

function WatchTeam({ name, logo }) {
  // Hook de traduccion
  const { t } = useTranslation();
  const teamLogo = getTeamLogo(name) || logo;
  const fallbackName = t("watchMatch.team.fallbackName");

  return (
    <div className="watch-match-team">
      <div className="watch-match-team__logo">
        {teamLogo ? (
          <img src={teamLogo} alt={name || fallbackName} />
        ) : (
          <span>
            {String(name || "?")
              .slice(0, 2)
              .toUpperCase()}
          </span>
        )}
      </div>

      <strong>{name || fallbackName}</strong>
    </div>
  );
}

function WatchMatch() {
  // Hook de traduccion
  const { t } = useTranslation();
  const { streamId } = useParams();
  const location = useLocation();
  const { competition, competitionId } = useCompetition();

  const match = location.state?.match || null;

  const [stream, setStream] = useState(null);
  const [activeSource, setActiveSource] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!competitionId) {
      return undefined;
    }

    let mounted = true;

    const loadStream = async () => {
      setLoading(true);
      setError("");

      try {
        const { data } = await axios.get(
          `${API_URL}/api/streams/${encodeURIComponent(streamId)}`,
          {
            params: { competition: competitionId },
          },
        );

        if (!mounted) {
          return;
        }

        const nextStream = data?.stream || null;
        const sources = Array.isArray(nextStream?.sources)
          ? nextStream.sources
          : [];

        setStream(nextStream);
        setActiveSource(sources[0] || null);
      } catch (requestError) {
        if (!mounted) {
          return;
        }

        setError(
          requestError?.response?.data?.detail ||
            requestError?.message ||
            t("watchMatch.errors.defaultStreamError"),
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadStream();

    return () => {
      mounted = false;
    };
  }, [streamId, competitionId, t]);

  const home = useMemo(
    () => ({
      name: match?.home?.name || stream?.home,
      logo: match?.home?.logo,
      goals: match?.home?.goals,
    }),
    [match, stream],
  );

  const away = useMemo(
    () => ({
      name: match?.away?.name || stream?.away,
      logo: match?.away?.logo,
      goals: match?.away?.goals,
    }),
    [match, stream],
  );

  const live =
    Boolean(match?.live_verified) || isLiveStatus(match?.status?.short);

  const localLabel = t("watchMatch.teams.home");
  const visitorLabel = t("watchMatch.teams.away");

  let playbackContent;

  if (loading) {
    playbackContent = (
      <section className="watch-match-loading">
        <span />
        <p>{t("watchMatch.states.loading")}</p>
      </section>
    );
  } else if (error) {
    playbackContent = (
      <section className="watch-match-error">
        <strong>{t("watchMatch.states.errorTitle")}</strong>
        <p>{error}</p>
        <Link to={`/?competition=${encodeURIComponent(competitionId)}`}>
          {t("watchMatch.states.backToMatches")}
        </Link>
      </section>
    );
  } else {
    playbackContent = (
      <>
        <section className="watch-match-player">
          {activeSource ? (
            <iframe
              key={activeSource.id}
              src={activeSource.url}
              title={`${home.name || localLabel} vs ${away.name || visitorLabel} - ${activeSource.name}`}
              allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
            />
          ) : (
            <div className="watch-match-player__empty">
              {t("watchMatch.states.noSource")}
            </div>
          )}
        </section>

        <section className="watch-match-sources">
          <div className="watch-match-sources__heading">
            <div>
              <span>{t("watchMatch.sources.eyebrow")}</span>
              <h2>{t("watchMatch.sources.title")}</h2>
            </div>

            <small>
              {t("watchMatch.sources.count", {
                count: stream?.sources?.length || 0,
              })}
            </small>
          </div>

          <div className="watch-match-sources__list">
            {(stream?.sources || []).map((source) => (
              <button
                key={source.id}
                type="button"
                className={activeSource?.id === source.id ? "active" : ""}
                onClick={() => setActiveSource(source)}
              >
                <span>{activeSource?.id === source.id ? "●" : "▶"}</span>
                {source.name}
              </button>
            ))}
          </div>

          <p>{t("watchMatch.sources.hint")}</p>
        </section>
      </>
    );
  }

  return (
    <>
      <Navbar />

      <main className="watch-match-page">
        <div className="watch-match-shell">
          <div className="watch-match-topbar">
            <Link to={`/?competition=${encodeURIComponent(competitionId)}`}>
              {t("watchMatch.topbar.back")}
            </Link>

            <span
              className={live ? "watch-match-live" : "watch-match-available"}
            >
              <i />
              {live
                ? t("watchMatch.status.live")
                : t("watchMatch.status.available")}
            </span>
          </div>

          <section className="watch-match-heading">
            <div>
              <span>{t("watchMatch.heading.eyebrow")}</span>
              <h1>
                {stream?.title ||
                  `${home.name || localLabel} vs ${away.name || visitorLabel}`}
              </h1>
              <p>
                {match?.date_local ||
                  stream?.date ||
                  competition?.name ||
                  t("watchMatch.heading.defaultCompetition")}
                {(match?.time_local || stream?.time) &&
                  ` · ${match?.time_local || stream?.time}`}
                {match?.venue?.name && ` · ${match.venue.name}`}
              </p>
            </div>

            <div className="watch-match-scoreboard">
              <WatchTeam name={home.name} logo={home.logo} />

              <div className="watch-match-score">
                <strong>{home.goals ?? "-"}</strong>
                <span>:</span>
                <strong>{away.goals ?? "-"}</strong>
              </div>

              <WatchTeam name={away.name} logo={away.logo} />
            </div>
          </section>

          <div className="watch-match-notice">{t("watchMatch.notice")}</div>

          {playbackContent}
        </div>
      </main>

      <Footer />
    </>
  );
}

export default WatchMatch;
