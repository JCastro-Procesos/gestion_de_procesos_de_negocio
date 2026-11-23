import {useEffect,useMemo,useRef,useState} from 'react';
import {KanbanSquare,List,Shapes,TriangleAlert} from 'lucide-react';
import type {Stage,StageStatus,Task,Workspace} from '../../domain/model';
import {session,type CurrentUser} from '../../data/processoneApi';
import {canPerform} from '../../domain/access';
import {BOARD_STATUSES,macroOf,memberWork,projectKind,STAGE_TO_TASK_STATUS,TASK_TO_STAGE_STATUS,UNLINKED_META,withActivityStatus,type WorkItem} from '../../domain/portfolio';
import {officialProjectProgress} from '../../domain/projectProgress';
import {useMacroInitiatives} from '../../data/useMacroInitiatives';
import {Bar,Empty,KindBadge,MacroTag,Ring,Segmented,Stat,shortDate} from '../../components/pd';
import {Button,Modal,TextArea} from '../../components/ui';
import {catalogFor} from '../../domain/alignment';

type View='lista'|'tablero'|'lienzo';
type Props={workspace:Workspace;onOpenProject:(id:string)=>void;onSaveTask:(task:Task,isNew:boolean)=>void;onUpdateActivity:(stage:Stage,activity:Stage['activities'][number])=>void;onRegisterBlocker:(projectId:string,stageId:string,activityId:string,description:string)=>void};
const SELECTABLE:StageStatus[]=['Por iniciar','En curso','En revisión','Completada'];
const dotClass=(s:StageStatus)=>s==='Completada'?'s-ok':s==='En curso'?'s-curso':s==='En revisión'?'s-rev':s==='Bloqueada'?'s-blk':'';

export function MyWorkPage({workspace,onOpenProject,onSaveTask,onUpdateActivity,onRegisterBlocker}:Props){
  const [user,setUser]=useState<CurrentUser|null>(null),[error,setError]=useState('');
  const [view,setView]=useState<View>('lista');
  const [personId,setPersonId]=useState('');
  const [showDone,setShowDone]=useState(false),[limit,setLimit]=useState(20);
  const [blocking,setBlocking]=useState<WorkItem|null>(null),[reason,setReason]=useState('');
  const {metas}=useMacroInitiatives();
  const catalog=catalogFor(workspace);
  useEffect(()=>{void session().then(setUser).catch(e=>setError(String(e)))},[]);
  const ownMember=workspace.members.find(m=>m.email?.toLowerCase()===(user?.email??'').toLowerCase());
  const canPickOthers=!!user&&canPerform(user.role,'gerencia');
  const activeId=personId||ownMember?.id||'';
  const member=workspace.members.find(m=>m.id===activeId);
  const isOwn=!!member&&member.id===ownMember?.id;
  const work=useMemo(()=>member?memberWork(workspace,member.id):null,[workspace,member]);
  const items=useMemo(()=>(work?.items??[]).filter(i=>showDone||i.status!=='Completada').sort((a,b)=>(a.dueDate||'9999').localeCompare(b.dueDate||'9999')),[work,showDone]);
  const open=(work?.items??[]).filter(i=>i.status!=='Completada');
  const overdue=open.filter(i=>i.overdue).length;

  const metaOfProject=(id:string)=>macroOf(metas,workspace.projects.find(p=>p.id===id)?.initiativeId);
  const projectName=(id:string)=>workspace.projects.find(p=>p.id===id)?.name??'Proyecto no encontrado';
  const setStatus=(item:WorkItem,status:StageStatus)=>{
    if(status===item.status)return;
    if(item.kind==='task'){const t=workspace.tasks.find(x=>x.id===item.id);if(t)onSaveTask({...t,status:STAGE_TO_TASK_STATUS[status]},false);return}
    const stage=workspace.stages.find(s=>s.id===item.stageId);const a=stage?.activities.find(x=>x.id===item.id);
    if(stage&&a)onUpdateActivity(stage,withActivityStatus(a,status));
  };
  const canBlock=(i:WorkItem)=>i.kind==='activity'&&i.status!=='Completada'&&i.status!=='Bloqueada';

  const row=(i:WorkItem)=>{const meta=metaOfProject(i.projectId);return <div key={i.key} className="pd-item" style={{['--m' as string]:meta?.color??UNLINKED_META.color,cursor:'default'}}>
    <span className={`pd-dot ${dotClass(i.status)}`} aria-hidden="true"/>
    <button type="button" onClick={()=>onOpenProject(i.projectId)} style={{all:'unset',cursor:'pointer',display:'grid',gap:3,minWidth:0}}><strong>{i.title}</strong><small style={{display:'flex',gap:6,flexWrap:'wrap',alignItems:'center'}}><span className="pd-pill">{i.kind==='task'?'Tarea':'Actividad'}</span><MacroTag meta={meta} compact/><span>{projectName(i.projectId)} · {i.stageName}</span></small>{i.detail&&i.kind==='activity'&&<small>Entregable: {i.detail}</small>}</button>
    <span style={{display:'grid',gap:4,justifyItems:'end'}}><span className={`pd-due ${i.overdue?'late':i.dueSoon?'soon':''}`}>{i.overdue?'Vencida · ':''}{shortDate(i.dueDate)}</span>
      {isOwn||canPickOthers?<span style={{display:'flex',gap:4}}><select className="pd-mini" aria-label={'Estado de '+i.title} value={i.status==='Bloqueada'?'Bloqueada':i.status} onChange={e=>setStatus(i,e.target.value as StageStatus)}>{i.status==='Bloqueada'&&<option disabled>Bloqueada</option>}{SELECTABLE.map(s=><option key={s}>{s}</option>)}</select>{canBlock(i)&&<button type="button" className="pd-mini warn" onClick={()=>{setBlocking(i);setReason('')}} aria-label={'Reportar bloqueo de '+i.title}><TriangleAlert size={13}/></button>}</span>:<span className={`pd-pill ${dotClass(i.status)}`}>{i.status}</span>}</span></div>};

  /* ----- Tablero y lienzo comparten estado ----- */
  const [drag,setDrag]=useState('');
  const board=<div className="pd-board">{BOARD_STATUSES.map(st=>{const col=items.filter(i=>i.status===st||(st==='Por iniciar'&&i.status==='Bloqueada'));return <section key={st} className="pd-col" aria-label={st} onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();const it=items.find(x=>x.key===(e.dataTransfer.getData('text/plain')||drag));if(it)setStatus(it,st);setDrag('')}}><header>{st}<em>{col.length}</em></header>{col.map(i=>{const meta=metaOfProject(i.projectId);return <article key={i.key} draggable className={`pd-kcard ${drag===i.key?'drag':''}`} style={{['--m' as string]:meta?.color??UNLINKED_META.color}} onDragStart={e=>{e.dataTransfer.setData('text/plain',i.key);setDrag(i.key)}} onDragEnd={()=>setDrag('')}><strong>{i.title}</strong><small>{i.kind==='task'?'Tarea':'Actividad'} · {projectName(i.projectId)}</small><span style={{display:'flex',justifyContent:'space-between',gap:6,alignItems:'center'}}><span className={`pd-due ${i.overdue?'late':''}`}>{i.status==='Bloqueada'?'Bloqueada · ':''}{shortDate(i.dueDate)}</span><span className="pd-kcard-actions"><select className="pd-mini" aria-label={'Mover '+i.title} value={SELECTABLE.includes(i.status)?i.status:'Por iniciar'} onChange={e=>setStatus(i,e.target.value as StageStatus)}>{SELECTABLE.map(s=><option key={s}>{s}</option>)}</select><button type="button" className="pd-mini" onClick={()=>onOpenProject(i.projectId)}>Abrir</button></span></span></article>})}{!col.length&&<p className="pd-hint" style={{padding:6}}>Arrastra aquí</p>}</section>})}</div>;

  const W=240,H=118;const KEY='po-mywork-canvas-v1';
  const [pos,setPos]=useState<Record<string,{x:number;y:number}>>(()=>{try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch{return {}}});
  const [moving,setMoving]=useState('');const cref=useRef<HTMLDivElement>(null);
  const place=(k:string,i:number)=>pos[k]??{x:16+(i%4)*(W+14),y:16+Math.floor(i/4)*(H+16)};
  const persist=(n:typeof pos)=>{try{localStorage.setItem(KEY,JSON.stringify(n))}catch{/* sin almacenamiento */}};
  const startMove=(e:React.PointerEvent,k:string,i:number)=>{if((e.target as HTMLElement).closest('select,button'))return;const p=place(k,i),sx=e.clientX,sy=e.clientY;setMoving(k);(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);const mv=(ev:PointerEvent)=>setPos(c=>({...c,[k]:{x:Math.max(0,Math.min((cref.current?.scrollWidth??1200)-W,p.x+ev.clientX-sx)),y:Math.max(0,p.y+ev.clientY-sy)}}));const up=()=>{window.removeEventListener('pointermove',mv);window.removeEventListener('pointerup',up);setMoving('');setPos(c=>{persist(c);return c})};window.addEventListener('pointermove',mv);window.addEventListener('pointerup',up)};
  const keyMove=(e:React.KeyboardEvent,k:string,i:number)=>{const m:Record<string,[number,number]>={ArrowLeft:[-24,0],ArrowRight:[24,0],ArrowUp:[0,-24],ArrowDown:[0,24]};const d=m[e.key];if(!d)return;e.preventDefault();const p=place(k,i);const n={...pos,[k]:{x:Math.max(0,p.x+d[0]),y:Math.max(0,p.y+d[1])}};setPos(n);persist(n)};
  const canvas=<div><p className="pd-hint" style={{marginBottom:6}}>Arrastra para organizar tu espacio (o usa las flechas). Se recuerda en este navegador.</p><div className="pd-canvas" ref={cref} style={{height:Math.max(520,...items.map((it,i)=>place(it.key,i).y+H+24))}} aria-label="Lienzo de mi trabajo">{items.map((i,idx)=>{const p=place(i.key,idx);const meta=metaOfProject(i.projectId);return <div key={i.key} className={`pd-node ${moving===i.key?'moving':''}`} style={{left:p.x,top:p.y,width:W,['--m' as string]:meta?.color??UNLINKED_META.color}} tabIndex={0} role="group" aria-label={i.title} onPointerDown={e=>startMove(e,i.key,idx)} onKeyDown={e=>keyMove(e,i.key,idx)}><div style={{display:'flex',justifyContent:'space-between',gap:6}}><span className="pd-pill">{i.kind==='task'?'Tarea':'Actividad'}</span><span className={`pd-due ${i.overdue?'late':''}`}>{shortDate(i.dueDate)}</span></div><strong>{i.title}</strong><small style={{color:'#51607d'}}>{projectName(i.projectId)}</small><div style={{display:'flex',gap:6,marginTop:6}}><select className="pd-mini" aria-label={'Estado de '+i.title} value={SELECTABLE.includes(i.status)?i.status:'Por iniciar'} onChange={e=>setStatus(i,e.target.value as StageStatus)}>{SELECTABLE.map(s=><option key={s}>{s}</option>)}</select><button type="button" className="pd-mini" onClick={()=>onOpenProject(i.projectId)}>Abrir</button></div></div>})}</div></div>;

  return <div className="pd-page">
    <header className="pd-head"><div><span className="pd-eyebrow">Ejecución personal</span><h2>Mi trabajo</h2><p>Tus proyectos con sus actividades (cargadas desde la macroiniciativa y la metodología) y tus tareas, en un solo lugar.</p></div>
      <div className="pd-head-actions">{canPickOthers&&<label className="pd-field">Ver el trabajo de<select value={activeId} onChange={e=>setPersonId(e.target.value)}>{ownMember==null&&<option value="">Elige una persona</option>}{workspace.members.map(m=><option key={m.id} value={m.id}>{m.name}{m.id===ownMember?.id?' (yo)':''}</option>)}</select></label>}
        <Segmented<View> label="Forma de ver mi trabajo" value={view} onChange={setView} options={[{id:'lista',label:'Lista',icon:<List size={15}/>},{id:'tablero',label:'Tablero',icon:<KanbanSquare size={15}/>},{id:'lienzo',label:'Lienzo',icon:<Shapes size={15}/>}]}/></div></header>
    {error&&<p role="alert" className="error-banner">{error}</p>}
    {!member&&user&&<Empty title="No encontramos tu perfil de equipo" text={canPickOthers?'Elige a una persona del equipo para ver su trabajo, o pide que vinculen tu correo en Equipo y capacidad.':'No hay un integrante del equipo con este correo. Solicita al Administrador que lo vincule en Equipo y capacidad.'}/>}
    {member&&work&&<>
      <div className="pd-grid pd-g4"><Stat label="Proyectos" value={work.projects.length} note="Donde participas"/><Stat tone="violet" label="Pendientes" value={open.length} note={`${work.activities.filter(a=>a.status!=='Completada').length} actividades · ${work.tasks.filter(t=>t.status!=='Completada').length} tareas`}/><Stat tone="red" label="Vencidos" value={overdue} note="Requieren atención"/><Stat tone="teal" label="Completados" value={(work.items.length-open.length)} note="Actividades y tareas"/></div>
      <section className="pd-card"><header><h3>Mis proyectos</h3><p>{isOwn?'Proyectos en los que eres responsable o tienes trabajo asignado':'Proyectos de '+member.name}</p></header>
        {work.projects.length?<div className="pd-grid pd-g3">{work.projects.map(p=>{const meta=macroOf(metas,p.initiativeId);const mine=work.items.filter(i=>i.projectId===p.id&&i.status!=='Completada').length;const prog=officialProjectProgress(workspace.stages.filter(s=>s.projectId===p.id),p.planType);const mName=catalog.methodologies.find(m=>m.id===p.methodologyId)?.name;return <button type="button" key={p.id} className="pd-macro-card" style={{['--m' as string]:meta?.color??UNLINKED_META.color}} onClick={()=>onOpenProject(p.id)}><div className="pd-macro-top"><div><MacroTag meta={meta} compact/><h4>{p.name}</h4></div><Ring value={prog} size={48} color={meta?.color}/></div><span style={{display:'flex',gap:6,flexWrap:'wrap'}}><KindBadge kind={projectKind(p)}/>{mName&&<span className="pd-method">{mName}</span>}</span><Bar value={prog} color={meta?.color}/><small style={{color:'#51607d'}}>{mine} pendiente{mine===1?'':'s'} para {isOwn?'ti':member.name.split(' ')[0]} · vence {shortDate(p.dueDate)}</small></button>})}</div>:<Empty title="Aún no tienes proyectos" text="Cuando te asignen actividades o tareas, tus proyectos aparecerán aquí."/>}
      </section>
      <section className="pd-card"><header style={{display:'flex',justifyContent:'space-between',gap:10,flexWrap:'wrap'}}><div><h3>Actividades y tareas</h3><p>{items.length} elemento{items.length===1?'':'s'} {showDone?'(incluye completados)':'abiertos'}</p></div><label style={{display:'flex',gap:6,alignItems:'center',fontSize:13}}><input type="checkbox" checked={showDone} onChange={e=>setShowDone(e.target.checked)}/> Mostrar completados</label></header>
        {!items.length?<Empty title="Tu bandeja está al día" text="Las actividades de tus proyectos y las tareas asignadas aparecerán aquí automáticamente."/>:view==='lista'?<div className="pd-list">{items.slice(0,limit).map(row)}{items.length>limit&&<Button onClick={()=>setLimit(n=>n+20)}>Mostrar {Math.min(20,items.length-limit)} más ({items.length-limit} restantes)</Button>}</div>:view==='tablero'?board:canvas}
      </section></>}
    <Modal open={!!blocking} title="Reportar bloqueo" subtitle={blocking?.title??''} onClose={()=>setBlocking(null)} size="lg"><form className="pd-page" onSubmit={e=>{e.preventDefault();if(blocking){onRegisterBlocker(blocking.projectId,blocking.stageId,blocking.id,reason);setBlocking(null)}}}><p className="pd-sub">Describe la causa, el impacto y qué se necesita para desbloquearla. Se creará una incidencia en Riesgos y decisiones.</p><label className="pd-field">Descripción del bloqueo *<TextArea required minLength={10} value={reason} onChange={e=>setReason(e.target.value)}/></label><div className="modal-actions"><Button type="button" onClick={()=>setBlocking(null)}>Cancelar</Button><Button variant="primary" disabled={reason.trim().length<10}>Registrar bloqueo</Button></div></form></Modal>
  </div>;
}
void TASK_TO_STAGE_STATUS;
