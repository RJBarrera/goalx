import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

// Carga de todos los translation.json dentro de la carpeta locales
const translationFiles = import.meta.glob("../locales/*/translation.json", {
  eager: true,
});

const resources = {};
for (const path in translationFiles) {
  // Extrae el código de idioma de la ruta (ej: "es", "en", "ar")
  const match = path.match(/\/locales\/([^/]+)\/translation\.json/);
  if (match) {
    const langCode = match[1];
    resources[langCode] = {
      translation: translationFiles[path].default || translationFiles[path],
    };
  }
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    // lng: "es", // Idioma por defecto al cargar
    fallbackLng: "en", // Idioma de respaldo si falta alguna clave en otro idioma
    supportedLngs: Object.keys(resources), // Idiomas soportados
    load: "languageOnly",
    detection: {
      order: ["sessionStorage", "navigator"],
      caches: ["sessionStorage"],
    },
    interpolation: {
      escapeValue: false, // React ya protege contra XSS
    },
  });

export default i18n;
