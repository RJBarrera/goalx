#!/bin/bash

echo "=========================================="
echo "    VERIFICADOR Y SINCRONIZADOR DE CSVs    "
echo "=========================================="


# --- 1. LIGA MX ---
echo ""
echo "[ 1 / 5 ] LIGA MX"
SRC_LIGA="/app/server/historial_ligamx_2023.csv"
DEST_LIGA="/data/historial_ligamx_2023.csv"

echo -n "  -> Versión App (GitHub): "
if [ -f "$SRC_LIGA" ]; then
    wc -l < "$SRC_LIGA" | xargs echo "líneas"
else
    echo "No encontrado ($SRC_LIGA)"
fi

echo -n "  -> Versión Railway (/data): "
if [ -f "$DEST_LIGA" ]; then
    wc -l < "$DEST_LIGA" | xargs echo "líneas"
else
    echo "No existe aún en /data"
fi

read -p "¿Deseas copiar/homologar el archivo de Liga MX de GitHub a Railway? (s/n): " resp_liga
if [[ "$resp_liga" =~ ^[sS]$ ]]; then
    mkdir -p "$(dirname "$DEST_LIGA")"
    cp "$SRC_LIGA" "$DEST_LIGA"
    echo "Archivo de Liga MX copiado con éxito."
else
    echo "Omitido."
fi


# --- 2. LIGA MX FEMENIL ---
echo ""
echo "[ 2 / 5 ] LIGA MX FEMENIL"
SRC_FEM="/app/server/data/liga-mx-f/historial_F.csv"
DEST_FEM="/data/liga-mx-f/historial_F.csv"

echo -n "  -> Versión App (GitHub): "
if [ -f "$SRC_FEM" ]; then
    wc -l < "$SRC_FEM" | xargs echo "líneas"
else
    echo "No encontrado ($SRC_FEM)"
fi

echo -n "  -> Versión Railway (/data): "
if [ -f "$DEST_FEM" ]; then
    wc -l < "$DEST_FEM" | xargs echo "líneas"
else
    echo "No existe aún en /data"
fi

read -p "¿Deseas copiar/homologar el archivo Femenil de GitHub a Railway? (s/n): " resp_fem
if [[ "$resp_fem" =~ ^[sS]$ ]]; then
    mkdir -p "$(dirname "$DEST_FEM")"
    cp "$SRC_FEM" "$DEST_FEM"
    echo "Archivo Liga MX Femenil copiado con éxito."
else
    echo "Omitido."
fi


# --- 3. LA LIGA ---
echo ""
echo "[ 3 / 5 ] LA LIGA"
SRC_LALIGA="/app/server/data/laliga/historial_laliga.csv"
DEST_LALIGA="/data/laliga/historial_laliga.csv"

echo -n "  -> Versión App (GitHub): "
if [ -f "$SRC_LALIGA" ]; then
    wc -l < "$SRC_LALIGA" | xargs echo "líneas"
else
    echo "No encontrado ($SRC_LALIGA)"
fi

echo -n "  -> Versión Railway (/data): "
if [ -f "$DEST_LALIGA" ]; then
    wc -l < "$DEST_LALIGA" | xargs echo "líneas"
else
    echo "No existe aún en /data"
fi

read -p "¿Deseas copiar/homologar el archivo La Liga de GitHub a Railway? (s/n): " resp_laliga
if [[ "$resp_laliga" =~ ^[sS]$ ]]; then
    mkdir -p "$(dirname "$DEST_LALIGA")"
    cp "$SRC_LALIGA" "$DEST_LALIGA"
    echo "Archivo La Liga copiado con éxito."
else
    echo "Omitido."
fi


# --- 4. LIGUE 1 ---
# echo ""
# echo "[ 4 / 5 ] LIGUE 1"
# SRC_LIGUE1="/app/server/data/ligue-1/historial_ligue1.csv"
# DEST_LIGUE1="/data/ligue-1/historial_ligue1.csv"

# echo -n "  -> Versión App (GitHub): "
# if [ -f "$SRC_LIGUE1" ]; then
#     wc -l < "$SRC_LIGUE1" | xargs echo "líneas"
# else
#     echo "No encontrado ($SRC_LIGUE1)"
# fi

# echo -n "  -> Versión Railway (/data): "
# if [ -f "$DEST_LIGUE1" ]; then
#     wc -l < "$DEST_LIGUE1" | xargs echo "líneas"
# else
#     echo "No existe aún en /data"
# fi

# read -p "¿Deseas copiar/homologar el archivo Ligue 1 de GitHub a Railway? (s/n): " resp_ligue1
# if [[ "$resp_ligue1" =~ ^[sS]$ ]]; then
#     mkdir -p "$(dirname "$DEST_LIGUE1")"
#     cp "$SRC_LIGUE1" "$DEST_LIGUE1"
#     echo "Archivo Ligue 1 copiado con éxito."
# else
#     echo "Omitido."
# fi


# # --- 5. PREMIER LEAGUE ---
# echo ""
# echo "[ 5 / 5 ] PREMIER LEAGUE"
# SRC_PREMIER="/app/server/data/premier-league/historial_premier.csv"
# DEST_PREMIER="/data/premier-league/historial_premier.csv"

# echo -n "  -> Versión App (GitHub): "
# if [ -f "$SRC_PREMIER" ]; then
#     wc -l < "$SRC_PREMIER" | xargs echo "líneas"
# else
#     echo "No encontrado ($SRC_PREMIER)"
# fi

# echo -n "  -> Versión Railway (/data): "
# if [ -f "$DEST_PREMIER" ]; then
#     wc -l < "$DEST_PREMIER" | xargs echo "líneas"
# else
#     echo "No existe aún en /data"
# fi

# read -p "¿Deseas copiar/homologar el archivo Premier League de GitHub a Railway? (s/n): " resp_premier
# if [[ "$resp_premier" =~ ^[sS]$ ]]; then
#     mkdir -p "$(dirname "$DEST_PREMIER")"
#     cp "$SRC_PREMIER" "$DEST_PREMIER"
#     echo "Archivo Premier League copiado con éxito."
# else
#     echo "Omitido."
# fi


echo ""
echo "Proceso finalizado."