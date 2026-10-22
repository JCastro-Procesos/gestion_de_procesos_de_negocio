<?php
declare(strict_types=1);
// ProcessOne API: PHP 8.1+, PDO MySQL. Secrets must be defined outside public_html.
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: no-referrer');
if (empty($_SERVER['HTTPS']) || $_SERVER['HTTPS'] === 'off') { http_response_code(403); echo '{"error":"HTTPS requerido"}'; exit; }
$config = '/home/u378754586/processone-private/config.php';
if (!is_file($config)) { http_response_code(503); echo '{"error":"Servidor sin configurar"}'; exit; }
$settings = require $config;
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
 $q=$db->prepare('SELECT id,name,email,role,active FROM po_users WHERE id=? LIMIT 1');$q->execute([$_SESSION['uid']]);$u=$q->fetch();
 if(!$u || !$u['active']) { session_destroy(); reply(401,['error'=>'Acceso deshabilitado']); }
 return $u;
}
function level(string $role):int { return ['ingeniero'=>1,'especialista'=>2,'gerencia'=>3,'direccion'=>4,'admin'=>5][$role]??0; }
function logAction(PDO $db,int $uid,string $action,string $entity,string $id):void {
 $q=$db->prepare('INSERT INTO po_audit_log(actor_id,action,entity_type,entity_id) VALUES (?,?,?,?)');$q->execute([$uid,$action,$entity,$id]);
}
$action=$_GET['action']??'';
$method=$_SERVER['REQUEST_METHOD']??'GET';
if($action==='login' && $method==='POST'){
 $d=input();$email=strtolower(trim((string)($d['email']??'')));$password=(string)($d['password']??'');
 $limit=$db->prepare('SELECT COUNT(*) FROM po_login_attempts WHERE ip_hash=? AND attempted_at > DATE_SUB(NOW(), INTERVAL 15 MINUTE)');$ipHash=hash('sha256',($_SERVER['REMOTE_ADDR']??'unknown').($settings['rate_secret']??''));$limit->execute([$ipHash]);if((int)$limit->fetchColumn()>=10)reply(429,['error'=>'Demasiados intentos. Intenta más tarde.']);
 $q=$db->prepare('SELECT id,name,email,password_hash,role,active FROM po_users WHERE email=? LIMIT 1');$q->execute([$email]);$u=$q->fetch();
 if(!$u || !$u['active'] || !password_verify($password,$u['password_hash'])){$fail=$db->prepare('INSERT INTO po_login_attempts(ip_hash) VALUES (?)');$fail->execute([$ipHash]);usleep(300000);reply(401,['error'=>'Credenciales inválidas']);}
 session_regenerate_id(true);$_SESSION['uid']=(int)$u['id'];$_SESSION['csrf']=bin2hex(random_bytes(32));unset($u['password_hash']);
 logAction($db,(int)$u['id'],'login','user',(string)$u['id']);reply(200,['user'=>$u,'csrf'=>$_SESSION['csrf']]);
}
if($action==='session' && $method==='GET'){
 $u=member($db);$_SESSION['csrf']??=bin2hex(random_bytes(32));reply(200,['user'=>$u,'csrf'=>$_SESSION['csrf']]);
}
if($action==='logout' && $method==='POST'){csrf();session_destroy();reply(200,['ok'=>true]);}
$u=member($db);$uid=(int)$u['id'];$role=$u['role'];
if($action==='workspace' && $method==='GET'){
 $q=$db->query("SELECT payload,revision FROM po_workspace WHERE id='main' LIMIT 1");$w=$q->fetch();
 $payload=$w?json_decode($w['payload'],true):null;
 if($role!=='admin' && is_array($payload) && isset($payload['members'])){foreach($payload['members'] as &$m){if(($m['role']??'')==='Dirección')$m['role']='';}unset($m);}
 reply(200,['workspace'=>$payload,'revision'=>$w?(int)$w['revision']:0]);
}
if($action==='workspace' && $method==='PUT'){
 csrf();$d=input();$payload=$d['workspace']??null;$rev=$d['revision']??null;
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
 if($role==='admin'){$rows=$db->query('SELECT id,name,email,role,active,avatar_animal FROM po_users ORDER BY name')->fetchAll();}
 else{$rows=$db->query('SELECT id,name,avatar_animal FROM po_users WHERE active=1 ORDER BY name')->fetchAll();}
 reply(200,['users'=>$rows]);
}
if($action==='users' && $method==='POST'){
 csrf();if($role!=='admin')reply(403,['error'=>'Acceso restringido']);
 $d=input();$name=trim((string)($d['name']??''));$email=strtolower(trim((string)($d['email']??'')));$password=(string)($d['password']??'');$newRole=(string)($d['role']??'ingeniero');
 if(strlen($name)<2||strlen($name)>120||!filter_var($email,FILTER_VALIDATE_EMAIL)||strlen($password)<12||level($newRole)<1)reply(400,['error'=>'Nombre, correo, rol o contraseña inválidos']);
 $q=$db->prepare('INSERT INTO po_users(name,email,password_hash,role) VALUES (?,?,?,?)');
 try{$q->execute([$name,$email,password_hash($password,PASSWORD_DEFAULT),$newRole]);}catch(PDOException $e){reply(409,['error'=>'Correo ya registrado']);}
 logAction($db,$uid,'create','user',(string)$db->lastInsertId());reply(201,['ok'=>true]);
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
reply(404,['error'=>'Ruta no encontrada']);
