#!/bin/bash


echo "=========================================="
echo "    VERIFICADOR Y SINCRONIZADOR DE CSVs   "
echo "=========================================="


# --- 1. LIGA MX ---
echo ""
echo "📌 [ 1 / 2 ] LIGA MX"
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
    echo "✅ Archivo de Liga MX copiado con éxito."
else
    echo "⏭️ Omitido."
fi




# --- 2. LIGA MX FEMENIL ---
echo ""
echo "📌 [ 2 / 2 ] LIGA MX FEMENIL"
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
    echo "✅ Archivo Femenil copiado con éxito."
else
    echo "⏭️ Omitido."
fi


echo ""
echo "✨ Proceso finalizado."