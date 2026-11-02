<?php
declare(strict_types=1);
require __DIR__.'/../api/governance_policy.php';
function check(bool $value,string $case):void{if(!$value)throw new RuntimeException('FAIL: '.$case);echo "PASS: $case\n";}
$i=['status'=>'Pendiente','severity'=>'Menor','kind'=>'Solicitud','createdBy'=>2,'ownerUserId'=>6,'approverUserId'=>3,'dueDate'=>'2026-12-01','description'=>'Resultado verificable','evidenceUrl'=>'','impactSummary'=>'','implementationStatus'=>'Pendiente'];
check(govDecisionError($i,3,'gerencia','Aprobado')==='','Gerencia aprueba menor independiente');
check(govDecisionError($i,2,'admin','Aprobado')!=='','Administrador no se autoaprueba');
check(govDecisionError($i,6,'direccion','Aprobado')!=='','Responsable no decide');
check(govDecisionError($i,7,'gerencia','Aprobado')!=='','Respeta revisor asignado');
check(govDecisionError($i,5,'admin','Aprobado')==='','Administración independiente puede cubrir revisión');
check(govDecisionError(array_replace($i,['severity'=>'Crítico']),3,'gerencia','Aprobado')!=='','Gerencia no aprueba crítico');
check(govDecisionError(array_replace($i,['status'=>'Devuelto']),3,'gerencia','Aprobado')!=='','Devuelto requiere reenvío');
check(govDecisionError(array_replace($i,['ownerUserId'=>null]),3,'gerencia','Aprobado')!=='','Registro histórico incompleto no se aprueba');
check(govDecisionError(array_replace($i,['kind'=>'Entregable']),3,'gerencia','Aprobado')!=='','Entregable requiere evidencia');
check(govDecisionError(array_replace($i,['kind'=>'Cambio']),3,'gerencia','Aprobado')!=='','Cambio requiere impacto');
$a=array_replace($i,['status'=>'Aprobado']);
check(govImplementationError($a,6,'ingeniero','En curso','')==='','Responsable inicia ejecución');
check(govImplementationError($i,6,'ingeniero','En curso','')!=='','No ejecutar pendiente');
check(govImplementationError($a,7,'ingeniero','En curso','')!=='','Tercero sin permiso no ejecuta');
check(govImplementationError($a,6,'ingeniero','Verificado','https://example.org')!=='','No saltar etapas');
$b=array_replace($a,['implementationStatus'=>'En curso']);
check(govImplementationError($b,6,'ingeniero','Implementado','')!=='','Implementación requiere evidencia');
check(govImplementationError($b,6,'ingeniero','Implementado','https://example.org')==='','Implementación con evidencia');
$c=array_replace($b,['implementationStatus'=>'Implementado']);
check(govImplementationError($c,6,'admin','Verificado','https://example.org')!=='','Ejecutor no verifica incluso admin');
check(govImplementationError($c,3,'gerencia','Verificado','https://example.org')==='','Revisor verifica resultado');
check(govImplementationError(array_replace($c,['implementationStatus'=>'Verificado']),3,'gerencia','En curso','https://example.org')!=='','Verificado no se reabre silenciosamente');
check(govManage($i,2,'especialista')&&!govManage($i,8,'especialista'),'Control de correcciones por identidad');
