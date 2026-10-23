import {useEffect,useMemo,useRef,useState} from 'react';
import {Search,X} from 'lucide-react';
import type {Workspace} from '../domain/model';
export function GlobalSearch({workspace,onProject,onNavigate}:{workspace:Workspace;onProject:(id:string)=>void;onNavigate:(page:string)=>void}){
 const [open,setOpen]=useState(false),[query,setQuery]=useState(''),[kind,setKind]=useState('Todos');const input=useRef<HTMLInputElement>(null);
 useEffect(()=>{const onKey=(e:KeyboardEvent)=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();setOpen(v=>!v)}if(e.key==='Escape')setOpen(false)};window.addEventListener('keydown',onKey);return()=>window.removeEventListener('keydown',onKey)},[]);
 useEffect(()=>{if(open)input.current?.focus()},[open]);
 const results=useMemo(()=>{const q=query.trim().toLocaleLowerCase('es');if(q.length<2)return [];return [
 ...workspace.projects.map(p=>({id:p.id,title:p.name,detail:p.area,kind:'Proyectos',page:'proyectos',projectId:p.id})),
 ...workspace.tasks.map(t=>({id:t.id,title:t.title,detail:workspace.projects.find(p=>p.id===t.projectId)?.name||'',kind:'Tareas',page:'tareas',projectId:t.projectId})),
 ...workspace.raids.map(r=>({id:r.id,title:r.description,detail:r.severity,kind:'RAID',page:'raid',projectId:r.projectId}))
 ].filter(r=>(kind==='Todos'||r.kind===kind)&&(r.title+' '+r.detail).toLocaleLowerCase('es').includes(q)).slice(0,35)},[query,kind,workspace]);
 return <div className="po-global-search"><button className="po-search-trigger" onClick={()=>setOpen(true)} aria-label="Abrir búsqueda global"><Search size={17}/> <span>Buscar</span><kbd>Ctrl K</kbd></button>
 {open&&<div className="po-search-overlay" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)setOpen(false)}}><section className="po-search-dialog" role="dialog" aria-modal="true" aria-label="Búsqueda global"><header><Search size={20}/><input ref={input} aria-label="Buscar proyectos, tareas o RAID" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar proyectos, tareas, riesgos…"/><button onClick={()=>setOpen(false)} aria-label="Cerrar búsqueda"><X size={19}/></button></header>
 <label>Filtrar resultados <select value={kind} onChange={e=>setKind(e.target.value)}><option>Todos</option><option>Proyectos</option><option>Tareas</option><option>RAID</option></select></label>
 <div className="po-search-results">{results.map(r=><button key={r.kind+r.id} onClick={()=>{setOpen(false);setQuery('');if(r.kind==='Proyectos')onProject(r.projectId);else onNavigate(r.page)}}><strong>{r.title}</strong><small>{r.kind} · {r.detail}</small></button>)}{query.trim().length<2?<p>Escribe al menos dos caracteres para buscar.</p>:!results.length&&<p>No se encontraron resultados. Revisa el texto o cambia el filtro.</p>}</div></section></div>}</div>;
}
