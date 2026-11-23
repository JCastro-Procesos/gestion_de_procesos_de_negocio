<?php
// Harness de pruebas: NO se distribuye en el paquete del sitio.
declare(strict_types=1);
if(!str_contains((string)getenv('GOV_TEST_DSN'),'host=127.0.0.1;port=33306;dbname=processone_governance_test;'))throw new RuntimeException('Only the isolated local CI database is allowed');
$db=new PDO(getenv('GOV_TEST_DSN'),getenv('GOV_TEST_USER'),getenv('GOV_TEST_PASSWORD'),[PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION,PDO::ATTR_DEFAULT_FETCH_MODE=>PDO::FETCH_ASSOC,PDO::ATTR_EMULATE_PREPARES=>false]);
if(($argv[1]??'')==='setup'){
 $db->exec("CREATE TABLE po_users(id BIGINT UNSIGNED PRIMARY KEY,name VARCHAR(120),role VARCHAR(30),active TINYINT NOT NULL DEFAULT 1) ENGINE=InnoDB");
 $db->exec("CREATE TABLE po_projects(id VARCHAR(100) PRIMARY KEY) ENGINE=InnoDB");
 $db->exec("CREATE TABLE po_audit_log(id BIGINT AUTO_INCREMENT PRIMARY KEY,actor_id BIGINT,action VARCHAR(50),entity_type VARCHAR(50),entity_id VARCHAR(100)) ENGINE=InnoDB");
 $db->exec("INSERT INTO po_users VALUES (1,'Ingeniero','ingeniero',1),(2,'Especialista','especialista',1),(3,'Gerencia','gerencia',1),(4,'Revisor mayor','direccion',1),(5,'Administrador','admin',1),(6,'Responsable','especialista',1),(7,'Otro gerente','gerencia',1),(8,'Inactivo','especialista',0)");
 foreach(['20261023_governance_mysql.sql','20261102_governance_collaboration_staging.sql','20261102_governance_collaboration_staging.sql'] as $name){foreach(explode(';',file_get_contents(__DIR__.'/../../database/migrations/'.$name)) as $sql){if(trim($sql)!==''){$q=$db->query($sql);$q->closeCursor();}}}
 $db->exec("INSERT INTO po_governance_items(id,kind,title,description,severity,status,owner,comment,created_by) VALUES ('00000000-0000-4000-8000-000000000099','Solicitud','Registro previo','Contenido anterior','Menor','Devuelto','Responsable anterior','Motivo previo',2)");
 echo 'setup OK';exit;
}
$packet=json_decode(stream_get_contents(STDIN),true,512,JSON_THROW_ON_ERROR);$method=$packet['method'];$_GET=$packet['query']??[];$uid=(int)$packet['uid'];$q=$db->prepare('SELECT role FROM po_users WHERE id=? AND active=1');$q->execute([$uid]);$role=$q->fetchColumn();if(!$role)throw new RuntimeException('Invalid test actor');
function input():array{global $packet;return $packet['body']??[];}
function csrf():void{} // Solo este harness; la API real aplica CSRF y sesión antes de cada mutación.
function reply(int $status,array $data):never{echo json_encode(['status'=>$status,'data'=>$data],JSON_UNESCAPED_UNICODE|JSON_THROW_ON_ERROR);exit;}
function logAction(PDO $db,int $uid,string $op,string $entity,string $id):void{$db->prepare('INSERT INTO po_audit_log(actor_id,action,entity_type,entity_id) VALUES (?,?,?,?)')->execute([$uid,$op,$entity,$id]);}
require __DIR__.'/../api/governance.php';
