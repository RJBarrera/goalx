import {
  faArrowLeft,
  faCookieBite,
  faDatabase,
  faEnvelope,
  faRectangleAd,
  faShieldHalved,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import "./PrivacyPolicy.css";

const CONTACT_EMAIL = "contacto@goalx.com";

function PrivacyPolicy() {
  // Hook de traduccion
  const { t } = useTranslation();

  return (
    <main className="privacy-page">
      <div className="privacy-page__container">
        <Link to="/" className="privacy-page__back">
          <FontAwesomeIcon icon={faArrowLeft} />
          {t("privacyPolicy.backLink")}
        </Link>

        <header className="privacy-page__header">
          <div className="privacy-page__icon">
            <FontAwesomeIcon icon={faShieldHalved} />
          </div>

          <div>
            <span className="privacy-page__eyebrow">
              {t("privacyPolicy.eyebrow")}
            </span>
            <h1>{t("privacyPolicy.title")}</h1>

            <p>{t("privacyPolicy.lastUpdated")}</p>
          </div>
        </header>

        <section className="privacy-page__card">
          <p>{t("privacyPolicy.intro")}</p>
        </section>

        <section className="privacy-page__section">
          <h2>
            <FontAwesomeIcon icon={faDatabase} />
            {t("privacyPolicy.sections.collection.title")}
          </h2>

          <p>{t("privacyPolicy.sections.collection.p1")}</p>
          <p>{t("privacyPolicy.sections.collection.p2")}</p>
        </section>

        <section className="privacy-page__section">
          <h2>
            <FontAwesomeIcon icon={faCookieBite} />
            {t("privacyPolicy.sections.cookies.title")}
          </h2>

          <p>{t("privacyPolicy.sections.cookies.p1")}</p>
          <p>{t("privacyPolicy.sections.cookies.p2")}</p>
        </section>

        <section className="privacy-page__section">
          <h2>
            <FontAwesomeIcon icon={faRectangleAd} />
            {t("privacyPolicy.sections.ads.title")}
          </h2>

          <p>{t("privacyPolicy.sections.ads.p1")}</p>
          <p>{t("privacyPolicy.sections.ads.p2")}</p>
          <p>{t("privacyPolicy.sections.ads.p3")}</p>

          <a
            href="https://adssettings.google.com/"
            target="_blank"
            rel="noreferrer"
            className="privacy-page__external"
          >
            {t("privacyPolicy.sections.ads.externalLink")}
          </a>
        </section>

        <section className="privacy-page__section">
          <h2>{t("privacyPolicy.sections.consent.title")}</h2>
          <p>{t("privacyPolicy.sections.consent.p1")}</p>
          <p>{t("privacyPolicy.sections.consent.p2")}</p>
        </section>

        <section className="privacy-page__section">
          <h2>{t("privacyPolicy.sections.thirdParty.title")}</h2>
          <p>{t("privacyPolicy.sections.thirdParty.p1")}</p>
          <p>{t("privacyPolicy.sections.thirdParty.p2")}</p>
        </section>

        <section className="privacy-page__section">
          <h2>{t("privacyPolicy.sections.purpose.title")}</h2>
          <p>{t("privacyPolicy.sections.purpose.subtitle")}</p>

          <ul>
            <li>{t("privacyPolicy.sections.purpose.list.0")}</li>
            <li>{t("privacyPolicy.sections.purpose.list.1")}</li>
            <li>{t("privacyPolicy.sections.purpose.list.2")}</li>
            <li>{t("privacyPolicy.sections.purpose.list.3")}</li>
            <li>{t("privacyPolicy.sections.purpose.list.4")}</li>
            <li>{t("privacyPolicy.sections.purpose.list.5")}</li>
          </ul>
        </section>

        <section className="privacy-page__section">
          <h2>{t("privacyPolicy.sections.externalLinks.title")}</h2>
          <p>{t("privacyPolicy.sections.externalLinks.p1")}</p>
        </section>

        <section className="privacy-page__section">
          <h2>{t("privacyPolicy.sections.changes.title")}</h2>
          <p>{t("privacyPolicy.sections.changes.p1")}</p>
        </section>

        <section className="privacy-page__section">
          <h2>
            <FontAwesomeIcon icon={faEnvelope} />
            {t("privacyPolicy.sections.contact.title")}
          </h2>

          <p>{t("privacyPolicy.sections.contact.p1")}</p>

          <a href={`mailto:${CONTACT_EMAIL}`} className="privacy-page__email">
            {CONTACT_EMAIL}
          </a>
        </section>

        <footer className="privacy-page__note">
          <p>{t("privacyPolicy.footerNote")}</p>
        </footer>
      </div>
    </main>
  );
}

export default PrivacyPolicy;
