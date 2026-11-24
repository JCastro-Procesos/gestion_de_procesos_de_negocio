import {useMemo,useState} from 'react';
import {FolderKanban,Inbox,KanbanSquare,Layers,List,Plus} from 'lucide-react';
import type {Project,Workspace} from '../../domain/model';
import {catalogFor,projectStageNames} from '../../domain/alignment';
import {officialProjectProgress} from '../../domain/projectProgress';
import {currentStage,filterProjects,macroOf,projectIsComplete,projectKind,PROJECT_KINDS,summarize,UNLINKED_META,type Facets} from '../../domain/portfolio';
import {useMacroInitiatives} from '../../data/useMacroInitiatives';
import {loadFacets,saveFacets} from '../../data/facetStore';
import {Bar,Empty,KindBadge,MacroTag,MethodTag,Ring,Segmented,Stat,shortDate} from '../../components/pd';
import {Avatar,Button,TrafficBadge} from '../../components/ui';
import {SharedControlsMigration} from './SharedControlsMigration';
import {ProjectRequestsPanel} from './ProjectRequestsPanel';

type View='lista'|'kanban'|'macro';
type Tab='proyectos'|'solicitudes';
const STATUSES=['Todos','Por iniciar','En diagnóstico','En ejecución','En validación','Bloqueado','Completado'];

export function PortfolioView({workspace,onOpenProject,onNewProject,onRequestsApproved}:{workspace:Workspace;onOpenProject:(id:string)=>void;onNewProject:()=>void;onRequestsApproved:()=>Promise<void>}){
  const {metas}=useMacroInitiatives();
  const catalog=catalogFor(workspace);
  const [tab,setTab]=useState<Tab>('proyectos');
  const [view,setView]=useState<View>('lista');
  const [query,setQuery]=useState('');
  const [status,setStatus]=useState('Todos');
  const [facets,setFacets]=useState<Facets>(()=>loadFacets());
  const apply=(f:Facets)=>{setFacets(f);saveFacets(f)};
  const methodName=(id:number)=>catalog.methodologies.find(m=>m.id===id)?.name??null;
  const ownerOf=(p:Project)=>workspace.members.find(m=>m.id===p.ownerId);

  const projects=useMemo(()=>filterProjects(workspace,facets).filter(p=>{
    const owner=workspace.members.find(m=>m.id===p.ownerId)?.name??'';
    return `${p.name} ${p.area} ${owner}`.toLowerCase().includes(query.toLowerCase())&&(status==='Todos'||p.status===status);
  }),[workspace,facets,query,status]);
  const sum=useMemo(()=>summarize(workspace,projects,0),[workspace,projects]);
  const progress=(p:Project)=>officialProjectProgress(workspace.stages.filter(s=>s.projectId===p.id),p.planType);
  const parse=(v:string):Facets['macro']=>v==='all'||v==='none'?v:Number(v);

  const card=(p:Project,compact=false)=>{const m=macroOf(metas,p.initiativeId);const owner=ownerOf(p);const prog=progress(p);
    return <button type="button" key={p.id} className="pd-item" style={{['--m' as string]:m?.color??UNLINKED_META.color}} onClick={()=>onOpenProject(p.id)}>
      <Ring value={prog} size={compact?42:50} color={m?.color}/>
      <span style={{minWidth:0}}><strong>{p.name}</strong><small style={{display:'flex',gap:6,flexWrap:'wrap',alignItems:'center',marginTop:4}}><MacroTag meta={m} compact={compact}/>{!compact&&<MethodTag name={methodName(p.methodologyId)}/>}<KindBadge kind={projectKind(p)}/><span>{p.area}</span></small></span>
      <span style={{display:'grid',gap:4,justifyItems:'end'}}><TrafficBadge value={p.semaforo}/><span className="pd-due">{owner?.name.split(' ')[0]??'Sin responsable'} · {shortDate(p.dueDate)}</span></span></button>};

  const columns=[...projectStageNames.map((name,i)=>({key:'e'+i,name:`${i+1}. ${name}`,items:[] as Project[]})),{key:'done',name:'Completados',items:[] as Project[]}];
  projects.forEach(p=>{const st=workspace.stages.filter(s=>s.projectId===p.id);const cur=currentStage(st);const idx=p.status==='Completado'||projectIsComplete(st)?6:cur?Math.min(5,Math.max(0,cur.order-1)):0;columns[idx].items.push(p)});

  const macroGroups=[...metas.map(m=>({meta:m as typeof metas[number]|null,projects:projects.filter(p=>Number(p.initiativeId)===m.id)})),{meta:null,projects:projects.filter(p=>!(Number(p.initiativeId)>0))}].filter(g=>g.projects.length||g.meta===null&&facets.macro==='none');

  return <div className="pd-page">
    <header className="pd-head"><div><span className="pd-eyebrow">Portafolio</span><h2>Portafolio de proyectos</h2><p>Mira tus proyectos como lista, tablero por etapa o agrupados por macroiniciativa. Un proyecto puede ligarse a una macroiniciativa, usar solo un libro de trabajo, o ser un análisis libre.</p></div><div className="pd-head-actions"><Segmented<Tab> label="Sección" value={tab} onChange={setTab} options={[{id:'proyectos',label:'Proyectos',icon:<FolderKanban size={15}/>,count:workspace.projects.length},{id:'solicitudes',label:'Solicitudes',icon:<Inbox size={15}/>}]}/><Button variant="primary" onClick={onNewProject}><Plus size={16}/> Nuevo proyecto</Button></div></header>
    {tab==='solicitudes'?<ProjectRequestsPanel workspace={workspace} onApproved={onRequestsApproved}/>:<>
      <SharedControlsMigration workspace={workspace}/>
      <div className="pd-grid pd-g4">
        <Stat label="Proyectos visibles" value={sum.projects} note={`${workspace.projects.length} en total`}/>
        <Stat tone="teal" label="Avance promedio" value={sum.average+'%'} note="Avance oficial por actividades"/>
        <Stat tone="amber" label="En atención" value={projects.filter(p=>p.semaforo!=='Verde'||p.status==='Bloqueado').length} note="Semáforo amarillo, rojo o bloqueado"/>
        <Stat tone="red" label="Vencidos" value={sum.overdueItems} note="Actividades y tareas fuera de fecha"/>
      </div>
      <div className="pd-toolbar" role="search">
        <label className="pd-field">Buscar<input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Proyecto, área o responsable" aria-label="Buscar proyectos"/></label>
        <label className="pd-field">Macroiniciativa<select value={String(facets.macro)} onChange={e=>apply({...facets,macro:parse(e.target.value)})}><option value="all">Todas</option>{metas.map(m=><option key={m.id} value={m.id}>{m.code} · {m.title}</option>)}<option value="none">Sin macroiniciativa</option></select></label>
        <label className="pd-field">Libro de trabajo<select value={String(facets.method)} onChange={e=>apply({...facets,method:parse(e.target.value)})}><option value="all">Todos</option>{catalog.methodologies.map(m=><option key={m.id} value={m.id}>{m.name}</option>)}<option value="none">Sin metodología</option></select></label>
        <label className="pd-field">Tipo<select value={facets.kind} onChange={e=>apply({...facets,kind:e.target.value as Facets['kind']})}><option value="all">Todos</option>{PROJECT_KINDS.map(k=><option key={k.id} value={k.id}>{k.short}</option>)}</select></label>
        <label className="pd-field">Estado<select value={status} onChange={e=>setStatus(e.target.value)}>{STATUSES.map(s=><option key={s}>{s}</option>)}</select></label>
        <span className="grow"/>
        <Segmented<View> label="Forma de ver los proyectos" value={view} onChange={setView} options={[{id:'lista',label:'Lista',icon:<List size={15}/>},{id:'kanban',label:'Tablero por etapa',icon:<KanbanSquare size={15}/>},{id:'macro',label:'Por macroiniciativa',icon:<Layers size={15}/>}]}/>
      </div>
      {!projects.length?<Empty title="No hay proyectos con estos filtros" text="Cambia los filtros o crea un proyecto nuevo." action={<Button variant="primary" onClick={onNewProject}><Plus size={15}/> Nuevo proyecto</Button>}/>:<>
        {view==='lista'&&<div className="pd-list">{projects.map(p=>card(p))}</div>}
        {view==='kanban'&&<><p className="pd-hint">Cada columna es la etapa actual calculada a partir de las actividades; avanza cuando se completan. Toca un proyecto para abrirlo.</p><div className="pd-board">{columns.map(c=><section key={c.key} className="pd-col" aria-label={c.name}><header>{c.name}<em>{c.items.length}</em></header>{c.items.map(p=>{const m=macroOf(metas,p.initiativeId);return <button type="button" key={p.id} className="pd-kcard" style={{['--m' as string]:m?.color??UNLINKED_META.color,cursor:'pointer',textAlign:'left',font:'inherit'}} onClick={()=>onOpenProject(p.id)}><strong>{p.name}</strong><span style={{display:'flex',gap:6,flexWrap:'wrap'}}><MacroTag meta={m} compact/><KindBadge kind={projectKind(p)}/></span><Bar value={progress(p)} color={m?.color}/><small style={{display:'flex',justifyContent:'space-between',gap:6}}><span>{ownerOf(p)?.name.split(' ')[0]??'Sin responsable'}</span><span>{progress(p)}% · {shortDate(p.dueDate)}</span></small></button>})}{!c.items.length&&<p className="pd-hint" style={{padding:'6px 4px'}}>Sin proyectos</p>}</section>)}</div></>}
        {view==='macro'&&<div className="pd-page">{macroGroups.map(g=>{const s=summarize(workspace,g.projects,0);const meta=g.meta;return <section key={meta?.id??'none'} className="pd-card" style={{borderTop:`4px solid ${meta?.color??UNLINKED_META.color}`}}><header style={{display:'flex',justifyContent:'space-between',gap:12,alignItems:'center',flexWrap:'wrap',marginBottom:10}}><div><MacroTag meta={meta}/><h3 style={{marginTop:6}}>{meta?.title??'Proyectos sin macroiniciativa'}</h3><p className="pd-sub" style={{margin:0}}>{g.projects.length} proyecto{g.projects.length===1?'':'s'} · {s.activitiesDone}/{s.activities} actividades{!meta&&' · análisis y proyectos de libro de trabajo'}</p></div><Ring value={s.average} color={meta?.color} size={56}/></header><div className="pd-list">{g.projects.map(p=>card(p,true))}</div></section>})}</div>}
      </>}
    </>}
  </div>;
}
void Avatar;
