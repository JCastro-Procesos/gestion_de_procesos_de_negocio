import {GovernanceRules} from './GovernanceRules';
import { useEffect, useState } from 'react';
import type { Workspace } from '../../domain/model';
import { api, session, type CurrentUser } from '../../data/processoneApi';

type Item = {id:string;kind:'Solicitud'|'Entregable'|'Cambio';projectId:string|null;title:string;description:string;severity:'Menor'|'Mayor'|'Crítico';status:'Pendiente'|'Aprobado'|'Rechazado'|'Devuelto';owner:string;reviewerName:string|null;comment:string;createdAt:string};
type Event = {id:number;itemId:string;action:string;actor:string;at:string;beforeStatus:string|null;afterStatus:string|null};
const field:React.CSSProperties={padding:'9px',border:'1px solid #dfe6f0',borderRadius:8,width:'100%'};
export function GovernancePage({workspace}:{workspace:Workspace}){
 const [items,setItems]=useState<Item[]>([]),[events,setEvents]=useState<Event[]>([]);
 const [user,setUser]=useState<CurrentUser|null>(null),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 const [kind,setKind]=useState<Item['kind']>('Solicitud'),[title,setTitle]=useState(''),[description,setDescription]=useState('');
 const [projectId,setProjectId]=useState(''),[severity,setSeverity]=useState<Item['severity']>('Menor'),[owner,setOwner]=useState('');
 const [note,setNote]=useState(''),[filter,setFilter]=useState('Todos');
 const canCreate=!!user&&['admin','direccion','gerencia','especialista'].includes(user.role);
 const canDecide=!!user&&['admin','direccion','gerencia'].includes(user.role);
 const load=async()=>{const r=await api<{items:Item[];events:Event[]}>('governance');setItems(r.items);setEvents(r.events);};
 useEffect(()=>{void session().then(setUser).catch(e=>setError(String(e)));void load().catch(e=>setError(e instanceof Error?e.message:String(e)));},[]);
 const create=async(e:React.FormEvent)=>{e.preventDefault();setBusy(true);setError('');try{
  await api('governance','POST',{id:crypto.randomUUID(),kind,title,description,projectId,severity,owner});
  setTitle('');setDescription('');await load();
 }catch(e){setError(e instanceof Error?e.message:String(e));}finally{setBusy(false);}};
 const decide=async(item:Item,status:'Aprobado'|'Rechazado'|'Devuelto')=>{
  if(!note.trim()){setError('Escribe una justificación antes de registrar la decisión.');return;}
  setBusy(true);setError('');try{await api('governance','PUT',{id:item.id,status,note});setNote('');await load();}
  catch(e){setError(e instanceof Error?e.message:String(e));}finally{setBusy(false);}
 };
 const visible=items.filter(i=>filter==='Todos'||i.kind===filter);
 return <div className="page-stack"><GovernanceRules workspace={workspace}/>
  <section className="itm-planning-panel">
   <h2>Gobierno y autorizaciones</h2>
   <p>Solicitudes y decisiones compartidas en MySQL, con identidad autenticada y bitácora del servidor.</p>
   {error&&<div role="alert" className="po-auth-error">{error}</div>}
   <div style={{display:'flex',gap:15,flexWrap:'wrap'}}>
    <strong>Solicitudes: {items.length}</strong><strong>Pendientes: {items.filter(i=>i.status==='Pendiente').length}</strong>
    <strong>Aprobadas: {items.filter(i=>i.status==='Aprobado').length}</strong>
   </div>
  </section>
  {canCreate&&<section className="itm-planning-panel">
   <h3>Registrar solicitud de revisión</h3>
   <form onSubmit={create} style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:12}}>
    <label>Tipo<select style={field} value={kind} onChange={e=>setKind(e.target.value as Item['kind'])}><option>Solicitud</option><option>Entregable</option><option>Cambio</option></select></label>
    <label>Proyecto<select style={field} value={projectId} onChange={e=>setProjectId(e.target.value)}><option value="">General</option>{workspace.projects.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
    <label>Impacto<select style={field} value={severity} onChange={e=>setSeverity(e.target.value as Item['severity'])}><option>Menor</option><option>Mayor</option><option>Crítico</option></select></label>
    <label>Responsable<select style={field} value={owner} onChange={e=>setOwner(e.target.value)}><option value="">Sin asignar</option>{workspace.members.map(m=><option key={m.id} value={m.id}>{m.name}</option>)}</select></label>
    <label>Título<input style={field} required maxLength={190} value={title} onChange={e=>setTitle(e.target.value)}/></label>
    <label>Justificación<textarea style={field} value={description} onChange={e=>setDescription(e.target.value)}/></label>
    <button className="top-add-button" type="submit" disabled={busy}>Registrar solicitud</button>
   </form>
  </section>}
  <section className="itm-planning-panel">
   <h3>Bandeja de decisiones</h3>
   <label>Filtrar <select style={{...field,maxWidth:190}} value={filter} onChange={e=>setFilter(e.target.value)}><option>Todos</option><option>Solicitud</option><option>Entregable</option><option>Cambio</option></select></label>
   {canDecide&&<label style={{display:'block',marginTop:12}}>Justificación de la decisión<input style={field} value={note} onChange={e=>setNote(e.target.value)} placeholder="Motivo obligatorio"/></label>}
   <div style={{overflowX:'auto'}}><table className="data-table"><thead><tr><th>Solicitud</th><th>Proyecto</th><th>Impacto</th><th>Estado</th><th>Decisión</th></tr></thead><tbody>
    {visible.map(i=><tr key={i.id}><td><b>{i.title}</b><small style={{display:'block'}}>{i.kind} · {i.description}</small></td>
     <td>{workspace.projects.find(p=>p.id===i.projectId)?.name||'General'}</td><td>{i.severity}</td><td>{i.status}</td>
     <td>{canDecide&&['Pendiente','Devuelto'].includes(i.status)?<div style={{display:'flex',gap:5}}>{(['Aprobado','Rechazado','Devuelto'] as const).map(s=><button key={s} disabled={busy} onClick={()=>void decide(i,s)}>{s}</button>)}</div>:i.reviewerName||'Sin resolver'}</td></tr>)}
   </tbody></table></div>
   {visible.length===0&&<p>No hay solicitudes registradas.</p>}
  </section>
  <section className="itm-planning-panel"><h3>Historial de decisiones</h3>
   {events.slice(0,40).map(e=><div key={e.id} style={{padding:8,borderBottom:'1px solid #e8edf4',fontSize:12}}>{e.at} · {e.actor} · {e.action} · {e.afterStatus||''}</div>)}
  </section>
 </div>;
}
