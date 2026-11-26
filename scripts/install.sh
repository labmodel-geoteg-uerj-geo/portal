#!/bin/bash
set -e
if [ ! -f .env ]; then
  echo "Erro: copie templates/.env.example para .env e edite suas variáveis antes de executar."
  exit 1
fi
source .env

echo "1. Preparando portal em $DIRETORIO_PORTAL..."
mkdir -p "$DIRETORIO_PORTAL"
cp -r portal/* "$DIRETORIO_PORTAL/"
find "$DIRETORIO_PORTAL" -name "*.html" -exec sed -i "s|https://ide-labmodel-geoteg-uerj.com.br|https://${DOMINIO_IDE}|g" {} +
find "$DIRETORIO_PORTAL" -name "*.html" -exec sed -i "s|__IDE_BASE_URL__|https://${DOMINIO_IDE}|g" {} +
chmod -R 755 "$DIRETORIO_PORTAL"

echo "2. Subindo containers Docker (PostGIS, GeoServer, Pygeoapi, Pycsw)..."
cp templates/docker-compose.template.yml docker-compose.yml
docker compose up -d

echo "3. Aplicando correção crítica UTF-8 e numDecimals=8 no global.xml do GeoServer..."
sleep 25
bash scripts/fix-geoserver-global-xml.sh

echo "4. Gerando configuração do Nginx para $DOMINIO_IDE..."
sed -e "s|__DOMINIO_IDE__|${DOMINIO_IDE}|g" \
    -e "s|__DIRETORIO_PORTAL__|${DIRETORIO_PORTAL}|g" \
    -e "s|__LIMITE_UPLOAD_MB__|${LIMITE_UPLOAD_MB}|g" \
    templates/nginx.conf.template > "/etc/nginx/sites-available/${DOMINIO_IDE}"
ln -sf "/etc/nginx/sites-available/${DOMINIO_IDE}" "/etc/nginx/sites-enabled/${DOMINIO_IDE}"
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

echo "Concluído! Emita o certificado SSL com: certbot --nginx -d ${DOMINIO_IDE} -m ${EMAIL_SSL} --agree-tos"
