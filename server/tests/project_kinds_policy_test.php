<?php
declare(strict_types=1);
require __DIR__.'/../api/project_requests_policy.php';
function ok(bool $v,string $case):void{if(!$v)throw new RuntimeException($case);echo "PASS $case\n";}
function denied(callable $f,string $class,string $case):void{try{$f();}catch(Throwable $e){if($e instanceof $class){echo "PASS $case\n";return;}throw $e;}throw new RuntimeException($case);}
$w=['members'=>[['id'=>'m']],'projects'=>[],'stages'=>[]];
$base=['name'=>'P','area'=>'Compras','objective'=>'Analizar','ownerId'=>'m','startDate'=>'2026-11-01','dueDate'=>'2026-12-01'];
$free=cleanProjectRequest($base+['initiativeId'=>null,'methodologyId'=>0],$w);
ok($free['initiativeId']===null&&$free['methodologyId']===0,'solicitud de análisis libre sin macro ni metodología');
$book=cleanProjectRequest($base+['initiativeId'=>null,'methodologyId'=>3],$w);
ok($book['initiativeId']===null&&$book['methodologyId']===3,'solicitud solo con libro de trabajo');
denied(fn()=>cleanProjectRequest($base+['initiativeId'=>4,'methodologyId'=>0],$w),InvalidArgumentException::class,'macroiniciativa exige metodología');
denied(fn()=>cleanProjectRequest($base+['initiativeId'=>null,'methodologyId'=>9],$w),InvalidArgumentException::class,'metodología fuera de catálogo se rechaza');
[$p,$stages]=requestProjectPlan($free,'new',$w);
ok(count($stages)===6&&$p['methodologyId']===0&&$p['initiativeId']===null,'plan base de seis etapas para análisis libre');
