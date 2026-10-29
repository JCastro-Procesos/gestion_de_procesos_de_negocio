#!/usr/bin/env bash
# Verifica que un directorio de publicación solo contenga archivos permitidos
# y ningún secreto. Falla (exit 1) ante cualquier hallazgo.
# Uso: deploy/check-package.sh <directorio>
set -euo pipefail
DIR="${1:?Falta directorio}"
cd "$DIR"
fail=0

# 1) Lista blanca de rutas publicables.
while IFS= read -r f; do
  case "$f" in
    ./index.html|./.htaccess|./version.json|./api/index.php|./api/cells_v12.php|./api/initiative_details_v12.php|./api/strategy_v12.php|./api/project_strategy_v12.php) ;;
    ./assets/*.js|./assets/*.css|./assets/*.svg|./assets/*.png|./assets/*.jpg|./assets/*.webp|./assets/*.woff|./assets/*.woff2) ;;
    ./*.svg|./manus-routes.json|./favicon.ico|./robots.txt) ;;
    *) echo "::error::Archivo no permitido en el paquete: $f"; fail=1 ;;
  esac
done < <(find . -type f | sort)

# 2) Nombres prohibidos explícitos (doble control).
if find . \( -iname 'setup.php' -o -iname 'config.php' -o -iname '.env*' -o -iname '*.sql' \
  -o -iname '*.sql.gz' -o -iname '*.pem' -o -iname '*.key' -o -iname 'id_rsa*' -o -iname 'id_ed25519*' \
  -o -iname '*.bak' -o -iname '*.zip' -o -iname '*.tar*' -o -name '.git' -o -name 'node_modules' \) | grep -q .; then
  echo "::error::El paquete contiene archivos prohibidos"; fail=1
fi

# 3) Contenido sensible.
if grep -rlE -- '-----BEGIN [A-Z ]*PRIVATE KEY-----|bootstrap_token[[:space:]]*['"'"'"]?[[:space:]]*=>|rate_secret[[:space:]]*['"'"'"]?[[:space:]]*=>' . 2>/dev/null | grep -q .; then
  echo "::error::Posible secreto dentro del paquete"; fail=1
fi

# 4) Contenido mínimo obligatorio.
for req in index.html .htaccess api/index.php api/cells_v12.php api/initiative_details_v12.php api/strategy_v12.php api/project_strategy_v12.php version.json; do
  test -s "$req" || { echo "::error::Falta $req"; fail=1; }
done
grep -q 'ProcessOne' index.html || { echo "::error::index.html no corresponde a ProcessOne"; fail=1; }

if [ "$fail" -ne 0 ]; then exit 1; fi
echo "Paquete verificado: $(find . -type f | wc -l) archivos, sin secretos ni archivos prohibidos."
