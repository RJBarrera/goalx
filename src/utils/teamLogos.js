// Logo de equipos
const logoModules = import.meta.glob(
  "../assets/imagenes/**/*.{png,jpg,jpeg,webp,svg}",
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

// Normalizar identificador de liga
const normalizarLiga = (liga = "") => {
  return String(liga)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, "-");
};

const archivosPorLiga = {};
const archivosGenerales = {};

// Procesamiento unificado de módulos
Object.entries(logoModules).forEach(([ruta, url]) => {
  const partes = ruta.split("/");
  const nombreArchivo = partes[partes.length - 1]?.toLowerCase();
  const carpetaContenedora = partes[partes.length - 2];

  if (!nombreArchivo) return;

  // Si está en la raíz de "imagenes", va a generales
  if (carpetaContenedora === "imagenes") {
    archivosGenerales[nombreArchivo] = url;
  } else {
    // Si está dentro de una carpeta de liga (ej. liga-mx)
    const liga = normalizarLiga(carpetaContenedora);
    if (!archivosPorLiga[liga]) {
      archivosPorLiga[liga] = {};
    }
    archivosPorLiga[liga][nombreArchivo] = url;
  }
});

// Prefijos/palabras comunes que ensucian las llaves
const STOP_WORDS = new Set([
  "w",
  "club",
  "fc",
  "cf",
  "deportivo",
  "unam",
  "guadalajara",
  // La liga
  "la",
  "las",
  "vigo",
  // Ligue1
  "foot",
  "estac",
  "le",
]);

// Mapeo de equipos por liga (las claves deben coincidir con normalizarLiga)
const equiposLigaMX = {
  atlas: "atlas.svg",
  "atletico san luis": "atletico-san-luis.svg",
  pachuca: "pachuca.svg",
  america: "america.svg",
  queretaro: "queretaro.svg",
  tijuana: "tijuana.svg",
  "cruz azul": "cruz-azul.svg",
  juarez: "juarez.svg",
  chivas: "chivas.svg",
  "guadalajara w": "chivas.svg",
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
};

const TEAM_LOGO_FILES = {
  "liga-mx": equiposLigaMX,
  "liga-mx-f": equiposLigaMX,
  "la-liga": {
    barcelona: "barcelona.svg",
    "real madrid": "rma.svg",
    "real sociedad": "rso.svg",
    "real betis": "betis.svg",
    osasuna: "osasuna.svg",
    malaga: "malaga.svg",
    "racing santander": "racing.svg",
    "atletico madrid": "atm.svg",
    athletic: "atc.svg",
    almeria: "almeria.svg",
    alaves: "alaves.svg",
    cadiz: "cadiz.svg",
    celta: "celta.svg",
    coruna: "coruña.svg",
    elche: "elche.svg",
    espanyol: "espanyol.svg",
    getafe: "getafe.svg",
    girona: "girona.svg",
    granada: "granada.svg",
    palmas: "palmas.svg",
    leganes: "leganes.svg",
    levante: "levante.svg",
    mallorca: "mallorca.svg",
    oviedo: "oviedo.svg",
    "rayo vallecano": "rayo.svg",
    sevilla: "sevilla.svg",
    valencia: "valencia.svg",
    valladolid: "valladolid.svg",
    villarreal: "villarreal.svg",
  },
  "ligue-1": {
    ajaccio: "ajaccio.svg",
    angers: "angers.svg",
    auxerre: "auxerre.svg",
    clermont: "clermont.svg",
    troyes: "troyes.svg",
    havre: "havre.svg",
    mans: "mans.svg",
    lens: "lens.svg",
    lille: "lille.svg",
    lorient: "lorient.svg",
    lyon: "lyon.svg",
    marseille: "marseille.svg",
    metz: "metz.svg",
    monaco: "monaco.svg",
    montpellier: "montpellier.svg",
    nantes: "nantes.svg",
    nice: "nice.svg",
    paris: "paris.svg",
    psg: "psg.svg",
    reims:"reims.svg",
    rennes: "rennes.svg",
    etienne: "etienne.svg",
    brest: "brest.svg",
    strasbourg: "strasbourg.svg",
    toulouse: "toulouse.svg",
  },
};

// Mapeo para imágenes generales
const GENERAL_FILES = {
  logo: "pelota2.png",
  "liga-mx": "liga-mx.svg",
  "liga-mx-f": "liga-mx-f.png",
  laliga: "la-liga.svg",
  "premier-league": "premier-league.svg",
  "ligue-1": "ligue-1.svg",
  champions: "uefa-champions.svg",
};

// Obtiene logos
export const getTeamLogo = (teamName, league = null) => {
  if (!teamName || typeof teamName !== "string") return null;

  const directKey = teamName.toLowerCase().trim();
  if (GENERAL_FILES[directKey]) {
    const fileName = GENERAL_FILES[directKey];
    return archivosGenerales[fileName.toLowerCase()] || null;
  }

  // Elimina minúsculas, acentos/caracteres raros, trim
  const normalized = normalizarTexto(teamName);

  // Elimina stop-words sin vaciar el término si coincide exactamente
  const words = normalized.split(/\s+/);
  const cleanWords = words.filter((word) => !STOP_WORDS.has(word));
  const teamKey = cleanWords.length > 0 ? cleanWords.join(" ") : normalized;

  // Si coincide con elemento general en la raíz
  if (GENERAL_FILES[teamKey]) {
    const fileName = GENERAL_FILES[teamKey];
    return archivosGenerales[fileName.toLowerCase()] || null;
  }

  // Si se envió una liga específica, buscar directamente ahí
  if (league) {
    const ligaKey = normalizarLiga(league);
    const fileName = TEAM_LOGO_FILES[ligaKey]?.[teamKey];
    if (fileName && archivosPorLiga[ligaKey]?.[fileName.toLowerCase()]) {
      return archivosPorLiga[ligaKey][fileName.toLowerCase()];
    }
  }

  // Búsqueda automática en todas las ligas disponibles
  for (const [ligaKey, equipos] of Object.entries(TEAM_LOGO_FILES)) {
    const fileName = equipos[teamKey];
    if (fileName && archivosPorLiga[ligaKey]?.[fileName.toLowerCase()]) {
      return archivosPorLiga[ligaKey][fileName.toLowerCase()];
    }
  }

  return null;
};
