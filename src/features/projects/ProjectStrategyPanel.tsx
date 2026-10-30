import {pendingTemplateActivities} from '../../domain/projectTemplateIntegration';
import {useEffect,useState} from 'react';
import {api,session,type CurrentUser} from '../../data/processoneApi';
import type {Project,Stage,Workspace} from '../../domain/model';
type Template={id:number;name:string;version:number;status:string};
type StageTemplate={id:number;template_id:number;stage_order:number;title:string;weight:number};
type ActivityTemplate={id:number;stage_id:number;title:string;deliverable:string|null;acceptance_criteria:string|null};
type Initiative={id:number;title:string};
type Assignment={project_id:string;template_id:number;initiative_id:number;methodology_name:string;version:number;initiative_title:string};
export function ProjectStrategyPanel({project,workspace,onUpdateStage,toast}:{project:Project;workspace:Workspace;onUpdateStage:(stage:Stage)=>void;toast:(message:string)=>void}){
 const [templates,setTemplates]=useState<Template[]>([]),[stages,setStages]=useState<StageTemplate[]>([]),[activities,setActivities]=useState<ActivityTemplate[]>([]),[initiatives,setInitiatives]=useState<Initiative[]>([]),[assignment,setAssignment]=useState<Assignment|null>(null);
 const [templateId,setTemplateId]=useState(''),[initiativeId,setInitiativeId]=useState(''),[user,setUser]=useState<CurrentUser|null>(null),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 const load=async()=>{const [m,i,a]=await Promise.all([api<{templates:Template[];stages:StageTemplate[];activities:ActivityTemplate[]}>('methodologies_v12'),api<{initiatives:Initiative[]}>('initiatives'),api<{assignments:Assignment[]}>('project_strategy_v12')]);setTemplates(m.templates);setStages(m.stages);setActivities(m.activities);setInitiatives(i.initiatives);const found=a.assignments.find(x=>x.project_id===project.id)??null;setAssignment(found);setTemplateId(found?String(found.template_id):'');setInitiativeId(found?String(found.initiative_id):'')};
 useEffect(()=>{void session().then(setUser).catch(()=>{});void load().catch(e=>setError(String(e)))},[project.id]);
 const canEdit=!!user&&['admin','direccion','gerencia'].includes(user.role);
 const selectedStages=stages.filter(s=>Number(s.template_id)===Number(templateId)).sort((a,b)=>Number(a.stage_order)-Number(b.stage_order));
 const projectStages=workspace.stages.filter(s=>s.projectId===project.id);
 const preview=selectedStages.map(s=>{const target=projectStages.find(x=>x.order===Number(s.stage_order));const pending=pendingTemplateActivities(target,activities.filter(a=>Number(a.stage_id)===Number(s.id)));return {stage:s,target,pending}});
 const pending=preview.reduce((n,s)=>n+s.pending.length,0);
 const save=async()=>{if(!templateId||!initiativeId)return;setBusy(true);setError('');try{await api('project_strategy_v12','POST',{projectId:project.id,templateId:Number(templateId),initiativeId:Number(initiativeId)});await load();toast('Iniciativa y metodología vinculadas al proyecto')}catch(e){setError(String(e))}finally{setBusy(false)}};
 const generate=()=>{if(!assignment||String(assignment.template_id)!==templateId){setError('Primero guarda la vinculación');return}if(projectStages.length!==6||preview.some(p=>!p.target)){setError('Este proyecto requiere seis etapas. Usa primero la migración metodológica existente.');return}if(!window.confirm('Se agregarán '+pending+' actividades nuevas sin modificar actividades, tareas ni evidencias existentes. ¿Continuar?'))return;
  for(const p of preview){if(!p.target||!p.pending.length)continue;const existing=p.target;onUpdateStage({...existing,activities:[...existing.activities,...p.pending.map(a=>({id:'activity-'+crypto.randomUUID(),name:a.title,deliverable:[a.deliverable,a.acceptance_criteria?'Criterio de aceptación: '+a.acceptance_criteria:''].filter(Boolean).join(' | '),ownerId:project.ownerId,startDate:project.startDate,dueDate:project.dueDate,status:'Por iniciar' as const,progress:0}))]})}
  toast('Actividades de la plantilla incorporadas. Verifica el guardado del espacio de trabajo.');
 };
 return <section className="itm-planning-panel" style={{marginBottom:16}}><h3>Vinculación estratégica · Iniciativa y metodología</h3><p>Asocia este proyecto con una iniciativa y una versión metodológica publicada. Las actividades existentes no se reemplazan.</p>
 {assignment&&<p><strong>Actual:</strong> {assignment.initiative_title} · {assignment.methodology_name} v{assignment.version}</p>}
 {canEdit&&<div style={{display:'grid',gap:10}}><label>Iniciativa<select className="input" value={initiativeId} onChange={e=>setInitiativeId(e.target.value)}><option value="">Seleccionar iniciativa</option>{initiatives.map(i=><option key={i.id} value={i.id}>{i.title}</option>)}</select></label><label>Metodología publicada<select className="input" value={templateId} onChange={e=>setTemplateId(e.target.value)}><option value="">Seleccionar versión</option>{templates.filter(t=>t.status==='Publicada').map(t=><option key={t.id} value={t.id}>{t.name} · v{t.version}</option>)}</select></label><button className="top-add-button" type="button" disabled={busy||!initiativeId||!templateId} onClick={()=>void save()}>Guardar vinculación</button></div>}
 {assignment&&String(assignment.template_id)===templateId&&<div><p>Plantilla seleccionada: {selectedStages.length} etapas · {pending} actividades por incorporar.</p>{preview.map(p=><p key={p.stage.id}><small>{p.stage.stage_order}. {p.stage.title}: {p.pending.length} pendientes {p.target?'':'(etapa no encontrada)'}</small></p>)}{canEdit&&pending>0&&<button className="top-add-button" type="button" onClick={generate}>Incorporar actividades faltantes</button>}</div>}
 {error&&<p role="alert" className="po-auth-error">{error}</p>}</section>;
}
