import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import translationES from "../locales/es/translation.json";
import translationEN from "../locales/en/translation.json";
import translationPT from "../locales/pt/translation.json";
import translationDE from "../locales/de/translation.json";
import translationFR from "../locales/fr/translation.json";

const resources = {
  es: { translation: translationES },
  en: { translation: translationEN },
  pt: { translation: translationPT },
  de: { translation: translationDE },
  fr: { translation: translationFR },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    lng: "es", // Idioma por defecto al cargar
    fallbackLng: "en", // Idioma de respaldo si falta alguna clave en otro idioma
    interpolation: {
      escapeValue: false, // React ya protege contra XSS
    },
  });

export default i18n;
