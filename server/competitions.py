# Valores por defecto
DEFAULT_CONFIG = {
    "timezone": "America/Mazatlan",
    "round_label": "Jornada",
    "next_scope_label": "Próxima jornada",
    "upcoming_scope_label": "Próximos partidos",
    "dataset_sync_enabled": True,
    "highlights_filename": "season_highlights.json",
    "streams_filename": "match_streams.json",
    "enabled": True,
    "default": False,
}

def _build_competition(
    comp_id, name, short_name, country, type_, sportsdb_id, api_football_id,
    season_mode, model_min_matches, suffix, is_default=False,
    team_context_group="men"
):
    """Auxiliar para generar el diccionario completo heredando los defaults."""
    config = DEFAULT_CONFIG.copy()
    config.update({
        "id": comp_id,
        "name": name,
        "short_name": short_name,
        "country": country,
        "type": type_,
        "default": is_default,
        "team_context_group": team_context_group,
        "sportsdb_league_id": sportsdb_id,
        "api_football_league_id": api_football_id,
        "season_mode": season_mode,
        "model_min_matches": model_min_matches,
        "seed_history_filename": f"historial_{suffix}.csv",
        "history_filename": f"historial_{suffix}.csv",
        "seed_highlights_filename": f"season_highlights_{suffix}.json",
        "seed_streams_filename": f"match_streams_{suffix}.json",
    })
    return config

# Diccionario final
COMPETITIONS = {
    "liga-mx": _build_competition(
        "liga-mx", "Liga MX", "Liga MX", "México", "league", 
        4350, 262, "split_calendar", 20, "ligamx_2023", is_default=True
    ),
    "liga-mx-f": _build_competition(
        "liga-mx-f", "Liga MX Femenil", "Liga MX Femenil", "México", "league", 
        5206, 673, "split_calendar", 20, "ligamx_F", is_default=True,
        team_context_group="women"
    ),
    "laliga": _build_competition(
        "laliga", "La Liga", "La Liga", "España", "league", 
        4335, 140, "european", 30, "laliga"
    ),
    "premier-league": _build_competition(
        "premier-league", "Premier League", "Premier", "Inglaterra", "league", 
        4328, 39, "european", 30, "premier"
    ),
    "ligue-1": _build_competition(
        "ligue-1", "Ligue 1", "Ligue 1", "Francia", "league", 
        4334, 61, "european", 30, "ligue1"
    ),
    "bundesliga": _build_competition(
        "bundesliga", "Bundesliga", "Bundesliga", "Alemania", "league", 
        4331, 78, "european", 30, "bundesliga"
    ),
    "serie-a": _build_competition(
        "serie-a", "Serie A", "Serie A", "Italia", "league", 
        4332, 135, "european", 30, "seriea"
    ),
    "europa-league": _build_competition(
        "europa-league", "UEFA Europa League", "Europa League", "Europa", "cup", 
        4481, 3, "european", 20, "europa_league"
    ),
    "conference-league": _build_competition(
        "conference-league", "UEFA Conference League", "Conference League", "Europa", "cup", 
        5071, 848, "european", 20, "conference_league"
    ),
    "champions": _build_competition(
        "champions", "UEFA Champions League", "Champions", "Europa", "cup", 
        4480, 2, "european", 30, "champions"
    ),
}
