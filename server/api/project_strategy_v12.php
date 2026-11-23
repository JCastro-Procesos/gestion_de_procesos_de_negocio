<?php
declare(strict_types=1);
// Adiciones 2B: asociaciones explícitas entre proyecto, iniciativa y versión metodológica.
if($action!=='project_strategy_v12')reply(404,['error'=>'Ruta inválida']);
if($method==='GET'){
 $rows=$db->query('SELECT a.project_id,a.template_id,a.initiative_id,a.assigned_at,t.name methodology_name,t.version,i.title initiative_title FROM po_project_methodology_v12 a JOIN po_methodology_templates_v12 t ON t.id=a.template_id JOIN po_initiatives i ON i.id=a.initiative_id ORDER BY a.assigned_at DESC')->fetchAll();
 reply(200,['assignments'=>$rows]);
}
if($method!=='POST')reply(405,['error'=>'Método no permitido']);
csrf();if(level($role)<3)reply(403,['error'=>'Solo Gerencia, Dirección o Administración pueden asignar metodologías']);
$d=input();$project=trim((string)($d['projectId']??''));$template=(int)($d['templateId']??0);$initiative=(int)($d['initiativeId']??0);
if($project===''||strlen($project)>100||$template<1||$initiative<1)reply(400,['error'=>'Proyecto, iniciativa y versión obligatorios']);
$q=$db->prepare('SELECT id FROM po_projects WHERE id=?');$q->execute([$project]);if(!$q->fetchColumn())reply(404,['error'=>'El proyecto no existe']);
$q=$db->prepare("SELECT id FROM po_methodology_templates_v12 WHERE id=? AND status='Publicada'");$q->execute([$template]);if(!$q->fetchColumn())reply(409,['error'=>'Solo se puede asignar una metodología publicada']);
$q=$db->prepare('SELECT id FROM po_initiatives WHERE id=?');$q->execute([$initiative]);if(!$q->fetchColumn())reply(404,['error'=>'La iniciativa no existe']);
$q=$db->prepare('SELECT COUNT(*) FROM po_methodology_stages_v12 WHERE template_id=?');$q->execute([$template]);if((int)$q->fetchColumn()!==6)reply(409,['error'=>'La metodología requiere seis etapas']);
try{
 $db->beginTransaction();
 $q=$db->prepare('INSERT INTO po_project_methodology_v12(project_id,template_id,initiative_id,assigned_by) VALUES(?,?,?,?) ON DUPLICATE KEY UPDATE template_id=VALUES(template_id),initiative_id=VALUES(initiative_id),assigned_by=VALUES(assigned_by),assigned_at=CURRENT_TIMESTAMP');
 $q->execute([$project,$template,$initiative,$uid]);
 $q=$db->prepare('INSERT INTO po_initiative_projects(initiative_id,project_id) SELECT ?,id FROM po_projects WHERE id=? ON DUPLICATE KEY UPDATE initiative_id=VALUES(initiative_id)');
 $q->execute([$initiative,$project]);
 logAction($db,$uid,'assign','project_methodology_v12',$project);
 $db->commit();reply(200,['ok'=>true]);
}catch(Throwable $e){if($db->inTransaction())$db->rollBack();reply(500,['error'=>'No fue posible vincular proyecto y metodología']);}
