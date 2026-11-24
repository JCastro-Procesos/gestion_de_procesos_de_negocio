import {useMemo,useRef,useState} from 'react';
import type {Task,TaskStatus,Workspace} from '../../domain/model';
import {macroOf,UNLINKED_META,TASK_STATUSES} from '../../domain/portfolio';
import {useMacroInitiatives} from '../../data/useMacroInitiatives';
import {Empty,MacroTag,shortDate} from '../../components/pd';
import {PriorityBadge} from '../../components/ui';

type GroupKey='project'|'macro'|'priority'|'status'|'owner';
const GROUPS:{id:GroupKey;label:string}[]=[{id:'project',label:'Proyecto'},{id:'macro',label:'Macroiniciativa'},{id:'priority',label:'Prioridad'},{id:'status',label:'Estado'},{id:'owner',label:'Responsable'}];
const PRIORITY_ORDER=['Urgente','Alta','Media','Baja'];
const statusClass=(s:TaskStatus)=>s==='Completado'?'s-ok':s==='En Proceso'?'s-curso':s==='En Revisión'?'s-rev':'';
const isLate=(t:Task)=>t.status!=='Completado'&&!!t.dueDate&&t.dueDate<new Date().toISOString().slice(0,10);

interface Common{tasks:Task[];workspace:Workspace;onEdit:(t:Task)=>void;onStatus:(t:Task,s:TaskStatus)=>void}

function useMeta(workspace:Workspace){
  const {metas}=useMacroInitiatives();
  return (t:Task)=>{const p=workspace.projects.find(x=>x.id===t.projectId);return {project:p,meta:macroOf(metas,p?.initiativeId)}};
}
function StatusSelect({task,onStatus}:{task:Task;onStatus:Common['onStatus']}){
  return <select className="pd-mini" aria-label={'Estado de '+task.title} value={task.status} onClick={e=>e.stopPropagation()} onChange={e=>onStatus(task,e.target.value as TaskStatus)}>{TASK_STATUSES.map(s=><option key={s}>{s}</option>)}</select>;
}

/** Tareas agrupadas por clasificación: proyecto, macroiniciativa, prioridad, estado o responsable. */
export function TaskClassView({tasks,workspace,onEdit,onStatus}:Common){
  const [by,setBy]=useState<GroupKey>('project');
  const metaOf=useMeta(workspace);
  const {metas}=useMacroInitiatives();
  const groups=useMemo(()=>{
    const map=new Map<string,{label:string;color?:string;items:Task[]}>();
    tasks.forEach(t=>{
      const {project,meta}=metaOf(t);
      const owner=workspace.members.find(m=>m.id===t.assigneeId)?.name??'Sin responsable';
      const [key,label,color]:[string,string,string|undefined]=by==='project'?[t.projectId,project?.name??'Sin proyecto',meta?.color]:by==='macro'?[meta?String(meta.id):'none',meta?`${meta.code} · ${meta.title}`:'Sin macroiniciativa',meta?.color]:by==='priority'?[t.priority,'Prioridad '+t.priority,undefined]:by==='status'?[t.status,t.status,undefined]:[t.assigneeId||'none',owner,undefined];
      if(!map.has(key))map.set(key,{label,color,items:[]});map.get(key)!.items.push(t);
    });
    const arr=[...map.entries()];
    if(by==='priority')arr.sort((a,b)=>PRIORITY_ORDER.indexOf(a[0])-PRIORITY_ORDER.indexOf(b[0]));
    else if(by==='status')arr.sort((a,b)=>TASK_STATUSES.indexOf(a[0] as TaskStatus)-TASK_STATUSES.indexOf(b[0] as TaskStatus));
    else arr.sort((a,b)=>a[1].label.localeCompare(b[1].label,'es'));
    return arr;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[tasks,by,metas,workspace]);
  return <div className="pd-page" style={{padding:14}}>
    <div className="pd-toolbar"><span className="pd-field" style={{marginRight:6}}>Clasificar por</span><div className="pd-seg" role="group" aria-label="Clasificar tareas por">{GROUPS.map(g=><button type="button" key={g.id} aria-pressed={by===g.id} className={by===g.id?'on':''} onClick={()=>setBy(g.id)}>{g.label}</button>)}</div></div>
    {!groups.length&&<Empty title="Sin tareas con estos filtros" text="Ajusta los filtros para ver tareas."/>}
    {groups.map(([key,g])=><section key={key} className="pd-card" style={{borderTop:`4px solid ${g.color??UNLINKED_META.color}`}}>
      <header style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}><h3 style={{margin:0}}>{g.label}</h3><span className="pd-pill">{g.items.length} tarea{g.items.length===1?'':'s'}</span></header>
      <div className="pd-list">{g.items.map(t=>{const {project,meta}=metaOf(t);const owner=workspace.members.find(m=>m.id===t.assigneeId);return <div key={t.id} className="pd-item" style={{['--m' as string]:meta?.color,gridTemplateColumns:'auto 1fr auto',cursor:'default'}}>
        <span className={`pd-dot ${statusClass(t.status)}`} aria-hidden="true"/>
        <button type="button" onClick={()=>onEdit(t)} style={{all:'unset',cursor:'pointer',display:'grid',gap:3,minWidth:0}}><strong>{t.title}</strong><small style={{display:'flex',gap:6,flexWrap:'wrap',alignItems:'center'}}><MacroTag meta={meta} compact/><span>{project?.name??'Sin proyecto'}</span><span>· {owner?.name.split(' ')[0]??'Sin responsable'}</span><PriorityBadge value={t.priority}/></small></button>
        <span style={{display:'grid',gap:4,justifyItems:'end'}}><span className={`pd-due ${isLate(t)?'late':''}`}>{isLate(t)?'Vencida · ':''}{shortDate(t.dueDate)}</span><StatusSelect task={t} onStatus={onStatus}/></span></div>})}</div>
    </section>)}
  </div>;
}

type Pos={x:number;y:number};
const KEY='po-task-canvas-v1';
/** Lienzo libre: las mismas tareas como tarjetas que se arrastran. La posición se recuerda en este navegador. */
export function TaskCanvasView({tasks,workspace,onEdit,onStatus}:Common){
  const metaOf=useMeta(workspace);
  const ref=useRef<HTMLDivElement>(null);
  const [pos,setPos]=useState<Record<string,Pos>>(()=>{try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch{return {}}});
  const [moving,setMoving]=useState('');
  const W=244,H=132;
  const place=(id:string,i:number):Pos=>pos[id]??{x:16+(i%4)*(W+14),y:16+Math.floor(i/4)*(H+14)};
  const height=Math.max(520,...tasks.map((t,i)=>place(t.id,i).y+H+24));
  const persist=(next:Record<string,Pos>)=>{try{localStorage.setItem(KEY,JSON.stringify(next))}catch{/* sin almacenamiento */}};
  const start=(e:React.PointerEvent,t:Task,i:number)=>{
    if((e.target as HTMLElement).closest('select,button'))return;
    const p=place(t.id,i);const sx=e.clientX,sy=e.clientY;const box=ref.current;setMoving(t.id);(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    const move=(ev:PointerEvent)=>setPos(cur=>({...cur,[t.id]:{x:Math.max(0,Math.min((box?.scrollWidth??1200)-W,p.x+ev.clientX-sx)),y:Math.max(0,p.y+ev.clientY-sy)}}));
    const up=()=>{window.removeEventListener('pointermove',move);window.removeEventListener('pointerup',up);setMoving('');setPos(cur=>{persist(cur);return cur})};
    window.addEventListener('pointermove',move);window.addEventListener('pointerup',up);
  };
  const key=(e:React.KeyboardEvent,t:Task,i:number)=>{const m:Record<string,[number,number]>={ArrowLeft:[-24,0],ArrowRight:[24,0],ArrowUp:[0,-24],ArrowDown:[0,24]};const d=m[e.key];if(e.key==='Enter'){onEdit(t);return}if(!d)return;e.preventDefault();const p=place(t.id,i);const next={...pos,[t.id]:{x:Math.max(0,p.x+d[0]),y:Math.max(0,p.y+d[1])}};setPos(next);persist(next)};
  if(!tasks.length)return <div style={{padding:14}}><Empty title="Sin tareas con estos filtros" text="Ajusta los filtros para ver tareas en el lienzo."/></div>;
  return <div style={{padding:14}} className="pd-page"><p className="pd-hint">Arrastra las tarjetas para organizarlas a tu manera (o usa las flechas del teclado). Enter abre la tarea. Son las mismas tareas del sistema.</p>
    <div className="pd-canvas" ref={ref} style={{height}} aria-label="Lienzo de tareas">{tasks.map((t,i)=>{const p=place(t.id,i);const {project,meta}=metaOf(t);return <div key={t.id} className={`pd-node ${moving===t.id?'moving':''}`} style={{left:p.x,top:p.y,width:W,['--m' as string]:meta?.color??UNLINKED_META.color}} tabIndex={0} role="group" aria-label={t.title} onPointerDown={e=>start(e,t,i)} onKeyDown={e=>key(e,t,i)}>
      <div style={{display:'flex',justifyContent:'space-between',gap:6,alignItems:'center'}}><MacroTag meta={meta} compact/><span className={`pd-due ${isLate(t)?'late':''}`}>{shortDate(t.dueDate)}</span></div>
      <strong>{t.title}</strong><small style={{color:'#51607d'}}>{project?.name??'Sin proyecto'}</small>
      <div style={{display:'flex',justifyContent:'space-between',gap:6,marginTop:6}}><StatusSelect task={t} onStatus={onStatus}/><button type="button" className="pd-mini" onClick={()=>onEdit(t)}>Abrir</button></div></div>})}</div></div>;
}
