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
  america: "america.svg",
  atlante: "atlante.svg",
  atlas: "atlas.svg",
  "atletico san luis": "atletico-san-luis.svg",
  chivas: "chivas.svg",
  "cruz azul": "cruz-azul.svg",
  "guadalajara w": "chivas.svg",
  juarez: "juarez.svg",
  leon: "leon.svg",
  monterrey: "monterrey.svg",
  necaxa: "necaxa.svg",
  pachuca: "pachuca.svg",
  puebla: "puebla.svg",
  pumas: "pumas.svg",
  queretaro: "queretaro.svg",
  santos: "santos.svg",
  "santos laguna": "santos.svg",
  tigres: "tigres.svg",
  "tigres uanl": "tigres.svg",
  tijuana: "tijuana.svg",
  toluca: "toluca.svg",
};

const TEAM_LOGO_FILES = {
  "liga-mx": equiposLigaMX,
  "liga-mx-f": equiposLigaMX,
  "la-liga": {
    alaves: "alaves.svg",
    almeria: "almeria.svg",
    athletic: "atc.svg",
    "atletico madrid": "atm.svg",
    barcelona: "barcelona.svg",
    cadiz: "cadiz.svg",
    celta: "celta.svg",
    coruna: "coruña.svg",
    elche: "elche.svg",
    espanyol: "espanyol.svg",
    getafe: "getafe.svg",
    girona: "girona.svg",
    granada: "granada.svg",
    leganes: "leganes.svg",
    levante: "levante.svg",
    malaga: "malaga.svg",
    mallorca: "mallorca.svg",
    osasuna: "osasuna.svg",
    oviedo: "oviedo.svg",
    palmas: "palmas.svg",
    "racing santander": "racing.svg",
    "rayo vallecano": "rayo.svg",
    "real betis": "betis.svg",
    "real madrid": "rma.svg",
    "real sociedad": "rso.svg",
    sevilla: "sevilla.svg",
    valencia: "valencia.svg",
    valladolid: "valladolid.svg",
    villarreal: "villarreal.svg",
  },
  "ligue-1": {
    ajaccio: "ajaccio.svg",
    angers: "angers.svg",
    auxerre: "auxerre.svg",
    brest: "brest.svg",
    clermont: "clermont.svg",
    etienne: "etienne.svg",
    havre: "havre.svg",
    lens: "lens.svg",
    lille: "lille.svg",
    lorient: "lorient.svg",
    lyon: "lyon.svg",
    mans: "mans.svg",
    marseille: "marseille.svg",
    metz: "metz.svg",
    monaco: "monaco.svg",
    montpellier: "montpellier.svg",
    nantes: "nantes.svg",
    nice: "nice.svg",
    paris: "paris.svg",
    psg: "psg.svg",
    reims: "reims.svg",
    rennes: "rennes.svg",
    strasbourg: "strasbourg.svg",
    toulouse: "toulouse.svg",
    troyes: "troyes.svg",
  },
  "premier-league": {
    arsenal: "arsenal.svg",
    "aston villa": "aston-villa.svg",
    brentford:"brentford.svg",
    brighton:"brighton.svg",
    bournemouth: "bournemouth.svg",
    chelsea: "chelsea.svg",
    coventry:"coventry.svg",
    "crystal palace":"crystal-palace.svg",
    ipswich:"ipswich.svg",
    liverpool: "liverpool.svg",
    "manchester city": "manchester-city.svg",
    "manchester united": "manchester-united.svg",
    newcastle: "newcastle.svg",
    sunderland: "sunderland.svg",
    tottenham: "tottenham.svg",
  },
  bundesliga: {
    "borussia dortmund": "borussia-dortmund.svg",
    "eintracht frankfurt": "eintracht-frankfurt.svg",
    "rb leipzig": "rb-leipzig.svg",
    "union berlin": "union-berlin.svg",
    "vfb stuttgart": "vfb-stuttgart.svg",
  },
  "serie-a": {
    "ac milan": "milan.svg",
    "as roma": "roma.svg",
    atalanta: "atalanta.svg",
    bologna: "bologna.svg",
    como: "como.svg",
    inter: "inter.svg",
    juventus: "juventus.svg",
    lazio: "lazio.svg",
    napoli: "napoli.svg",
  },
  champions: {
    "aek athens": "aek.svg",
    ajax: "ajax.svg",
    antwerp: "antwerp.svg",
    basel: "basel.svg",
    "bayer leverkusen": "bayer-leverkusen.svg",
    "bayern munchen": "bayern-munich.svg",
    benfica: "benfica.svg",
    "bodo/glimt": "bodo-glimt.svg",
    braga: "sc-braga.svg",
    brugge: "club-brugge.svg",
    celje: "celje.svg",
    celtic: "celtic.svg",
    copenhagen: "copenhagen.svg",
    "crvena zvezda": "crvena-zvezda.svg",
    "dinamo zagreb": "dinamo.svg",
    "dynamo kyiv": "dynamo-kyiv.svg",
    fenerbahce: "fenerbahce.svg",
    ferencvaros: "ferencvaros.svg",
    feyenoord: "feyenoord.svg",
    galatasaray: "galatasaray.svg",
    "hapoel beer sheva": "hapoel-beer-sheva.svg",
    kairat: "kairat.svg",
    lask: "lask.svg",
    "lask linz": "lask.svg",
    "levski sofia": "levski.svg",
    "maccabi haifa": "maccabi-haifa.svg",
    "malmo ff": "malmo.svg",
    midtjylland: "midtjylland.svg",
    molde: "molde.svg",
    "nec nijmegen": "nec-nijmegen.svg",
    olympiacos: "olympiacos.svg",
    pafos: "pafos.svg",
    panathinaikos: "panathinaikos.svg",
    plzen: "viktoria-plzen.svg",
    porto: "porto.svg",
    "psv eindhoven": "psv.svg",
    qarabag: "qarabag.svg",
    "rakow czestochowa": "rakow.svg",
    rangers: "rangers.svg",
    "red bull salzburg": "salzburg.svg",
    sabah: "sabah.svg",
    "shakhtar donetsk": "shakhtar.svg",
    "slavia praha": "slavia-praha.svg",
    "slovan bratislava": "s-bratislava.svg",
    "sparta praha": "sparta-praha.svg",
    "sporting cp": "sporting-cp.svg",
    "sturm graz": "sturm-graz.svg",
    trabzonspor: "trabzonspor.svg",
    "union saint gilloise": "union-saint-gilloise.svg",
    viking: "viking.svg",
    "young boys": "young-boys.svg",
  },
};

// Mapeo para imágenes generales
const GENERAL_FILES = {
  champions: "uefa-champions.svg",
  bundesliga: "bundesliga.svg",
  laliga: "la-liga.svg",
  "liga-mx": "liga-mx.svg",
  "liga-mx-f": "liga-mx-f.png",
  "ligue-1": "ligue-1.svg",
  logo: "pelota2.png",
  "premier-league": "premier-league.svg",
  "serie-a": "serie-a.svg",
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
