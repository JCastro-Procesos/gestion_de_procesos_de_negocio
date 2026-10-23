import {useEffect,useState} from 'react';
import type {Workspace,Task} from '../../domain/model';
import {session,type CurrentUser} from '../../data/processoneApi';
type Props={workspace:Workspace;onOpenProject:(id:string)=>void;onSaveTask:(task:Task,isNew:boolean)=>void};
export function MyWorkPage({workspace,onOpenProject,onSaveTask}:Props){
 const [user,setUser]=useState<CurrentUser|null>(null),[error,setError]=useState('');
 useEffect(()=>{void session().then(setUser).catch(e=>setError(String(e)));},[]);
 const email=user?.email?.toLowerCase()||'';
 const member=workspace.members.find(m=>m.email?.toLowerCase()===email);
 const tasks=workspace.tasks.filter(t=>member&&t.assigneeId===member.id).sort((a,b)=>(a.dueDate||'9999').localeCompare(b.dueDate||'9999'));
 const today=new Date().toISOString().slice(0,10);
 const open=tasks.filter(t=>t.status!=='Completado');
 const overdue=open.filter(t=>t.dueDate&&t.dueDate<today);
 return <div className="page-stack"><section className="itm-planning-panel"><h2>Mi trabajo</h2><p>Actividades asociadas a tu correo corporativo: {email||'Cargando sesión…'}</p>{error&&<p role="alert">{error}</p>}
 {!member&&user&&<p>No encontramos un integrante del equipo con este correo. Solicita al Administrador que vincule tu correo en Equipo y capacidad.</p>}
 <div style={{display:'flex',gap:15,flexWrap:'wrap'}}><b>{open.length} pendientes</b><b>{overdue.length} vencidas</b><b>{tasks.filter(t=>t.status==='Completado').length} completadas</b></div></section>
 <section className="itm-planning-panel"><h3>Mis tareas</h3><div style={{display:'grid',gap:10}}>{tasks.map(t=><article key={t.id} className="po-action-row"><div><b>{t.title}</b><small>{workspace.projects.find(p=>p.id===t.projectId)?.name||'Proyecto no encontrado'} · {t.priority} · {t.dueDate||'Sin fecha'}</small></div><div style={{display:'flex',gap:8,alignItems:'center'}}><select aria-label={'Estado de '+t.title} value={t.status} onChange={e=>onSaveTask({...t,status:e.target.value as Task['status']},false)}>{(['Por Hacer','En Proceso','En Revisión','Completado'] as const).map(v=><option key={v}>{v}</option>)}</select><button onClick={()=>onOpenProject(t.projectId)}>Abrir proyecto</button></div></article>)}{member&&tasks.length===0&&<p>No tienes tareas asignadas actualmente.</p>}</div></section></div>;
}
