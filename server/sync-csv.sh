#!/bin/bash

echo "=========================================="
echo "    VERIFICADOR Y SINCRONIZADOR DE CSVs    "
echo "=========================================="

# Agrega o modifica ligas: nombre|origen|destino
DATASETS=(
    "LIGA MX|/app/server/historial_ligamx_2023.csv|/data/historial_ligamx_2023.csv"
    "LIGA MX FEMENIL|/app/server/data/liga-mx-f/historial_ligamx_F.csv|/data/liga-mx-f/historial_ligamx_F.csv"
    "LA LIGA|/app/server/data/laliga/historial_laliga.csv|/data/laliga/historial_laliga.csv"
    "LIGUE 1|/app/server/data/ligue-1/historial_ligue1.csv|/data/ligue-1/historial_ligue1.csv"
    "PREMIER LEAGUE|/app/server/data/premier-league/historial_premier.csv|/data/premier-league/historial_premier.csv"
    "BUNDESLIGA|/app/server/data/bundesliga/historial_bundesliga.csv|/data/bundesliga/historial_bundesliga.csv"
    "SERIE A|/app/server/data/serie-a/historial_seriea.csv|/data/serie-a/historial_seriea.csv"
    "UEFA CHAMPIONS|/app/server/data/champions/historial_champions.csv|/data/champions/historial_champions.csv"
    "UEFA CONFERENCE|/app/server/data/conference-league/historial_conference_league.csv|/data/conference-league/historial_conference_league.csv"
    "UEFA EUROPA LEAGUE|/app/server/data/europa-league/historial_europa_league.csv|/data/europa-league/historial_europa_league.csv"
)

sync_dataset() {
    local name="$1"
    local source="$2"
    local destination="$3"
    local response
    local compare_status

    echo ""
    echo "[$current / $total] $name"

    if [ ! -f "$source" ]; then
        echo "  -> ERROR: No se encontró el archivo de origen ($source)"
        echo "  -> Se omite este archivo; no se intentará copiar."
        return 1
    fi

    echo "  -> Versión App (GitHub): $(wc -l < "$source") saltos de línea"

    if [ -f "$destination" ]; then
    echo "  -> Versión Railway (/data): $(wc -l < "$destination") saltos de línea"
        if cmp -s "$source" "$destination"; then
            echo "  -> Los archivos son idénticos."
        else
        compare_status=$?
        if [ "$compare_status" -eq 1 ]; then
            echo "  -> Los archivos tienen diferencias."
        else
            echo "  -> ERROR: No se pudieron comparar los archivos."
            return 1
        fi
        fi
    else
        echo "  -> No existe aún en /data ($destination)"
    fi

    if ! read -r -p "¿Deseas copiar/homologar $name de GitHub a Railway? (s/n): " response; then
        echo ""
        echo "  -> No se recibió respuesta; se omite."
        return 0
    fi

    if [[ ! "$response" =~ ^[sS]$ ]]; then
        echo "  -> Omitido."
        return 0
    fi

    if ! mkdir -p "$(dirname "$destination")"; then
        echo "  -> ERROR: No se pudo crear el directorio de destino."
        return 1
    fi

    if ! cp "$source" "$destination"; then
        echo "  -> ERROR: No se pudo copiar el archivo."
        return 1
    fi

    if cmp -s "$source" "$destination"; then
        :
    else
        compare_status=$?
        if [ "$compare_status" -eq 1 ]; then
            echo "  -> ERROR: La verificación posterior a la copia no coincide."
        else
            echo "  -> ERROR: No se pudo verificar el archivo copiado."
        fi
        return 1
    fi

    echo "  -> Archivo copiado y verificado con éxito."
}

total=${#DATASETS[@]}
failures=0

for index in "${!DATASETS[@]}"; do
    IFS='|' read -r name source destination <<< "${DATASETS[$index]}"
    current=$((index + 1))

    if ! sync_dataset "$name" "$source" "$destination"; then
        failures=$((failures + 1))
    fi
done

echo ""
if [ "$failures" -gt 0 ]; then
    echo "Proceso finalizado con $failures error(es)."
    exit 1
fi

echo "Proceso finalizado sin errores."
