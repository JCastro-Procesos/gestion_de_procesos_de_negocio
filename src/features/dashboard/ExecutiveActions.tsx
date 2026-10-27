import type {Workspace} from '../../domain/model';
import {projectProgress,projectIsAtRisk,dueDateOverdue} from '../../domain/metrics';
type Props={workspace:Workspace;onOpenProject:(id:string)=>void;onNavigate:(page:string)=>void};
export function ExecutiveActions({workspace,onOpenProject,onNavigate}:Props){
 const alerts=workspace.projects.map(p=>({p,progress:projectProgress(p.id,workspace.stages),overdue:dueDateOverdue(p.dueDate,p.status),risk:projectIsAtRisk(p,workspace.stages,workspace.raids)})).filter(x=>x.risk||x.overdue).sort((a,b)=>Number(b.overdue)-Number(a.overdue));
 const tasks=workspace.tasks.filter(t=>t.status!=='Completado'&&!!t.dueDate&&t.dueDate<new Date().toISOString().slice(0,10)).sort((a,b)=>a.dueDate.localeCompare(b.dueDate));
 return <section className="itm-planning-panel" aria-label="Acciones ejecutivas prioritarias">
 <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12,flexWrap:'wrap'}}><div><h2>Centro de decisiones</h2><p>Alertas priorizadas para actuar, no solo consultar indicadores.</p></div><button className="top-add-button" onClick={()=>onNavigate('raid')}>Revisar RAID</button></div>
 <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(170px,1fr))',gap:12,margin:'14px 0'}}>
 <div className="po-kpi-tile"><small>Proyectos en atención</small><strong>{alerts.length}</strong></div>
 <div className="po-kpi-tile"><small>Tareas vencidas</small><strong>{tasks.length}</strong></div>
 <div className="po-kpi-tile"><small>Sin responsable</small><strong>{workspace.tasks.filter(t=>t.status!=='Completado'&&!t.assigneeId).length}</strong></div>
 </div>
 <div style={{display:'grid',gap:9}}>{alerts.slice(0,6).map(({p,progress,overdue})=><button key={p.id} className="po-action-row" onClick={()=>onOpenProject(p.id)}><span><b>{p.name}</b><small>{overdue?'Fecha vencida · ':''}{p.status} · {p.area}</small></span><span><b>{progress}%</b><small>Ver proyecto →</small></span></button>)}</div>
 {!alerts.length&&<p>No hay proyectos con alertas activas.</p>}
 {tasks.length>0&&<button className="po-action-row" style={{width:'100%',marginTop:12}} onClick={()=>onNavigate('tareas')}><b>{tasks.length} tareas vencidas</b><span>Revisar tareas →</span></button>}
 </section>;
}
