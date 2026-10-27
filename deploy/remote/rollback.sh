# shellcheck shell=bash
# Reversión de ARCHIVOS a un respaldo anterior. No toca la base de datos.
# Argumentos: $1 ruta destino · $2 nombre del respaldo (files-*.tar.gz) o "listar"
TARGET="${1:?}"; BACKUP="${2:?}"

po_guard_target "$TARGET" 0

if [ "$BACKUP" = "listar" ]; then
  log "Respaldos de archivos disponibles (más reciente primero):"
  ls -1t "$PO_BACKUPS"/files-*.tar.gz 2>/dev/null | xargs -r -n1 basename | sed 's/^/   - /'
  log "Historial de publicaciones:"; tail -n 15 "$PO_BASE/history.tsv" 2>/dev/null || true
  exit 0
fi

printf '%s' "$BACKUP" | grep -Eq '^files-[A-Za-z0-9._-]+\.tar\.gz$' || die "Nombre de respaldo inválido"
SRC="$PO_BACKUPS/$BACKUP"
[ -f "$SRC" ] || die "No existe el respaldo $BACKUP"

TMP="$(mktemp -d "$PO_BASE/rollback.XXXXXX")"; trap 'rm -rf -- "$TMP"' EXIT
tar -xzf "$SRC" -C "$TMP"
grep -q 'ProcessOne' "$TMP/index.html" || die "El respaldo no contiene ProcessOne"
[ -f "$TMP/api/index.php" ] && php -l "$TMP/api/index.php" >/dev/null || die "API del respaldo inválida"
[ ! -f "$TMP/api/setup.php" ] || rm -f -- "$TMP/api/setup.php"

STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
SAFETY="$PO_BACKUPS/files-${STAMP}-antes-de-reversion.tar.gz"
tar -C "$PO_TARGET" -czf "$SAFETY" . && chmod 600 "$SAFETY"
log "Respaldo de seguridad del estado actual: $(basename "$SAFETY")"

copy() { if command -v rsync >/dev/null 2>&1; then rsync -a --checksum "$@"; else cp -a "$@"; fi; }
# Primero todo menos index.html; index.html al final.
( cd "$TMP" && find . -type f ! -path './index.html' -print0 ) | while IFS= read -r -d '' f; do
  mkdir -p "$PO_TARGET/$(dirname "$f")"; copy "$TMP/$f" "$PO_TARGET/$f"
done
copy "$TMP/index.html" "$PO_TARGET/index.html"
# Los archivos extraídos heredan permisos privados (umask 077): el servidor web debe poder leerlos.
( cd "$TMP" && find . -type d -print0 ) | while IFS= read -r -d "" d; do chmod 755 "$PO_TARGET/$d"; done
( cd "$TMP" && find . -type f -print0 ) | while IFS= read -r -d "" f; do chmod 644 "$PO_TARGET/$f"; done
# Si el respaldo no traía version.json (versiones previas a este flujo), dejar constancia de la reversión.
if [ ! -f "$TMP/version.json" ]; then
  printf '{"release":"restaurado-%s","restored_at":"%s"}\n' "${BACKUP%.tar.gz}" "$STAMP" > "$PO_TARGET/version.json"
  chmod 644 "$PO_TARGET/version.json"
fi
printf '%s\t%s\t%s\t%s\t%s\n' "$STAMP" "reversion:$BACKUP" "$PO_TARGET" "$(basename "$SAFETY")" "-" >> "$PO_BASE/history.tsv"
log "Reversión de archivos aplicada desde $BACKUP. La base de datos NO se modificó."
