#!/bin/bash
set -e
docker exec -i geoserver sh -c '
for f in $(find / -name "global.xml" 2>/dev/null); do
  sed -i "s|<charset/>|<charset>UTF-8</charset>|g" "$f"
  grep -q "<charset>" "$f" || sed -i "s|</settings>|  <charset>UTF-8</charset>\n  </settings>|g" "$f"
  if grep -q "<numDecimals>" "$f"; then
    sed -i "s|<numDecimals>.*</numDecimals>|<numDecimals>8</numDecimals>|g" "$f"
  else
    sed -i "s|</settings>|  <numDecimals>8</numDecimals>\n  </settings>|g" "$f"
  fi
done
'
docker restart geoserver
echo "GeoServer reiniciado com UTF-8 e numDecimals=8."
