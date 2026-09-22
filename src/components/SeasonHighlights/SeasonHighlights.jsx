import { useEffect, useState } from "react";

import axios from "axios";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import {
  faFire,
  faFutbol,
  faStar,
  faTrophy,
} from "@fortawesome/free-solid-svg-icons";

import { useTranslation } from "react-i18next";
import { useCompetition } from "../../context/CompetitionContext";
import { getTeamLogo } from "../../utils/teamLogos";
import "./SeasonHighlights.css";

const API_URL = "";
const SLIDE_SECONDS = 6;

function PlayerSlide({ slide, competitionName }) {
  // Hook de traduccion
  const { t } = useTranslation();
  const player = slide.player || {};
  const teamLogo = getTeamLogo(player.team?.name);

  const initials = String(player.name || "?")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <article className="season-highlight-slide season-highlight-slide--player">
      <div className="season-highlight-slide__visual">
        <div className="season-highlight-player-fallback">
          <span>{initials}</span>
        </div>

        {teamLogo && (
          <img
            className="season-highlight-team-watermark"
            src={teamLogo}
            alt=""
          />
        )}
      </div>

      <div className="season-highlight-slide__content">
        <div className="season-highlight-badge">
          <FontAwesomeIcon icon={faFire} />

          {t(`seasonHighlights.badges.${slide.badge}`)}
        </div>

        <span className="season-highlight-kicker">
          {t("seasonHighlights.playerSlide.kicker", {
            competition: String(
              competitionName ||
                t("seasonHighlights.playerSlide.defaultCompetition"),
            ).toUpperCase(),
          })}
        </span>

        <h2>{player.name}</h2>

        <div className="season-highlight-team">
          {teamLogo && <img src={teamLogo} alt={player.team?.name} />}

          <span>{player.team?.name}</span>
        </div>

        <div className="season-highlight-player-stats">
          <div>
            <strong>{player.goals ?? 0}</strong>
            <span>{t("seasonHighlights.playerSlide.goals")}</span>
          </div>

          <div>
            <strong>{player.assists ?? 0}</strong>
            <span>{t("seasonHighlights.playerSlide.assists")}</span>
          </div>

          <div>
            <strong>{player.contributions ?? 0}</strong>
            <span>{t("seasonHighlights.playerSlide.contributions")}</span>
          </div>
        </div>
      </div>
    </article>
  );
}

function MatchSlide({ slide, competitionName }) {
  // Hook de traduccion
  const { t } = useTranslation();
  const match = slide.match || {};
  const homeLogo = getTeamLogo(match.home?.name);
  const awayLogo = getTeamLogo(match.away?.name);

  return (
    <article className="season-highlight-slide season-highlight-slide--match">
      <div className="season-highlight-slide__content">
        <div className="season-highlight-badge">
          <FontAwesomeIcon icon={faFutbol} />

          {t(`seasonHighlights.badges.${slide.badge}`)}
        </div>

        <span className="season-highlight-kicker">
          {t("seasonHighlights.matchSlide.kicker", {
            competition: String(
              competitionName ||
                t("seasonHighlights.matchSlide.defaultCompetition"),
            ).toUpperCase(),
          })}
        </span>

        <div className="season-highlight-scoreboard">
          <div className="season-highlight-club">
            <div className="season-highlight-club__logo">
              {homeLogo && <img src={homeLogo} alt={match.home?.name} />}
            </div>

            <strong>{match.home?.name}</strong>
          </div>

          <div className="season-highlight-score">
            <span>{match.home?.goals}</span>

            <small>—</small>

            <span>{match.away?.goals}</span>
          </div>

          <div className="season-highlight-club">
            <div className="season-highlight-club__logo">
              {awayLogo && <img src={awayLogo} alt={match.away?.name} />}
            </div>

            <strong>{match.away?.name}</strong>
          </div>
        </div>

        <div className="season-highlight-match-meta">
          <FontAwesomeIcon icon={faStar} />

          <strong>
            {t("seasonHighlights.matchSlide.goals", {
              count: match.total_goals,
            })}
          </strong>

          {match.total_corners !== null &&
            match.total_corners !== undefined && (
              <>
                <span>•</span>
                <span>
                  {t("seasonHighlights.matchSlide.corners", {
                    count: match.total_corners,
                  })}
                </span>
              </>
            )}

          {match.total_cards !== null && match.total_cards !== undefined && (
            <>
              <span>•</span>
              <span>
                {t("seasonHighlights.matchSlide.cards", {
                  count: match.total_cards,
                })}
              </span>
            </>
          )}
        </div>
      </div>

      <div className="season-highlight-match-decoration">
        <FontAwesomeIcon icon={faTrophy} />
      </div>
    </article>
  );
}

function SeasonHighlights() {
  // Hook de traduccion
  const { t } = useTranslation();
  const { competition, competitionId } = useCompetition();
  const [slides, setSlides] = useState([]);
  const [seasonInfo, setSeasonInfo] = useState({
    name: "",
    type: "",
    year: "",
  });
  const [active, setActive] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!competitionId) {
      return undefined;
    }

    let mounted = true;
    setLoading(true);
    setSlides([]);
    setActive(0);

    const loadHighlights = async () => {
      try {
        const { data } = await axios.get(`${API_URL}/api/highlights`, {
          params: { competition: competitionId },
        });

        if (!mounted) {
          return;
        }

        setSlides(Array.isArray(data?.slides) ? data.slides : []);

        setSeasonInfo({
          name: data?.season_name || data?.competition || "",
          type: data?.season_type || "",
          year: data?.season || "",
        });
      } catch (error) {
        console.error("Season highlights:", error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadHighlights();

    return () => {
      mounted = false;
    };
  }, [competitionId]);

  useEffect(() => {
    if (slides.length <= 1) {
      return undefined;
    }

    const interval = window.setInterval(() => {
      setActive((current) => (current + 1 >= slides.length ? 0 : current + 1));
    }, SLIDE_SECONDS * 1000);

    return () => window.clearInterval(interval);
  }, [slides.length]);

  if (loading || slides.length === 0) {
    return null;
  }

  return (
    <section className="season-highlights">
      <div className="season-highlights__shell">
        <div className="season-highlights__header">
          <div>
            <span>{t("seasonHighlights.container.kicker")}</span>

            <h2>{t("seasonHighlights.container.title")}</h2>
          </div>

          <div className="season-highlights__season">
            <FontAwesomeIcon icon={faTrophy} />

            {seasonInfo.type === "apertura" || seasonInfo.type === "clausura"
              ? t(`seasonHighlights.seasons.${seasonInfo.type}`, {
                  year: seasonInfo.year,
                })
              : seasonInfo.name ||
                t("seasonHighlights.container.defaultSeason")}
          </div>
        </div>

        <div className="season-highlights__viewport">
          <div
            className="season-highlights__track"
            style={{
              transform: `translateX(-${active * 100}%)`,
            }}
          >
            {slides.map((slide, index) => (
              <div
                className="season-highlights__item"
                key={`${slide.type}-${index}`}
              >
                {slide.type === "player" ? (
                  <PlayerSlide
                    slide={slide}
                    competitionName={competition?.name}
                  />
                ) : (
                  <MatchSlide
                    slide={slide}
                    competitionName={competition?.name}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="season-highlights__footer">
          <div className="season-highlights__progress">
            {slides.map((_, index) => (
              <span
                key={index}
                className={
                  index === active
                    ? "season-highlight-dot season-highlight-dot--active"
                    : "season-highlight-dot"
                }
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default SeasonHighlights;
