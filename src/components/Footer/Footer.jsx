import {
  faBrain,
  faChartColumn,
  faChartLine,
  faChevronRight,
  faEnvelope,
  faFutbol,
  faShieldHalved,
  faTowerBroadcast,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTranslation } from "react-i18next";

import { getTeamLogo } from "../../utils/teamLogos";
import "./Footer.css";

const CONTACT_EMAIL = "contacto@goalx.com";

function Footer() {
  // Hook de traduccion
  const { t } = useTranslation();

  const currentYear = new Date().getFullYear();

  return (
    <footer className="goalx-footer">
      <div className="goalx-footer__container">
        <div className="goalx-footer__content">
          <section className="goalx-footer__brand">
            <div className="goalx-footer__brand-header">
              <div className="goalx-footer__logo-wrapper">
                <img
                  src={getTeamLogo("logo")}
                  alt="GoalX"
                  className="goalx-footer__logo"
                />
              </div>

              <div className="goalx-footer__brand-text">
                <div className="goalx-footer__name">
                  Goal<span>X</span>
                </div>

                <div className="goalx-footer__tagline">
                  <span className="goalx-footer__status-dot" />{" "}
                  {t("footer.subtitle")}
                </div>
              </div>
            </div>

            <p className="goalx-footer__description">
              {t("footer.description")}
              <br />
              {t("footer.description-1")}
              <br className="goalx-footer__desktop-break" />{" "}
              {t("footer.description-2")}
            </p>
          </section>

          <section className="goalx-footer__column goalx-footer__navigation">
            <div className="goalx-footer__column-title">
              <span className="goalx-footer__title-icon">
                <FontAwesomeIcon icon={faChartLine} />
              </span>

              <span>{t("footer.navegation")}</span>
            </div>

            <nav className="goalx-footer__nav">
              <a href="#prediccion">
                <FontAwesomeIcon icon={faChartColumn} />
                <span>{t("footer.prediction")}</span>
              </a>

              <a href="#analitica">
                <FontAwesomeIcon icon={faChartLine} />
                <span>{t("footer.analytics")}</span>
              </a>

              <a href="#modelo">
                <FontAwesomeIcon icon={faBrain} />
                <span>{t("footer.model")}</span>
              </a>

              <a href="#en-vivo">
                <FontAwesomeIcon icon={faTowerBroadcast} />
                <span>{t("footer.live")}</span>
                <span className="goalx-footer__live-badge">
                  {t("footer.liveBadge")}
                </span>
              </a>
            </nav>
          </section>

          <section className="goalx-footer__column">
            <div className="goalx-footer__column-title">
              <span className="goalx-footer__title-icon">
                <FontAwesomeIcon icon={faShieldHalved} />
              </span>

              <span>{t("footer.legal")}</span>
            </div>

            <div className="goalx-footer__links">
              <a
                href="/politica-de-privacidad"
                className="goalx-footer__link-row"
              >
                <span className="goalx-footer__link-icon">
                  <FontAwesomeIcon icon={faShieldHalved} />
                </span>

                <span className="goalx-footer__link-text">
                  {t("footer.privacy-policy")}
                </span>

                <span className="goalx-footer__arrow">
                  <FontAwesomeIcon icon={faChevronRight} />
                </span>
              </a>
            </div>
          </section>

          <section className="goalx-footer__column">
            <div className="goalx-footer__column-title">
              <span className="goalx-footer__title-icon">
                <FontAwesomeIcon icon={faEnvelope} />
              </span>

              <span>{t("footer.contact")}</span>
            </div>

            <div className="goalx-footer__links">
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="goalx-footer__link-row goalx-footer__contact-row"
              >
                <span className="goalx-footer__link-icon">
                  <FontAwesomeIcon icon={faEnvelope} />
                </span>

                <span className="goalx-footer__link-text">{CONTACT_EMAIL}</span>

                <span className="goalx-footer__arrow">
                  <FontAwesomeIcon icon={faChevronRight} />
                </span>
              </a>
            </div>
          </section>
        </div>
      </div>

      <div className="goalx-footer__bottom">
        <div className="goalx-footer__bottom-container">
          <p>{t("footer.bottom.rights", { year: currentYear })}</p>

          <p className="goalx-footer__bottom-message">
            {t("footer.bottom.message")} <FontAwesomeIcon icon={faFutbol} />
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
