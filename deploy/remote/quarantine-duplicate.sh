# shellcheck shell=bash
# Mantenimiento único: retira de internet la copia duplicada de ProcessOne
# (public_html/public_html/procesos) MOVIÉNDOLA a ~/processone-backups. No borra nada.
# Argumentos: $1 = ruta de producción (para verificar que NO se toca)
PROD="${1:?}"
SRC="$HOME/domains/viajescasal.com/public_html/public_html/procesos"

po_guard_target "$PROD" 0
PROD_REAL="$PO_TARGET"

[ -d "$SRC" ] || { log "La copia duplicada ya no existe: nada que hacer."; exit 0; }
SRC_REAL="$(cd "$SRC" && pwd -P)"
[ "$SRC_REAL" = "$HOME/domains/viajescasal.com/public_html/public_html/procesos" ] || die "Ruta inesperada: $SRC_REAL"
[ "$SRC_REAL" != "$PROD_REAL" ] || die "La copia coincide con producción: cancelado"
grep -q 'ProcessOne' "$SRC_REAL/index.html" 2>/dev/null || die "La carpeta no es una copia de ProcessOne: cancelado"
[ -f "$SRC_REAL/api/index.php" ] || die "La carpeta no tiene api/index.php: cancelado"

log "Contenido de public_html/public_html (solo nombres):"
ls -1A "$HOME/domains/viajescasal.com/public_html/public_html" | sed 's/^/   - /'

mkdir -p "$PO_BACKUPS"; chmod 700 "$PO_BACKUPS"
DEST="$PO_BACKUPS/duplicado-public_html-procesos-$(date -u +%Y%m%dT%H%M%SZ)"
mv -- "$SRC_REAL" "$DEST"
chmod -R go-rwx "$DEST"
log "Copia duplicada movida a: $DEST ($(du -sh "$DEST" | cut -f1)). No se borró nada."

grep -q 'ProcessOne' "$PROD_REAL/index.html" || die "¡Producción no responde a la verificación!"
log "Producción intacta: $PROD_REAL"
mkdir -p "$PO_BASE"; printf '%s\t%s\t%s\t%s\t%s\n' "$(date -u +%Y%m%dT%H%M%SZ)" "retiro-duplicado" "$SRC_REAL" "$(basename "$DEST")" "-" >> "$PO_BASE/history.tsv" 2>/dev/null || true
