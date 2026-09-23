// Logo de equipos
const logoModules = import.meta.glob(
  "../assets/imagenes/*.{png,jpg,jpeg,webp,svg}",
  {
    eager: true,
    import: "default",
  },
);

// Normalizar Texto
const normalizarTexto = (texto = "") => {
  return String(texto)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Quita tildes
    .replace(/[.,]/g, "") // Elimina puntos
    .replace(/\s*-\s*/g, " ") // Convierte guiones rodeados de espacios en un espacio limpio
    .toLowerCase()
    .trim();
};

// Obtener nombre del archivo
const obtenerNombreArchivo = (ruta = "") => {
  return ruta.split("/").pop()?.toLowerCase();
};

// Mapa de archivos
const archivosPorNombre = Object.entries(logoModules).reduce(
  (accumulator, [ruta, url]) => {
    const nombreArchivo = obtenerNombreArchivo(ruta);

    if (nombreArchivo) {
      accumulator[nombreArchivo] = url;
    }

    return accumulator;
  },
  {},
);

// Prefijos de clubes que ensucian las llaves
const STOP_WORDS = new Set([
  "club",
  "fc",
  "cf",
  "deportivo",
  "unam",
  "guadalajara",
]);

// Mapeo
const TEAM_LOGO_FILES = Object.freeze({
  atlas: "atlas.svg",
  "atletico san luis": "atletico-san-luis.png",
  pachuca: "pachuca.svg",
  america: "america.svg",
  queretaro: "queretaro.svg",
  tijuana: "tijuana.svg",
  "cruz azul": "cruz-azul.svg",
  juarez: "juarez.svg",
  chivas: "chivas.svg",
  leon: "leon.svg",
  necaxa: "necaxa.svg",
  puebla: "puebla.svg",
  pumas: "pumas.svg",
  santos: "santos.svg",
  "santos laguna": "santos.svg",
  tigres: "tigres.svg",
  "tigres uanl": "tigres.svg",
  toluca: "toluca.svg",
  monterrey: "monterrey.svg",
  atlante: "atlante.svg",
  logo: "pelota2.png",
});

// Obtiene logos
export const getTeamLogo = (teamName) => {
  if (!teamName || typeof teamName !== "string") return null;

  // Elimina minúsculas, acentos/caracteres raros, trim
  const normalized = normalizarTexto(teamName);
  // console.log(normalized);

  // Elimina stop-words dinámicamente
  const cleanWords = normalized
    .split(/\s+/)
    .filter((word) => !STOP_WORDS.has(word));
  // console.log(cleanWords);
  const teamKey = cleanWords.join(" ");
  // console.log(teamKey);

  // Manejo de alias
  const fileName = TEAM_LOGO_FILES[teamKey];
  if (!fileName) return null;

  return archivosPorNombre[fileName.toLowerCase()] || null;
};
