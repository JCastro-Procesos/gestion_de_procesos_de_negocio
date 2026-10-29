<?php
declare(strict_types=1);
// ProcessOne v1.2: rutas de células. Incluido después de member() y csrf().
// Requiere la migración de staging y no sustituye la API existente.
if ($action === 'cells_v12') {
 if ($method === 'GET') {
  if (level($role) < 2) reply(403,['error'=>'Permiso insuficiente']);
  try {
   $cells=$db->query("SELECT c.id,c.code,c.name,c.mission,c.leader_user_id,c.status,c.capacity_hours_week,c.created_at,c.updated_at,u.name AS leader_name FROM po_cells_v12 c LEFT JOIN po_users u ON u.id=c.leader_user_id ORDER BY c.name")->fetchAll();
   $members=$db->query("SELECT m.cell_id,m.user_id,m.role,m.allocated_hours_week,m.effective_from,m.effective_to,u.name AS user_name FROM po_cell_members_v12 m JOIN po_users u ON u.id=m.user_id WHERE m.effective_from<=CURRENT_DATE AND (m.effective_to IS NULL OR m.effective_to>=CURRENT_DATE) AND u.active=1 ORDER BY u.name")->fetchAll();
   $people=$db->query("SELECT id,name,role FROM po_users WHERE active=1 ORDER BY name")->fetchAll();
   reply(200,['cells'=>$cells,'members'=>$members,'users'=>$people]);
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
 $members=$d['members']??[];
 if(!is_array($members)||count($members)>200)reply(400,['error'=>'Lista de integrantes inválida']);
 $normalized=[];$seen=[];
 foreach($members as $m){
  if(!is_array($m))reply(400,['error'=>'Integrante inválido']);
  $memberId=filter_var($m['userId']??null,FILTER_VALIDATE_INT,['options'=>['min_range'=>1]]);
  $hours=$m['allocatedHoursPerWeek']??null;
  if($hours!==null && (!is_numeric($hours)||!is_finite((float)$hours)||(float)$hours<0||(float)$hours>999999))reply(400,['error'=>'Capacidad asignada inválida']);
  if($memberId===false||isset($seen[$memberId]))reply(400,['error'=>'Integrantes repetidos o inválidos']);
  $seen[$memberId]=true;
  $normalized[]=['userId'=>$memberId,'hours'=>$hours===null?null:(float)$hours];
 }
 $capacity=isset($d['capacityHoursPerWeek']) && $d['capacityHoursPerWeek']!==''?(float)$d['capacityHoursPerWeek']:null;
 if(!preg_match('/^[A-Z0-9_-]{2,32}$/',$code)||mb_strlen($name)<3||mb_strlen($name)>190||mb_strlen($mission)>5000||!in_array($status,['Borrador','Activa','Pausada','Archivada'],true)||($capacity!==null&&(!is_finite($capacity)||$capacity<0||$capacity>999999)))reply(400,['error'=>'Datos de célula inválidos']);
 if($leader!==null&&!isset($seen[$leader]))reply(400,['error'=>'El líder debe formar parte de la célula']);
 if($leader!==null){$q=$db->prepare('SELECT id FROM po_users WHERE id=? AND active=1');$q->execute([$leader]);if(!$q->fetchColumn())reply(400,['error'=>'El líder debe ser un usuario activo']);}
 if($normalized){
  $placeholders=implode(',',array_fill(0,count($normalized),'?'));
  $q=$db->prepare("SELECT id FROM po_users WHERE active=1 AND id IN ($placeholders)");
  $q->execute(array_column($normalized,'userId'));
  if(count($q->fetchAll())!==count($normalized))reply(400,['error'=>'Todos los integrantes deben ser usuarios activos']);
 }
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
  // Cierra membresías anteriores; las altas del mismo día se reemplazan sin duplicar PK.
  $db->prepare("DELETE FROM po_cell_members_v12 WHERE cell_id=? AND effective_from=CURRENT_DATE")->execute([$id]);
  $db->prepare("UPDATE po_cell_members_v12 SET effective_to=DATE_SUB(CURRENT_DATE,INTERVAL 1 DAY) WHERE cell_id=? AND effective_from<CURRENT_DATE AND (effective_to IS NULL OR effective_to>=CURRENT_DATE)")->execute([$id]);
  $add=$db->prepare("INSERT INTO po_cell_members_v12(cell_id,user_id,role,allocated_hours_week,effective_from,effective_to) VALUES (?,?,?,?,CURRENT_DATE,NULL)");
  foreach($normalized as $m){$add->execute([$id,$m['userId'],$m['userId']===$leader?'Líder':'Integrante',$m['hours']]);}
  $db->commit();reply($method==='POST'?201:200,['ok'=>true,'id'=>$id]);
 }catch(Throwable $e){
  if($db->inTransaction())$db->rollBack();
  if($e instanceof PDOException && $e->getCode()==='23000')reply(409,['error'=>'Código de célula duplicado o referencia inválida']);
  reply(503,['error'=>'No se pudo guardar la célula; verificar migración v1.2']);
 }
}
