<?php
declare(strict_types=1);
// Bloque 2A: metadatos aditivos; no modifica iniciativas, proyectos ni vínculos actuales.
if ($action !== 'initiative_details_v12') reply(404,['error'=>'Ruta inválida']);
if ($method === 'GET') {
 $rows=$db->query('SELECT d.* FROM po_initiative_details_v12 d ORDER BY d.initiative_id')->fetchAll();
 $people=$db->query('SELECT id,name FROM po_users WHERE active=1 ORDER BY name')->fetchAll();
 $cells=$db->query("SELECT id,code,name FROM po_cells_v12 WHERE status <> 'Archivada' ORDER BY name")->fetchAll();
 reply(200,['details'=>$rows,'users'=>$people,'cells'=>$cells]);
}
if ($method !== 'POST') reply(405,['error'=>'Método no permitido']);
csrf();
if(level($role)<3)reply(403,['error'=>'Solo Gerencia, Dirección o Administración pueden modificar iniciativas']);
$d=input();
$id=filter_var($d['initiativeId']??null,FILTER_VALIDATE_INT,['options'=>['min_range'=>1]]);
if(!$id)reply(400,['error'=>'Selecciona una iniciativa válida']);
$level=(string)($d['initiativeLevel']??'Departamental');
if(!in_array($level,['Corporativa','Departamental'],true))reply(400,['error'=>'Nivel inválido']);
$code=strtoupper(trim((string)($d['code']??'')));
if($code!==''&&!preg_match('/^[A-Z0-9_-]{2,32}$/',$code))reply(400,['error'=>'Código: 2-32 caracteres alfanuméricos, guiones o guion bajo']);
$priority=(string)($d['priority']??'Media');
if(!in_array($priority,['Baja','Media','Alta','Crítica'],true))reply(400,['error'=>'Prioridad inválida']);
$parent=filter_var($d['parentInitiativeId']??null,FILTER_VALIDATE_INT,['options'=>['min_range'=>1]])?:null;
$cell=filter_var($d['cellId']??null,FILTER_VALIDATE_INT,['options'=>['min_range'=>1]])?:null;
$sponsor=filter_var($d['sponsorUserId']??null,FILTER_VALIDATE_INT,['options'=>['min_range'=>1]])?:null;
$owner=filter_var($d['processOwnerUserId']??null,FILTER_VALIDATE_INT,['options'=>['min_range'=>1]])?:null;
$department=trim((string)($d['department']??''));
$problem=trim((string)($d['problemStatement']??''));
$benefit=trim((string)($d['expectedBenefit']??''));
$scope=trim((string)($d['scopeText']??''));
$q=$db->prepare('SELECT baseline_plan FROM po_initiative_details_v12 WHERE initiative_id=?');$q->execute([$id]);$previousBaseline=$q->fetchColumn();
$baseline=array_key_exists('baselinePlan',$d)?trim((string)$d['baselinePlan']):(string)($previousBaseline?:'');
$start=trim((string)($d['startDate']??''));
$target=trim((string)($d['targetDate']??''));
foreach([$start,$target] as $date)if($date!==''&&(!preg_match('/^\d{4}-\d{2}-\d{2}$/',$date)||!checkdate((int)substr($date,5,2),(int)substr($date,8,2),(int)substr($date,0,4))))reply(400,['error'=>'Fecha inválida']);
if($start!==''&&$target!==''&&$target<$start)reply(400,['error'=>'La fecha meta debe ser posterior al inicio']);
if(strlen($department)>120||strlen($problem)>10000||strlen($benefit)>10000||strlen($scope)>10000||strlen($baseline)>60000)reply(400,['error'=>'Uno o más textos exceden el máximo permitido']);
if($level==='Corporativa'&&$parent!==null)reply(400,['error'=>'Una iniciativa corporativa no puede tener iniciativa superior']);
if($level==='Departamental'&&$department==='')reply(400,['error'=>'Indica el departamento responsable']);
if($parent===$id)reply(400,['error'=>'Una iniciativa no puede depender de sí misma']);
$q=$db->prepare('SELECT id FROM po_initiatives WHERE id=?');$q->execute([$id]);if(!$q->fetchColumn())reply(404,['error'=>'La iniciativa no existe']);
if($parent!==null){
 $q=$db->prepare("SELECT initiative_level FROM po_initiative_details_v12 WHERE initiative_id=?");$q->execute([$parent]);
 if($q->fetchColumn()!=='Corporativa')reply(400,['error'=>'La iniciativa superior debe estar registrada como corporativa']);
 $q=$db->prepare('SELECT 1 FROM po_initiative_details_v12 WHERE parent_initiative_id=? LIMIT 1');$q->execute([$id]);
 if($q->fetchColumn())reply(409,['error'=>'No se puede cambiar el nivel: esta iniciativa tiene dependientes']);
}
if($level==='Departamental'&&$parent===null)reply(400,['error'=>'Selecciona una iniciativa corporativa superior']);
if($level==='Departamental'){
 $q=$db->prepare('SELECT 1 FROM po_initiative_details_v12 WHERE parent_initiative_id=? LIMIT 1');$q->execute([$id]);
 if($q->fetchColumn())reply(409,['error'=>'No se puede cambiar a departamental: existen iniciativas dependientes']);
}
if($cell!==null){$q=$db->prepare("SELECT id FROM po_cells_v12 WHERE id=? AND status <> 'Archivada'");$q->execute([$cell]);if(!$q->fetchColumn())reply(400,['error'=>'Célula no disponible']);}
foreach([$sponsor,$owner] as $person){if($person!==null){$q=$db->prepare('SELECT id FROM po_users WHERE id=? AND active=1');$q->execute([$person]);if(!$q->fetchColumn())reply(400,['error'=>'Responsable no disponible']);}}
try{
 $db->beginTransaction();
 $q=$db->prepare('INSERT INTO po_initiative_details_v12
 (initiative_id,code,initiative_level,parent_initiative_id,department,problem_statement,expected_benefit,scope_text,priority,cell_id,sponsor_user_id,process_owner_user_id,start_date,target_date,baseline_plan)
 VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
 ON DUPLICATE KEY UPDATE code=VALUES(code),initiative_level=VALUES(initiative_level),parent_initiative_id=VALUES(parent_initiative_id),department=VALUES(department),problem_statement=VALUES(problem_statement),expected_benefit=VALUES(expected_benefit),scope_text=VALUES(scope_text),priority=VALUES(priority),cell_id=VALUES(cell_id),sponsor_user_id=VALUES(sponsor_user_id),process_owner_user_id=VALUES(process_owner_user_id),start_date=VALUES(start_date),target_date=VALUES(target_date),baseline_plan=VALUES(baseline_plan)');
 $q->execute([$id,$code?:null,$level,$parent,$department?:null,$problem?:null,$benefit?:null,$scope?:null,$priority,$cell,$sponsor,$owner,$start?:null,$target?:null,$baseline?:null]);
 logAction($db,(int)$uid,'upsert','initiative_details_v12',(string)$id);
 $db->commit();
 reply(200,['ok'=>true,'initiativeId'=>$id]);
}catch(PDOException $e){if($db->inTransaction())$db->rollBack();if($e->getCode()==='23000')reply(409,['error'=>'Código duplicado o relación inválida']);reply(500,['error'=>'No fue posible guardar los datos de la iniciativa']);}
catch(Throwable $e){if($db->inTransaction())$db->rollBack();reply(500,['error'=>'No fue posible guardar los datos de la iniciativa']);}
