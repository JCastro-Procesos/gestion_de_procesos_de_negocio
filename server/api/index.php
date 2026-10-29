<?php
declare(strict_types=1);
// ProcessOne API: PHP 8.1+, PDO MySQL. Secrets must be defined outside public_html.
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: no-referrer');
if (empty($_SERVER['HTTPS']) || $_SERVER['HTTPS'] === 'off') { http_response_code(403); echo '{"error":"HTTPS requerido"}'; exit; }
// La configuración se elige por la carpeta física donde está instalada la API (no se puede falsificar desde el navegador).
// Pruebas: .../public_html/procesos-pruebas/api  ·  Producción: cualquier otra ubicación.
$isStaging = str_contains(__DIR__, '/procesos-pruebas/');
$config = $isStaging
  ? '/home/u378754586/processone-pruebas-private/config.php'
  : '/home/u378754586/processone-private/config.php';
if ($isStaging) { header('X-Robots-Tag: noindex, nofollow'); }
if (!is_file($config)) { http_response_code(503); echo '{"error":"Servidor sin configurar"}'; exit; }
ob_start(); $settings = require $config; ob_end_clean();
if (!is_array($settings)) { http_response_code(503); exit; }
try {
 $db = new PDO('mysql:host='.($settings['host']??'localhost').';dbname='.$settings['database'].';charset=utf8mb4', $settings['username'], $settings['password'], [
 PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE=>PDO::FETCH_ASSOC, PDO::ATTR_EMULATE_PREPARES=>false
 ]);
} catch (Throwable $e) { http_response_code(503); echo '{"error":"Base de datos no disponible"}'; exit; }
session_name('processone_session');
session_set_cookie_params(['lifetime'=>0,'path'=>'/api','secure'=>true,'httponly'=>true,'samesite'=>'Strict']);
ini_set('session.use_strict_mode','1');
session_start();
function reply(int $status,array $data):never { http_response_code($status); echo json_encode($data,JSON_UNESCAPED_UNICODE|JSON_INVALID_UTF8_SUBSTITUTE); exit; }
function input():array { $raw=file_get_contents('php://input'); if(strlen($raw)>2000000)reply(413,['error'=>'Solicitud demasiado grande']); $x=json_decode($raw,true); if(!is_array($x))reply(400,['error'=>'JSON inválido']); return $x; }
function csrf():void { if(!hash_equals($_SESSION['csrf']??'',$_SERVER['HTTP_X_CSRF_TOKEN']??''))reply(403,['error'=>'Sesión inválida']); }
function member(PDO $db):array {
 if(empty($_SESSION['uid']))reply(401,['error'=>'Inicia sesión']);
 $q=$db->prepare('SELECT id,name,email,role,active,avatar_animal FROM po_users WHERE id=? LIMIT 1');$q->execute([$_SESSION['uid']]);$u=$q->fetch();
 if(!$u || !$u['active']) { session_destroy(); reply(401,['error'=>'Acceso deshabilitado']); }
 return $u;
}
function level(string $role):int { return ['ingeniero'=>1,'especialista'=>2,'gerencia'=>3,'direccion'=>4,'admin'=>5][$role]??0; }
function logAction(PDO $db,int $uid,string $action,string $entity,string $id):void {
 $q=$db->prepare('INSERT INTO po_audit_log(actor_id,action,entity_type,entity_id) VALUES (?,?,?,?)');$q->execute([$uid,$action,$entity,$id]);
}

function authToken(PDO $db,int $userId,string $purpose,int $hours):string {
 $token=bin2hex(random_bytes(32));
 $db->prepare('UPDATE po_auth_tokens SET consumed_at=NOW() WHERE user_id=? AND purpose=? AND consumed_at IS NULL')->execute([$userId,$purpose]);
 $db->prepare('INSERT INTO po_auth_tokens(user_id,purpose,token_hash,expires_at) VALUES (?,?,?,DATE_ADD(NOW(),INTERVAL ? HOUR))')->execute([$userId,$purpose,hash('sha256',$token),$hours]);
 return $token;
}
function sendAuthEmail(array $settings,string $email,string $subject,string $url):bool {
 $from=$settings['mail_from']??'';
 if(!filter_var($from,FILTER_VALIDATE_EMAIL))return false;
 $body="ProcessOne\n\n".$subject."\n\nAbre el siguiente enlace para continuar:\n".$url."\n\nSi no solicitaste esta acción, ignora este mensaje.";
 return mail($email,$subject,$body,'From: '.$from."\r\nContent-Type: text/plain; charset=UTF-8");
}
function authLink(array $settings,string $token,string $purpose):string {
 $base=rtrim((string)($settings['public_url']??'https://procesos.viajescasal.com'),'/');
 return $base.'/?auth='.$purpose.'&token='.rawurlencode($token);
}
$action=$_GET['action']??'';
$method=$_SERVER['REQUEST_METHOD']??'GET';

if($action==='token_validate' && $method==='POST'){
 $d=input();$token=(string)($d['token']??'');$purpose=(string)($d['purpose']??'');
 if(!preg_match('/^[a-f0-9]{64}$/',$token)||!in_array($purpose,['invite','reset'],true))reply(400,['error'=>'Enlace inválido']);
 $q=$db->prepare('SELECT t.id FROM po_auth_tokens t JOIN po_users u ON u.id=t.user_id WHERE t.token_hash=? AND t.purpose=? AND t.consumed_at IS NULL AND t.expires_at>NOW() AND u.active=1 LIMIT 1');
 $q->execute([hash('sha256',$token),$purpose]);reply(200,['valid'=>(bool)$q->fetch()]);
}
if($action==='token_consume' && $method==='POST'){
 $d=input();$token=(string)($d['token']??'');$purpose=(string)($d['purpose']??'');$password=(string)($d['password']??'');
 if(!preg_match('/^[a-f0-9]{64}$/',$token)||!in_array($purpose,['invite','reset'],true)||strlen($password)<12||strlen($password)>256)reply(400,['error'=>'Enlace o contraseña inválidos (mínimo 12 caracteres)']);
 $db->beginTransaction();
 try{
  $q=$db->prepare('SELECT t.id,t.user_id FROM po_auth_tokens t JOIN po_users u ON u.id=t.user_id WHERE t.token_hash=? AND t.purpose=? AND t.consumed_at IS NULL AND t.expires_at>NOW() AND u.active=1 LIMIT 1 FOR UPDATE');
  $q->execute([hash('sha256',$token),$purpose]);$row=$q->fetch();
  if(!$row){$db->rollBack();reply(400,['error'=>'El enlace expiró o ya fue utilizado']);}
  $db->prepare('UPDATE po_users SET password_hash=?,invitation_pending=0 WHERE id=?')->execute([password_hash($password,PASSWORD_DEFAULT),$row['user_id']]);
  $db->prepare('UPDATE po_auth_tokens SET consumed_at=NOW() WHERE user_id=? AND consumed_at IS NULL')->execute([$row['user_id']]);
  logAction($db,(int)$row['user_id'],'set_password','user',(string)$row['user_id']);$db->commit();reply(200,['ok'=>true]);
 }catch(Throwable $e){if($db->inTransaction())$db->rollBack();reply(500,['error'=>'No fue posible actualizar la contraseña']);}
}
if($action==='password_forgot' && $method==='POST'){
 $d=input();$email=strtolower(trim((string)($d['email']??'')));
 // Respuesta uniforme para evitar enumeración de usuarios.
 if(filter_var($email,FILTER_VALIDATE_EMAIL)){
  $q=$db->prepare('SELECT id FROM po_users WHERE email=? AND active=1 AND invitation_pending=0');$q->execute([$email]);$id=$q->fetchColumn();
  if($id){
   $recent=$db->prepare("SELECT COUNT(*) FROM po_auth_tokens WHERE user_id=? AND purpose='reset' AND created_at>DATE_SUB(NOW(),INTERVAL 15 MINUTE)");$recent->execute([$id]);
   if((int)$recent->fetchColumn()<1){$token=authToken($db,(int)$id,'reset',1);sendAuthEmail($settings,$email,'Restablecer contraseña ProcessOne',authLink($settings,$token,'reset'));}
  }
 }
 reply(200,['ok'=>true,'message'=>'Si existe una cuenta activa, recibirás instrucciones por correo.']);
}
if($action==='login' && $method==='POST'){
 $d=input();$email=strtolower(trim((string)($d['email']??'')));$password=(string)($d['password']??'');
 $limit=$db->prepare('SELECT COUNT(*) FROM po_login_attempts WHERE ip_hash=? AND attempted_at > DATE_SUB(NOW(), INTERVAL 15 MINUTE)');$ipHash=hash('sha256',($_SERVER['REMOTE_ADDR']??'unknown').($settings['rate_secret']??''));$limit->execute([$ipHash]);if((int)$limit->fetchColumn()>=10)reply(429,['error'=>'Demasiados intentos. Intenta más tarde.']);
 $q=$db->prepare('SELECT id,name,email,password_hash,role,active,invitation_pending FROM po_users WHERE email=? LIMIT 1');$q->execute([$email]);$u=$q->fetch();
 if(!$u || !$u['active'] || !empty($u['invitation_pending']) || !password_verify($password,$u['password_hash'])){$fail=$db->prepare('INSERT INTO po_login_attempts(ip_hash) VALUES (?)');$fail->execute([$ipHash]);usleep(300000);reply(401,['error'=>'Credenciales inválidas']);}
 session_regenerate_id(true);$_SESSION['uid']=(int)$u['id'];$_SESSION['csrf']=bin2hex(random_bytes(32));unset($u['password_hash'],$u['invitation_pending']);
 logAction($db,(int)$u['id'],'login','user',(string)$u['id']);reply(200,['user'=>$u,'csrf'=>$_SESSION['csrf']]);
}
if($action==='session' && $method==='GET'){
 $u=member($db);$_SESSION['csrf']??=bin2hex(random_bytes(32));reply(200,['user'=>$u,'csrf'=>$_SESSION['csrf']]);
}
if($action==='logout' && $method==='POST'){csrf();session_destroy();reply(200,['ok'=>true]);}
$u=member($db);$uid=(int)$u['id'];$role=$u['role'];
if($action==='cells_v12') require __DIR__.'/cells_v12.php';
if($action==='profile' && $method==='PUT'){
 csrf();$d=input();$name=trim((string)($d['name']??''));$avatar=(string)($d['avatar_animal']??'');
 $allowed=['🦊','🐯','🦁','🐼','🐻','🦉','🐬','🦋','🐢','🦄','🐺','🦜',''];
 if(mb_strlen($name)<2||mb_strlen($name)>120||!in_array($avatar,$allowed,true))reply(400,['error'=>'Nombre o avatar inválido']);
 $db->prepare('UPDATE po_users SET name=?,avatar_animal=? WHERE id=?')->execute([$name,$avatar,$uid]);
 logAction($db,$uid,'update_profile','user',(string)$uid);
 reply(200,['ok'=>true,'user'=>member($db)]);
}
if($action==='workspace' && $method==='GET'){
 $q=$db->query("SELECT payload,revision FROM po_workspace WHERE id='main' LIMIT 1");$w=$q->fetch();
 $payload=$w?json_decode($w['payload'],true):null;
 if(is_array($payload)){
 $people=$db->query('SELECT id,name,email,role,active FROM po_users WHERE active=1')->fetchAll();
 $existing=[];foreach(($payload['members']??[]) as $m){$existing[(string)($m['id']??'')]=$m;}
 foreach($people as $person){$key='user-'.$person['id'];$old=$existing[$key]??[];$existing[$key]=array_merge(['id'=>$key,'name'=>$person['name'],'role'=>$person['role'],'email'=>$person['email'],'capacityHours'=>36,'color'=>'#5367d8'],$old,['name'=>$person['name'],'email'=>$person['email']]);}
 $payload['members']=array_values($existing);
 }
 if($role!=='admin' && is_array($payload) && isset($payload['members'])){foreach($payload['members'] as &$m){if(in_array(strtolower((string)($m['role']??'')),['dirección','direccion'],true))$m['role']='';}unset($m);}
 reply(200,['workspace'=>$payload,'revision'=>$w?(int)$w['revision']:0]);
}
if($action==='workspace' && $method==='PUT'){
 csrf();if(level($role)<2)reply(403,['error'=>'Permiso insuficiente para modificar el espacio compartido']);$d=input();$payload=$d['workspace']??null;$rev=$d['revision']??null;
 if(!is_array($payload)||!is_int($rev)||!isset($payload['projects'],$payload['tasks'],$payload['members'])||!is_array($payload['projects'])||!is_array($payload['tasks']))reply(400,['error'=>'Datos inválidos']);
 $json=json_encode($payload,JSON_UNESCAPED_UNICODE|JSON_THROW_ON_ERROR);
 if(strlen($json)>1500000)reply(413,['error'=>'Espacio demasiado grande']);
 $db->beginTransaction();
 try {
 $q=$db->query("SELECT revision FROM po_workspace WHERE id='main' FOR UPDATE");$old=$q->fetch();$current=$old?(int)$old['revision']:0;
 if($rev!==$current){$db->rollBack();reply(409,['error'=>'Los datos cambiaron en otra sesión. Recarga antes de guardar.']);}
 $sync=$db->prepare('INSERT INTO po_projects(id,name,description,status,payload) VALUES (?,?,?,?,?) ON DUPLICATE KEY UPDATE name=VALUES(name),description=VALUES(description),status=VALUES(status),payload=VALUES(payload)');
 foreach($payload['projects'] as $p){if(!is_array($p)||empty($p['id'])||empty($p['name']))continue;$sync->execute([(string)$p['id'],(string)$p['name'],(string)($p['description']??''),(string)($p['status']??'Por iniciar'),json_encode($p,JSON_UNESCAPED_UNICODE)]);}
 if($old){$q=$db->prepare("UPDATE po_workspace SET payload=?,revision=revision+1,updated_by=? WHERE id='main'");$q->execute([$json,$uid]);}
 else{$q=$db->prepare("INSERT INTO po_workspace(id,payload,revision,updated_by) VALUES ('main',?,1,?)");$q->execute([$json,$uid]);}
 logAction($db,$uid,'update','workspace','main');$db->commit();reply(200,['revision'=>$current+1]);
 }catch(Throwable $e){if($db->inTransaction())$db->rollBack();reply(500,['error'=>'No fue posible guardar']);}
}
if($action==='users' && $method==='GET'){
 if($role==='admin'){$rows=$db->query('SELECT id,name,email,role,active,avatar_animal,invitation_pending FROM po_users ORDER BY name')->fetchAll();}
 else{$rows=$db->query('SELECT id,name,avatar_animal FROM po_users WHERE active=1 ORDER BY name')->fetchAll();}
 reply(200,['users'=>$rows]);
}

if($action==='users' && $method==='POST'){
 csrf();if($role!=='admin')reply(403,['error'=>'Acceso restringido']);
 $d=input();$name=trim((string)($d['name']??''));$email=strtolower(trim((string)($d['email']??'')));$newRole=(string)($d['role']??'ingeniero');
 if(mb_strlen($name)<2||mb_strlen($name)>120||!filter_var($email,FILTER_VALIDATE_EMAIL)||!in_array($newRole,['direccion','gerencia','especialista','ingeniero'],true))reply(400,['error'=>'Nombre, correo o perfil inválido']);
 $db->beginTransaction();
 try{
  $q=$db->prepare('INSERT INTO po_users(name,email,password_hash,role,invitation_pending) VALUES (?,?,?,?,1)');
  $q->execute([$name,$email,password_hash(bin2hex(random_bytes(32)),PASSWORD_DEFAULT),$newRole]);$id=(int)$db->lastInsertId();
  $token=authToken($db,$id,'invite',48);logAction($db,$uid,'invite','user',(string)$id);$db->commit();
 }catch(Throwable $e){if($db->inTransaction())$db->rollBack();reply(409,['error'=>'No se pudo registrar: verifica que el correo no exista']);}
 $sent=sendAuthEmail($settings,$email,'Invitación a ProcessOne',authLink($settings,$token,'invite'));
 reply(201,['ok'=>true,'sent'=>$sent,'message'=>$sent?'Invitación enviada':'Cuenta pendiente de activación. No se pudo enviar el correo; revisa la configuración del servidor.']);
}
if($action==='users' && $method==='PUT'){
 csrf();if($role!=='admin')reply(403,['error'=>'Acceso restringido']);
 $d=input();$id=(int)($d['id']??0);$newRole=(string)($d['role']??'');$active=$d['active']??null;$name=trim((string)($d['name']??''));
 if($id<1||!in_array($newRole,['direccion','gerencia','especialista','ingeniero'],true)||!is_bool($active)||mb_strlen($name)<2||mb_strlen($name)>120)reply(400,['error'=>'Datos inválidos']);
 $q=$db->prepare("UPDATE po_users SET name=?,role=?,active=? WHERE id=? AND role<>'admin'");
 $q->execute([$name,$newRole,$active?1:0,$id]);
 if($q->rowCount()===0){$check=$db->prepare("SELECT id FROM po_users WHERE id=? AND role<>'admin'");$check->execute([$id]);if(!$check->fetchColumn())reply(404,['error'=>'Usuario no encontrado']);}
 if(!$active)$db->prepare('UPDATE po_auth_tokens SET consumed_at=NOW() WHERE user_id=? AND consumed_at IS NULL')->execute([$id]);
 logAction($db,$uid,'update','user',(string)$id);reply(200,['ok'=>true]);
}
if($action==='users_resend' && $method==='POST'){
 csrf();if($role!=='admin')reply(403,['error'=>'Acceso restringido']);
 $d=input();$id=(int)($d['id']??0);$q=$db->prepare('SELECT email FROM po_users WHERE id=? AND active=1 AND invitation_pending=1');$q->execute([$id]);$email=$q->fetchColumn();
 if(!$email)reply(404,['error'=>'No hay invitación pendiente']);
 $token=authToken($db,$id,'invite',48);
 $sent=sendAuthEmail($settings,$email,'Invitación a ProcessOne',authLink($settings,$token,'invite'));
 reply(200,['sent'=>$sent,'message'=>$sent?'Invitación reenviada':'No se pudo enviar el correo']);
}
if($action==='password_change' && $method==='POST'){
 csrf();$d=input();$old=(string)($d['oldPassword']??'');$new=(string)($d['newPassword']??'');
 if(strlen($new)<12||strlen($new)>256)reply(400,['error'=>'La contraseña debe tener al menos 12 caracteres']);
 $q=$db->prepare('SELECT password_hash FROM po_users WHERE id=?');$q->execute([$uid]);
 if(!password_verify($old,(string)$q->fetchColumn()))reply(403,['error'=>'Contraseña actual incorrecta']);
 $db->prepare('UPDATE po_users SET password_hash=? WHERE id=?')->execute([password_hash($new,PASSWORD_DEFAULT),$uid]);
 logAction($db,$uid,'change_password','user',(string)$uid);reply(200,['ok'=>true]);
}
if($action==='initiatives' && $method==='GET'){
 $rows=$db->query('SELECT i.id,i.title,i.objective,i.status,i.owner_id,i.created_at, GROUP_CONCAT(l.project_id SEPARATOR ",") project_ids FROM po_initiatives i LEFT JOIN po_initiative_projects l ON l.initiative_id=i.id GROUP BY i.id ORDER BY i.created_at DESC')->fetchAll();
 reply(200,['initiatives'=>$rows]);
}
if($action==='initiatives' && $method==='POST'){
 csrf();if(level($role)<3)reply(403,['error'=>'Permiso insuficiente']);$d=input();$title=trim((string)($d['title']??''));$objective=trim((string)($d['objective']??''));$status=(string)($d['status']??'Planeada');$projects=$d['projectIds']??[];
 if(!$title||strlen($title)>190||!in_array($status,['Planeada','En ejecución','Completada','En riesgo'],true)||!is_array($projects))reply(400,['error'=>'Iniciativa inválida']);
 $db->beginTransaction();
 try{$q=$db->prepare('INSERT INTO po_initiatives(title,objective,status,created_by) VALUES (?,?,?,?)');$q->execute([$title,$objective,$status,$uid]);$id=(int)$db->lastInsertId();
 $link=$db->prepare('INSERT INTO po_initiative_projects(initiative_id,project_id) SELECT ?,id FROM po_projects WHERE id=?');
 foreach(array_unique($projects) as $p){if(is_string($p))$link->execute([$id,$p]);}
 logAction($db,$uid,'create','initiative',(string)$id);$db->commit();reply(201,['id'=>$id]);}
 catch(Throwable $e){$db->rollBack();reply(500,['error'=>'No fue posible crear iniciativa']);}
}
if($action==='initiatives' && in_array($method,['PUT','DELETE'],true)){
 csrf();if(level($role)<3)reply(403,['error'=>'Permiso insuficiente']);$d=input();$id=(int)($d['id']??0);if($id<1)reply(400,['error'=>'ID inválido']);
 if($method==='DELETE'){$q=$db->prepare('DELETE FROM po_initiatives WHERE id=?');$q->execute([$id]);logAction($db,$uid,'delete','initiative',(string)$id);reply(200,['ok'=>true]);}
 $title=trim((string)($d['title']??''));$objective=trim((string)($d['objective']??''));$status=(string)($d['status']??'Planeada');$projects=$d['projectIds']??[];
 if(!$title||strlen($title)>190||!in_array($status,['Planeada','En ejecución','Completada','En riesgo'],true)||!is_array($projects))reply(400,['error'=>'Iniciativa inválida']);
 $db->beginTransaction();
 try{$q=$db->prepare('UPDATE po_initiatives SET title=?,objective=?,status=? WHERE id=?');$q->execute([$title,$objective,$status,$id]);$db->prepare('DELETE FROM po_initiative_projects WHERE initiative_id=?')->execute([$id]);
 $link=$db->prepare('INSERT INTO po_initiative_projects(initiative_id,project_id) SELECT ?,id FROM po_projects WHERE id=?');foreach(array_unique($projects) as $p){if(is_string($p))$link->execute([$id,$p]);}
 logAction($db,$uid,'update','initiative',(string)$id);$db->commit();reply(200,['ok'=>true]);}
 catch(Throwable $e){$db->rollBack();reply(500,['error'=>'No fue posible actualizar']);}
}

if($action==='governance' && $method==='GET'){
 $items=$db->query("SELECT g.id,g.kind,g.project_id projectId,g.title,g.description,g.severity,g.status,g.owner,g.reviewer_id reviewerId,g.comment,g.created_at createdAt,g.updated_at updatedAt,u.name reviewerName FROM po_governance_items g LEFT JOIN po_users u ON u.id=g.reviewer_id ORDER BY g.created_at DESC LIMIT 500")->fetchAll();
 $events=$db->query("SELECT e.id,e.item_id itemId,e.action,e.previous_status beforeStatus,e.next_status afterStatus,e.note,e.created_at at,u.name actor FROM po_governance_events e JOIN po_users u ON u.id=e.actor_id ORDER BY e.id DESC LIMIT 200")->fetchAll();
 reply(200,['items'=>$items,'events'=>$events]);
}
if($action==='governance' && $method==='POST'){
 csrf();if(level($role)<2)reply(403,['error'=>'No tienes permisos para registrar solicitudes']);
 $d=input();$id=(string)($d['id']??'');$kind=(string)($d['kind']??'');$title=trim((string)($d['title']??''));$severity=(string)($d['severity']??'Menor');
 if(!preg_match('/^[a-f0-9-]{36}$/i',$id)||!in_array($kind,['Solicitud','Entregable','Cambio'],true)||$title===''||mb_strlen($title)>190||!in_array($severity,['Menor','Mayor','Crítico'],true))reply(400,['error'=>'Solicitud inválida']);
 $db->beginTransaction();
 try {
  $q=$db->prepare("INSERT INTO po_governance_items(id,kind,project_id,title,description,severity,owner,comment,created_by) VALUES (?,?,?,?,?,?,?,'',?)");
  $q->execute([$id,$kind,($d['projectId']??'')?:null,$title,substr((string)($d['description']??''),0,10000),$severity,substr((string)($d['owner']??''),0,100),$uid]);
  $db->prepare("INSERT INTO po_governance_events(item_id,actor_id,action,next_status) VALUES (?,?,'Crear solicitud','Pendiente')")->execute([$id,$uid]);
  logAction($db,$uid,'create','governance',$id);$db->commit();reply(201,['ok'=>true]);
 }catch(Throwable $e){if($db->inTransaction())$db->rollBack();reply(500,['error'=>'No fue posible registrar la solicitud']);}
}
if($action==='governance' && $method==='PUT'){
 csrf();if(level($role)<3)reply(403,['error'=>'Solo Gerencia, Dirección o Administración pueden decidir']);
 $d=input();$id=(string)($d['id']??'');$status=(string)($d['status']??'');$note=trim((string)($d['note']??''));
 if(!in_array($status,['Aprobado','Rechazado','Devuelto'],true)||mb_strlen($note)>10000||$note==='')reply(400,['error'=>'Decisión inválida: agrega una justificación']);
 $db->beginTransaction();
 try {
  $q=$db->prepare('SELECT status FROM po_governance_items WHERE id=? FOR UPDATE');$q->execute([$id]);$old=$q->fetchColumn();
  if($old===false){$db->rollBack();reply(404,['error'=>'Solicitud inexistente']);}
  if(!in_array($old,['Pendiente','Devuelto'],true)){$db->rollBack();reply(409,['error'=>'La solicitud ya fue resuelta. Actualiza la vista.']);}
  $db->prepare('UPDATE po_governance_items SET status=?,reviewer_id=?,comment=? WHERE id=?')->execute([$status,$uid,$note,$id]);
  $db->prepare("INSERT INTO po_governance_events(item_id,actor_id,action,previous_status,next_status,note) VALUES (?,?,'Decisión',?,?,?)")->execute([$id,$uid,$old,$status,$note]);
  logAction($db,$uid,'decide','governance',$id);$db->commit();reply(200,['ok'=>true]);
 }catch(Throwable $e){if($db->inTransaction())$db->rollBack();reply(500,['error'=>'No fue posible registrar la decisión']);}
}

if($action==='audit' && $method==='GET'){
 if($role!=='admin')reply(403,['error'=>'Solo Administración puede consultar la auditoría']);
 $limit=min(100,max(10,(int)($_GET['limit']??50)));$offset=max(0,(int)($_GET['offset']??0));
 $q=$db->prepare('SELECT l.id,l.action,l.entity_type,l.entity_id,l.created_at,u.name actor FROM po_audit_log l LEFT JOIN po_users u ON u.id=l.actor_id ORDER BY l.id DESC LIMIT ? OFFSET ?');
 $q->bindValue(1,$limit,PDO::PARAM_INT);$q->bindValue(2,$offset,PDO::PARAM_INT);$q->execute();
 reply(200,['events'=>$q->fetchAll(),'limit'=>$limit,'offset'=>$offset]);
}
reply(404,['error'=>'Ruta no encontrada']);
