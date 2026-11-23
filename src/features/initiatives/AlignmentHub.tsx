import {useMemo,useState} from 'react';
import type {ReactNode} from 'react';
import {FolderKanban,Layers,Library,Network,Plus} from 'lucide-react';
import type {Workspace} from '../../domain/model';
import {catalogFor,projectStageNames} from '../../domain/alignment';
import type {AlignmentCatalog,WorkMethod} from '../../domain/alignment';
import {officialProjectProgress} from '../../domain/projectProgress';
import {hasMacro,macroMetas,macroOf,projectKind,PROJECT_KINDS,UNLINKED_META,type ProjectKind} from '../../domain/portfolio';
import {Bar,Empty,KindBadge,MacroTag,Ring,Segmented} from '../../components/pd';
import {PlanCatalogEditor} from './PlanCatalogEditor';
import {StrategyManagementPanel} from './StrategyManagementPanel';
import {InitiativeArchitecturePanel} from './InitiativeArchitecturePanel';
import {CellsPanel} from './CellsPanel';
type Initiative={id:number;title:string;objective:string;status:string;project_ids:string|null};
type Step='overview'|'macros'|'methods'|'projects';
/** PHVA es un método de orientación independiente: cualquier proyecto puede aplicarlo sin importar su macroiniciativa o etapa. */
const PHVA_CYCLE=[['P','Planear','Definir objetivo, alcance y plan'],['H','Hacer','Ejecutar lo planeado'],['V','Verificar','Medir y comparar contra lo esperado'],['A','Actuar','Estandarizar o corregir']] as const;

export function AlignmentHub({workspace,items,canEdit,onSaveCatalog,onOpenProject,onNewProject,children}:{workspace:Workspace;items:Initiative[];canEdit:boolean;onSaveCatalog:(catalog:AlignmentCatalog)=>void;onOpenProject:(id:string)=>void;onNewProject:()=>void;children:ReactNode}){
 const [tab,setTab]=useState<Step>('overview'),[editing,setEditing]=useState<WorkMethod|null>(null),[notice,setNotice]=useState('');
 const [selMacro,setSelMacro]=useState<number|'none'|null>(null),[selMethod,setSelMethod]=useState<number|'none'|null>(null);
 const [kindFilter,setKindFilter]=useState<'all'|ProjectKind>('all');
 const catalog=catalogFor(workspace);
 const metas=useMemo(()=>macroMetas(items),[items]);
 const save=(next:AlignmentCatalog)=>{if(!canEdit)return;onSaveCatalog(next);setNotice('Cambios enviados al espacio compartido. Verifica la sincronización antes de salir.');setEditing(null)};
 const progress=(id:string)=>officialProjectProgress(workspace.stages.filter(s=>s.projectId===id),workspace.projects.find(p=>p.id===id)?.planType);
 const methodName=(id:number)=>catalog.methodologies.find(m=>m.id===id)?.name??null;
 const linkedToMacro=(id:number)=>workspace.projects.filter(p=>Number(p.initiativeId)===id);
 const noMacro=workspace.projects.filter(p=>!hasMacro(p));
 const avg=(ids:string[])=>ids.length?Math.round(ids.reduce((n,id)=>n+progress(id),0)/ids.length):0;
 const stepList:{id:Step;label:string;icon:ReactNode;count?:number}[]=[{id:'overview',label:'Vista general',icon:<Network size={15}/>},{id:'macros',label:'Macroiniciativas',icon:<Layers size={15}/>,count:items.length},{id:'methods',label:'Libros de trabajo',icon:<Library size={15}/>,count:catalog.methodologies.length},{id:'projects',label:'Proyectos',icon:<FolderKanban size={15}/>,count:workspace.projects.length}];

 /* Selección cruzada: elegir una macroiniciativa o un libro resalta lo relacionado con él. */
 const visible=workspace.projects.filter(p=>(selMacro===null||(selMacro==='none'?!hasMacro(p):Number(p.initiativeId)===selMacro))&&(selMethod===null||(selMethod==='none'?!(p.methodologyId>0):p.methodologyId===selMethod)));
 const methodsInUse=new Set(visible.map(p=>p.methodologyId>0?p.methodologyId:0));
 const macrosInUse=new Set(visible.map(p=>hasMacro(p)?Number(p.initiativeId):0));
 const dimMacro=(id:number|'none')=>(selMethod!==null)&&!macrosInUse.has(id==='none'?0:id);
 const dimMethod=(id:number|'none')=>(selMacro!==null)&&!methodsInUse.has(id==='none'?0:id);
 const clearSel=()=>{setSelMacro(null);setSelMethod(null)};
 const methodStageCounts=(m:WorkMethod)=>projectStageNames.map((_,i)=>m.activities.filter(a=>a.stageOrder===i+1).length);

 return <div className="pd-page">
  <header className="pd-head"><div><span className="pd-eyebrow">Alineación y trazabilidad</span><h2>Metodología e iniciativas</h2><p>Del objetivo estratégico al trabajo y sus resultados. Una macroiniciativa se ejecuta con libros de trabajo (metodologías) que generan las actividades de cada proyecto. También hay proyectos sin macroiniciativa o sin libro de trabajo.</p></div><div className="pd-head-actions"><Segmented<Step> label="Secciones" value={tab} onChange={s=>{setTab(s);setEditing(null)}} options={stepList}/></div></header>
  {notice&&<p role="status" className="pd-card">{notice}</p>}

  {tab==='overview'&&<>
   <section className="pd-card"><header style={{display:'flex',justifyContent:'space-between',gap:10,flexWrap:'wrap',alignItems:'center'}}><div><h3>Mapa de alineación</h3><p className="pd-sub" style={{margin:0}}>Toca una macroiniciativa o un libro de trabajo para ver los proyectos y conexiones relacionados.</p></div>{(selMacro!==null||selMethod!==null)&&<button type="button" className="pd-mini" onClick={clearSel}>Quitar selección</button>}</header>
    <div className="pd-flow" style={{marginTop:12}}>
     <div className="pd-flow-col"><h4>1 · Macroiniciativas</h4>
      {metas.map(m=>{const ps=linkedToMacro(m.id);return <button type="button" key={m.id} className={`pd-node-btn ${dimMacro(m.id)?'dim':''} ${selMacro===m.id?'sel':''}`} style={{['--m' as string]:m.color}} aria-pressed={selMacro===m.id} onClick={()=>setSelMacro(selMacro===m.id?null:m.id)}><MacroTag meta={m} compact/><strong>{m.title}</strong><small>{ps.length} proyecto{ps.length===1?'':'s'} · {avg(ps.map(p=>p.id))}% de avance</small></button>})}
      {!metas.length&&<Empty title="Sin macroiniciativas" text="Regístralas en la pestaña Macroiniciativas."/>}
      <button type="button" className={`pd-node-btn ${dimMacro('none')?'dim':''} ${selMacro==='none'?'sel':''}`} style={{['--m' as string]:UNLINKED_META.color}} aria-pressed={selMacro==='none'} onClick={()=>setSelMacro(selMacro==='none'?null:'none')}><strong>Sin macroiniciativa</strong><small>{noMacro.length} proyecto{noMacro.length===1?'':'s'} independientes</small></button></div>
     <div className="pd-flow-col"><h4>2 · Libros de trabajo</h4>
      {catalog.methodologies.map(m=><button type="button" key={m.id} className={`pd-node-btn ${dimMethod(m.id)?'dim':''} ${selMethod===m.id?'sel':''}`} style={{['--m' as string]:'#102a5c'}} aria-pressed={selMethod===m.id} onClick={()=>setSelMethod(selMethod===m.id?null:m.id)}><strong>{String(m.id).padStart(2,'0')} · {m.name}</strong><small>{m.activities.length} actividades · {workspace.projects.filter(p=>p.methodologyId===m.id).length} proyectos</small></button>)}
      <button type="button" className={`pd-node-btn ${dimMethod('none')?'dim':''} ${selMethod==='none'?'sel':''}`} style={{['--m' as string]:UNLINKED_META.color}} aria-pressed={selMethod==='none'} onClick={()=>setSelMethod(selMethod==='none'?null:'none')}><strong>Sin metodología</strong><small>{workspace.projects.filter(p=>!(p.methodologyId>0)).length} análisis o trabajo libre</small></button></div>
     <div className="pd-flow-col"><h4>3 · Proyectos {(selMacro!==null||selMethod!==null)?`(${visible.length})`:''}</h4>
      {visible.slice(0,12).map(p=>{const m=macroOf(metas,p.initiativeId);return <button type="button" key={p.id} className="pd-node-btn" style={{['--m' as string]:m?.color??UNLINKED_META.color}} onClick={()=>onOpenProject(p.id)}><strong>{p.name}</strong><small style={{display:'flex',gap:6,alignItems:'center',flexWrap:'wrap'}}><KindBadge kind={projectKind(p)}/>{progress(p.id)}%</small></button>})}
      {visible.length>12&&<small className="pd-hint">+{visible.length-12} más en la pestaña Proyectos</small>}{!visible.length&&<Empty title="Sin proyectos" text="No hay proyectos con esta combinación."/>}</div>
    </div></section>
   <div className="pd-grid pd-g2">
    <section className="pd-card"><h3>Seis etapas de ejecución</h3><p className="pd-sub">Todos los proyectos usan las mismas seis etapas. Los libros de trabajo no añaden fases: aportan actividades y entregables.</p>
     <div className="pd-stages" style={{gridTemplateColumns:'repeat(6,minmax(0,1fr))'}}>{projectStageNames.map((n,i)=><div key={n} className="pd-stage-cell has"><span>{n}</span><b>{i+1}</b></div>)}</div>
     <div className="pd-phva-guide" style={{marginTop:10}}><small style={{fontWeight:700,color:'#102a5c'}}>Método de orientación PHVA (opcional, aplica a cualquier proyecto)</small><div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))',gap:8,marginTop:6}}>{PHVA_CYCLE.map(([k,n,d])=><div key={k} className="pd-stage-cell has"><b>{k}</b><span>{n}</span><span style={{fontSize:12,opacity:.8}}>{d}</span></div>)}</div><p className="pd-hint" style={{marginTop:6}}>Es una guía de referencia: no está ligada a una macroiniciativa ni a una etapa fija, y no modifica el avance oficial.</p></div></section>
    <section className="pd-card"><h3>Cómo se conecta el trabajo</h3><ol style={{margin:0,paddingLeft:18,display:'grid',gap:6,fontSize:13,color:'#51607d',lineHeight:1.5}}><li><b style={{color:'#102a5c'}}>Macroiniciativa</b> — resultado esperado, responsables y KPIs.</li><li><b style={{color:'#102a5c'}}>Libro de trabajo</b> — cómo trabajar y qué entregar.</li><li><b style={{color:'#102a5c'}}>Proyecto</b> — al vincularlos se cargan sus actividades en las seis etapas y aparecen en «Mi trabajo».</li><li><b style={{color:'#102a5c'}}>Proyecto libre</b> — sin macroiniciativa, con o sin libro de trabajo; también se mide y se ve aquí.</li></ol></section>
   </div>
   <details className="pd-card"><summary style={{cursor:'pointer',fontWeight:700}}>Células, responsables y arquitectura corporativa / departamental</summary><CellsPanel/><InitiativeArchitecturePanel initiatives={items}/></details></>}

  {tab==='macros'&&<>
   {!!metas.length&&<div className="pd-grid pd-g3">{metas.map(m=>{const ps=linkedToMacro(m.id);const init=items.find(i=>i.id===m.id);return <div key={m.id} className="pd-macro-card" style={{['--m' as string]:m.color,cursor:'default'}}><div className="pd-macro-top"><div><MacroTag meta={m} compact/><h4>{m.title}</h4></div><Ring value={avg(ps.map(p=>p.id))} color={m.color} label={'Avance de '+m.title}/></div><small style={{color:'#51607d'}}>{init?.objective}</small><div className="pd-macro-nums"><span><b>{ps.length}</b>proyectos</span><span><b>{ps.reduce((n,p)=>n+workspace.stages.filter(s=>s.projectId===p.id).reduce((a,s)=>a+s.activities.length,0),0)}</b>actividades</span><span><b>{init?.status??'—'}</b>estado</span></div></div>})}</div>}
   {children}</>}

  {tab==='methods'&&<section className="pd-page"><p className="pd-sub" style={{margin:0}}>Los cinco libros de trabajo están disponibles desde el inicio. Puedes editarlos; los cambios se aplican a futuras propuestas y conservan las actividades ya registradas en proyectos.</p>
   {editing?<PlanCatalogEditor key={editing.id} method={editing} activities={editing.activities} canEdit={canEdit} onCancel={()=>setEditing(null)} onSave={(activities,m)=>{if(m)save({...catalog,methodologies:catalog.methodologies.map(old=>old.id===m.id?{...m,outputs:m.outputs.map(x=>x.trim()).filter(Boolean),activities,version:old.version+1}:old)})}}/>:
   <div className="pd-grid pd-g3">{catalog.methodologies.map(m=>{const counts=methodStageCounts(m);return <article key={m.id} className="pd-book"><div className="pd-book-spine"><b>{String(m.id).padStart(2,'0')}</b><div><h4>{m.name}</h4><small style={{opacity:.8}}>Versión {m.version} · {m.activities.length} actividades · {m.kpis.length} KPIs</small></div></div>
    <div className="pd-book-body"><p style={{margin:0}}>{m.description}</p>
     <div><small style={{fontWeight:700,color:'#102a5c'}}>Actividades por etapa</small><div className="pd-phva" style={{marginTop:4}}>{counts.map((c,i)=><i key={i} className={c?'on':''} title={`${projectStageNames[i]}: ${c}`}>{c||'·'}</i>)}</div></div>
     <details><summary className="text-action" style={{cursor:'pointer'}}>Contenido y entregables posibles</summary><ul style={{margin:'6px 0',paddingLeft:18}}>{m.outputs.map((o,i)=><li key={i}>{o}</li>)}</ul></details>
     <details><summary className="text-action" style={{cursor:'pointer'}}>Actividades por etapa e indicadores</summary>{projectStageNames.map((s,i)=><div key={s}><h4 style={{margin:'8px 0 2px',fontSize:13,color:'#102a5c'}}>{i+1}. {s}</h4><ul style={{margin:0,paddingLeft:18}}>{m.activities.filter(a=>a.stageOrder===i+1).map(a=><li key={a.id}>{a.title} · {a.deliverable}</li>)}</ul></div>)}<h4 style={{margin:'10px 0 2px',fontSize:13,color:'#102a5c'}}>KPIs de referencia</h4>{m.kpis.map(k=><p key={k.id} style={{margin:'0 0 4px'}}>{k.name} · {k.unit}<small style={{display:'block'}}>{k.formula}</small></p>)}</details>
     {canEdit&&<button className="button button-primary" type="button" onClick={()=>setEditing(m)}>Editar libro de trabajo</button>}</div></article>})}</div>}
   <details className="pd-card"><summary style={{cursor:'pointer',fontWeight:700}}>Versiones metodológicas publicadas anteriormente</summary><StrategyManagementPanel initiatives={items} mode="methods"/></details></section>}

  {tab==='projects'&&<section className="pd-page"><div className="pd-toolbar"><Segmented<'all'|ProjectKind> label="Tipo de proyecto" value={kindFilter} onChange={setKindFilter} options={[{id:'all',label:'Todos',count:workspace.projects.length},...PROJECT_KINDS.map(k=>({id:k.id,label:k.short,count:workspace.projects.filter(p=>projectKind(p)===k.id).length}))]}/><span className="grow"/><button className="button button-primary" type="button" onClick={onNewProject}><Plus size={15}/> Crear proyecto</button></div>
   {!workspace.projects.length?<Empty title="Sin proyectos registrados" text="Crea el primero para verlo conectado aquí."/>:<div className="pd-list">{workspace.projects.filter(p=>kindFilter==='all'||projectKind(p)===kindFilter).map(p=>{const m=macroOf(metas,p.initiativeId);const acts=workspace.stages.filter(s=>s.projectId===p.id).reduce((n,s)=>n+s.activities.length,0);return <button type="button" key={p.id} className="pd-item" style={{['--m' as string]:m?.color??UNLINKED_META.color}} onClick={()=>onOpenProject(p.id)}><Ring value={progress(p.id)} size={46} color={m?.color}/><span><strong>{p.name}</strong><small style={{display:'flex',gap:6,flexWrap:'wrap',alignItems:'center',marginTop:3}}><MacroTag meta={m}/><span className="pd-method">{methodName(p.methodologyId)??'Sin metodología'}</span><KindBadge kind={projectKind(p)}/><span>{p.area} · {acts} actividades</span></small></span><Bar value={progress(p.id)} color={m?.color}/></button>})}</div>}</section>}
 </div>;
}
