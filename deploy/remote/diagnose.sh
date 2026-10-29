# shellcheck shell=bash
# Diagnóstico SOLO LECTURA del servidor. No crea, modifica ni borra nada.
# Argumentos: $1 = ruta de publicación propuesta (puede estar vacía)
TARGET="${1:-}"

log "Usuario: $(whoami) · HOME: $HOME"
log "PHP CLI: $(php -r 'echo PHP_VERSION;' 2>/dev/null || echo 'no disponible')"
for t in rsync tar gzip sha256sum mysqldump curl; do
  if command -v "$t" >/dev/null 2>&1; then log "Herramienta $t: disponible"; else log "Herramienta $t: NO disponible"; fi
done

log "Dominios en la cuenta: $(ls -1 "$HOME/domains" 2>/dev/null | wc -l) (nombres omitidos: repositorio público)"

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
  [ -f "$real/api/index.php" ] && log "     config usada por la API: $(po_config_path "$real" "$real/api/index.php")"
  [ -f "$real/index.html" ] && log "     versión publicada (bundle): $(grep -oE 'assets/index-[A-Za-z0-9_-]+\.js' "$real/index.html" | head -n1) · index.html modificado: $(date -r "$real/index.html" '+%Y-%m-%d %H:%M')"
  [ -f "$real/api/index.php" ] && log "     api/index.php: $(wc -c < "$real/api/index.php") bytes · sha256 $(sha256sum "$real/api/index.php" | cut -c1-12) · modificado: $(date -r "$real/api/index.php" '+%Y-%m-%d %H:%M')"
done

for cfg in "$HOME/processone-private/config.php" "$HOME/processone-pruebas-private/config.php"; do
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
    ob_start(); $c=include $argv[1]; ob_end_clean();
    try { $db=new PDO("mysql:host=".($c["host"]??"localhost").";dbname=".$c["database"].";charset=utf8mb4",$c["username"],$c["password"],[PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION]); }
    catch(Throwable $e){ echo "   no se pudo conectar\n"; exit; }
    $tabs=$db->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
    $esperadas=["po_users","po_workspace","po_projects","po_auth_tokens","po_governance_items","po_governance_events"];
    echo "   tablas: ".count($tabs)." · esquema Fase 1 completo: ".(count(array_diff($esperadas,$tabs))?"NO":"sí")."\n";
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

# Correo saliente (solo lectura): prueba conexión y autenticación SMTP sin enviar mensajes.
for cfg in "$HOME/processone-pruebas-private/config.php" "$HOME/processone-private/config.php"; do
  [ -f "$cfg" ] || continue
  log "Correo saliente según $(basename "$(dirname "$cfg")"):"
  php -r '
    ob_start(); $c=include $argv[1]; ob_end_clean();
    $u=(string)($c["smtp_user"]??""); $h=(string)($c["smtp_host"]??""); $p=(int)($c["smtp_port"]??465);
    echo "   mail_from: ".(($c["mail_from"]??"")!==""?$c["mail_from"]:"(vacío)")." · smtp_host: ".($h?:"(vacío)")." · puerto: $p · smtp_user: ".($u?:"(vacío)")." · smtp_pass: ".(empty($c["smtp_pass"])?"(vacío)":"configurada".(preg_match("/^\\s|\\s$/",(string)($c["smtp_pass"]??""))?" ⚠ tiene espacios o saltos al inicio/fin":"").(preg_match("/[^\\x20-\\x7E]/",(string)($c["smtp_pass"]??""))?" ⚠ contiene acentos o caracteres especiales no estándar":""))."\n";
    if(!$h||!$u||empty($c["smtp_pass"])){echo "   SMTP incompleto: la API usará mail() o no enviará.\n";exit;}
    $fp=@stream_socket_client(($p===465?"ssl://":"tcp://")."$h:$p",$en,$es,15);
    if(!$fp){echo "   CONEXIÓN FALLIDA: $es ($en)\n";exit;}
    stream_set_timeout($fp,15);
    $rd=function()use($fp){$r="";while(($l=fgets($fp,515))!==false){$r.=$l;if(strlen($l)<4||$l[3]===" ")break;}return trim($r);};
    $cmd=function($x)use($fp,$rd){fwrite($fp,$x."\r\n");return $rd();};
    echo "   saludo: ".substr($rd(),0,60)."\n";
    $cmd("EHLO procesos.viajescasal.com");
    if($p!==465){$cmd("STARTTLS");stream_socket_enable_crypto($fp,true,STREAM_CRYPTO_METHOD_TLS_CLIENT);$cmd("EHLO procesos.viajescasal.com");}
    $cmd("AUTH LOGIN");$cmd(base64_encode($u));$r=$cmd(base64_encode((string)$c["smtp_pass"]));
    echo "   autenticación: ".(str_starts_with($r,"235")?"OK":"RECHAZADA (".substr($r,0,80).")")."\n";
    $cmd("QUIT");fclose($fp);
  ' "$cfg" 2>&1 | sed 's/^/ /'
done
log "Últimos errores de correo registrados por la API (sin datos sensibles):"
find "$HOME/domains" "$HOME/logs" -maxdepth 6 -type f -name 'error_log*' 2>/dev/null | while IFS= read -r f; do
  { grep -h 'ProcessOne correo' "$f" 2>/dev/null || true; } | tail -n 5 | sed -E 's/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+/***@***/g' | sed "s#^#   [$(basename "$(dirname "$f")")] #"
done || true
log "Fin de la revisión de correo."
