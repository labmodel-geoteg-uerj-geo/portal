#!/bin/bash
set -e

DATA=$(date +%Y%m%d_%H%M)
BKP_ROOT="/root/backups"
WORK_BKP="$BKP_ROOT/backup_privado_ide_${DATA}"
KIT_WORK="/tmp/kit_ciencia_aberta_${DATA}"
PUBLIC_DL="/var/www/ide/public/downloads"

mkdir -p "$WORK_BKP" "$KIT_WORK/templates" "$KIT_WORK/scripts" "$KIT_WORK/portal_public" "$PUBLIC_DL"

echo "[1/5] Exportando banco de dados PostGIS (dump completo + schema limpo)..."
PG_CONT=$(docker ps --format '{{.Names}}' | grep -iE 'postgis|postgres' | head -n 1 || true)
if [ -n "$PG_CONT" ]; then
  docker exec "$PG_CONT" pg_dumpall -U postgres > "$WORK_BKP/postgis_completo.sql"
  docker exec "$PG_CONT" pg_dump -U postgres --schema-only ide > "$KIT_WORK/templates/schema_ide.sql" 2>/dev/null || true
else
  sudo -u postgres pg_dumpall > "$WORK_BKP/postgis_completo.sql" 2>/dev/null || true
  sudo -u postgres pg_dump --schema-only ide > "$KIT_WORK/templates/schema_ide.sql" 2>/dev/null || true
fi

echo "[2/5] Copiando GeoServer data_dir, Nginx, FastAPI e Docker..."
cp -r /etc/nginx/sites-available "$WORK_BKP/nginx_sites_available"
cp -r /var/www/ide/public "$WORK_BKP/portal_public"

GS_DATA=$(docker inspect geoserver --format '{{range .Mounts}}{{if eq .Destination "/opt/geoserver_data"}}{{.Source}}{{end}}{{end}}' 2>/dev/null || true)
if [ -z "$GS_DATA" ]; then
  GLOBAL_F=$(find / -name "global.xml" 2>/dev/null | grep "geoserver" | head -n 1 || true)
  [ -n "$GLOBAL_F" ] && GS_DATA=$(dirname "$GLOBAL_F")
fi
[ -n "$GS_DATA" ] && cp -r "$GS_DATA" "$WORK_BKP/geoserver_data_dir"

find /opt /root /srv /home -maxdepth 4 \( -name "docker-compose*.yml" -o -name "main.py" -o -name "requirements.txt" -o -name "*.service" \) \
  ! -path "/root/backups/*" -exec cp --parents {} "$WORK_BKP/" \; 2>/dev/null || true

docker ps -a --format "table {{.Names}}\t{{.Image}}\t{{.Ports}}\t{{.Status}}" > "$WORK_BKP/inventario_containers.txt"
uname -a > "$WORK_BKP/inventario_sistema.txt"
df -h >> "$WORK_BKP/inventario_sistema.txt"
free -h >> "$WORK_BKP/inventario_sistema.txt"

echo "[3/5] Compactando Backup Privado Administrativo..."
tar -czf "$BKP_ROOT/backup_privado_ide_${DATA}.tar.gz" -C "$BKP_ROOT" "backup_privado_ide_${DATA}"
rm -rf "$WORK_BKP"

echo "[4/5] Montando Kit Sanitizado de Ciência Aberta..."
cp -r /var/www/ide/public/* "$KIT_WORK/portal_public/" 2>/dev/null || true
rm -rf "$KIT_WORK/portal_public/downloads"
find "$KIT_WORK/portal_public" -name "*.html" -exec sed -i 's|https://ide-labmodel-geoteg-uerj.com.br|__IDE_BASE_URL__|g' {} +

echo "[5/5] Empacotando Kit de Ciência Aberta em $PUBLIC_DL..."
(cd "$KIT_WORK" && tar -czf "$PUBLIC_DL/ide-labmodel-open-science-kit.tar.gz" .)
chmod 644 "$PUBLIC_DL/ide-labmodel-open-science-kit.tar.gz"
rm -rf "$KIT_WORK"

ls -lh "$BKP_ROOT/backup_privado_ide_${DATA}.tar.gz"
ls -lh "$PUBLIC_DL/ide-labmodel-open-science-kit.tar.gz"
