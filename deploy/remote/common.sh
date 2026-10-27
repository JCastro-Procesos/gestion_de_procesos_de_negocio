# shellcheck shell=bash
# Funciones comunes que se ejecutan EN EL SERVIDOR (Hostinger) vía SSH.
# Este archivo se concatena delante de diagnose.sh / deploy.sh / rollback.sh.
# Nunca imprime contraseñas ni el contenido de config.php.
set -euo pipefail
umask 077

PO_BASE="$HOME/processone-deploy"          # paquetes recibidos, versiones e historial
PO_BACKUPS="$HOME/processone-backups"      # respaldos (fuera de public_html, permisos 700/600)
PO_KEEP_BACKUPS="${PO_KEEP_BACKUPS:-10}"   # retención por tipo de respaldo
PO_KEEP_RELEASES="${PO_KEEP_RELEASES:-5}"

log()  { printf '[%s] %s\n' "$(date -u +%H:%M:%S)" "$*"; }
die()  { printf '::error::%s\n' "$*"; exit 1; }

# Únicas rutas de publicación aceptadas (producción y pruebas de ProcessOne).
po_allowed_path() {
  local p="$1" h
  h="$(printf '%s' "$HOME" | sed 's/[.[\*^$/]/\\&/g')"
  printf '%s' "$p" | grep -Eq "^${h}/domains/(viajescasal\.com/public_html/procesos(-pruebas)?|procesos(-pruebas)?\.viajescasal\.com/public_html)$"
}

# Verifica que el destino es ProcessOne y no otro sitio. $2=1 permite destino vacío (solo pruebas).
po_guard_target() {
  local target="$1" allow_empty="${2:-0}" real
  [ -n "$target" ] || die "Ruta de publicación vacía"
  case "$target" in /*) ;; *) die "La ruta debe ser absoluta";; esac
  case "$target" in *..*) die "Ruta con '..' no permitida";; esac
  [ -d "$target" ] || die "No existe el directorio de publicación"
  real="$(cd "$target" && pwd -P)"
  po_allowed_path "$real" || die "Ruta fuera de la lista permitida de ProcessOne: $real"
  if [ -f "$real/index.html" ] || [ -f "$real/api/index.php" ]; then
    grep -q 'ProcessOne' "$real/index.html" 2>/dev/null || die "index.html del destino no es de ProcessOne"
    [ -f "$real/api/index.php" ] || die "El destino no tiene api/index.php"
  else
    if [ "$allow_empty" = "1" ]; then
      case "$real" in *pruebas*) ;; *) die "Producción vacía: no se publica";; esac
    else
      die "El destino no contiene ProcessOne"
    fi
  fi
  PO_TARGET="$real"
}

# Ruta de config.php que usa el api/index.php indicado (no lee el archivo de configuración).
po_config_path() {
  grep -oE "/home/[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+/config\.php" "$1" | head -n1
}

# Nombre de la base configurada (solo el nombre, nunca credenciales).
po_db_name() {
  php -r 'ob_start(); $c=@include $argv[1]; ob_end_clean(); echo is_array($c)?($c["database"]??""):"";' "$1"
}

po_prune() { # $1=directorio $2=patrón $3=cuántos conservar
  local n=0
  ls -1t "$1"/$2 2>/dev/null | while IFS= read -r f; do
    n=$((n+1)); [ "$n" -le "$3" ] || rm -rf -- "$f"
  done
}
