import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

// Diccionario base de idiomas
const LANGUAGES = [
  { code: "es", label: "Español", country: "mx", short: "ES" },
  { code: "en", label: "English", country: "us", short: "EN" },
  { code: "pt", label: "Português", country: "br", short: "PT" },
  { code: "fr", label: "Français", country: "fr", short: "FR" },
  { code: "de", label: "Deutsch", country: "de", short: "DE" },
  { code: "ru", label: "Русский", country: "ru", short: "RU" },
  { code: "ar", label: "العربية", country: "sa", short: "AR" },
];

// Si el clic ocurre fuera, cerramos el dropdown
const useClickOutside = (ref, handler) => {
  useEffect(() => {
    const listener = (event) => {
      if (!ref.current || ref.current.contains(event.target)) return;
      handler(event);
    };

    document.addEventListener("mousedown", listener);
    return () => document.removeEventListener("mousedown", listener);
  }, [ref, handler]);
};

// Flecha (Micro-componente)
const ChevronIcon = () => (
  <svg
    className="sports-navbar__lang-chevron"
    xmlns="http://www.w3.org/2000/svg"
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

export function LanguageSelector() {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const closeDropdown = useCallback(() => setIsOpen(false), []);
  const toggleDropdown = useCallback(() => setIsOpen((prev) => !prev), []);

  useClickOutside(dropdownRef, closeDropdown);

  // Nullish coalescing por si i18n.language es undefined
  const currentCode = i18n.language?.slice(0, 2) ?? "es";
  const currentLang =
    LANGUAGES.find((l) => l.code === currentCode) ?? LANGUAGES[0];

  const handleLanguageChange = useCallback(
    (code) => {
      // Evita re-traducir si seleccionan el idioma activo
      if (code !== currentCode) {
        i18n.changeLanguage(code);
      }
      closeDropdown();
    },
    [i18n, currentCode, closeDropdown],
  );

  return (
    <div className="sports-navbar__lang-wrapper" ref={dropdownRef}>
      <button
        type="button"
        className={`sports-navbar__lang-button ${isOpen ? "sports-navbar__lang-button--open" : ""}`}
        onClick={toggleDropdown}
        aria-label="Seleccionar idioma"
        aria-expanded={isOpen}
      >
        <img
          src={`https://flagcdn.com/${currentLang.country}.svg`}
          alt=""
          aria-hidden="true"
          className="sports-navbar__lang-flag"
        />
        <span className="sports-navbar__lang-text">{currentLang.short}</span>
        <ChevronIcon />
      </button>

      {isOpen && (
        <div className="sports-navbar__lang-menu">
          {/* Destructuracion de propiedades */}
          {LANGUAGES.map(({ code, country, label }) => (
            <button
              key={code}
              type="button"
              className={`sports-navbar__lang-option ${currentCode === code ? "active" : ""}`}
              onClick={() => handleLanguageChange(code)}
            >
              <img
                src={`https://flagcdn.com/${country}.svg`}
                alt=""
                aria-hidden="true"
                className="sports-navbar__lang-flag"
              />
              <span className="sports-navbar__lang-label">{label}</span>

              {currentCode === code && (
                <span className="sports-navbar__lang-check">✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
