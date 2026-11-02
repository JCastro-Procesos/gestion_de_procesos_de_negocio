<?php
declare(strict_types=1);
require_once __DIR__.'/governance_policy.php';
function govSchema(PDO $db):bool{try{$db->query('SELECT item_id FROM po_governance_details LIMIT 0');$db->query('SELECT item_id FROM po_governance_versions LIMIT 0');return true;}catch(PDOException $e){if(($e->errorInfo[1]??0)===1146)return false;throw $e;}}
function govRows(PDO $db,bool $ready,?string $id=null):array{
 $extra=$ready?'d.owner_user_id ownerUserId,d.approver_user_id approverUserId,d.due_date dueDate,d.evidence_url evidenceUrl,d.impact_summary impactSummary,d.implementation_status implementationStatus,d.implementation_note implementationNote,COALESCE(d.revision,0) revision':"NULL ownerUserId,NULL approverUserId,NULL dueDate,'' evidenceUrl,'' impactSummary,'Pendiente' implementationStatus,'' implementationNote,0 revision";
 $sql='SELECT g.id,g.kind,g.project_id projectId,g.title,g.description,g.severity,g.status,g.owner,g.created_by createdBy,g.reviewer_id reviewerId,g.comment,g.created_at createdAt,g.updated_at updatedAt,u.name reviewerName,'.$extra.' FROM po_governance_items g LEFT JOIN po_users u ON u.id=g.reviewer_id '.($ready?'LEFT JOIN po_governance_details d ON d.item_id=g.id ':'').($id?'WHERE g.id=? ':'').'ORDER BY g.updated_at DESC,g.id';
 $q=$db->prepare($sql);$q->execute($id?[$id]:[]);return $q->fetchAll();
}
function govText(array $d,string $key,int $max,bool $required=false):string{
 if(isset($d[$key])&&!is_string($d[$key]))reply(400,['error'=>'Texto inválido: '.$key]);$v=trim($d[$key]??'');if(($required&&$v==='')||mb_strlen($v)>$max)reply(400,['error'=>'Revisa el campo '.$key]);return $v;
}
function govForm(PDO $db,array $d,int $creator):array{
 $title=govText($d,'title',190,true);$description=govText($d,'description',10000,true);$impact=govText($d,'impactSummary',10000);$evidence=govText($d,'evidenceUrl',1000);$kind=$d['kind']??'';$severity=$d['severity']??'';
 if(!in_array($kind,['Solicitud','Entregable','Cambio'],true)||!in_array($severity,['Menor','Mayor','Crítico'],true))reply(400,['error'=>'Tipo o impacto inválido']);
 if($kind==='Cambio'&&$impact==='')reply(400,['error'=>'Describe el impacto en alcance, plazo, costo y riesgo del cambio']);
 if($kind==='Entregable'&&$evidence==='')reply(400,['error'=>'El entregable requiere evidencia']);
 govEvidence($evidence);$due=govText($d,'dueDate',10,true);if(!preg_match('/^\d{4}-\d{2}-\d{2}$/',$due)||!checkdate((int)substr($due,5,2),(int)substr($due,8,2),(int)substr($due,0,4)))reply(400,['error'=>'Fecha compromiso inválida']);
 $owner=filter_var($d['ownerUserId']??null,FILTER_VALIDATE_INT,['options'=>['min_range'=>1]]);$approver=filter_var($d['approverUserId']??null,FILTER_VALIDATE_INT,['options'=>['min_range'=>1]]);
 if(!$owner||!$approver||$owner===$approver||$creator===$approver)reply(400,['error'=>'Asigna responsable y revisor diferentes; el creador no puede revisarse a sí mismo']);
 $q=$db->prepare('SELECT id,name,role FROM po_users WHERE active=1 AND id IN (?,?)');$q->execute([$owner,$approver]);$people=[];foreach($q->fetchAll() as $p)$people[(int)$p['id']]=$p;
 if(!isset($people[$owner],$people[$approver])||govLevel($people[$approver]['role'])<govRequiredLevel($severity))reply(400,['error'=>'Responsable o revisor no disponible para este impacto']);
 $project=govText($d,'projectId',100);if($project!==''){$q=$db->prepare('SELECT id FROM po_projects WHERE id=?');$q->execute([$project]);if(!$q->fetchColumn())reply(400,['error'=>'Proyecto inexistente']);}
 return [$kind,$project?:null,$title,$description,$severity,$people[$owner]['name'],$owner,$approver,$due,$evidence,$impact];
}
function govEvidence(string $url):void{if($url!==''&&(!filter_var($url,FILTER_VALIDATE_URL)||strtolower((string)parse_url($url,PHP_URL_SCHEME))!=='https'||parse_url($url,PHP_URL_USER)!==null))reply(400,['error'=>'La evidencia debe ser una URL HTTPS sin credenciales']);}
$ready=govSchema($db);
if($method==='GET'){
 $id=isset($_GET['id'])?(string)$_GET['id']:null;
 if($id&&isset($_GET['version'])){if(!$ready)reply(409,['error'=>'Versiones no disponibles hasta aplicar la migración']);$q=$db->prepare('SELECT snapshot FROM po_governance_versions WHERE item_id=? AND revision=?');$q->execute([$id,(int)$_GET['version']]);$snapshot=$q->fetchColumn();if(!$snapshot)reply(404,['error'=>'Versión inexistente']);reply(200,['snapshot'=>json_decode($snapshot,true)]);}
 if($id){$rows=govRows($db,$ready,$id);if(!$rows)reply(404,['error'=>'Solicitud inexistente']);$before=max(0,(int)($_GET['before']??0));$q=$db->prepare('SELECT e.id,e.item_id itemId,e.action,e.previous_status beforeStatus,e.next_status afterStatus,e.note,e.created_at at,u.name actor FROM po_governance_events e JOIN po_users u ON u.id=e.actor_id WHERE e.item_id=? '.($before?'AND e.id<? ':'').'ORDER BY e.id DESC LIMIT 101');$q->execute($before?[$id,$before]:[$id]);$events=$q->fetchAll();$more=count($events)>100;$events=array_slice($events,0,100);if($ready){$q=$db->prepare('SELECT event_id,revision FROM po_governance_versions WHERE item_id=?');$q->execute([$id]);$versions=[];foreach($q->fetchAll() as $v)$versions[(int)$v['event_id']]=(int)$v['revision'];foreach($events as &$event)$event['revision']=$versions[(int)$event['id']]??null;unset($event);}reply(200,['item'=>$rows[0],'events'=>$events,'nextBefore'=>$more?(int)$events[count($events)-1]['id']:null]);}
 $people=$db->query('SELECT id,name,role FROM po_users WHERE active=1 ORDER BY name')->fetchAll();foreach($people as &$p){$p['reviewImpacts']=govLevel($p['role'])>=4?['Menor','Mayor','Crítico']:(govLevel($p['role'])>=3?['Menor']:[]);unset($p['role']);}unset($p);
 reply(200,['items'=>govRows($db,$ready),'people'=>$people,'schemaReady'=>$ready]);
}
if(!in_array($method,['POST','PUT'],true))reply(405,['error'=>'Método no permitido']);
csrf();if(!$ready)reply(409,['error'=>'Aplica primero la migración de Gobierno y colaboración en esta base de datos']);
$d=input();$id=(string)($d['id']??'');if(!preg_match('/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i',$id))reply(400,['error'=>'ID de solicitud inválido']);
$op=$method==='POST'?'create':(string)($d['operation']??'decide');
$form=null;$note='';$evidence='';
if($op==='create'){if(govLevel($role)<2)reply(403,['error'=>'Especialista o un nivel superior puede registrar solicitudes']);$form=govForm($db,$d,$uid);}
elseif(in_array($op,['decide','comment','resubmit','implementation','edit'],true)){
 $note=govText($d,'note',10000,true);if(mb_strlen($note)<5)reply(400,['error'=>'Explica el motivo con al menos cinco caracteres']);
 if($op==='implementation'){$evidence=govText($d,'evidenceUrl',1000);govEvidence($evidence);}
 if($op==='edit'){$existing=govRows($db,true,$id);if(!$existing)reply(404,['error'=>'Solicitud inexistente']);$form=govForm($db,$d,(int)$existing[0]['createdBy']);}
}else reply(400,['error'=>'Operación inválida']);
try{
 $db->beginTransaction();
 if($op==='create'){
  [$kind,$project,$title,$description,$severity,$ownerName,$owner,$approver,$due,$evidence,$impact]=$form;
  $db->prepare("INSERT INTO po_governance_items(id,kind,project_id,title,description,severity,owner,comment,created_by) VALUES (?,?,?,?,?,?,?,'',?)")->execute([$id,$kind,$project,$title,$description,$severity,$ownerName,$uid]);
  $db->prepare('INSERT INTO po_governance_details(item_id,owner_user_id,approver_user_id,due_date,evidence_url,impact_summary,revision) VALUES (?,?,?,?,?,?,1)')->execute([$id,$owner,$approver,$due,$evidence,$impact]);
  $actionLabel='Crear solicitud';$before=null;$after='Pendiente';$note=$description;
 }else{
  $q=$db->prepare('SELECT id FROM po_governance_items WHERE id=? FOR UPDATE');$q->execute([$id]);if(!$q->fetchColumn()){$db->rollBack();reply(404,['error'=>'Solicitud inexistente']);}
  $item=govRows($db,true,$id)[0];$revision=filter_var($d['revision']??null,FILTER_VALIDATE_INT,['options'=>['min_range'=>0]]);
  if($revision===false||$revision!==(int)$item['revision']){$db->rollBack();reply(409,['error'=>'La solicitud cambió. Actualiza el detalle y revisa la última información antes de guardar.']);}
  $db->prepare('INSERT IGNORE INTO po_governance_details(item_id,revision) VALUES (?,0)')->execute([$id]);
  if((int)$item['revision']===0){
   $db->prepare("INSERT INTO po_governance_events(item_id,actor_id,action,previous_status,next_status,note) VALUES (?,?,'Ficha heredada',?,?,?)")->execute([$id,$uid,$item['status'],$item['status'],'Contenido previo conservado antes de la primera actualización de colaboración']);$legacyEvent=(int)$db->lastInsertId();
   $db->prepare('INSERT INTO po_governance_versions(item_id,revision,event_id,snapshot) VALUES (?,0,?,?)')->execute([$id,$legacyEvent,json_encode($item,JSON_UNESCAPED_UNICODE|JSON_THROW_ON_ERROR)]);
  }

  $before=$item['status'];$after=$before;
  if($op==='decide'){
   $after=(string)($d['status']??'');$problem=govDecisionError($item,$uid,$role,$after);if($problem!==''){$db->rollBack();reply(403,['error'=>$problem]);}
   $db->prepare('UPDATE po_governance_items SET status=?,reviewer_id=?,comment=? WHERE id=?')->execute([$after,$uid,$note,$id]);$actionLabel='Decisión';
  }elseif($op==='edit'){
   if(!govManage($item,$uid,$role)||!in_array($before,['Pendiente','Devuelto'],true)){$db->rollBack();reply(403,['error'=>'Solo se corrigen solicitudes pendientes o devueltas por su responsable o Gerencia']);}
   [$kind,$project,$title,$description,$severity,$ownerName,$owner,$approver,$due,$evidence,$impact]=$form;
   $db->prepare('UPDATE po_governance_items SET kind=?,project_id=?,title=?,description=?,severity=?,owner=? WHERE id=?')->execute([$kind,$project,$title,$description,$severity,$ownerName,$id]);
   $db->prepare('UPDATE po_governance_details SET owner_user_id=?,approver_user_id=?,due_date=?,evidence_url=?,impact_summary=? WHERE item_id=?')->execute([$owner,$approver,$due,$evidence,$impact,$id]);$actionLabel='Corregir ficha';
  }elseif($op==='resubmit'){
   if($before!=='Devuelto'||!govManage($item,$uid,$role)){$db->rollBack();reply(403,['error'=>'Solo el responsable o Gerencia puede reenviar una solicitud devuelta']);}
   // Validar también registros históricos antes de reenviar.
   if(empty($item['ownerUserId'])||empty($item['approverUserId'])||empty($item['dueDate'])){$db->rollBack();reply(400,['error'=>'Completa primero responsable, revisor y fecha en Editar ficha']);}
   $q=$db->prepare("SELECT MAX(CASE WHEN action='Corregir ficha' THEN id ELSE 0 END) corrected,MAX(CASE WHEN action='Decisión' AND next_status='Devuelto' THEN id ELSE 0 END) returned FROM po_governance_events WHERE item_id=?");$q->execute([$id]);$history=$q->fetch();
   if((int)$history['corrected']<=(int)$history['returned']){$db->rollBack();reply(409,['error'=>'Corrige y guarda la ficha después de la devolución antes de reenviarla']);}
   $after='Pendiente';$db->prepare("UPDATE po_governance_items SET status='Pendiente',reviewer_id=NULL,comment='' WHERE id=?")->execute([$id]);$actionLabel='Reenviar';
  }elseif($op==='implementation'){
   $next=(string)($d['implementationStatus']??'');$problem=govImplementationError($item,$uid,$role,$next,$evidence);if($problem!==''){$db->rollBack();reply(403,['error'=>$problem]);}
   $db->prepare('UPDATE po_governance_details SET implementation_status=?,implementation_note=?,evidence_url=? WHERE item_id=?')->execute([$next,$note,$evidence,$id]);$note=$next.' · '.$note.($evidence?' · Evidencia: '.$evidence:'');$actionLabel='Seguimiento';
  }else $actionLabel='Comentario';
  $db->prepare('UPDATE po_governance_details SET revision=revision+1 WHERE item_id=?')->execute([$id]);
  $db->prepare('UPDATE po_governance_items SET updated_at=CURRENT_TIMESTAMP WHERE id=?')->execute([$id]);
 }
 $db->prepare('INSERT INTO po_governance_events(item_id,actor_id,action,previous_status,next_status,note) VALUES (?,?,?,?,?,?)')->execute([$id,$uid,$actionLabel,$before,$after,$note]);
 $eventId=(int)$db->lastInsertId();$snapshot=govRows($db,true,$id)[0];$db->prepare('INSERT INTO po_governance_versions(item_id,revision,event_id,snapshot) VALUES (?,?,?,?)')->execute([$id,(int)$snapshot['revision'],$eventId,json_encode($snapshot,JSON_UNESCAPED_UNICODE|JSON_THROW_ON_ERROR)]);
 logAction($db,$uid,$op,'governance',$id);$db->commit();reply($op==='create'?201:200,['ok'=>true,'id'=>$id]);
}catch(Throwable $e){if($db->inTransaction())$db->rollBack();if($e instanceof PDOException&&$e->getCode()==='23000')reply(409,['error'=>'Solicitud duplicada o relación no disponible; actualiza la vista']);reply(500,['error'=>'No fue posible guardar la solicitud y su bitácora']);}
