<?php
declare(strict_types=1);
require __DIR__.'/../api/project_requests_policy.php';
function ok(bool $v,string $case):void{if(!$v)throw new RuntimeException($case);echo "PASS $case\n";}
function denied(callable $f,string $class):void{try{$f();throw new RuntimeException('Expected rejection');}catch(Throwable $e){if(!($e instanceof $class))throw $e;}}
$old=['projects'=>[['id'=>'p']],'stages'=>[['projectId'=>'p','activities'=>[['id'=>'a'],['id'=>'b']]]],'members'=>[['id'=>'m']],'projectControls'=>['version'=>1,'budgets'=>['p'=>['approved'=>100,'hourRate'=>10,'expenses'=>[]]],'planning'=>[],'benefits'=>[]]];
$n=$old;unset($n['projectControls']);ok(controlsWrite($n,$old,2)['projectControls']===$old['projectControls'],'old client preserves shared controls');
$n=$old;$n['projectControls']['budgets']['p']['approved']=200;denied(fn()=>controlsWrite($n,$old,2),DomainException::class);ok(controlsWrite($n,$old,3)['projectControls']['budgets']['p']['approved']===200,'manager authorizes budget');
$n=$old;$n['projectControls']['budgets']['p']['expenses']=[['id'=>'e','description'=>'Licencia','amount'=>10,'date'=>'2026-11-03','type'=>'Pagado']];ok(count(controlsWrite($n,$old,2)['projectControls']['budgets']['p']['expenses'])===1,'specialist records expense');
$n['projectControls']['budgets']['p']['expenses'][0]['amount']=-1;denied(fn()=>controlsWrite($n,$old,3),InvalidArgumentException::class);
$n=$old;$n['projectControls']['planning']['p']=['dependencies'=>['a'=>['b'],'b'=>['a']]];denied(fn()=>controlsWrite($n,$old,3),InvalidArgumentException::class);
$n['projectControls']['planning']['p']=['dependencies'=>['a'=>['unknown']]];denied(fn()=>controlsWrite($n,$old,3),InvalidArgumentException::class);
$r=['created_by'=>2,'revision'=>1,'status'=>'Pendiente'];denied(fn()=>requestDecisionAllowed($r,3,2,1),DomainException::class);denied(fn()=>requestDecisionAllowed($r,2,5,1),DomainException::class);denied(fn()=>requestDecisionAllowed($r,3,3,2),LogicException::class);requestDecisionAllowed($r,3,3,1);
$d=['name'=>'P','area'=>'Compras','objective'=>'Reducir tiempo','ownerId'=>'m','startDate'=>'2026-11-01','dueDate'=>'2026-11-03','initiativeId'=>1,'methodologyId'=>2];$clean=cleanProjectRequest($d,$old);[$p,$stages]=requestProjectPlan($clean,'new',$old);ok(count($stages)===6,'six corporate stages');ok($stages[5]['dueDate']==='2026-11-03','plan respects target date');ok($p['ownerId']==='m','owner from validated request');
$d['dueDate']='2026-02-30';denied(fn()=>cleanProjectRequest($d,$old),InvalidArgumentException::class);
