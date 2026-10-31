import {api} from '../../data/processoneApi';
import {catalogFor,methodsForMacro} from '../../domain/alignment';
import { useEffect, useState } from 'react';
import type { Project, Workspace } from '../../domain/model';

export type ProjectRequest = {
 id:string; name:string; area:string; scopeAreas?:string[]; objective:string; requestedBy:string;
 priority:'Baja'|'Media'|'Alta'|'Crítica'; mode:'Express'|'Estándar'|'Transformación';
 status:'Pendiente'|'Aprobada'|'Rechazada'; reason:string; createdAt:string; projectId?:string;
 initiativeId?:number|null;planType?:Project['planType'];ownerId?:string; sponsor?:string; methodologyId?:number; startDate?:string; dueDate?:string; description?:string;
};
export const REQUEST_KEY='itm-project-requests-v1';
export function readProjectRequests():ProjectRequest[]{try{const x:unknown=JSON.parse(localStorage.getItem(REQUEST_KEY)||'[]');return Array.isArray(x)?x as ProjectRequest[]:[];}catch{return [];}}
export function saveProjectRequest(request:ProjectRequest){const next=[request,...readProjectRequests()];localStorage.setItem(REQUEST_KEY,JSON.stringify(next));window.dispatchEvent(new Event('itm-project-requests-updated'));}
const button:React.CSSProperties={padding:'8px 12px',background:'#eaf1fb',color:'#243b67',border:'1px solid #dfe5f0',borderRadius:8,fontWeight:700,cursor:'pointer'};
export function ProjectRequestsPanel({workspace,onSaveProject,toast}:{workspace:Workspace;onSaveProject:(project:Project,mode:ProjectRequest['mode'],isNew:boolean)=>void;toast:(msg:string)=>void}){
 const [requests,setRequests]=useState(readProjectRequests);
 const [initiatives,setInitiatives]=useState<{id:number;title:string}[]>([]);
 useEffect(()=>{void api<{initiatives:{id:number;title:string}[]}>('initiatives').then(r=>setInitiatives(r.initiatives)).catch(()=>{})},[]);
 const change=(id:string,key:'initiativeId'|'methodologyId',value:number|null)=>persist(requests.map(r=>{if(r.id!==id)return r;if(key==='initiativeId'){const allowed=methodsForMacro(catalogFor(workspace),value);return {...r,initiativeId:value,methodologyId:allowed.some(m=>m.id===(r.methodologyId||2))?(r.methodologyId||2):allowed[0]?.id||2}}return {...r,methodologyId:value||2}}));
 useEffect(()=>{const refresh=()=>setRequests(readProjectRequests());window.addEventListener('itm-project-requests-updated',refresh);return()=>window.removeEventListener('itm-project-requests-updated',refresh);},[]);
 const persist=(next:ProjectRequest[])=>{setRequests(next);localStorage.setItem(REQUEST_KEY,JSON.stringify(next));window.dispatchEvent(new Event('itm-project-requests-updated'));};
 const decide=(r:ProjectRequest,approved:boolean)=>{if(r.status!=='Pendiente')return;
  if(!approved){persist(requests.map(x=>x.id===r.id?{...x,status:'Rechazada',reason:'Rechazada en revisión local'}:x));toast('Solicitud rechazada');return;}
  if(!r.initiativeId||!methodsForMacro(catalogFor(workspace),r.initiativeId).some(m=>m.id===(r.methodologyId||2))){toast('Selecciona macroiniciativa principal y metodología vinculada antes de aprobar.');return;}
  const date=new Date().toISOString().slice(0,10),id='project-'+crypto.randomUUID();
  const project:Project={id,name:r.name,area:r.area,scopeAreas:r.scopeAreas?.length?r.scopeAreas:[r.area],priority:r.priority==='Crítica'?'Alta':r.priority,ownerId:r.ownerId||workspace.members[0]?.id||'',sponsor:r.sponsor||r.requestedBy,methodologyId:r.methodologyId||2,initiativeId:r.initiativeId,planType:r.planType||'Optimización',status:'Por iniciar',semaforo:'Verde',startDate:r.startDate||date,dueDate:r.dueDate||'',goal:r.objective,description:r.description||'Solicitud aprobada: '+r.id,createdAt:date,updatedAt:date};
  onSaveProject(project,r.mode,true);
  persist(requests.map(x=>x.id===r.id?{...x,status:'Aprobada',projectId:id}:x));toast('Solicitud aprobada y proyecto registrado');
 };
 const pending=requests.filter(r=>r.status==='Pendiente');
 return <div style={{display:'grid',gap:12,marginTop:8}}>
  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:10,flexWrap:'wrap'}}><div><strong style={{fontSize:14,color:'#243b67'}}>Proyectos pendientes por autorizar</strong><p style={{fontSize:11,color:'#8490a3'}}>Solicitudes registradas desde «Nuevo proyecto» que todavía no forman parte del portafolio aprobado.</p></div><span style={{background:'#fff4dd',color:'#9a6513',padding:'7px 12px',borderRadius:12,fontSize:12,fontWeight:800}}>{pending.length} pendientes</span></div>
  {pending.length?<div style={{overflowX:'auto'}}><table className="data-table"><thead><tr><th>Solicitud</th><th>Prioridad</th><th>Alcance</th><th>Solicitante</th><th>Decisión</th></tr></thead><tbody>{pending.map(r=><tr key={r.id}><td><b>{r.name}</b><small>{r.objective||'Objetivo por definir'}</small></td><td>{r.priority}</td><td>{(r.scopeAreas?.length?r.scopeAreas:[r.area]).join(', ')}</td><td>{r.requestedBy||'No indicado'}</td><td><label>Macroiniciativa principal<select className="input" value={r.initiativeId??''} onChange={e=>change(r.id,'initiativeId',e.target.value?Number(e.target.value):null)}><option value="">Seleccionar</option>{initiatives.map(i=><option key={i.id} value={i.id}>{i.title}</option>)}</select></label><label>Metodología<select className="input" value={r.methodologyId||2} onChange={e=>change(r.id,'methodologyId',Number(e.target.value))}>{methodsForMacro(catalogFor(workspace),r.initiativeId).map(m=><option key={m.id} value={m.id}>{m.name}</option>)}</select></label><div style={{display:'flex',gap:6}}><button type="button" style={{...button,background:'#e9f7f1',color:'#167553'}} onClick={()=>decide(r,true)}>Aprobar</button><button type="button" style={button} onClick={()=>decide(r,false)}>Rechazar</button></div></td></tr>)}</tbody></table></div>:<div style={{padding:18,border:'1px dashed #dce5f2',borderRadius:10,color:'#7b89a2',fontSize:12,textAlign:'center'}}>No hay proyectos pendientes de autorización.</div>}
  <small style={{color:'#8790a5'}}>Las decisiones son locales y no tienen firma electrónica ni validación de permisos. Las solicitudes históricas aprobadas o rechazadas se conservan en el almacenamiento local.</small>
 </div>;
}
