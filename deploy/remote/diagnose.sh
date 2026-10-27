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
  [ -f "$real/index.html" ] && log "     versión publicada (bundle): $(grep -oE 'assets/index-[A-Za-z0-9_-]+\.js' "$real/index.html" | head -n1) · index.html modificado: $(date -r "$real/index.html" '+%Y-%m-%d %H:%M')"
  [ -f "$real/api/index.php" ] && log "     api/index.php: $(wc -c < "$real/api/index.php") bytes · sha256 $(sha256sum "$real/api/index.php" | cut -c1-12) · modificado: $(date -r "$real/api/index.php" '+%Y-%m-%d %H:%M')"
done

for cfg in "$HOME/processone-private/config.php" "$HOME/processone-privado/config.php"; do
  if [ -f "$cfg" ]; then
    log "Config $cfg: existe · permisos $(stat -c %a "$cfg") · base: $(po_db_name "$cfg")"
    case "$cfg" in "$HOME"/domains/*) log "   ¡ATENCIÓN! config dentro de domains";; esac
  else
    log "Config $cfg: no existe"
  fi
done

# Estructura de la base (solo nombres de tablas, conteo de filas y columnas clave). Sin leer datos.
cfg="$HOME/processone-private/config.php"
if [ -f "$cfg" ]; then
  log "Base de datos de ProcessOne (solo lectura):"
  php -r '
    $c=include $argv[1];
    try { $db=new PDO("mysql:host=".($c["host"]??"localhost").";dbname=".$c["database"].";charset=utf8mb4",$c["username"],$c["password"],[PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION]); }
    catch(Throwable $e){ echo "   no se pudo conectar\n"; exit; }
    foreach($db->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN) as $t){
      $n=$db->query("SELECT COUNT(*) FROM `".str_replace("`","",$t)."`")->fetchColumn();
      echo "   - $t: $n filas\n";
    }
    $cols=$db->query("SHOW COLUMNS FROM po_users")->fetchAll(PDO::FETCH_COLUMN);
    echo "   po_users.invitation_pending: ".(in_array("invitation_pending",$cols)?"existe":"NO existe")."\n";
  ' "$cfg" 2>/dev/null || log "   (no disponible)"
fi

if [ -n "$TARGET" ]; then
  if ( po_guard_target "$TARGET" 0 ) ; then log "Ruta de publicación configurada: VÁLIDA ($TARGET)"; else log "Ruta de publicación configurada: NO VÁLIDA"; fi
fi

log "Respaldos existentes: $(ls -1 "$PO_BACKUPS" 2>/dev/null | wc -l)"
log "Espacio usado en HOME: $(du -sh "$HOME" 2>/dev/null | cut -f1)"
log "Diagnóstico terminado (sin cambios)."
