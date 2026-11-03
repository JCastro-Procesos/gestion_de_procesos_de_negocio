<?php
declare(strict_types=1);
require_once __DIR__.'/project_requests_policy.php';
function requestWorkspace(PDO $db,bool $lock=false):array{
 $q=$db->query("SELECT payload,revision FROM po_workspace WHERE id='main'".($lock?' FOR UPDATE':''));$row=$q->fetch();if(!$row)throw new InvalidArgumentException('Inicializa el espacio compartido antes de registrar solicitudes');$w=json_decode($row['payload'],true,512,JSON_THROW_ON_ERROR);
 $members=[];foreach($w['members']??[] as $m)$members[$m['id']]=$m;
 foreach($db->query('SELECT id,name,email,role FROM po_users WHERE active=1')->fetchAll() as $person){$key='user-'.$person['id'];$members[$key]=array_merge(['id'=>$key,'capacityHours'=>36,'color'=>'#5367d8'],$members[$key]??[],['name'=>$person['name'],'email'=>$person['email'],'role'=>$person['role']]);}
 $w['members']=array_values($members);return [$w,(int)$row['revision']];
}
function requestView(array $row):array{$r=json_decode($row['payload'],true,512,JSON_THROW_ON_ERROR);return array_merge($r,['id'=>$row['id'],'status'=>$row['status'],'revision'=>(int)$row['revision'],'createdBy'=>(int)$row['created_by'],'decidedBy'=>$row['decided_by']===null?null:(int)$row['decided_by'],'projectId'=>$row['project_id'],'requestedBy'=>$row['creator_name']??'Usuario','createdAt'=>$row['created_at'],'updatedAt'=>$row['updated_at']]);}
try{
 if($method==='GET'){$rows=$db->query('SELECT r.*,u.name creator_name FROM po_project_requests_shared r JOIN po_users u ON u.id=r.created_by ORDER BY r.created_at DESC LIMIT 1000')->fetchAll();reply(200,['requests'=>array_map('requestView',$rows)]);}
 csrf();$d=input();$id=$d['id']??'';if(!is_string($id)||!preg_match('/^REQ-[a-f0-9-]{36}$/D',$id))reply(400,['error'=>'Identificador de solicitud inválido']);
 if($method==='POST'){
  $q=$db->prepare('SELECT r.*,u.name creator_name FROM po_project_requests_shared r JOIN po_users u ON u.id=r.created_by WHERE r.id=?');$q->execute([$id]);$existing=$q->fetch();if($existing){if((int)$existing['created_by']!==$uid)reply(409,['error'=>'Identificador de solicitud ya utilizado']);reply(200,['request'=>requestView($existing)]);}
  [$w]=requestWorkspace($db);$r=cleanProjectRequest($d,$w);$r['history']=[['operation'=>'Creada','actorId'=>$uid,'at'=>gmdate('c'),'note'=>'Solicitud registrada para revisión']];
  $db->beginTransaction();$q=$db->prepare("INSERT INTO po_project_requests_shared(id,status,created_by,payload) VALUES (?,'Pendiente',?,?)");$q->execute([$id,$uid,json_encode($r,JSON_UNESCAPED_UNICODE|JSON_THROW_ON_ERROR)]);logAction($db,$uid,'create','project_request',$id);$db->commit();reply(201,['id'=>$id,'revision'=>1]);
 }
 if($method!=='PUT')reply(405,['error'=>'Operación no permitida']);
 if(!is_int($d['revision']??null)||!in_array($d['decision']??'', ['Aprobada','Rechazada'],true)||!controlText($d['note']??null,2000,true))reply(400,['error'=>'Define decisión, revisión y justificación']);
 $db->beginTransaction();$q=$db->prepare('SELECT * FROM po_project_requests_shared WHERE id=? FOR UPDATE');$q->execute([$id]);$row=$q->fetch();if(!$row){$db->rollBack();reply(404,['error'=>'Solicitud no encontrada']);}
 requestDecisionAllowed($row,$uid,level($role),$d['revision']);$r=json_decode($row['payload'],true,512,JSON_THROW_ON_ERROR);$projectId=null;
 if($d['decision']==='Aprobada'){
  [$w,$revision]=requestWorkspace($db,true);$r['initiativeId']=$d['initiativeId']??$r['initiativeId'];$r['methodologyId']=$d['methodologyId']??$r['methodologyId'];$r=array_merge($r,cleanProjectRequest($r,$w));
  if(!is_int($r['initiativeId'])||$r['initiativeId']<1)throw new InvalidArgumentException('Selecciona macroiniciativa principal');
  $q=$db->prepare('SELECT id FROM po_initiatives WHERE id=?');$q->execute([$r['initiativeId']]);if(!$q->fetchColumn())throw new InvalidArgumentException('Macroiniciativa inexistente');
  $w['alignmentCatalog']??=requestPlanTemplate()['catalog'];$allowed=$w['alignmentCatalog']['macroMethodologyIds'][(string)$r['initiativeId']]??[];if($allowed&&!in_array($r['methodologyId'],$allowed,true))throw new InvalidArgumentException('Metodología no vinculada a la macroiniciativa');
  $projectId='project-'.bin2hex(random_bytes(16));[$project,$stages]=requestProjectPlan($r,$projectId,$w);array_unshift($w['projects'],$project);$w['stages']=array_merge($w['stages']??[],$stages);$json=json_encode($w,JSON_UNESCAPED_UNICODE|JSON_THROW_ON_ERROR);if(strlen($json)>1500000)throw new InvalidArgumentException('El espacio supera el tamaño permitido');
  $q=$db->prepare('INSERT INTO po_projects(id,name,description,status,payload) VALUES (?,?,?,?,?)');$q->execute([$projectId,$project['name'],$project['description'],$project['status'],json_encode($project,JSON_UNESCAPED_UNICODE|JSON_THROW_ON_ERROR)]);
  $db->prepare('INSERT INTO po_initiative_projects(initiative_id,project_id) VALUES (?,?)')->execute([$r['initiativeId'],$projectId]);
  $db->prepare("UPDATE po_workspace SET payload=?,revision=revision+1,updated_by=? WHERE id='main'")->execute([$json,$uid]);
 }
 $r['history'][]=['operation'=>$d['decision'],'actorId'=>$uid,'at'=>gmdate('c'),'note'=>trim($d['note']),'projectId'=>$projectId];
 $db->prepare('UPDATE po_project_requests_shared SET status=?,revision=revision+1,decided_by=?,project_id=?,payload=? WHERE id=?')->execute([$d['decision'],$uid,$projectId,json_encode($r,JSON_UNESCAPED_UNICODE|JSON_THROW_ON_ERROR),$id]);
 logAction($db,$uid,$d['decision']==='Aprobada'?'approve':'reject','project_request',$id);if($projectId)logAction($db,$uid,'create','project',$projectId);$db->commit();reply(200,['id'=>$id,'status'=>$d['decision'],'projectId'=>$projectId]);
}catch(DomainException $e){if($db->inTransaction())$db->rollBack();reply(403,['error'=>$e->getMessage()]);}
catch(InvalidArgumentException $e){if($db->inTransaction())$db->rollBack();reply(400,['error'=>$e->getMessage()]);}
catch(LogicException $e){if($db->inTransaction())$db->rollBack();reply(409,['error'=>$e->getMessage()]);}
catch(Throwable $e){if($db->inTransaction())$db->rollBack();$missing=$e instanceof PDOException&&($e->errorInfo[1]??0)===1146;reply($missing?503:500,['error'=>$missing?'Falta aplicar 20261103_project_requests_staging.sql en esta base.':'No se pudo completar la operación de solicitud']);}
