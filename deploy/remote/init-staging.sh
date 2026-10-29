# shellcheck shell=bash
# Prepara el ENTORNO DE PRUEBAS en el servidor. Nunca toca producción.
# Variables recibidas por la entrada estándar (no por argumentos, para que no aparezcan en procesos):
#   PO_DB_NAME PO_DB_USER PO_DB_PASSWORD PO_ADMIN_EMAIL PO_SITE_URL PO_MAIL_FROM
# Idempotente: si ya existe la configuración no se sobrescribe; el esquema usa CREATE TABLE IF NOT EXISTS.
: "${PO_DB_NAME:?}" "${PO_DB_USER:?}" "${PO_DB_PASSWORD:?}" "${PO_ADMIN_EMAIL:?}" "${PO_SITE_URL:?}"
PO_MAIL_FROM="${PO_MAIL_FROM:-}"
PO_SMTP_USER="${PO_SMTP_USER:-}"; PO_SMTP_PASS="${PO_SMTP_PASS:-}"; PO_SMTP_HOST="${PO_SMTP_HOST:-smtp.hostinger.com}"; PO_SMTP_PORT="${PO_SMTP_PORT:-465}"

STG_DIR="$HOME/domains/viajescasal.com/public_html/procesos-pruebas"
STG_PRIV="$HOME/processone-pruebas-private"
STG_CFG="$STG_PRIV/config.php"
SCHEMA_DIR="$PO_BASE/incoming/schema"

# 1) Protecciones: solo una base de PRUEBAS, nunca producción ni otros sistemas.
printf '%s' "$PO_DB_NAME" | grep -Eq '^u378754586_[A-Za-z0-9_]*pruebas[A-Za-z0-9_]*$' || die "La base de pruebas debe llamarse u378754586_…pruebas…"
case "$PO_DB_NAME" in
  u378754586_processone|u378754586_cotizador|u378754586_travelcrm) die "Base de producción u otro sistema: prohibido";;
esac
[ "$PO_DB_USER" != "u378754586_processone" ] || die "El usuario de base de pruebas no puede ser el de producción"
[ -d "$STG_DIR" ] || die "No existe la carpeta del subdominio de pruebas: $STG_DIR"
po_allowed_path "$(cd "$STG_DIR" && pwd -P)" || die "Carpeta de pruebas fuera de la lista permitida"
log "1/5 Protecciones superadas (base $PO_DB_NAME, carpeta procesos-pruebas)."

# 2) Configuración privada de pruebas (fuera de public_html, permisos 600).
#    Se regenera siempre desde los secretos de GitHub (fuente de verdad del entorno de pruebas).
mkdir -p "$STG_PRIV"; chmod 700 "$STG_PRIV"
if [ -f "$STG_CFG" ] && [ "$(po_db_name "$STG_CFG")" != "$PO_DB_NAME" ]; then
  die "La configuración de pruebas existente apunta a otra base: revisar manualmente"
fi
PO_DB_PASSWORD="$PO_DB_PASSWORD" PO_SMTP_PASS="$PO_SMTP_PASS" php -r '
  $c=["host"=>"localhost","database"=>$argv[1],"username"=>$argv[2],"password"=>getenv("PO_DB_PASSWORD"),
      "rate_secret"=>bin2hex(random_bytes(32)),"public_url"=>$argv[3],"mail_from"=>$argv[4],"mail_from_name"=>"ProcessOne (pruebas)",
      "smtp_host"=>$argv[5],"smtp_port"=>(int)$argv[6],"smtp_user"=>$argv[7],"smtp_pass"=>getenv("PO_SMTP_PASS"),"environment"=>"pruebas"];
  echo "<?php\nreturn ".var_export($c,true).";\n";' "$PO_DB_NAME" "$PO_DB_USER" "$PO_SITE_URL" "$PO_MAIL_FROM" "$PO_SMTP_HOST" "$PO_SMTP_PORT" "$PO_SMTP_USER" > "$STG_CFG.tmp"
chmod 600 "$STG_CFG.tmp"; mv -f "$STG_CFG.tmp" "$STG_CFG"
log "2/5 Configuración de pruebas escrita en $STG_CFG (permisos 600)."
unset PO_DB_PASSWORD PO_SMTP_PASS

# 3) Conexión y esquema (solo en la base de pruebas).
[ -d "$SCHEMA_DIR" ] || die "No se recibieron los archivos de esquema"
php -d display_errors=stderr -r '
  ob_start(); $c=include $argv[1]; ob_end_clean();
  set_exception_handler(function($e) use ($c){ fwrite(STDERR,"   detalle: ".get_class($e)." [".$e->getCode()."] ".str_replace((string)($c["password"]??"\0"),"***",$e->getMessage())."\n"); exit(1); });
  if (($c["database"]??"") !== $argv[2]) { fwrite(STDERR,"config no coincide\n"); exit(1); }
  $db=new PDO("mysql:host=".$c["host"].";dbname=".$c["database"].";charset=utf8mb4",$c["username"],$c["password"],[PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION]);
  $real=$db->query("SELECT DATABASE()")->fetchColumn();
  if ($real !== $argv[2] || $real === "u378754586_processone") { fwrite(STDERR,"base inesperada\n"); exit(1); }
  foreach (array_slice($argv,3) as $f) {
    $sql=preg_replace("/^\s*--.*$/m","",file_get_contents($f));
    foreach (preg_split("/;\s*(\r?\n|$)/",$sql) as $st) {
      $st=trim($st); if ($st==="") continue;
      if (preg_match("/^(DROP|TRUNCATE|DELETE|UPDATE)\b/i",$st)) { fwrite(STDERR,"sentencia destructiva rechazada\n"); exit(1); }
      try { $db->exec($st); }
      catch (PDOException $e) { if (($e->errorInfo[1]??0)==1060) continue; throw $e; } // columna ya existente
    }
    echo "   aplicado: ".basename($f)."\n";
  }' "$STG_CFG" "$PO_DB_NAME" \
  "$SCHEMA_DIR/processone_mysql.sql" "$SCHEMA_DIR/processone_live_patch.sql" \
  "$SCHEMA_DIR/20261023_governance_mysql.sql" "$SCHEMA_DIR/20261023_user_invites.sql" \
  "$SCHEMA_DIR/20261028_temp_password.sql" "$SCHEMA_DIR/20261029_presencia_usuarios.sql" || die "No se pudo preparar el esquema de pruebas"
log "3/5 Esquema aplicado en $PO_DB_NAME (sin datos reales)."

# 4) Administrador de pruebas por invitación (sin contraseña conocida por nadie hasta que la defina el usuario).
LINK_FILE="$STG_PRIV/invitacion-administrador.txt"
php -r '
  ob_start(); $c=include $argv[1]; ob_end_clean();
  $db=new PDO("mysql:host=".$c["host"].";dbname=".$c["database"].";charset=utf8mb4",$c["username"],$c["password"],[PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION]);
  if ((int)$db->query("SELECT COUNT(*) FROM po_users")->fetchColumn() > 0) { echo "existe\n"; exit(0); }
  $db->beginTransaction();
  $db->prepare("INSERT INTO po_users(name,email,password_hash,role,invitation_pending) VALUES (?,?,?,\"admin\",1)")
     ->execute(["Administrador (pruebas)",$argv[2],password_hash(bin2hex(random_bytes(32)),PASSWORD_DEFAULT)]);
  $uid=(int)$db->lastInsertId(); $token=bin2hex(random_bytes(32));
  $db->prepare("INSERT INTO po_auth_tokens(user_id,purpose,token_hash,expires_at) VALUES (?,\"invite\",?,DATE_ADD(NOW(),INTERVAL 72 HOUR))")
     ->execute([$uid,hash("sha256",$token)]);
  $db->commit();
  $url=rtrim($c["public_url"],"/")."/?auth=invite&token=".$token;
  file_put_contents($argv[3],"Invitación de administrador del entorno de PRUEBAS (válida 72 horas):\n".$url."\n");
  chmod($argv[3],0600);
  $sent=false;
  if (filter_var($c["mail_from"]??"",FILTER_VALIDATE_EMAIL)) {
    $sent=mail($argv[2],"Invitación a ProcessOne (pruebas)","Define tu contraseña del entorno de PRUEBAS:\n".$url."\n\nVálido 72 horas.","From: ".$c["mail_from"]."\r\nContent-Type: text/plain; charset=UTF-8");
  }
  echo $sent ? "enviado\n" : "archivo\n";' "$STG_CFG" "$PO_ADMIN_EMAIL" "$LINK_FILE" > "$PO_BASE/.init-admin.out" || die "No se pudo crear el administrador de pruebas"
case "$(cat "$PO_BASE/.init-admin.out")" in
  existe)  log "4/5 Ya existen usuarios en pruebas: no se crea administrador." ;;
  enviado) log "4/5 Administrador de pruebas creado; invitación enviada por correo y guardada en $LINK_FILE (600)." ;;
  *)       log "4/5 Administrador de pruebas creado; invitación guardada en $LINK_FILE (600). Ábrela desde el Administrador de archivos de hPanel." ;;
esac
rm -f "$PO_BASE/.init-admin.out"

# 5) Limpieza de archivos de esquema recibidos.
rm -rf -- "$SCHEMA_DIR"
log "5/5 Entorno de pruebas listo para recibir la primera publicación."
