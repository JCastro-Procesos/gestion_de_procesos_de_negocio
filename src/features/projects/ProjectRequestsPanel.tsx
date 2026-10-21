import { useState } from 'react';
import type { Project, Workspace } from '../../domain/model';

export type ProjectRequest = {
 id:string; name:string; area:string; scopeAreas?:string[]; objective:string; requestedBy:string;
 priority:'Baja'|'Media'|'Alta'|'Crítica'; mode:'Express'|'Estándar'|'Transformación';
 status:'Pendiente'|'Aprobada'|'Rechazada'; reason:string; createdAt:string; projectId?:string;
 ownerId?:string; sponsor?:string; methodologyId?:number; startDate?:string; dueDate?:string; description?:string;
};
export const REQUEST_KEY='itm-project-requests-v1';
export function readProjectRequests():ProjectRequest[]{try{const x:unknown=JSON.parse(localStorage.getItem(REQUEST_KEY)||'[]');return Array.isArray(x)?x as ProjectRequest[]:[];}catch{return [];}}
export function saveProjectRequest(request:ProjectRequest){const next=[request,...readProjectRequests()];localStorage.setItem(REQUEST_KEY,JSON.stringify(next));window.dispatchEvent(new Event('itm-project-requests-updated'));}
const button:React.CSSProperties={padding:'8px 12px',background:'#eaf1fb',color:'#243b67',border:'1px solid #dfe5f0',borderRadius:8,fontWeight:700,cursor:'pointer'};
export function ProjectRequestsPanel({workspace,onSaveProject,toast}:{workspace:Workspace;onSaveProject:(project:Project,mode:ProjectRequest['mode'],isNew:boolean)=>void;toast:(msg:string)=>void}){
 const [requests,setRequests]=useState(readProjectRequests);
 const persist=(next:ProjectRequest[])=>{setRequests(next);localStorage.setItem(REQUEST_KEY,JSON.stringify(next));window.dispatchEvent(new Event('itm-project-requests-updated'));};
 const decide=(r:ProjectRequest,approved:boolean)=>{if(r.status!=='Pendiente')return;
  if(!approved){persist(requests.map(x=>x.id===r.id?{...x,status:'Rechazada',reason:'Rechazada en revisión local'}:x));toast('Solicitud rechazada');return;}
  const date=new Date().toISOString().slice(0,10),id='project-'+crypto.randomUUID();
  const project:Project={id,name:r.name,area:r.area,scopeAreas:r.scopeAreas?.length?r.scopeAreas:[r.area],priority:r.priority==='Crítica'?'Alta':r.priority,ownerId:r.ownerId||workspace.members[0]?.id||'',sponsor:r.sponsor||r.requestedBy,methodologyId:r.methodologyId||2,status:'Por iniciar',semaforo:'Verde',startDate:r.startDate||date,dueDate:r.dueDate||'',goal:r.objective,description:r.description||'Solicitud aprobada: '+r.id,createdAt:date,updatedAt:date};
  onSaveProject(project,r.mode,true);
  persist(requests.map(x=>x.id===r.id?{...x,status:'Aprobada',projectId:id}:x));toast('Solicitud aprobada y proyecto registrado');
 };
 const pending=requests.filter(r=>r.status==='Pendiente');
 return <div style={{display:'grid',gap:12,marginTop:8}}>
  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:10,flexWrap:'wrap'}}><div><strong style={{fontSize:14,color:'#243b67'}}>Proyectos pendientes por autorizar</strong><p style={{fontSize:11,color:'#8490a3'}}>Solicitudes registradas desde «Nuevo proyecto» que todavía no forman parte del portafolio aprobado.</p></div><span style={{background:'#fff4dd',color:'#9a6513',padding:'7px 12px',borderRadius:12,fontSize:12,fontWeight:800}}>{pending.length} pendientes</span></div>
  {pending.length?<div style={{overflowX:'auto'}}><table className="data-table"><thead><tr><th>Solicitud</th><th>Prioridad</th><th>Alcance</th><th>Solicitante</th><th>Decisión</th></tr></thead><tbody>{pending.map(r=><tr key={r.id}><td><b>{r.name}</b><small>{r.objective||'Objetivo por definir'}</small></td><td>{r.priority}</td><td>{(r.scopeAreas?.length?r.scopeAreas:[r.area]).join(', ')}</td><td>{r.requestedBy||'No indicado'}</td><td><div style={{display:'flex',gap:6}}><button type="button" style={{...button,background:'#e9f7f1',color:'#167553'}} onClick={()=>decide(r,true)}>Aprobar</button><button type="button" style={button} onClick={()=>decide(r,false)}>Rechazar</button></div></td></tr>)}</tbody></table></div>:<div style={{padding:18,border:'1px dashed #dce5f2',borderRadius:10,color:'#7b89a2',fontSize:12,textAlign:'center'}}>No hay proyectos pendientes de autorización.</div>}
  <small style={{color:'#8790a5'}}>Las decisiones son locales y no tienen firma electrónica ni validación de permisos. Las solicitudes históricas aprobadas o rechazadas se conservan en el almacenamiento local.</small>
 </div>;
}
