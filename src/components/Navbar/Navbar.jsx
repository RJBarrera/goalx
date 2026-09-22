import { useEffect, useRef, useState } from "react";

import {
  faDisplay,
  faPowerOff,
  faRightToBracket,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { LanguageSelector } from "../LanguageSelector";

import { useAuth } from "../../context/AuthContext";
import { useCompetition } from "../../context/CompetitionContext";
import { getTeamLogo } from "../../utils/teamLogos";
import "./Navbar.css";

const NAV_ITEMS = [
  {
    translationKey: "navbar.prediction",
    href: "#prediccion",
  },
  {
    translationKey: "navbar.analytics",
    href: "#analitica",
  },
  {
    translationKey: "navbar.model",
    href: "#modelo",
  },
];

function Navbar() {
  const navigate = useNavigate();
  const { user, authenticated, logout } = useAuth();
  const {
    competitions,
    competition,
    competitionId,
    loading: competitionLoading,
    changeCompetition,
  } = useCompetition();

  const [menuOpen, setMenuOpen] = useState(false);
  const [competitionOpen, setCompetitionOpen] = useState(false);
  const competitionRef = useRef(null);

  // Hook de traduccion
  const { t } = useTranslation();

  const cerrarMenu = () => {
    setMenuOpen(false);
    setCompetitionOpen(false);
  };

  const seleccionarCompeticion = (nextCompetitionId) => {
    changeCompetition(nextCompetitionId);
    setCompetitionOpen(false);
    setMenuOpen(false);
  };

  const cerrarSesion = async () => {
    cerrarMenu();
    await logout();
    navigate("/");
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        competitionRef.current &&
        !competitionRef.current.contains(event.target)
      ) {
        setCompetitionOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setCompetitionOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <header className="sports-navbar">
      <div className="sports-navbar__inner">
        {/* BRAND */}
        <a href="/" className="sports-navbar__brand">
          <div className="sports-navbar__logo">
            <img
              src={getTeamLogo("logo")}
              alt="GoalX"
              className="sports-select__team-logo"
            />
          </div>

          <div className="sports-navbar__brand-text">
            <strong>
              Goal<span>X</span>
            </strong>

            <div className="glob-sports-navbar__engine-dot">
              <span className="sports-navbar__engine-dot" />
              <small>{t("navbar.subtitle")}</small>
            </div>
          </div>
        </a>

        {/* DESKTOP NAV */}
        <nav className="sports-navbar__links">
          {/* COMPETICIÓN */}
          <div className="sports-navbar__competition" ref={competitionRef}>
            <button
              type="button"
              className={`sports-navbar__competition-button ${
                competitionOpen ? "sports-navbar__competition-button--open" : ""
              }`}
              onClick={() => setCompetitionOpen((current) => !current)}
              disabled={competitionLoading || competitions.length === 0}
              aria-expanded={competitionOpen}
            >
              <span className="sports-navbar__competition-icon">⚽</span>

              <span className="sports-navbar__competition-copy">
                <small>{t("navbar.competition")}</small>
                <strong>
                  {competition?.short_name ||
                    competition?.name ||
                    t("navbar.loading")}
                </strong>
              </span>

              <span className="sports-navbar__competition-chevron">⌄</span>
            </button>

            {competitionOpen && (
              <div className="sports-navbar__competition-menu">
                <span>{t("navbar.competition-menu")}</span>

                {competitions.map((item) => {
                  const active = item.id === competitionId;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      className={active ? "active" : ""}
                      onClick={() => seleccionarCompeticion(item.id)}
                    >
                      <div>
                        <strong>{item.name}</strong>
                        {item.country && <small>{item.country}</small>}
                      </div>

                      <b>{active ? "✓" : "→"}</b>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          {NAV_ITEMS.map((item) => (
            <a key={item.translationKey} href={`/${item.href}`}>
              {t(item.translationKey)}
            </a>
          ))}
          <a href="/#en-vivo" className="navbar-live-link">
            <span className="navbar-live-dot" /> {t("navbar.live")}{" "}
            <small>{t("navbar.live")}</small>
          </a>
        </nav>

        {/* RIGHT */}
        <div className="sports-navbar__actions">
          {/* Botón para cambiar idioma */}
          <div className="sports-navbar__lang-desktop">
            <LanguageSelector />
          </div>

          <a href="/" className="sports-navbar__cta">
            {t("navbar.new_prediction")} <span>→</span>
          </a>

          {authenticated ? (
            <div className="sports-navbar__account">
              {user?.role === "ADMIN" && (
                <Link
                  to="/admin/transmisiones"
                  className="sports-navbar__admin"
                  onClick={cerrarMenu}
                >
                  <FontAwesomeIcon icon={faDisplay} />
                </Link>
              )}

              {/* <div className="sports-navbar__user">
                <span>
                  {String(user?.username || "U")
                    .slice(0, 1)
                    .toUpperCase()}
                </span>
                <div>
                  <strong>{user?.username}</strong>
                  <small>
                    {user?.role === "ADMIN"
                      ? t("navbar.admin")
                      : t("navbar.user")}
                  </small>
                </div>
              </div> */}

              <button
                type="button"
                className="sports-navbar__logout"
                onClick={cerrarSesion}
              >
                <FontAwesomeIcon icon={faPowerOff} />
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="sports-navbar__login"
              onClick={cerrarMenu}
            >
              <FontAwesomeIcon icon={faRightToBracket} />
            </Link>
          )}

          <button
            type="button"
            className={`sports-navbar__menu-button ${
              menuOpen ? "sports-navbar__menu-button--open" : ""
            }`}
            aria-label="Abrir menú"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((prev) => !prev)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </div>

      {/* MOBILE MENU */}
      <div
        className={`sports-navbar__mobile ${
          menuOpen ? "sports-navbar__mobile--open" : ""
        }`}
      >
        {/* Botón para cambiar idioma */}
        <div className="sports-navbar__mobile-lang">
          <LanguageSelector />
        </div>
        <div className="sports-navbar__mobile-competition">
          <span>{t("navbar.mobile-competition")}</span>

          <div>
            {competitions.map((item) => (
              <button
                key={item.id}
                type="button"
                className={item.id === competitionId ? "active" : ""}
                onClick={() => seleccionarCompeticion(item.id)}
              >
                <span>{item.name}</span>
                <strong>{item.id === competitionId ? "✓" : "→"}</strong>
              </button>
            ))}
          </div>
        </div>

        <nav>
          {NAV_ITEMS.map((item) => (
            <a
              key={item.translationKey}
              href={`/${item.href}`}
              onClick={cerrarMenu}
            >
              <span>{t(item.translationKey)}</span>
              <strong>→</strong>
            </a>
          ))}

          <a href="/#en-vivo" onClick={cerrarMenu}>
            <span>{t("navbar.live")}</span>
            <strong>→</strong>
          </a>

          {authenticated ? (
            <>
              {user?.role === "ADMIN" && (
                <Link to="/admin/transmisiones" onClick={cerrarMenu}>
                  <span>{t("navbar.admin_panel")}</span>
                  <strong>→</strong>
                </Link>
              )}

              <button
                type="button"
                className="sports-navbar__mobile-auth"
                onClick={cerrarSesion}
              >
                <span>
                  {t("navbar.logout")} · {user?.username}
                </span>
                <strong>→</strong>
              </button>
            </>
          ) : (
            <Link to="/login" onClick={cerrarMenu}>
              <span>{t("navbar.login")}</span>
              <strong>→</strong>
            </Link>
          )}
        </nav>

        <div className="sports-navbar__mobile-engine">
          <span className="sports-navbar__engine-dot" />{" "}
          {t("navbar.engine_available")}
        </div>
      </div>
    </header>
  );
}

export default Navbar;
