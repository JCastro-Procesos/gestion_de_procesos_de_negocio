#!/usr/bin/env bash
# Construye el paquete de publicación de ProcessOne en ./release/
# Uso: deploy/build-package.sh <release_id>
# No usa credenciales ni contacta el servidor.
set -euo pipefail

RELEASE_ID="${1:?Falta release_id}"
DESTINO="${2:-produccion}"   # produccion | pruebas
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

test -d dist-hostinger || { echo "::error::Falta dist-hostinger (compila primero)"; exit 1; }

rm -rf release
mkdir -p release/site
cp -a dist-hostinger/. release/site/

# Reglas Apache para la SPA (idénticas a las publicadas hoy).
cat > release/site/.htaccess <<'EOF'
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
EOF

if [ "$DESTINO" = "pruebas" ]; then
  # Entorno de pruebas: no indexable por buscadores.
  cat >> release/site/.htaccess <<'EOF'
<IfModule mod_headers.c>
  Header set X-Robots-Tag "noindex, nofollow"
</IfModule>
EOF
  printf 'User-agent: *\nDisallow: /\n' > release/site/robots.txt
fi

# API PHP: solo index.php. setup.php NUNCA se distribuye.
mkdir -p release/site/api
cp server/api/index.php release/site/api/index.php

# Identificador de versión (sin datos sensibles) para verificar la publicación.
COMMIT="$(git rev-parse HEAD 2>/dev/null || echo desconocido)"
printf '{"release":"%s","commit":"%s","environment":"%s","built_at":"%s"}\n' \
  "$RELEASE_ID" "$COMMIT" "$DESTINO" "$(date -u +%Y-%m-%dT%H:%M:%SZ)" > release/site/version.json

bash deploy/check-package.sh release/site

tar -C release/site -czf "release/processone-${RELEASE_ID}.tar.gz" .
( cd release && sha256sum "processone-${RELEASE_ID}.tar.gz" > "processone-${RELEASE_ID}.tar.gz.sha256" )
echo "Paquete listo: release/processone-${RELEASE_ID}.tar.gz"
