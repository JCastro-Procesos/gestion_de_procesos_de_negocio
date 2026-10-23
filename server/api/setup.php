<?php
declare(strict_types=1);
// ONE-TIME installer: remove this file from hosting after initial administrator creation.
header('Content-Type: text/html; charset=utf-8');
header('Cache-Control: no-store');
if (($_SERVER['HTTPS']??'')==='off'||empty($_SERVER['HTTPS'])){http_response_code(403);exit('HTTPS requerido');}
$config='/home/u378754586/processone-private/config.php';
if(!is_file($config)){http_response_code(503);exit('Configuración privada no encontrada');}
$s=require $config;
if(!is_array($s)||empty($s['bootstrap_token'])||strlen($s['bootstrap_token'])<32){http_response_code(503);exit('Instalación deshabilitada');}
$db=new PDO('mysql:host='.($s['host']??'localhost').';dbname='.$s['database'].';charset=utf8mb4',$s['username'],$s['password'],[PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION,PDO::ATTR_EMULATE_PREPARES=>false]);
$count=(int)$db->query('SELECT COUNT(*) FROM po_users')->fetchColumn();
if($count>0){http_response_code(403);exit('Instalación inicial cerrada. Elimina setup.php del servidor.');}
$error='';
if($_SERVER['REQUEST_METHOD']==='POST'){
 $token=(string)($_POST['token']??'');$password=(string)($_POST['password']??'');$confirm=(string)($_POST['confirm']??'');
 if(!hash_equals($s['bootstrap_token'],$token)){$error='Token inválido';usleep(400000);}
 elseif(strlen($password)<14||$password!==$confirm){$error='Usa al menos 14 caracteres y confirma la contraseña';}
 else{
 $q=$db->prepare("INSERT INTO po_users(name,email,password_hash,role) VALUES (?,?,?,'admin')");
 $q->execute(['Administrador ProcessOne','castro.j@outlook.com',password_hash($password,PASSWORD_DEFAULT)]);
 exit('<h1>Administrador creado</h1><p>Elimina inmediatamente <b>api/setup.php</b> y borra bootstrap_token de config.php. Después ingresa a <a href="/">ProcessOne</a>.</p>');
 }
}
?><!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Configuración inicial ProcessOne</title><body style="font:16px system-ui;max-width:430px;margin:8vh auto;padding:20px"><h1>Activar administrador</h1><p>Esta pantalla solo funciona si no hay usuarios registrados.</p><?php if($error):?><p style="color:#b21"><?=htmlspecialchars($error,ENT_QUOTES,'UTF-8')?></p><?php endif;?><form method="post" style="display:grid;gap:12px"><label>Token de instalación<input required type="password" name="token" style="display:block;width:100%;padding:10px"></label><label>Nueva contraseña (mínimo 14 caracteres)<input required minlength="14" type="password" name="password" autocomplete="new-password" style="display:block;width:100%;padding:10px"></label><label>Confirmar contraseña<input required minlength="14" type="password" name="confirm" autocomplete="new-password" style="display:block;width:100%;padding:10px"></label><button style="padding:12px">Crear administrador</button></form></body></html>