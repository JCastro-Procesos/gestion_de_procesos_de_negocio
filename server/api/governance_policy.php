<?php
declare(strict_types=1);
function govLevel(string $role):int{return ['ingeniero'=>1,'especialista'=>2,'gerencia'=>3,'direccion'=>4,'admin'=>5][$role]??0;}
function govRequiredLevel(string $severity):int{return $severity==='Menor'?3:4;}
function govManage(array $item,int $uid,string $role):bool{return govLevel($role)>=3||(int)$item['createdBy']===$uid||(int)($item['ownerUserId']??0)===$uid;}
function govDecisionError(array $item,int $uid,string $role,string $status):string{
 if($item['status']!=='Pendiente')return 'Solo se decide una solicitud pendiente; las devueltas deben corregirse y reenviarse.';
 if(!in_array($status,['Aprobado','Rechazado','Devuelto'],true))return 'Decisión inválida';
 if((int)$item['createdBy']===$uid||(int)($item['ownerUserId']??0)===$uid)return 'La revisión debe ser independiente: no puedes decidir tu propia solicitud ni la que ejecutas.';
 if(govLevel($role)<govRequiredLevel($item['severity']))return 'Tu perfil no autoriza decisiones de este impacto.';
 if(!empty($item['approverUserId'])&&(int)$item['approverUserId']!==$uid&&$role!=='admin')return 'La revisión está asignada a otra persona.';
 if($status==='Aprobado'&&(empty($item['ownerUserId'])||empty($item['approverUserId'])||empty($item['dueDate'])||trim((string)$item['description'])===''||($item['kind']==='Cambio'&&trim((string)($item['impactSummary']??''))==='')||($item['kind']==='Entregable'&&trim((string)($item['evidenceUrl']??''))==='')))return 'Completa responsable, revisor, fecha, justificación y los datos requeridos del tipo antes de aprobar.';
 return '';
}
function govImplementationError(array $item,int $uid,string $role,string $next,string $evidence):string{
 if($item['status']!=='Aprobado')return 'Primero se requiere una aprobación.';
 $current=$item['implementationStatus']??'Pendiente';
 $allowed=['Pendiente'=>['En curso'],'En curso'=>['Implementado'],'Implementado'=>['En curso','Verificado'],'Verificado'=>[]];
 if(!in_array($next,$allowed[$current]??[],true))return 'Transición de ejecución inválida.';
 if($next==='Verificado'){
  if($current!=='Implementado')return 'Registra primero la implementación.';
  if(govLevel($role)<govRequiredLevel($item['severity'])||(int)$item['createdBy']===$uid||(int)($item['ownerUserId']??0)===$uid)return 'La verificación requiere un revisor independiente autorizado.';
  if((int)($item['approverUserId']??0)!==$uid&&$role!=='admin')return 'La verificación corresponde al revisor asignado.';
 }elseif((int)($item['ownerUserId']??0)!==$uid&&govLevel($role)<3)return 'Solo el responsable o Gerencia pueden registrar la ejecución.';
 if(in_array($next,['Implementado','Verificado'],true)&&trim($evidence)==='')return 'Agrega una referencia de evidencia HTTPS antes de implementar o verificar.';
 return '';
}
