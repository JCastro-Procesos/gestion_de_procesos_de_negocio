# shellcheck shell=bash
# Publicación controlada EN EL SERVIDOR. Sin borrados en el sitio, sin migraciones.
# Argumentos: $1 ruta destino · $2 release_id · $3 base de datos esperada · $4 permitir destino vacío (0/1)
TARGET="${1:?}"; RELEASE_ID="${2:?}"; EXPECTED_DB="${3:?}"; ALLOW_EMPTY="${4:-0}"

printf '%s' "$RELEASE_ID" | grep -Eq '^[A-Za-z0-9._-]{6,80}$' || die "release_id inválido"
case "$EXPECTED_DB" in
  u378754586_cotizador|u378754586_travelcrm) die "Base de datos de otro sistema: prohibido";;
esac

po_guard_target "$TARGET" "$ALLOW_EMPTY"
mkdir -p "$PO_BASE/incoming" "$PO_BASE/releases" "$PO_BACKUPS"
chmod 700 "$PO_BASE" "$PO_BACKUPS"

PKG="$PO_BASE/incoming/processone-${RELEASE_ID}.tar.gz"
[ -f "$PKG" ] && [ -f "$PKG.sha256" ] || die "No se recibió el paquete"
( cd "$PO_BASE/incoming" && sha256sum -c "processone-${RELEASE_ID}.tar.gz.sha256" >/dev/null ) || die "Checksum del paquete inválido"
log "1/6 Paquete recibido y verificado (sha256)."

REL="$PO_BASE/releases/$RELEASE_ID"
# Validar entradas del paquete antes de extraer.
tar -tzf "$PKG" | while IFS= read -r entry; do
  case "$entry" in /*|../*|*/../*|*/..|./../*) die "Ruta insegura en paquete";; esac
done
if tar -tvzf "$PKG" | grep -Eq '^[lh]'; then die "Enlaces no permitidos en el paquete"; fi
[ ! -e "$REL" ] || die "Identificador de versión ya existente"
mkdir -p "$REL"
tar -xzf "$PKG" -C "$REL" --no-same-owner --no-same-permissions
if find "$REL" \( -iname 'setup.php' -o -iname 'config.php' -o -iname '.env*' -o -iname '*.sql*' -o -iname '*.pem' -o -iname '*.key' \) | grep -q .; then
  die "El paquete contiene archivos prohibidos"
fi
grep -q 'ProcessOne' "$REL/index.html" || die "Paquete sin index.html de ProcessOne"
php -l "$REL/api/index.php" >/dev/null || die "Error de sintaxis PHP en el servidor"
CFG="$(po_config_path "$PO_TARGET" "$REL/api/index.php")"
[ -n "$CFG" ] && [ -f "$CFG" ] || die "La nueva API apunta a una configuración inexistente: $CFG"
case "$CFG" in "$HOME"/domains/*) die "La configuración no debe estar dentro de domains";; esac
DBNAME="$(po_db_name "$CFG")"
[ "$DBNAME" = "$EXPECTED_DB" ] || die "La configuración apunta a '$DBNAME', se esperaba '$EXPECTED_DB'"
case "$PO_TARGET" in
  *procesos-pruebas*) [ "$DBNAME" != "u378754586_processone" ] || die "Pruebas NUNCA puede usar la base de producción" ;;
  *) case "$DBNAME" in *pruebas*) die "Producción no puede usar una base de pruebas";; esac ;;
esac
log "2/6 Paquete validado en servidor (PHP $(php -r 'echo PHP_VERSION;'), config fuera de public_html, base $DBNAME)."

STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
PREV="$(cat "$PO_BASE/current-$(basename "$(dirname "$PO_TARGET")")-$(basename "$PO_TARGET")" 2>/dev/null || echo inicial)"
FILES_BK="$PO_BACKUPS/files-${STAMP}-antes-de-${RELEASE_ID}.tar.gz"
tar -C "$PO_TARGET" -czf "$FILES_BK" . && chmod 600 "$FILES_BK"
tar -tzf "$FILES_BK" >/dev/null || die "Respaldo de archivos ilegible"
log "3/6 Respaldo de archivos: $(basename "$FILES_BK") ($(du -h "$FILES_BK" | cut -f1)); versión anterior: $PREV"
echo "BACKUP_FILES=$(basename "$FILES_BK")"

DB_BK="$PO_BACKUPS/db-${DBNAME}-${STAMP}.sql.gz"
DEFS="$(mktemp "$PO_BASE/.my.XXXXXX")"; trap 'rm -f -- "$DEFS"' EXIT
php -r 'ob_start(); $c=include $argv[1]; ob_end_clean(); $e=function($v){return str_replace(["\\","\""],["\\\\","\\\""],(string)$v);}; echo "[client]\nuser=\"".$e($c["username"])."\"\npassword=\"".$e($c["password"])."\"\nhost=\"".$e($c["host"]??"localhost")."\"\n";' "$CFG" > "$DEFS"
chmod 600 "$DEFS"
mysqldump --defaults-extra-file="$DEFS" --single-transaction --quick --no-tablespaces --skip-lock-tables "$DBNAME" | gzip > "$DB_BK"
rm -f -- "$DEFS"
chmod 600 "$DB_BK"
gzip -t "$DB_BK" && [ "$(gzip -dc "$DB_BK" | head -c 4096 | grep -c 'Dump\|CREATE\|INSERT' || true)" -gt 0 ] || die "Respaldo de base de datos inválido"
log "4/6 Respaldo de base de datos (solo lectura): $(basename "$DB_BK") ($(du -h "$DB_BK" | cut -f1))"

# Copia SIN borrar nada del destino. index.html al final para que la versión cambie de golpe.
copy() { if command -v rsync >/dev/null 2>&1; then rsync -a --checksum "$@"; else cp -a "$@"; fi; }
mkdir -p "$PO_TARGET/assets" "$PO_TARGET/api"
[ -d "$REL/assets" ] && copy "$REL/assets/." "$PO_TARGET/assets/"
for f in "$REL"/*.svg "$REL"/manus-routes.json "$REL"/robots.txt; do if [ -f "$f" ]; then copy "$f" "$PO_TARGET/"; fi; done
copy "$REL/api/index.php" "$PO_TARGET/api/index.php"
copy "$REL/.htaccess" "$PO_TARGET/.htaccess"
copy "$REL/version.json" "$PO_TARGET/version.json"
copy "$REL/index.html" "$PO_TARGET/index.html"
# No modificar permisos de archivos ajenos a esta publicación.
chmod 755 "$PO_TARGET/assets" "$PO_TARGET/api"
[ ! -d "$REL/assets" ] || ( cd "$REL/assets" && find . -type f -print0 | while IFS= read -r -d "" f; do chmod 644 "$PO_TARGET/assets/$f"; done )
chmod 644 "$PO_TARGET/api/index.php" "$PO_TARGET/.htaccess" "$PO_TARGET/version.json" "$PO_TARGET/index.html"
for f in "$REL"/*.svg "$REL"/manus-routes.json "$REL"/robots.txt; do
  [ ! -f "$f" ] || chmod 644 "$PO_TARGET/$(basename "$f")"
done
[ ! -f "$PO_TARGET/api/setup.php" ] || log "AVISO: existe api/setup.php en el servidor (no lo creó este despliegue). Elimínalo manualmente."
log "5/6 Archivos publicados (sin eliminar archivos existentes)."

echo "$RELEASE_ID" > "$PO_BASE/current-$(basename "$(dirname "$PO_TARGET")")-$(basename "$PO_TARGET")"
printf '%s\t%s\t%s\t%s\t%s\n' "$STAMP" "$RELEASE_ID" "$PO_TARGET" "$(basename "$FILES_BK")" "$(basename "$DB_BK")" >> "$PO_BASE/history.tsv"
po_prune "$PO_BACKUPS" 'files-*.tar.gz' "$PO_KEEP_BACKUPS"
po_prune "$PO_BACKUPS" "db-${DBNAME}-*.sql.gz" "$PO_KEEP_BACKUPS"
po_prune "$PO_BASE/releases" '*' "$PO_KEEP_RELEASES"
rm -f -- "$PKG" "$PKG.sha256"
log "6/6 Historial actualizado. Respaldo para reversión: $(basename "$FILES_BK")"
