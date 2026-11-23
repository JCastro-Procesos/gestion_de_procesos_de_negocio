<?php
declare(strict_types=1);
function controlNumber(mixed $value,bool $nonnegative=true):bool{return (is_int($value)||is_float($value))&&is_finite((float)$value)&&abs($value)<=1e12&&(!$nonnegative||$value>=0);}
function controlDate(mixed $value,bool $empty=false):bool{if($empty&&$value==='')return true;if(!is_string($value))return false;$d=DateTimeImmutable::createFromFormat('!Y-m-d',$value);return $d&&$d->format('Y-m-d')===$value;}
function controlText(mixed $v,int $max,bool $required=false):bool{return is_string($v)&&mb_strlen($v)<=$max&&(!$required||trim($v)!=='');}
function controlsWrite(array $next,array $prior,int $level):array{
 if(!array_key_exists('projectControls',$next)){if(isset($prior['projectControls']))$next['projectControls']=$prior['projectControls'];return $next;}
 $c=$next['projectControls'];$old=$prior['projectControls']??['version'=>1,'budgets'=>[],'planning'=>[],'benefits'=>[]];
 if(json_encode($c)===json_encode($old))return $next;
 if($level<2)throw new DomainException('Permiso insuficiente para modificar controles compartidos');
 if(!is_array($c)||($c['version']??null)!==1)throw new InvalidArgumentException('Versión de controles inválida');
 foreach(['budgets','planning','benefits'] as $k)if(!is_array($c[$k]??null)||count($c[$k])>10000)throw new InvalidArgumentException('Controles compartidos inválidos');
 $projects=[];$activities=[];foreach($next['projects'] as $p)$projects[(string)$p['id']]=true;
 foreach($next['stages']??[] as $s)foreach($s['activities']??[] as $a)$activities[(string)$s['projectId']][(string)$a['id']]=true;
 foreach($c['budgets'] as $id=>$b){
  if(!isset($projects[$id])&&json_encode($b)!==json_encode($old['budgets'][$id]??null))throw new InvalidArgumentException('Presupuesto sin proyecto existente');
  if(!is_array($b)||!controlNumber($b['approved']??null)||!controlNumber($b['hourRate']??null)||!is_array($b['expenses']??null)||count($b['expenses'])>10000)throw new InvalidArgumentException('Importes de presupuesto inválidos');
  $before=$old['budgets'][$id]??['approved'=>0,'hourRate'=>0];
  if($level<3&&(($b['approved']!=$before['approved'])||($b['hourRate']!=$before['hourRate'])))throw new DomainException('Solo Gerencia, Dirección o Administración autorizan presupuesto y tarifa');
  $seen=[];foreach($b['expenses'] as $e){if(!is_array($e)||!controlText($e['id']??null,100,true)||isset($seen[$e['id']])||!controlText($e['description']??null,1000,true)||!controlNumber($e['amount']??null)||$e['amount']<=0||!controlDate($e['date']??null)||!in_array($e['type']??null,['Comprometido','Pagado'],true))throw new InvalidArgumentException('Costo inválido');$seen[$e['id']]=true;}
 }
 if($level<3)foreach($old['budgets'] as $id=>$b)if(!array_key_exists($id,$c['budgets'])&&(($b['approved']??0)!=0||($b['hourRate']??0)!=0))throw new DomainException('No puedes eliminar un presupuesto autorizado');
 foreach($c['planning'] as $id=>$p){
  if(json_encode($p)===json_encode($old['planning'][$id]??null))continue;
  if(!isset($projects[$id])||!is_array($p))throw new InvalidArgumentException('Plan sin proyecto existente');
  if(!is_array($p['baseline']??[])||count($p['baseline']??[])>10000)throw new InvalidArgumentException('Línea base inválida');
  foreach($p['baseline']??[] as $aid=>$row)if(!isset($activities[$id][$aid])||!is_array($row)||!controlDate($row['start']??null,true)||!controlDate($row['end']??null,true)||!controlNumber($row['hours']??null)||(($row['start']??'')&&($row['end']??'')&&$row['end']<$row['start']))throw new InvalidArgumentException('Línea base inválida');
  $graph=$p['dependencies']??[];if(!is_array($graph)||count($graph)>10000)throw new InvalidArgumentException('Dependencias inválidas');
  foreach($graph as $aid=>$deps){if(!isset($activities[$id][$aid])||!is_array($deps)||count($deps)>100||count(array_unique($deps))!==count($deps))throw new InvalidArgumentException('Dependencias inválidas');foreach($deps as $dep)if(!is_string($dep)||$dep===(string)$aid||!isset($activities[$id][$dep]))throw new InvalidArgumentException('Dependencia inexistente o de otro proyecto');}
  $done=[];$active=[];$visit=function(string $aid)use(&$visit,&$done,&$active,$graph):void{if(isset($active[$aid]))throw new InvalidArgumentException('Las dependencias no pueden contener ciclos');if(isset($done[$aid]))return;$active[$aid]=true;foreach($graph[$aid]??[] as $dep)$visit($dep);unset($active[$aid]);$done[$aid]=true;};foreach(array_keys($graph) as $aid)$visit((string)$aid);
 }
 $oldBenefits=[];foreach($old['benefits'] as $b)$oldBenefits[$b['id']]=$b;$seen=[];
 foreach($c['benefits'] as $b){if(!is_array($b)||!controlText($b['id']??null,100,true)||isset($seen[$b['id']])||!controlText($b['name']??null,500,true)||!controlText($b['unit']??null,60,true)||!controlNumber($b['target']??null,false)||!controlNumber($b['actual']??null,false))throw new InvalidArgumentException('Beneficio inválido');$seen[$b['id']]=true;if(!isset($projects[$b['projectId']??''])&&json_encode($b)!==json_encode($oldBenefits[$b['id']]??null))throw new InvalidArgumentException('Beneficio sin proyecto existente');}
 return $next;
}
