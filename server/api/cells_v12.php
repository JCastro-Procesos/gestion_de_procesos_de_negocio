<?php
declare(strict_types=1);
// ProcessOne v1.2: rutas de células. Incluido después de member() y csrf().
// Requiere la migración de staging y no sustituye la API existente.
if ($action === 'cells_v12') {
 if ($method === 'GET') {
  if (level($role) < 2) reply(403,['error'=>'Permiso insuficiente']);
  try {
   $cells=$db->query("SELECT c.id,c.code,c.name,c.mission,c.leader_user_id,c.status,c.capacity_hours_week,c.created_at,c.updated_at,u.name AS leader_name FROM po_cells_v12 c LEFT JOIN po_users u ON u.id=c.leader_user_id ORDER BY c.name")->fetchAll();
   reply(200,['cells'=>$cells]);
  } catch (Throwable $e) { reply(503,['error'=>'Catálogo de células no disponible; verificar migración v1.2']); }
 }
 csrf();
 if (level($role) < 3) reply(403,['error'=>'Solo Gerencia, Dirección y Administración pueden editar células']);
 if (!in_array($method,['POST','PUT'],true)) reply(405,['error'=>'Método no permitido']);
 $d=input();$id=(int)($d['id']??0);
 $code=strtoupper(trim((string)($d['code']??'')));
 $name=trim((string)($d['name']??''));$mission=trim((string)($d['mission']??''));
 $status=(string)($d['status']??'Borrador');
 $leader=isset($d['leaderUserId']) && $d['leaderUserId']!==''?(int)$d['leaderUserId']:null;
 $capacity=isset($d['capacityHoursPerWeek']) && $d['capacityHoursPerWeek']!==''?(float)$d['capacityHoursPerWeek']:null;
 if(!preg_match('/^[A-Z0-9_-]{2,32}$/',$code)||mb_strlen($name)<3||mb_strlen($name)>190||mb_strlen($mission)>5000||!in_array($status,['Borrador','Activa','Pausada','Archivada'],true)||($capacity!==null&&(!is_finite($capacity)||$capacity<0||$capacity>999999)))reply(400,['error'=>'Datos de célula inválidos']);
 if($leader!==null){$q=$db->prepare('SELECT id FROM po_users WHERE id=? AND active=1');$q->execute([$leader]);if(!$q->fetchColumn())reply(400,['error'=>'El líder debe ser un usuario activo']);}
 if($method==='PUT' && $id<1)reply(400,['error'=>'ID inválido']);
 try {
  $db->beginTransaction();
  if($method==='POST'){
   $q=$db->prepare('INSERT INTO po_cells_v12(code,name,mission,leader_user_id,status,capacity_hours_week) VALUES (?,?,?,?,?,?)');
   $q->execute([$code,$name,$mission,$leader,$status,$capacity]);$id=(int)$db->lastInsertId();
   logAction($db,$uid,'create','cell',(string)$id);
  }else{
   $q=$db->prepare('UPDATE po_cells_v12 SET code=?,name=?,mission=?,leader_user_id=?,status=?,capacity_hours_week=? WHERE id=?');
   $q->execute([$code,$name,$mission,$leader,$status,$capacity,$id]);
   $check=$db->prepare('SELECT id FROM po_cells_v12 WHERE id=?');$check->execute([$id]);
   if(!$check->fetchColumn()){ $db->rollBack();reply(404,['error'=>'Célula no encontrada']); }
   logAction($db,$uid,'update','cell',(string)$id);
  }
  $db->commit();reply($method==='POST'?201:200,['ok'=>true,'id'=>$id]);
 }catch(Throwable $e){
  if($db->inTransaction())$db->rollBack();
  if($e instanceof PDOException && $e->getCode()==='23000')reply(409,['error'=>'Código de célula duplicado o referencia inválida']);
  reply(503,['error'=>'No se pudo guardar la célula; verificar migración v1.2']);
 }
}
