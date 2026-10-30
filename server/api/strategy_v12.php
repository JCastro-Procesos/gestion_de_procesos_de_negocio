<?php
declare(strict_types=1);
// Bloque 2B/2C: endpoints aditivos, sin alterar datos de proyectos históricos.
if($action==='methodologies_v12'){
 if($method==='GET'){
  $templates=$db->query('SELECT * FROM po_methodology_templates_v12 ORDER BY code,version DESC')->fetchAll();
  $stages=$db->query('SELECT * FROM po_methodology_stages_v12 ORDER BY template_id,stage_order')->fetchAll();
  $activities=$db->query('SELECT a.* FROM po_methodology_activities_v12 a JOIN po_methodology_stages_v12 s ON s.id=a.stage_id ORDER BY s.template_id,s.stage_order,a.id')->fetchAll();
  reply(200,['templates'=>$templates,'stages'=>$stages,'activities'=>$activities]);
 }
 if($method!=='POST')reply(405,['error'=>'Método no permitido']);
 csrf();if(level($role)<3)reply(403,['error'=>'Permiso insuficiente']);
 $d=input();
 if(($d['operation']??'')==='publish'){
  $id=(int)($d['templateId']??0);$note=trim((string)($d['approvalNote']??''));
  if($id<1||mb_strlen($note)<5||mb_strlen($note)>1000)reply(400,['error'=>'Indica la versión y justificación de aprobación']);
  $q=$db->prepare("SELECT status FROM po_methodology_templates_v12 WHERE id=?");$q->execute([$id]);$status=$q->fetchColumn();
  if($status===false)reply(404,['error'=>'Metodología no encontrada']);
  if($status!=='Borrador')reply(409,['error'=>'Solo se pueden publicar borradores']);
  $q=$db->prepare('SELECT COUNT(*) FROM po_methodology_stages_v12 WHERE template_id=?');$q->execute([$id]);if((int)$q->fetchColumn()!==6)reply(409,['error'=>'Se requieren seis etapas']);
  $db->beginTransaction();
  try{
   $db->prepare("UPDATE po_methodology_templates_v12 SET status='Publicada' WHERE id=? AND status='Borrador'")->execute([$id]);
   logAction($db,$uid,'publish: '.substr($note,0,100),'methodology_v12',(string)$id);
   $db->commit();reply(200,['ok'=>true]);
  }catch(Throwable $e){if($db->inTransaction())$db->rollBack();reply(500,['error'=>'No fue posible publicar']);}
 }
 $name=trim((string)($d['name']??''));$code=strtoupper(trim((string)($d['code']??'')));
 $stages=$d['stages']??[];$status=(string)($d['status']??'Borrador');
 if(!preg_match('/^[A-Z0-9_-]{2,32}$/',$code)||$name===''||mb_strlen($name)>190||!in_array($status,['Borrador','Publicada'],true)||!is_array($stages)||count($stages)!==6)reply(400,['error'=>'Metodología inválida: requiere exactamente seis etapas']);
 $weight=0;
 foreach($stages as $i=>$s){
  if(!is_array($s)||!is_string($s['title']??null)||trim($s['title'])===''||mb_strlen($s['title'])>190||!is_numeric($s['weight']??null))reply(400,['error'=>'Etapa inválida']);
  $w=(float)$s['weight'];if(!is_finite($w)||$w<0||$w>100)reply(400,['error'=>'Ponderación inválida']);$weight+=$w;
  if(!is_array($s['activities']??null))reply(400,['error'=>'Actividades inválidas']);
  foreach($s['activities'] as $a)if(!is_array($a)||trim((string)($a['title']??''))===''||mb_strlen((string)$a['title'])>190||mb_strlen((string)($a['deliverable']??''))>500||mb_strlen((string)($a['acceptanceCriteria']??''))>10000)reply(400,['error'=>'Actividad inválida']);
 }
 if(abs($weight-100)>0.001)reply(400,['error'=>'Las ponderaciones deben sumar 100%']);
 try{
  $db->beginTransaction();
  $q=$db->prepare('SELECT COALESCE(MAX(version),0)+1 FROM po_methodology_templates_v12 WHERE code=? FOR UPDATE');$q->execute([$code]);$version=(int)$q->fetchColumn();
  $db->prepare('INSERT INTO po_methodology_templates_v12(code,name,version,status,created_by) VALUES(?,?,?,?,?)')->execute([$code,$name,$version,$status,$uid]);
  $template=(int)$db->lastInsertId();
  $stageQ=$db->prepare('INSERT INTO po_methodology_stages_v12(template_id,stage_order,title,weight) VALUES(?,?,?,?)');
  $activityQ=$db->prepare('INSERT INTO po_methodology_activities_v12(stage_id,title,deliverable,acceptance_criteria,suggested_role,estimated_days,required) VALUES(?,?,?,?,?,?,?)');
  foreach($stages as $i=>$s){$stageQ->execute([$template,$i+1,trim($s['title']),$s['weight']]);$stage=(int)$db->lastInsertId();
   foreach($s['activities'] as $a){$days=$a['estimatedDays']??null;if($days!==null&&(!is_numeric($days)||(float)$days<0))throw new InvalidArgumentException('Duración inválida');
    $activityQ->execute([$stage,trim((string)$a['title']),trim((string)($a['deliverable']??''))?:null,trim((string)($a['acceptanceCriteria']??''))?:null,substr(trim((string)($a['suggestedRole']??'')),0,100)?:null,$days,empty($a['required'])?0:1]);}
  }
  logAction($db,(int)$uid,'create','methodology_v12',(string)$template);$db->commit();reply(201,['id'=>$template,'version'=>$version]);
 }catch(Throwable $e){if($db->inTransaction())$db->rollBack();reply(500,['error'=>'No fue posible crear la versión de metodología']);}
}
if($action==='initiative_kpis_v12'){
 if($method==='GET'){
  $kpis=$db->query('SELECT * FROM po_initiative_kpis_v12 ORDER BY initiative_id,id')->fetchAll();
  $measurements=$db->query('SELECT * FROM po_initiative_kpi_measurements_v12 ORDER BY measured_at DESC,id DESC')->fetchAll();
  reply(200,['kpis'=>$kpis,'measurements'=>$measurements]);
 }
 if($method!=='POST')reply(405,['error'=>'Método no permitido']);
 csrf();if(level($role)<3)reply(403,['error'=>'Permiso insuficiente']);$d=input();
 $kind=(string)($d['kind']??'kpi');
 if($kind==='measurement'){
  $kpi=(int)($d['kpiId']??0);$actual=$d['actual']??null;$date=(string)($d['measuredAt']??'');
  if($kpi<1||!is_numeric($actual)||!is_finite((float)$actual)||!preg_match('/^\d{4}-\d{2}-\d{2}$/',$date)||!checkdate((int)substr($date,5,2),(int)substr($date,8,2),(int)substr($date,0,4)))reply(400,['error'=>'Medición inválida']);
  $url=trim((string)($d['evidenceUrl']??''));
  if(strlen($url)>1000||($url!==''&&(!filter_var($url,FILTER_VALIDATE_URL)||!in_array(strtolower((string)parse_url($url,PHP_URL_SCHEME)),['https'],true))))reply(400,['error'=>'La evidencia debe ser una URL HTTPS']);
  $q=$db->prepare('SELECT id FROM po_initiative_kpis_v12 WHERE id=?');$q->execute([$kpi]);if(!$q->fetchColumn())reply(404,['error'=>'Indicador no encontrado']);
  $db->prepare('INSERT INTO po_initiative_kpi_measurements_v12(kpi_id,measured_at,actual,evidence_url,recorded_by) VALUES(?,?,?,?,?)')->execute([$kpi,$date,$actual,$url?:null,$uid]);
  logAction($db,(int)$uid,'measure','initiative_kpi_v12',(string)$kpi);reply(201,['ok'=>true]);
 }
 if($kind!=='kpi')reply(400,['error'=>'Operación inválida']);
 $initiative=(int)($d['initiativeId']??0);$name=trim((string)($d['name']??''));$unit=trim((string)($d['unit']??''));
 $baseline=$d['baseline']??null;$target=$d['target']??null;$direction=(string)($d['direction']??'increase');
 $frequency=trim((string)($d['frequency']??'Mensual'));$source=trim((string)($d['dataSource']??''));
 if($initiative<1||$name===''||mb_strlen($name)>190||$unit===''||mb_strlen($unit)>60||!in_array($direction,['increase','decrease'],true)||!is_numeric($baseline)||!is_numeric($target)||!is_finite((float)$baseline)||!is_finite((float)$target)||$baseline==$target||mb_strlen($frequency)>60||mb_strlen($source)>500)reply(400,['error'=>'Indicador inválido: línea base y meta deben ser distintas']);
 $date=trim((string)($d['targetDate']??''));if($date!==''&&(!preg_match('/^\d{4}-\d{2}-\d{2}$/',$date)||!checkdate((int)substr($date,5,2),(int)substr($date,8,2),(int)substr($date,0,4))))reply(400,['error'=>'Fecha meta inválida']);
 if(($direction==='increase'&&(float)$target<=(float)$baseline)||($direction==='decrease'&&(float)$target>=(float)$baseline))reply(400,['error'=>'La meta debe seguir la dirección del indicador']);
 $q=$db->prepare('SELECT id FROM po_initiatives WHERE id=?');$q->execute([$initiative]);if(!$q->fetchColumn())reply(404,['error'=>'Iniciativa inexistente']);
 $db->prepare('INSERT INTO po_initiative_kpis_v12(initiative_id,name,unit,direction,baseline,target,target_date,frequency,data_source) VALUES(?,?,?,?,?,?,?,?,?)')->execute([$initiative,$name,$unit,$direction,$baseline,$target,$date?:null,$frequency?:'Mensual',$source?:null]);
 $id=(int)$db->lastInsertId();logAction($db,(int)$uid,'create','initiative_kpi_v12',(string)$id);reply(201,['id'=>$id]);
}
reply(404,['error'=>'Ruta desconocida']);
