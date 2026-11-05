from competitions import COMPETITIONS

DEFAULT_COMPETITION_ID = "liga-mx"

# Aqui se agregan para el buscador y seccion live
TEAM_EQUIVALENCES = {
    "Atlante FC": "Atlante",
    "Mazatlán": "Atlante",
    "Mazatlan": "Atlante",
    "Mazatlán FC": "Atlante",
    "Mazatlan FC": "Atlante",
    "Juarez": "FC Juarez",
    "Juárez": "FC Juarez",
    "Juárez FC": "FC Juarez",
    "Pumas UNAM": "U.N.A.M. - Pumas",
    "Pumas": "U.N.A.M. - Pumas",
    "América": "Club America",
    "America": "Club America",
    "CD Guadalajara": "Guadalajara Chivas",
    "Guadalajara": "Guadalajara Chivas",
    "Chivas": "Guadalajara Chivas",
    "Pachuca": "CF Pachuca",
    "Pachuca CF": "CF Pachuca",
    "Tijuana": "Club Tijuana",
    "Xolos": "Club Tijuana",
    "Queretaro": "Club Queretaro",
    "Querétaro": "Club Queretaro",
    "León": "Leon",
    "Atletico de San Luis": "Atletico San Luis",
}

LIGA_MX_F_EQUIVALENCIAS = {
    # "América W": "America",
    "América Femenil": "América W",
    # "Cruz Azul W": "Cruz Azul",
    "Cruz Azul Femenil": "Cruz Azul W",
    # "Atlas W": "Atlas",
    "Atlas Femenil": "Atlas W",
    # "Tijuana W": "Tijuana",
    "Tijuana Femenil": "Tijuana W",
    # "Necaxa W": "Necaxa",
    "Necaxa Femenil": "Necaxa W",
    # "Puebla W": "Puebla",
    "Puebla Femenil": "Puebla W",
    # "Santos Laguna W": "Santos Laguna",
    "Santos Laguna Femenil": "Santos Laguna W",
    # "Tigres UANL W": "Tigres UANL",
    "Tigres UANL Femenil": "Tigres UANL W",
    # "Atlético San Luis W": "Atlético San Luis",
    "Atlético San Luis Femenil": "Atlético San Luis W",
    "Atlético de San Luis Femenil": "Atlético San Luis W",
    # "Pachuca W": "Pachuca",
    "Pachuca Femenil": "Pachuca W",
    # "León W": "Leon W",
    "León Femenil": "León W",
    "Mazatlán W": "Atlante W",
    "Mazatlán Femenil": "Atlante W",
    # "Atlante W": "Atlante",
    "Atlante Femenil": "Atlante W",
    # "Juárez W": "Juarez",
    "Juárez Femenil": "Juárez W",
    # "Guadalajara W": "Chivas",
    # "Guadalajara Femenil": "Chivas",
    "CD Guadalajara Femenil": "Guadalajara W",
    # "Monterrey W": "Monterrey",
    "Monterrey Femenil": "Monterrey W",
    # "Pumas UNAM W": "Pumas UNAM",
    "Pumas UNAM Femenil": "Pumas UNAM W",
    # "Querétaro W": "Querétaro",
    "Querétaro Femenil": "Querétaro W",
    # "Toluca W": "Toluca",
    "Toluca Femenil": "Toluca W",
}

LALIGA_EQUIVALENCIAS = {
    "Atlético Madrid": "Atletico Madrid",
    "Athletic Bilbao": "Athletic Club",
    "Athletic Club Bilbao": "Athletic Club",
    "Deportivo Alavés": "Alaves",
    "Málaga": "Malaga",
    "Deportivo La Coruna": "Deportivo La Coruña",
    "Deportivo de A Coruña": "Deportivo La Coruña",
}

PREMIER_LEAGUE_EQUIVALENCIAS = {}

# Equipos que pueden aparecer en múltiples competiciones
EQUIVALENCIAS_GENERALES = {
    # Ligue 1
    "Paris Saint Germain": "PSG",
    "Paris Saint-Germain": "PSG",
    "Stade Brestois 29": "Brest",

    # Serie A
    "AC Milan": "Milan",
    "Roma": "AS Roma",
    "Como 1907": "Como",
    "Inter Milan": "Inter",
    "Napoli": "Napoli",

    # Bundesliga
    "Bayern Munich": "Bayern München",
    "SC Freiburg": "Freiburg",
    "1899 Hoffenheim": "Hoffenheim",

    # Europa League
    "Ferencvarosi TC": "Ferencvaros",
    "Olympiakos Piraeus": "Olympiacos",
    "Union St. Gilloise": "Union Saint-Gilloise",
}

# Equivalencias específicas de Ligue 1
LIGUE1_EQUIVALENCIAS = EQUIVALENCIAS_GENERALES | {
    "Estac Troyes": "Troyes",
    "Saint Etienne": "Etienne",
}

BUNDESLIGA_EQUIVALENCIAS = EQUIVALENCIAS_GENERALES | {
    "1. FC Köln": "FC Köln",
    "Borussia Monchengladbach": "Borussia Mönchengladbach",
    "FC Schalke 04": "Schalke 04",
    "FSV Mainz 05": "Mainz 05",
    "Hamburger SV": "Hamburger",
    "SC Paderborn 07": "Paderborn", "":""
}

SERIE_A_EQUIVALENCIAS = EQUIVALENCIAS_GENERALES | {
    "AC Monza": "Monza",
}

CONFERENCE_EQUIVALENCIAS = EQUIVALENCIAS_GENERALES | {
    "Aarhus": "AGF",
    "Egnatia Rrogozhinë": "Egnatia",
    "FC Iberia 1999": "Iberia",
    "FC Lugano": "Lugano",
    "FC Thun": "Thun",
    "FK Crvena Zvezda": "Crvena Zvezda",
    "FK Jablonec": "Jablonec",
    "Gent": "KAA Gent",
    "Heart Of Midlothian": "Hearts",
    "HNK Hajduk Split": "Hajduk Split",
    "Inter Club d'Escaldes": "Inter Escaldes",
    "Kairat Almaty": "Kairat",
    "Mjallby AIF": "Mjällby",
    "SC Braga": "Braga",
    "St. Truiden": "Sint Truidense VV",
}

EUROPA_LEAGUE_EQUIVALENCIAS = EQUIVALENCIAS_GENERALES | {
    "Ararat-Armenia": "Ararat Armenia",
    "Beşiktaş": "Besiktas",
    "Omonoia Nicosia": "Omonia Nicosia",
}


# Equivalencias específicas de Champions
CHAMPIONS_EQUIVALENCIAS = EQUIVALENCIAS_GENERALES | {
    "AEK Athens FC": "AEK Athens",
    "BSC Young Boys": "Young Boys",
    "Bodø/Glimt": "Bodo/Glimt",
    "Club Brugge KV": "Club Brugge",
    "FC Basel 1893": "Basel",
    "FC Copenhagen": "Copenhagen",
    "FC Midtjylland": "Midtjylland",
    "FC Porto": "Porto",
    "FK Crvena Zvezda": "Crvena Zvezda",
    "Fenerbahçe": "Fenerbahce",
    "Kairat Almaty": "Kairat",
    "Lask Linz": "LASK",
    "Raków Częstochowa": "Rakow Czestochowa",
    "Sabah FA": "Sabah",
    "SC Braga": "Braga",
}


# Equivalencias (Para busquedas rapidas)
COMPETITION_EQUIVALENCES = {
    "liga-mx": TEAM_EQUIVALENCES,
    "liga-mx-f": LIGA_MX_F_EQUIVALENCIAS,
    "laliga": LALIGA_EQUIVALENCIAS,
    "ligue-1": LIGUE1_EQUIVALENCIAS,
    # "premier-league": PREMIER_LEAGUE_EQUIVALENCIAS,
    "bundesliga": BUNDESLIGA_EQUIVALENCIAS,
    "serie-a": SERIE_A_EQUIVALENCIAS,
    "champions": CHAMPIONS_EQUIVALENCIAS,
    "conference-league": CONFERENCE_EQUIVALENCIAS,
    "europa-league": EUROPA_LEAGUE_EQUIVALENCIAS,
}

# ALIAS
TEAM_ALIASES = {
    "club america": "america",
    "america": "america",
    "cf america": "america",
    "pumas unam": "pumas",
    "unam pumas": "pumas",
    "unam": "pumas",
    "u n a m pumas": "pumas",
    "guadalajara": "chivas",
    "cd guadalajara": "chivas",
    "guadalajara chivas": "chivas",
    "chivas": "chivas",
    "fc juarez": "juarez",
    "juarez": "juarez",
    "club tijuana": "tijuana",
    "tijuana": "tijuana",
    "atletico san luis": "san luis",
    "san luis": "san luis",
    "club leon": "leon",
    "leon": "leon",
    "cf pachuca": "pachuca",
    "pachuca": "pachuca",
    "club necaxa": "necaxa",
    "necaxa": "necaxa",
    "club puebla": "puebla",
    "puebla": "puebla",
    "club queretaro": "queretaro",
    "queretaro": "queretaro",
    "santos laguna": "santos",
    "santos": "santos",
    "tigres uanl": "tigres",
    "tigres": "tigres",
    "toluca": "toluca",
    "deportivo toluca": "toluca",
    "cruz azul": "cruz azul",
    "atlas": "atlas",
    "monterrey": "monterrey",
    "rayados": "monterrey",
    "rayados de monterrey": "monterrey",
    "mazatlan": "atlante",
    "mazatlan fc": "atlante",
    "atlante": "atlante",
}

LIGA_MX_F_TEAM_ALIASES = {
    "América W": "America",
    "Cruz Azul W": "Cruz Azul",
    "Atlas W": "Atlas",
    "Tijuana W": "Tijuana",
    "Necaxa W": "Necaxa",
    "Puebla W": "Puebla",
    "Santos Laguna W": "Santos Laguna",
    "Tigres UANL W": "Tigres UANL",
    "Atlético San Luis W": "Atletico San Luis",
    "Pachuca W": "Pachuca",
    "León W": "Leon",
    "Mazatlán W": "Atlante",
    "Atlante W": "Atlante",
    "Juárez W": "Juarez",
    # "Guadalajara W": "Guadalajara",
    "Guadalajara W": "Chivas",
    "Monterrey W": "Monterrey",
    "Pumas UNAM W": "Pumas UNAM",
    "Querétaro W": "Querétaro",
    "Toluca W": "Toluca",
}

EUROPE_TEAM_ALIASES = {
    "arsenal fc": "arsenal",
    "arsenal": "arsenal",
    "atletico de madrid": "atletico madrid",
    "atletico madrid": "atletico madrid",
    "atalanta bc": "atalanta",
    "atalanta": "atalanta",
    "bayer 04 leverkusen": "bayer leverkusen",
    "bayer leverkusen": "bayer leverkusen",
    "bayern munich": "bayern",
    "bayern munchen": "bayern",
    "fc bayern munich": "bayern",
    "fc bayern munchen": "bayern",
    "barcelona": "barcelona",
    "fc barcelona": "barcelona",
    "benfica": "benfica",
    "sl benfica": "benfica",
    "borussia dortmund": "dortmund",
    "dortmund": "dortmund",
    "chelsea": "chelsea",
    "chelsea fc": "chelsea",
    "club brugge": "club brugge",
    "club brugge kv": "club brugge",
    "inter": "inter",
    "inter milan": "inter",
    "internazionale": "inter",
    "juventus": "juventus",
    "juventus fc": "juventus",
    "liverpool": "liverpool",
    "liverpool fc": "liverpool",
    "manchester city": "manchester city",
    "man city": "manchester city",
    "marseille": "marseille",
    "olympique marseille": "marseille",
    "monaco": "monaco",
    "as monaco": "monaco",
    "napoli": "napoli",
    "ssc napoli": "napoli",
    "newcastle": "newcastle",
    "newcastle united": "newcastle",
    "olympiacos": "olympiacos",
    "olympiakos": "olympiacos",
    "paris saint germain": "psg",
    "paris sg": "psg",
    "psg": "psg",
    "psv": "psv",
    "psv eindhoven": "psv",
    "qarabag": "qarabag",
    "qarabag fk": "qarabag",
    "real madrid": "real madrid",
    "real madrid cf": "real madrid",
    "slavia prague": "slavia prague",
    "slavia praha": "slavia prague",
    "sporting cp": "sporting",
    "sporting lisbon": "sporting",
    "tottenham": "tottenham",
    "tottenham hotspur": "tottenham",
    "villarreal": "villarreal",
    "villarreal cf": "villarreal",
}

# Alias (Para busquedas rapidas)
COMPETITION_ALIASES = {
    "liga-mx": TEAM_ALIASES,
    "liga-mx-f": LIGA_MX_F_TEAM_ALIASES,
    "champions": EUROPE_TEAM_ALIASES,
}


# Exclusiones (Equipos fuera de liga)
# LIGA_MX_INACTIVE_TEAMS = {"Mazatlán"}

LALIGA_INACTIVE_TEAMS = {
    "Almeria",
    "Cadiz",
    "Girona",
    "Granada CF",
    "Las Palmas",
    "Leganes",
    "Mallorca",
    "Oviedo",
    "Valladolid",
}

LIGUE1_INACTIVE_TEAMS = {
    "Ajaccio",
    "Clermont Foot",
    "Etienne",
    "Metz",
    "Montpellier",
    "Nantes",
    "Reims",
}

PREMIER_LEAGUE_INACTIVE_TEAMS = {
    "Burnley", "Leicester", "Luton", "Luton Town", "Sheffield Utd", "Sheffield United",
    "Southampton", "West Ham", "Wolves"
}

BUNDESLIGA_INACTIVE_TEAMS = {
    "1. FC Heidenheim", "FC Heidenheim", "FC St. Pauli", "Fortuna Dusseldorf",
    "Hertha Berlin", "Holstein Kiel", "SV Darmstadt 98", "Vfl Bochum", "VfL Wolfsburg"
}

SERIE_A_INACTIVE_TEAMS = {
    "Cremonese","Empoli","Hellas Verona", "Pisa", "Salernitana", "Sampdoria",
    "Spezia",
}

CHAMPIONS_INACTIVE_TEAMS = {
    "AC Milan",
    "Ajax",
    "Antwerp",
    "Atalanta",
    "Athletic Club",
    "Basel",
    "Bayer Leverkusen",
    "Benfica",
    "Bologna",
    "Braga",
    "Brest",
    "Celje",
    "Celtic",
    "Chelsea",
    "Copenhagen",
    "Crvena Zvezda",
    "Dinamo Zagreb",
    "Dynamo Kyiv",
    "Eintracht Frankfurt",
    "Ferencvaros",
    "Girona",
    "Hapoel Beer Sheva",
    "Juventus",
    "Kairat",
    "Lazio",
    "Levski Sofia",
    "Lyon",
    "Maccabi Haifa",
    "Malmo FF",
    "Marseille",
    "Midtjylland",
    "Molde",
    "Monaco",
    "NEC Nijmegen",
    "Newcastle",
    "Olympiacos",
    "Pafos",
    "Panathinaikos",
    "Plzen",
    "Qarabag",
    "Rakow Czestochowa",
    "Rangers",
    "Real Sociedad",
    "Red Bull Salzburg",
    "Sevilla",
    "Sparta Praha",
    "Sturm Graz",
    "Tottenham",
    "Trabzonspor",
    "Union Berlin",
    "Union Saint-Gilloise",
    "Young Boys",
}

CONFERENCE_LEAGUE_INACTIVE_TEAMS = {
    "1. FC Heidenheim", "1. FC Köln", "AEK Athens FC", "AEK Larnaca",
    "AIK Stockholm", "AZ Alkmaar", "Aberdeen", "Adana Demirspor",
    "Anderlecht", "Antwerp", "Apoel Nicosia", "Apollon Limassol",
    "Arda Kardzhali", "Aston Villa", "Austria Vienna", "BK Hacken",
    "BSC Young Boys", "Ballkani", "Baník Ostrava", "Bate Borisov",
    "Başakşehir", "Beşiktaş", "Bodo/Glimt", "Breidablik", "Brondby",
    "CFR 1907 Cluj", "Celje", "Cercle Brugge", "Chelsea", "Club Brugge KV",
    "Crystal Palace", "Cukaricki", "Dinamo Minsk", "Dinamo Tirana", "Dinamo Zagreb",
    "Djurgardens IF", "Dnipro-1", "Drita", "Dynamo Kyiv",
    "Eintracht Frankfurt", "F91 Dudelange", "FC Astana", "FC Basel 1893",
    "FC Differdange 03", "FC Noah", "FC ST. Gallen", "FC Sion",
    "FC Vaduz", "FCSB", "FK Partizan", "FK Tobol Kostanay",
    "FK Zalgiris Vilnius", "FSV Mainz 05", "Farul Constanta", "Fehérvár FC",
    "Fenerbahçe", "Ferencvarosi TC", "Fiorentina", "Fredrikstad",
    "GIL Vicente", "Genk", "Gornik Zabrze", "Gyori ETO FC",
    "HJK Helsinki", "HNK Rijeka", "Hamrun Spartans", "Hapoel Beer Sheva",
    "Hapoel Tel Aviv", "Hibernian", "Hradec Králové", "Inter Turku",
    "Jagiellonia", "KI Klaksvik", "Kilmarnock", "Kryvbas KR",
    "Larne", "Lask Linz", "Lausanne", "Lazio", "Lech Poznan", "Legia Warszawa",
    "Lens", "Levski Sofia", "Lille", "Linfield", "Ludogorets", "Maccabi Haifa",
    "Maccabi Tel Aviv", "Maribor", "Mlada Boleslav", "Molde", "Motherwell",
    "Neman", "Nice", "Olimpija Ljubljana", "Olympiakos Piraeus", "Omonia Nicosia",
    "Osasuna", "PAOK", "Paks", "Panevėžys", "Partizani", "Petrocub",
    "Plzen", "Polessya", "Puskas Academy", "Pyunik Yerevan", "Qarabag",
    "Raków Częstochowa", "Rangers", "Rapid Vienna", "Rayo Vallecano",
    "Real Betis", "Rosenborg", "Ružomberok", "Rīgas FS", "Samsunspor",
    "Santa Clara", "Sepsi OSK Sfantu Gheorghe", "Servette FC", "Shakhtar Donetsk",
    "Shamrock Rovers", "Shelbourne", "Sheriff Tiraspol", "Shkendija",
    "Shkupi 1927", "Sigma Olomouc", "Silkeborg", "Sivasspor", "Slavia Praha",
    "Slovan Bratislava", "Slovácko", "Sparta Praha", "Spartak Trnava",
    "St Patrick's Athl.", "Strasbourg", "Struga", "Sturm Graz", "TSC Backa Topola",
    "The New Saints", "Tromso", "UE Santa Coloma", "Union St. Gilloise",
    "Viborg", "Viking", "Vikingur Reykjavik", "Villarreal", "Virtus",
    "Vitória SC", "West Ham", "Wisla Krakow", "Wolfsberger AC", "Zira", "Zorya Luhansk", "Zrinjski",
}

EUROPA_LEAGUE_INACTIVE_TEAMS = {
    "AEK Athens FC", "AEK Larnaca", "AS Roma", "Aarhus",
    "Aberdeen", "Ajax", "Apoel Nicosia", "Apollon Limassol",
    "Aris", "Arsenal", "Aston Villa", "Atalanta",
    "Athletic Club", "Austria Vienna", "BK Hacken", "BSC Young Boys",
    "Barcelona", "Bodo/Glimt", "Bologna", "Borac Banja Luka",
    "Brann", "Brighton", "CSKA Sofia", "Cukaricki",
    "Dinamo Minsk", "Dnipro-1", "Dynamo Kyiv", "Egnatia Rrogozhinë",
    "Eintracht Frankfurt", "FC Basel 1893", "FC Iberia 1999", "FC Lugano",
    "FC Midtjylland", "FC Porto", "FC Thun", "FC Zurich",
    "FCSB", "FK Crvena Zvezda", "FK Zalgiris Vilnius", "Fenerbahçe",
    "Feyenoord", "GO Ahead Eagles", "Galatasaray", "Genk",
    "Gent", "HJK Helsinki", "HNK Rijeka", "Heart Of Midlothian",
    "IF Elfsborg", "KI Klaksvik", "Kairat Almaty", "Kauno Žalgiris",
    "KuPS", "Lask Linz", "Lazio", "Lens",
    "Lille", "Lincoln Red Imps FC", "Liverpool", "Ludogorets",
    "Maccabi Haifa", "Maccabi Tel Aviv", "Malmo FF", "Manchester United",
    "Mjallby AIF", "Molde", "Monaco", "Nantes",
    "Nice", "Nottingham Forest", "Olimpija Ljubljana", "PAOK",
    "PSV Eindhoven", "Panathinaikos", "Petrocub", "Pyunik Yerevan",
    "Qarabag", "Raków Częstochowa", "Rangers", "Rapid Vienna",
    "Real Betis", "Rīgas FS", "SC Braga", "SC Freiburg", "Freiburg",
    "Samsunspor", "Servette FC", "Sevilla", "Shakhtar Donetsk",
    "Shamrock Rovers", "Sheriff Tiraspol", "Shkendija", "Sigma Olomouc",
    "Silkeborg", "Sivasspor", "Slavia Praha", "Slovan Bratislava",
    "Sporting CP", "St. Truiden", "Sint-Truidense VV", "TSC Backa Topola", "Tottenham",
    "Toulouse", "Trabzonspor", "Twente", "Union Berlin",
    "Universitatea Craiova", "Utrecht", "VfB Stuttgart", "Villarreal",
    "West Ham", "Zorya Luhansk", "Zrinjski",
}

INACTIVE_TEAMS_BY_COMPETITION = {
    # "liga-mx": LIGA_MX_INACTIVE_TEAMS,
    # "liga-mx-f": LIGA_MX_F_INACTIVE_TEAMS,
    "laliga": LALIGA_INACTIVE_TEAMS,
    "ligue-1": LIGUE1_INACTIVE_TEAMS,
    "premier-league": PREMIER_LEAGUE_INACTIVE_TEAMS,
    "bundesliga": BUNDESLIGA_INACTIVE_TEAMS,
    "serie-a": SERIE_A_INACTIVE_TEAMS,
    "champions": CHAMPIONS_INACTIVE_TEAMS,
    "conference-league": CONFERENCE_LEAGUE_INACTIVE_TEAMS,
    "europa-league": EUROPA_LEAGUE_INACTIVE_TEAMS,
}


def get_competition(competition_id=None):
    competition_id = str(competition_id or DEFAULT_COMPETITION_ID).strip().lower()

    competition = COMPETITIONS.get(competition_id)

    if not competition or not competition.get("enabled", False):
        raise ValueError(f"La competición '{competition_id}' no está disponible.")

    return {
        **competition,
    }


def list_competitions():
    competitions = []

    for competition in COMPETITIONS.values():
        if not competition.get("enabled", False):
            continue

        competitions.append(
            {
                "id": competition["id"],
                "name": competition["name"],
                "short_name": competition["short_name"],
                "country": competition.get("country"),
                "type": competition.get("type", "league"),
                "round_label": competition.get("round_label", "Jornada"),
                "next_scope_label": competition.get(
                    "next_scope_label",
                    "Próxima jornada",
                ),
                "upcoming_scope_label": competition.get(
                    "upcoming_scope_label",
                    "Próximos partidos",
                ),
                "default": competition["id"] == DEFAULT_COMPETITION_ID,
            }
        )

    return competitions
