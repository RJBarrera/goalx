DEFAULT_COMPETITION_ID = "liga-mx"

COMPETITIONS = {
    "liga-mx": {
        "id": "liga-mx",
        "name": "Liga MX",
        "short_name": "Liga MX",
        "country": "México",
        "type": "league",
        "enabled": True,
        "default": True,
        "sportsdb_league_id": 4350,
        "api_football_league_id": 262,
        "timezone": "America/Mazatlan",
        "round_label": "Jornada",
        "next_scope_label": "Próxima jornada",
        "upcoming_scope_label": "Próximos partidos",
        "season_mode": "split_calendar",
        "dataset_sync_enabled": True,
        "model_min_matches": 20,
        "seed_history_filename": "historial_ligamx_2023.csv",
        "history_filename": "historial.csv",
        "seed_highlights_filename": "season_highlights.json",
        "highlights_filename": "season_highlights.json",
        "seed_streams_filename": "match_streams.json",
        "streams_filename": "match_streams.json",
    },
    "champions": {
        "id": "champions",
        "name": "UEFA Champions League",
        "short_name": "Champions",
        "country": "Europa",
        "type": "cup",
        "enabled": True,
        "default": False,
        "sportsdb_league_id": 4480,
        "api_football_league_id": 2,
        "timezone": "America/Mazatlan",
        "round_label": "Jornada",
        "next_scope_label": "Siguiente ronda",
        "upcoming_scope_label": "Próximos partidos",
        "season_mode": "european",
        "dataset_sync_enabled": True,
        "model_min_matches": 30,
        "seed_history_filename": "historial_champions.csv",
        "history_filename": "historial.csv",
        "seed_highlights_filename": "season_highlights_champions.json",
        "highlights_filename": "season_highlights.json",
        "seed_streams_filename": "match_streams_champions.json",
        "streams_filename": "match_streams.json",
    },
}

TEAM_EQUIVALENCES = {
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
