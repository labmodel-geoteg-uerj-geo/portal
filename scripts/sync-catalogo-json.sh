#!/bin/bash
DEST="/var/www/ide/public/js/catalogo.json"
mkdir -p "$(dirname "$DEST")"
TMP="/tmp/catalogo_new.json"
if curl -sf "http://127.0.0.1:9000/api/catalogo" -o "$TMP" && python3 -m json.tool "$TMP" > /dev/null 2>&1; then
  mv "$TMP" "$DEST"
  chmod 644 "$DEST"
fi
