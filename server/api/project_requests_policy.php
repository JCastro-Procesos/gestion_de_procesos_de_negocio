<?php
declare(strict_types=1);
require_once __DIR__.'/project_controls_policy.php';
require_once __DIR__.'/project_request_plan.php';
function cleanProjectRequest(array $d,array $w):array{
 $r=[];
 foreach(['name'=>190,'area'=>120,'objective'=>2000,'description'=>5000,'sponsor'=>190,'ownerId'=>100] as $k=>$max){$v=$d[$k]??'';if(!controlText($v,$max,in_array($k,['name','area','objective','ownerId'],true)))throw new InvalidArgumentException('Completa nombre, área, objetivo y responsable');$r[$k]=trim($v);}
 $members=array_column($w['members']??[],'id');if(!in_array($r['ownerId'],$members,true))throw new InvalidArgumentException('Responsable fuera del equipo');
 foreach(['startDate','dueDate'] as $k){if(!controlDate($d[$k]??null))throw new InvalidArgumentException('Define fechas válidas de inicio y compromiso');$r[$k]=$d[$k];}if($r['dueDate']<$r['startDate'])throw new InvalidArgumentException('El compromiso debe ser posterior al inicio');
 foreach(['priority'=>['Baja','Media','Alta','Crítica'],'mode'=>['Express','Estándar','Transformación'],'planType'=>['Tecnológico','Documentación','Optimización']] as $k=>$allowed){$v=$d[$k]??($k==='priority'?'Media':($k==='mode'?'Estándar':'Optimización'));if(!in_array($v,$allowed,true))throw new InvalidArgumentException('Tipo o prioridad inválida');$r[$k]=$v;}
 $areas=$d['scopeAreas']??[$r['area']];if(!is_array($areas)||count($areas)>50)throw new InvalidArgumentException('Alcance inválido');foreach($areas as $a)if(!controlText($a,120,true))throw new InvalidArgumentException('Área de alcance inválida');$r['scopeAreas']=array_values(array_unique(array_merge([$r['area']],$areas)));
 $r['initiativeId']=$d['initiativeId']??null;$r['methodologyId']=$d['methodologyId']??2;
 if($r['initiativeId']!==null&&(!is_int($r['initiativeId'])||$r['initiativeId']<1))throw new InvalidArgumentException('Macroiniciativa inválida');
 if(!is_int($r['methodologyId'])||$r['methodologyId']<1||$r['methodologyId']>5)throw new InvalidArgumentException('Metodología inválida');
 return $r;
}
function requestDecisionAllowed(array $r,int $uid,int $level,int $revision):void{
 if($level<3)throw new DomainException('Solo Gerencia, Dirección o Administración pueden decidir solicitudes');
 if((int)$r['created_by']===$uid)throw new DomainException('La solicitud requiere aprobación de otra persona');
 if($r['status']!=='Pendiente'||(int)$r['revision']!==$revision)throw new LogicException('La solicitud cambió o ya fue decidida. Actualiza la bandeja.');
}
function requestProjectPlan(array $r,string $id,array $w):array{
 $template=requestPlanTemplate();$now=gmdate('c');$date=gmdate('Y-m-d');
 $project=['id'=>$id,'name'=>$r['name'],'area'=>$r['area'],'scopeAreas'=>$r['scopeAreas'],'goal'=>$r['objective'],'description'=>$r['description'],'sponsor'=>$r['sponsor'],'ownerId'=>$r['ownerId'],'initiativeId'=>$r['initiativeId'],'methodologyId'=>$r['methodologyId'],'planType'=>$r['planType'],'priority'=>$r['priority']==='Crítica'?'Alta':$r['priority'],'status'=>'Por iniciar','semaforo'=>'Verde','startDate'=>$r['startDate'],'dueDate'=>$r['dueDate'],'createdAt'=>$date,'updatedAt'=>$date];
 $start=new DateTimeImmutable($r['startDate'].'T12:00:00Z');$days=(int)$start->diff(new DateTimeImmutable($r['dueDate'].'T12:00:00Z'))->format('%a');$weight=$template['weights'][$r['planType']];$cumulative=0;$stages=[];
 foreach($template['stages'] as $i=>$blueprint){$from=$cumulative;$cumulative+=$weight[$i];$a=$start->modify('+'.(int)round($days*$from/100).' days')->format('Y-m-d');$b=$start->modify('+'.(int)round($days*$cumulative/100).' days')->format('Y-m-d');$stage=['id'=>'stage-'.bin2hex(random_bytes(16)),'projectId'=>$id,'order'=>$i+1,'name'=>$blueprint['name'],'objective'=>$blueprint['objective'].' Puerta: '.$blueprint['gate'],'startDate'=>$a,'dueDate'=>$b,'status'=>'Por iniciar','progress'=>0,'activities'=>[]];
  foreach($blueprint['deliverables'] as $name)$stage['activities'][]=['id'=>'activity-'.bin2hex(random_bytes(16)),'name'=>$name,'deliverable'=>$template['aliases'][$r['planType']][$name]??$name,'ownerId'=>$r['ownerId'],'startDate'=>$a,'dueDate'=>$b,'status'=>'Por iniciar','progress'=>0];
  $stages[]=$stage;
 }
 $method=null;foreach($w['alignmentCatalog']['methodologies']??[] as $m)if($m['id']===$r['methodologyId'])$method=$m;
 $sources=[];foreach($w['alignmentCatalog']['macroActivities'][(string)$r['initiativeId']]??[] as $a)$sources[]=['a'=>$a,'kind'=>'Macroiniciativa','key'=>'macro:'.$r['initiativeId'].':'.$a['id'],'sourceId'=>$r['initiativeId'],'version'=>1,'name'=>'Macroiniciativa'];
 foreach($method['activities']??[] as $a)$sources[]=['a'=>$a,'kind'=>'Metodología','key'=>'method:'.$method['id'].':'.$a['id'],'sourceId'=>$method['id'],'version'=>$method['version'],'name'=>$method['name'].' · v'.$method['version']];
 foreach($sources as $source){$a=$source['a'];$index=($a['stageOrder']??0)-1;if(!isset($stages[$index]))continue;$found=null;foreach($stages[$index]['activities'] as $j=>$existing)if(mb_strtolower(trim($existing['name']))===mb_strtolower(trim($a['title'])))$found=$j;
  if($found!==null){if(isset($stages[$index]['activities'][$found]['origin'])){$stages[$index]['activities'][$found]['origin']['sourceKeys'][]=$source['key'];$stages[$index]['activities'][$found]['deliverable'].=' | '.$a['deliverable'];}continue;}
  $stages[$index]['activities'][]=['id'=>'activity-'.bin2hex(random_bytes(16)),'name'=>$a['title'],'deliverable'=>$a['deliverable'],'acceptanceCriteria'=>$a['acceptanceCriteria'],'estimatedDays'=>$a['estimatedDays'],'ownerId'=>$r['ownerId'],'startDate'=>$stages[$index]['startDate'],'dueDate'=>$stages[$index]['dueDate'],'status'=>'Por iniciar','progress'=>0,'origin'=>['kind'=>$source['kind'],'templateId'=>$source['sourceId'],'version'=>$source['version'],'activityId'=>$a['id'],'incorporatedAt'=>$now,'sourceKeys'=>[$source['key']],'sourceNames'=>[$source['name']]]];
 }
 return [$project,$stages];
}
