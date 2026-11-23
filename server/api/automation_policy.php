<?php
declare(strict_types=1);
function validAutomationSettings(mixed $v):bool{
 $rules=['taskDue','activityDue','blocker','dependency','raid','projectDue','capacity','governance','forecast','missingOwner'];
 if(!is_array($v)||($v['version']??null)!==1||!is_int($v['warningDays']??null)||$v['warningDays']<1||$v['warningDays']>30||!is_int($v['capacityPercent']??null)||$v['capacityPercent']<100||$v['capacityPercent']>200||!is_array($v['enabled']??null)||count($v['enabled'])!==count($rules))return false;
 foreach($rules as $r)if(!is_bool($v['enabled'][$r]??null))return false;return true;
}
function automationSettingsWrite(array $payload,array $prior,int $level):array{
 if(array_key_exists('automationSettings',$payload)&&!validAutomationSettings($payload['automationSettings']))throw new InvalidArgumentException('Configuración de automatización inválida');
 if(!array_key_exists('automationSettings',$payload)&&array_key_exists('automationSettings',$prior))$payload['automationSettings']=$prior['automationSettings'];
 if(json_encode($payload['automationSettings']??null)!==json_encode($prior['automationSettings']??null)&&$level<3)throw new DomainException('Solo Gerencia, Dirección o Administración pueden modificar las reglas compartidas');
 return $payload;
}
