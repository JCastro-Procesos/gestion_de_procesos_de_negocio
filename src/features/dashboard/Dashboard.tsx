import {useMemo,useState} from 'react';
import {ArrowRight,Layers,Library,ShieldAlert} from 'lucide-react';
import {Bar as RBar,BarChart,CartesianGrid,Cell,Pie,PieChart,ResponsiveContainer,Tooltip,XAxis,YAxis} from 'recharts';
import type {Workspace} from '../../domain/model';
import {executiveMetrics,memberWorkload} from '../../domain/metrics';
import {catalogFor,projectStageNames} from '../../domain/alignment';
import {officialProjectProgress} from '../../domain/projectProgress';
import {ALL_FACETS,filterProjects,kindInfo,macroOf,projectKind,PROJECT_KINDS,summarize,UNLINKED_META,type Facets,type WorkItem} from '../../domain/portfolio';
import {useMacroInitiatives} from '../../data/useMacroInitiatives';
import {loadFacets,saveFacets} from '../../data/facetStore';
import {LiveClock} from '../../components/pd/LiveClock';
import {Bar,Empty,KindBadge,MacroTag,MethodTag,Ring,Segmented,Stat,shortDate} from '../../components/pd';
import {Button,TrafficBadge} from '../../components/ui';
import {ExecutiveActions} from './ExecutiveActions';

type GroupBy='macro'|'method';
const SIGNAL=['#14804a','#e0a12b','#c4314b'];

export function Dashboard({workspace,onOpenProject,onNavigate,viewerName,viewerRole}:{workspace:Workspace;onOpenProject:(id:string)=>void;onNavigate:(page:string)=>void;viewerName:string;viewerRole:string}){
  const {metas}=useMacroInitiatives();
  const catalog=catalogFor(workspace);
  const [groupBy,setGroupBy]=useState<GroupBy>('macro');
  const [facets,setFacets]=useState<Facets>(()=>loadFacets());
  const apply=(next:Facets)=>{setFacets(next);saveFacets(next)};
  const projects=useMemo(()=>filterProjects(workspace,facets),[workspace,facets]);
  const all=useMemo(()=>summarize(workspace,workspace.projects),[workspace]);
  const sel=useMemo(()=>summarize(workspace,projects,6),[workspace,projects]);
  const metrics=executiveMetrics(workspace);
  const methodName=(id:number)=>catalog.methodologies.find(m=>m.id===id)?.name??null;

  type Group={key:string;id:'none'|number;title:string;code:string;color:string;tint:string;ink:string;projects:typeof workspace.projects};
  const groups:Group[]=useMemo(()=>{
    if(groupBy==='macro'){
      const g:Group[]=metas.map(m=>({key:'m'+m.id,id:m.id,title:m.title,code:m.code,color:m.color,tint:m.tint,ink:m.ink,projects:workspace.projects.filter(p=>Number(p.initiativeId)===m.id)}));
      const none=workspace.projects.filter(p=>!(Number(p.initiativeId)>0));
      if(none.length)g.push({key:'none',id:'none',title:UNLINKED_META.title,code:'—',color:UNLINKED_META.color,tint:UNLINKED_META.tint,ink:UNLINKED_META.ink,projects:none});
      return g;
    }
    const pal=['#1565c0','#0aa89f','#7c5cc4','#e0872b','#d6455d','#4f8a3b'];
    const g:Group[]=catalog.methodologies.map((m,i)=>({key:'w'+m.id,id:m.id,title:m.name,code:String(m.id).padStart(2,'0'),color:pal[i%pal.length],tint:'#eef3fb',ink:'#102a5c',projects:workspace.projects.filter(p=>p.methodologyId===m.id)}));
    const none=workspace.projects.filter(p=>!(p.methodologyId>0));
    if(none.length)g.push({key:'none',id:'none',title:'Sin metodología',code:'—',color:UNLINKED_META.color,tint:UNLINKED_META.tint,ink:UNLINKED_META.ink,projects:none});
    return g;
  },[groupBy,metas,workspace.projects,catalog.methodologies]);
  const activeGroup=groupBy==='macro'?facets.macro:facets.method;
  const pick=(g:Group)=>{
    const same=activeGroup===g.id;
    apply(groupBy==='macro'?{...facets,macro:same?'all':g.id}:{...facets,method:same?'all':g.id});
  };
  const clear=()=>apply(ALL_FACETS);
  const filtered=facets.macro!=='all'||facets.method!=='all'||facets.kind!=='all';
  const first=viewerName.trim()?viewerName.trim().split(' ')[0]:'equipo';
  const chartData=[{name:'En control',value:metrics.green},{name:'Atención',value:metrics.yellow},{name:'Crítico',value:metrics.red}];
  const workload=workspace.members.map(m=>({name:m.name.split(' ')[0],hours:memberWorkload(m,workspace.tasks).estimated,available:m.capacityHours})).sort((a,b)=>b.hours-a.hours).slice(0,6);
  const scopeLabel=!filtered?'todo el portafolio':[facets.macro!=='all'&&(facets.macro==='none'?'sin macroiniciativa':macroOf(metas,facets.macro as number)?.code),facets.method!=='all'&&(facets.method==='none'?'sin metodología':methodName(facets.method as number)),facets.kind!=='all'&&kindInfo(facets.kind).short].filter(Boolean).join(' · ');
  const go=(page:string)=>{saveFacets(facets);onNavigate(page)};
  const openItem=(i:WorkItem)=>onOpenProject(i.projectId);

  return <div className="pd-page">
    <section className="pd-animal-hero pd-hero-clock">
      <div><span className="pd-eyebrow" style={{color:'#bfe0ff'}}>PANEL EJECUTIVO</span><h2 style={{margin:'4px 0 0',fontSize:26}}>Hola, {first}</h2><p>{viewerRole?viewerRole+' · ':''}{all.projects} proyectos · {all.average}% de avance promedio · {all.openItems} pendientes{all.overdueItems?` · ${all.overdueItems} vencidos`:''}</p></div>
      <LiveClock/>
    </section>

    <div className="pd-toolbar">
      <label className="pd-field">Agrupar por<Segmented<GroupBy> label="Agrupar el panel por" value={groupBy} onChange={setGroupBy} options={[{id:'macro',label:'Macroiniciativa',icon:<Layers size={15}/>},{id:'method',label:'Libro de trabajo',icon:<Library size={15}/>}]}/></label>
      <label className="pd-field">Tipo de proyecto<select value={facets.kind} onChange={e=>apply({...facets,kind:e.target.value as Facets['kind']})}><option value="all">Todos los tipos</option>{PROJECT_KINDS.map(k=><option key={k.id} value={k.id}>{k.short}</option>)}</select></label>
      <span className="grow"/>
      {filtered&&<Button variant="quiet" onClick={clear}>Quitar filtros</Button>}
    </div>

    <section aria-label="Grupos del portafolio">
      <div className="pd-grid pd-g3">
        {groups.map(g=>{const s=summarize(workspace,g.projects,0);const on=activeGroup===g.id;return <button type="button" key={g.key} className="pd-macro-card" style={{['--m' as string]:g.color}} aria-pressed={on} onClick={()=>pick(g)}>
          <div className="pd-macro-top"><div><span className="pd-tag" style={{background:g.tint,color:g.ink,borderColor:g.color+'55'}}><i style={{background:g.color}}/>{g.code}</span><h4>{g.title}</h4></div><Ring value={s.average} color={g.color} label={'Avance de '+g.title}/></div>
          <div className="pd-macro-nums"><span><b>{s.projects}</b>proyectos</span><span><b>{s.activities}</b>actividades</span><span><b>{s.overdueItems}</b>vencidos</span></div>
        </button>})}
        {!groups.length&&<Empty title="Aún no hay grupos" text="Crea tu primer proyecto para ver aquí su avance."/>}
      </div>
      <p className="pd-hint" style={{marginTop:8}}>Toca un grupo para filtrar todo el panel; vuelve a tocarlo para quitarlo.</p>
    </section>

    <div className="pd-grid pd-g4">
      <Stat label="Proyectos" value={sel.projects} note={`${sel.active} activos · ${sel.completed} completados`} onClick={()=>go('proyectos')}/>
      <Stat tone="teal" label="Avance promedio" value={sel.average+'%'} note={`Alcance: ${scopeLabel}`}/>
      <Stat tone="violet" label="Actividades" value={`${sel.activitiesDone}/${sel.activities}`} note="completadas / total"/>
      <Stat tone="red" label="Vencidos o bloqueados" value={sel.overdueItems+sel.blocked} note={`${sel.overdueItems} vencidos · ${sel.blocked} bloqueados`} onClick={()=>go('mi-trabajo')}/>
    </div>

    {metrics.critical.length>0&&<div className="pd-card" style={{borderLeft:'5px solid var(--pd-red)',display:'flex',gap:12,alignItems:'center',flexWrap:'wrap'}}><ShieldAlert size={22} color="#c4314b"/><div style={{flex:1,minWidth:200}}><b style={{color:'#a02339'}}>{metrics.critical.length} proyecto{metrics.critical.length===1?'':'s'} crítico{metrics.critical.length===1?'':'s'} requieren atención</b><div className="pd-sub" style={{margin:0}}>{metrics.critical.slice(0,2).map(p=>p.name).join(' · ')}</div></div><Button variant="danger" onClick={()=>go('proyectos')}>Revisar <ArrowRight size={14}/></Button></div>}

    <div className="pd-split">
      <section className="pd-card"><header><h3>Siguientes pasos</h3><p>Primero lo bloqueado y vencido, luego lo que vence esta semana · {scopeLabel}</p></header>
        {sel.next.length?<div className="pd-list">{sel.next.map(i=>{const p=workspace.projects.find(x=>x.id===i.projectId);const m=macroOf(metas,p?.initiativeId);return <button type="button" key={i.key} className="pd-item" style={{['--m' as string]:m?.color}} onClick={()=>openItem(i)}>
          <span className={`pd-dot ${i.status==='Completada'?'s-ok':i.status==='En curso'?'s-curso':i.status==='En revisión'?'s-rev':i.status==='Bloqueada'?'s-blk':''}`} aria-hidden="true"/>
          <span><strong>{i.title}</strong><small>{i.kind==='task'?'Tarea':'Actividad'} · {p?.name??'Sin proyecto'} · {i.stageName}</small></span>
          <span className={`pd-due ${i.overdue?'late':i.dueSoon?'soon':''}`}>{i.status==='Bloqueada'?'Bloqueada · ':i.overdue?'Vencida · ':''}{shortDate(i.dueDate)}</span></button>})}</div>:<Empty title="Todo al día" text="No hay pasos pendientes en este alcance."/>}
        <div style={{marginTop:10}}><Button variant="quiet" onClick={()=>go('mi-trabajo')}>Ver mi trabajo <ArrowRight size={14}/></Button></div>
      </section>
      <section className="pd-card"><header><h3>¿En qué etapa están?</h3><p>Proyectos por etapa actual</p></header>
        <div className="pd-stages pd-stages-wide">{[...projectStageNames,'Cierre'].map((n,i)=><div key={n} className={`pd-stage-cell ${sel.byCurrentStage[i]?'has':''}`}><span>{n}</span><b>{sel.byCurrentStage[i]}</b></div>)}</div>
        <div style={{display:'grid',gap:6,marginTop:12}}><span className="pd-sub" style={{margin:0}}>Actividades por estado</span>{(['Por iniciar','En curso','En revisión','Bloqueada','Completada'] as const).map(s=>{const total=Math.max(1,sel.activities);return <div key={s} style={{display:'grid',gridTemplateColumns:'92px 1fr 30px',gap:8,alignItems:'center',fontSize:13,color:'#51607d'}}><span>{s}</span><Bar value={(sel.stageCounts[s]/total)*100} color={s==='Completada'?'#14804a':s==='Bloqueada'?'#c4314b':'#1565c0'}/><b>{sel.stageCounts[s]}</b></div>})}</div>
      </section>
    </div>

    <section className="pd-card"><header style={{display:'flex',justifyContent:'space-between',gap:10,flexWrap:'wrap'}}><div><h3>Proyectos del alcance</h3><p>{projects.length} proyecto{projects.length===1?'':'s'} · {scopeLabel}</p></div><Button variant="quiet" onClick={()=>go('proyectos')}>Abrir portafolio <ArrowRight size={14}/></Button></header>
      {projects.length?<div className="pd-list">{projects.slice(0,8).map(p=>{const m=macroOf(metas,p.initiativeId);const prog=officialProjectProgress(workspace.stages.filter(s=>s.projectId===p.id),p.planType);return <button type="button" key={p.id} className="pd-item" style={{['--m' as string]:m?.color}} onClick={()=>onOpenProject(p.id)}>
        <Ring value={prog} size={44} color={m?.color}/>
        <span><strong>{p.name}</strong><small style={{display:'flex',gap:6,flexWrap:'wrap',alignItems:'center',marginTop:3}}><MacroTag meta={m} compact/><MethodTag name={methodName(p.methodologyId)}/><KindBadge kind={projectKind(p)}/></small></span>
        <TrafficBadge value={p.semaforo}/></button>})}</div>:<Empty title="Sin proyectos en este alcance" text="Cambia el filtro o crea un proyecto nuevo."/>}
    </section>

    <div className="pd-grid pd-g2">
      <section className="pd-card"><header><h3>Semáforo del portafolio</h3><p>{metrics.total} proyectos · {metrics.atRisk} en riesgo</p></header>
        <div style={{display:'flex',alignItems:'center',gap:16,flexWrap:'wrap'}}><div style={{width:150,height:150}}><ResponsiveContainer><PieChart><Pie data={chartData} dataKey="value" nameKey="name" innerRadius={46} outerRadius={66} paddingAngle={3} stroke="none">{chartData.map((d,i)=><Cell key={d.name} fill={SIGNAL[i]}/>)}</Pie><Tooltip/></PieChart></ResponsiveContainer></div><div style={{display:'grid',gap:6,fontSize:13}}>{chartData.map((d,i)=><span key={d.name} style={{display:'flex',gap:8,alignItems:'center'}}><i style={{width:10,height:10,borderRadius:3,background:SIGNAL[i]}}/>{d.name}: <b>{d.value}</b></span>)}</div></div>
      </section>
      <section className="pd-card"><header><h3>Carga del equipo</h3><p>Horas abiertas frente a capacidad semanal</p></header>
        <div style={{height:170}}><ResponsiveContainer><BarChart data={workload} margin={{top:4,right:8,left:-20,bottom:0}}><CartesianGrid stroke="#edf1f6" strokeDasharray="3 3" vertical={false}/><XAxis dataKey="name" tick={{fill:'#51607d',fontSize:13}} axisLine={false} tickLine={false}/><YAxis tick={{fill:'#51607d',fontSize:13}} axisLine={false} tickLine={false}/><Tooltip/><RBar dataKey="available" name="Capacidad (h)" fill="#dfe7f5" radius={[5,5,0,0]}/><RBar dataKey="hours" name="Horas abiertas" fill="#1565c0" radius={[5,5,0,0]}/></BarChart></ResponsiveContainer></div>
      </section>
    </div>

    <ExecutiveActions workspace={workspace} onOpenProject={onOpenProject} onNavigate={onNavigate}/>
  </div>;
}
