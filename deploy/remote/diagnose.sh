# shellcheck shell=bash
# Diagnóstico SOLO LECTURA del servidor. No crea, modifica ni borra nada.
# Argumentos: $1 = ruta de publicación propuesta (puede estar vacía)
TARGET="${1:-}"

log "Usuario: $(whoami) · HOME: $HOME"
log "PHP CLI: $(php -r 'echo PHP_VERSION;' 2>/dev/null || echo 'no disponible')"
for t in rsync tar gzip sha256sum mysqldump curl; do
  if command -v "$t" >/dev/null 2>&1; then log "Herramienta $t: disponible"; else log "Herramienta $t: NO disponible"; fi
done

log "Dominios en la cuenta:"
ls -1 "$HOME/domains" 2>/dev/null | sed 's/^/   - /' || log "   (no existe ~/domains)"

log "Directorios candidatos de ProcessOne:"
find "$HOME/domains" -maxdepth 4 -type d \( -name 'procesos*' -o -path '*procesos*.viajescasal.com/public_html' \) 2>/dev/null | while IFS= read -r d; do
  real="$(cd "$d" && pwd -P)"
  idx=no; api=no; po=no
  [ -f "$real/index.html" ] && idx=sí
  [ -f "$real/api/index.php" ] && api=sí
  grep -q 'ProcessOne' "$real/index.html" 2>/dev/null && po=sí
  allowed=no; po_allowed_path "$real" && allowed=sí
  log "   - $real | index.html:$idx api/index.php:$api ProcessOne:$po permitido:$allowed"
  [ -f "$real/api/setup.php" ] && log "     ¡ATENCIÓN! existe api/setup.php en $real"
  [ -f "$real/api/index.php" ] && log "     config usada por la API: $(po_config_path "$real/api/index.php")"
done

for cfg in "$HOME/processone-private/config.php" "$HOME/processone-privado/config.php"; do
  if [ -f "$cfg" ]; then
    log "Config $cfg: existe · permisos $(stat -c %a "$cfg") · base: $(po_db_name "$cfg")"
    case "$cfg" in "$HOME"/domains/*) log "   ¡ATENCIÓN! config dentro de domains";; esac
  else
    log "Config $cfg: no existe"
  fi
done

if [ -n "$TARGET" ]; then
  if ( po_guard_target "$TARGET" 0 ) ; then log "Ruta de publicación configurada: VÁLIDA ($TARGET)"; else log "Ruta de publicación configurada: NO VÁLIDA"; fi
fi

log "Respaldos existentes: $(ls -1 "$PO_BACKUPS" 2>/dev/null | wc -l)"
log "Espacio usado en HOME: $(du -sh "$HOME" 2>/dev/null | cut -f1)"
log "Diagnóstico terminado (sin cambios)."
