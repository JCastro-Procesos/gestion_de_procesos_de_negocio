# shellcheck shell=bash
# Mantenimiento: restringe config.php de producción a permisos 600 (solo el dueño de la cuenta).
# Verifica la API tras el cambio; si falla, restaura el permiso anterior automáticamente.
# Argumentos: $1 = URL pública de producción
SITE="${1:?}"
CFG="$HOME/processone-private/config.php"
[ -f "$CFG" ] || die "No existe $CFG"

api_ok() {
  local body
  body="$(curl -sS -m 20 "${SITE%/}/api/index.php?nc=$(date +%s%N)" -w '\n%{http_code}' 2>/dev/null || true)"
  [ "$(printf '%s' "$body" | tail -n1)" = "401" ] && printf '%s' "$body" | grep -q 'Inicia sesi'
}

BEFORE="$(stat -c %a "$CFG")"
log "Permisos actuales de config.php: $BEFORE"
api_ok || die "La API no respondía correctamente ANTES del cambio: no se modifica nada"

if [ "$BEFORE" = "600" ]; then
  log "Ya tenía 600: nada que cambiar."
else
  chmod 600 "$CFG"
  sleep 2
  if api_ok; then
    log "Permisos cambiados $BEFORE -> 600 y la API sigue respondiendo correctamente."
  else
    chmod "$BEFORE" "$CFG"
    die "La API falló con 600; se restauró el permiso $BEFORE"
  fi
fi
DIR_MODE="$(stat -c %a "$HOME/processone-private")"
log "Carpeta processone-private: permisos $DIR_MODE (sin cambios)"
mkdir -p "$PO_BASE"; printf '%s\t%s\t%s\t%s\t%s\n' "$(date -u +%Y%m%dT%H%M%SZ)" "permisos-config" "$CFG" "$BEFORE->$(stat -c %a "$CFG")" "-" >> "$PO_BASE/history.tsv" || true
