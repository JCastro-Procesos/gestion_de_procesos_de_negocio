<?php
declare(strict_types=1);
require __DIR__.'/../api/automation_policy.php';
function autoCheck(bool $ok,string $case):void{if(!$ok)throw new RuntimeException('FAIL '.$case);echo "PASS $case\n";}
$rules=['taskDue','activityDue','blocker','dependency','raid','projectDue','capacity','governance','forecast','missingOwner'];$settings=['version'=>1,'warningDays'=>7,'capacityPercent'=>125,'enabled'=>array_fill_keys($rules,true)];
autoCheck(validAutomationSettings($settings),'Valid settings');
foreach([null,[],array_replace($settings,['warningDays'=>0]),array_replace($settings,['capacityPercent'=>201]),array_replace($settings,['warningDays'=>'7']),array_replace($settings,['enabled'=>[]]),array_replace($settings,['enabled'=>array_fill_keys($rules,1)])] as $bad)autoCheck(!validAutomationSettings($bad),'Reject malformed settings');
$prior=['automationSettings'=>$settings,'tasks'=>[['id'=>'keep']]];
autoCheck(automationSettingsWrite(['tasks'=>[['id'=>'changed']]],$prior,2)['automationSettings']===$settings,'Old client retains shared rules');
autoCheck(automationSettingsWrite($prior,$prior,2)===$prior,'Specialist may preserve same rules');
$next=$settings;$next['warningDays']=14;
try{automationSettingsWrite(['automationSettings'=>$next],$prior,2);throw new RuntimeException('Expected forbidden');}catch(DomainException $e){autoCheck(true,'Specialist cannot change rules');}
autoCheck(automationSettingsWrite(['automationSettings'=>$next],$prior,3)['automationSettings']===$next,'Manager can update');
try{automationSettingsWrite(['automationSettings'=>null],$prior,5);throw new RuntimeException('Expected invalid');}catch(InvalidArgumentException $e){autoCheck(true,'Admin cannot save malformed settings');}
autoCheck(automationSettingsWrite(['tasks'=>[]],$prior,3)['tasks']===[],'Unrelated writes preserved');
