import type {Workspace} from '../../domain/model';
export type BusinessRule={id:string;title:string;condition:string;owner:string;severity:'Obligatoria'|'Recomendada'};
export const RULES:BusinessRule[]=[
{id:'RN-01',title:'Responsable identificado',condition:'Todo proyecto debe tener un responsable asignado.',owner:'Gerencia de Procesos',severity:'Obligatoria'},
{id:'RN-02',title:'Etapas verificables',condition:'Una etapa solo se cierra con actividades completadas y entregables documentados.',owner:'Responsable del proyecto',severity:'Obligatoria'},
{id:'RN-03',title:'Riesgo crítico escalado',condition:'Todo riesgo crítico debe contar con responsable, respuesta y fecha de compromiso.',owner:'Gerencia de Procesos',severity:'Obligatoria'},
{id:'RN-04',title:'Aprobación independiente',condition:'Las decisiones de gobierno requieren revisión de un perfil autorizado y justificación.',owner:'Dirección o Gerencia',severity:'Obligatoria'},
{id:'RN-05',title:'Evidencia de entrega',condition:'El entregable debe incluir una referencia verificable y responsable de revisión.',owner:'Responsable del proyecto',severity:'Recomendada'}
];
export const RACI=[
{activity:'Definir alcance y objetivos',R:'Especialista',A:'Gerencia',C:'Ingeniero',I:'Dirección'},
{activity:'Planear etapas y actividades',R:'Especialista',A:'Gerencia',C:'Ingeniero',I:'Dirección'},
{activity:'Ejecutar tareas y registrar evidencia',R:'Ingeniero',A:'Especialista',C:'Gerencia',I:'Dirección'},
{activity:'Gestionar riesgos e incidencias',R:'Especialista',A:'Gerencia',C:'Ingeniero',I:'Dirección'},
{activity:'Validar entregables',R:'Especialista',A:'Gerencia',C:'Ingeniero',I:'Dirección'},
{activity:'Autorizar cierre o cambio mayor',R:'Gerencia',A:'Dirección',C:'Especialista',I:'Ingeniero'},
{activity:'Administrar cuentas y permisos',R:'Administrador',A:'Administrador',C:'Gerencia',I:'Dirección'}
];
export function GovernanceRules({workspace}:{workspace:Workspace}){
 const critical=workspace.raids.filter(r=>r.status!=='Cerrado'&&r.severity==='Crítica'&&(!r.ownerId||!r.response||!r.dueDate));
 const unowned=workspace.projects.filter(p=>!p.ownerId);
 return <section className="itm-planning-panel"><h2>Reglas de negocio y matriz RACI</h2><p>Propuesta basada exclusivamente en los cinco perfiles de ProcessOne: Administrador, Dirección, Gerencia, Especialista e Ingeniero. Las asignaciones RACI requieren validación antes de declararse normativa.</p>
 <div style={{display:'flex',gap:14,flexWrap:'wrap',marginBottom:12}}><strong>Proyectos sin responsable: {unowned.length}</strong><strong>RAID críticos incompletos: {critical.length}</strong></div>
 <h3>Reglas de negocio</h3><div style={{overflowX:'auto'}}><table className="data-table"><thead><tr><th>Código</th><th>Regla</th><th>Condición</th><th>Responsable</th></tr></thead><tbody>{RULES.map(r=><tr key={r.id}><td>{r.id}</td><td>{r.title}</td><td>{r.condition}</td><td>{r.owner}</td></tr>)}</tbody></table></div>
 <h3>Matriz RACI propuesta</h3><p style={{fontSize:12}}>R = ejecuta · A = responde por el resultado · C = consultado · I = informado. Los perfiles RACI describen responsabilidades funcionales; los permisos de acceso se controlan por separado.</p>
 <div style={{overflowX:'auto'}}><table className="data-table"><thead><tr><th>Actividad</th><th>R</th><th>A</th><th>C</th><th>I</th></tr></thead><tbody>{RACI.map(r=><tr key={r.activity}><td>{r.activity}</td><td>{r.R}</td><td>{r.A}</td><td>{r.C}</td><td>{r.I}</td></tr>)}</tbody></table></div>
 </section>;
}
