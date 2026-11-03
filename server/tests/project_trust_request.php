<?php
declare(strict_types=1);
$dsn=(string)getenv('TRUST_TEST_DSN');if(!str_contains($dsn,'host=127.0.0.1;port=33306;dbname=processone_trust_test;'))throw new RuntimeException('Only isolated trust database allowed');
$db=new PDO($dsn,getenv('TRUST_TEST_USER'),getenv('TRUST_TEST_PASSWORD'),[PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION,PDO::ATTR_DEFAULT_FETCH_MODE=>PDO::FETCH_ASSOC,PDO::ATTR_EMULATE_PREPARES=>false]);
if(($argv[1]??'')==='setup'){
 foreach([
 'CREATE TABLE po_users(id BIGINT UNSIGNED PRIMARY KEY,name VARCHAR(120),email VARCHAR(190),role VARCHAR(30),active TINYINT DEFAULT 1)',
 'CREATE TABLE po_workspace(id VARCHAR(20) PRIMARY KEY,payload LONGTEXT,revision BIGINT NOT NULL DEFAULT 1,updated_by BIGINT)',
 'CREATE TABLE po_projects(id VARCHAR(100) PRIMARY KEY,name VARCHAR(190),description TEXT,status VARCHAR(30),payload LONGTEXT)',
 'CREATE TABLE po_initiatives(id BIGINT UNSIGNED PRIMARY KEY)',
 'CREATE TABLE po_initiative_projects(initiative_id BIGINT UNSIGNED,project_id VARCHAR(100),PRIMARY KEY(initiative_id,project_id),FOREIGN KEY(project_id) REFERENCES po_projects(id))',
 'CREATE TABLE po_audit_log(id BIGINT AUTO_INCREMENT PRIMARY KEY,actor_id BIGINT,action VARCHAR(50),entity_type VARCHAR(50),entity_id VARCHAR(100))'
 ] as $sql)$db->exec($sql.' ENGINE=InnoDB');
 $db->exec("INSERT INTO po_users VALUES (1,'Ingeniero','one@example.test','ingeniero',1),(2,'Especialista','two@example.test','especialista',1),(3,'Gerencia','three@example.test','gerencia',1),(4,'Administrador','four@example.test','admin',1)");
 $db->exec('INSERT INTO po_initiatives VALUES (1)');
 foreach(explode(';',file_get_contents(__DIR__.'/../../database/migrations/20261103_project_requests_staging.sql')) as $sql)if(trim($sql)!=='')$db->exec($sql);
 require_once __DIR__.'/../api/project_request_plan.php';$catalog=requestPlanTemplate()['catalog'];$catalog['macroMethodologyIds']=['1'=>[2]];
 $w=['schemaVersion'=>1,'workspaceName'=>'Prueba aislada','projects'=>[],'stages'=>[],'tasks'=>[],'raids'=>[],'members'=>[['id'=>'m','name'=>'Equipo','role'=>'Especialista','capacityHours'=>36,'email'=>'m@example.test','color'=>'#5367d8']],'timeLogs'=>[],'alignmentCatalog'=>$catalog,'projectControls'=>['version'=>1,'budgets'=>[],'planning'=>[],'benefits'=>[]]];
 $db->prepare("INSERT INTO po_workspace(id,payload,revision) VALUES ('main',?,1)")->execute([json_encode($w,JSON_THROW_ON_ERROR)]);echo 'setup OK';exit;
}
$packet=json_decode(stream_get_contents(STDIN),true,512,JSON_THROW_ON_ERROR);if(($packet['inspect']??false)===true){$w=$db->query("SELECT payload,revision FROM po_workspace WHERE id='main'")->fetch();echo json_encode(['workspace'=>json_decode($w['payload'],true),'revision'=>(int)$w['revision'],'projects'=>(int)$db->query('SELECT COUNT(*) FROM po_projects')->fetchColumn(),'links'=>(int)$db->query('SELECT COUNT(*) FROM po_initiative_projects')->fetchColumn(),'audit'=>(int)$db->query('SELECT COUNT(*) FROM po_audit_log')->fetchColumn()]);exit;}
$method=$packet['method'];$uid=(int)$packet['uid'];$q=$db->prepare('SELECT role FROM po_users WHERE id=? AND active=1');$q->execute([$uid]);$role=$q->fetchColumn();if(!$role)throw new RuntimeException('Invalid test actor');
function level(string $role):int{return ['ingeniero'=>1,'especialista'=>2,'gerencia'=>3,'direccion'=>4,'admin'=>5][$role]??0;}
function input():array{global $packet;return $packet['body']??[];}
function csrf():void{} // Production route checks session and CSRF in index.php.
function reply(int $status,array $data):never{echo json_encode(['status'=>$status,'data'=>$data],JSON_THROW_ON_ERROR);exit;}
function logAction(PDO $db,int $uid,string $action,string $entity,string $id):void{$db->prepare('INSERT INTO po_audit_log(actor_id,action,entity_type,entity_id) VALUES (?,?,?,?)')->execute([$uid,$action,$entity,$id]);}
require __DIR__.'/../api/project_requests.php';
