#!/usr/bin/env bash
# Pruebas de humo NO destructivas contra el sitio publicado (no inicia sesión ni escribe datos).
# Uso: deploy/smoke-test.sh <url_sitio> [release_id_esperado]
set -uo pipefail
URL="${1:?Falta URL}"; URL="${URL%/}"; EXPECT="${2:-}"
fail=0; ok() { echo "✅ $*"; }; ko() { echo "::error::❌ $*"; fail=1; }
get() { curl -sS -m 20 -o /tmp/body -w '%{http_code}' -H 'Cache-Control: no-cache' "$1?nc=$(date +%s%N)"; }

for i in 1 2 3; do code="$(get "$URL/version.json")"; [ "$code" = 200 ] && break; sleep 5; done
if [ -n "$EXPECT" ]; then
  grep -q "\"$EXPECT\"" /tmp/body && ok "version.json = $EXPECT" || ko "version.json no muestra $EXPECT (HTTP $code)"
fi

code="$(get "$URL/")";        [ "$code" = 200 ] && grep -q ProcessOne /tmp/body && ok "Sitio responde 200" || ko "Sitio: HTTP $code"
js="$(grep -oE '/assets/index-[^"]+\.js' /tmp/body | head -n1)"
if [ -n "$js" ]; then code="$(get "$URL$js")"; [ "$code" = 200 ] && ok "Bundle $js" || ko "Bundle $js: HTTP $code"; else ko "index.html sin bundle"; fi
code="$(get "$URL/api/index.php")"; [ "$code" = 401 ] && grep -q 'Inicia sesi' /tmp/body && ok "API conectada a MySQL (401 sin sesión)" || ko "API: HTTP $code $(head -c 120 /tmp/body)"
code="$(get "$URL/api/cells_v12.php")"; [ "$code" = 200 ] && grep -q "cells_v12" /tmp/body && ko "Código PHP de células expuesto" || { [ "$code" = 200 ] && ko "Archivo PHP de células accesible inesperadamente" || ok "Módulo PHP de células no expone código fuente (HTTP $code)"; }
code="$(get "$URL/api/setup.php")"; grep -q 'Activar administrador' /tmp/body && ko "setup.php está expuesto" || ok "setup.php no expuesto"
code="$(get "$URL/.htaccess")";    { [ "$code" = 403 ] || [ "$code" = 404 ]; } && ok ".htaccess protegido ($code)" || ko ".htaccess accesible ($code)"
code="$(get "$URL/version.json")"; grep -qiE 'password|bootstrap|secret' /tmp/body && ko "version.json contiene datos sensibles" || ok "Sin secretos expuestos"

exit "$fail"
