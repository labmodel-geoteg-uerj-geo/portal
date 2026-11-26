#!/bin/bash
set -e
REPO_DIR="/var/www/ide"
CATALOGO_LOCAL="$REPO_DIR/public/js/catalogo.json"
CATALOGO_TMP="/tmp/catalogo_preserve.json"

[ -f "$CATALOGO_LOCAL" ] && cp "$CATALOGO_LOCAL" "$CATALOGO_TMP"

cd "$REPO_DIR"
git fetch origin main --quiet
LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse origin/main)

if [ "$LOCAL" != "$REMOTE" ]; then
  git reset --hard origin/main --quiet
  [ -f "$CATALOGO_TMP" ] && cp "$CATALOGO_TMP" "$CATALOGO_LOCAL"
  chmod -R 755 "$REPO_DIR/public"
  echo "$(date '+%Y-%m-%d %H:%M:%S') - Portal atualizado do GitHub ($REMOTE)" >> /var/log/sync-portal-ide.log
fi
