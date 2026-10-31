import {useEffect,useState} from 'react';
import {api,session,type CurrentUser} from '../../data/processoneApi';
import type {Project,Stage,Workspace} from '../../domain/model';
import {pendingTemplateActivities} from '../../domain/projectTemplateIntegration';
import {deriveStageFromActivities} from '../../domain/activityProgress';
type Template={id:number;name:string;version:number;status:string};
type TemplateStage={id:number;template_id:number;stage_order:number;title:string;weight:number};
type TemplateActivity={id:number;stage_id:number;title:string;deliverable:string|null;acceptance_criteria:string|null;estimated_days?:number|null;suggested_role?:string|null};
type Assignment={project_id:string;template_id:number;initiative_id:number;methodology_name:string;version:number;initiative_title:string};
export function ProjectStrategyPanel({project,workspace,onUpdateStage,toast}:{project:Project;workspace:Workspace;onUpdateStage:(stage:Stage)=>void;toast:(message:string)=>void}){
 const [templates,setTemplates]=useState<Template[]>([]),[stages,setStages]=useState<TemplateStage[]>([]),[activities,setActivities]=useState<TemplateActivity[]>([]);
 const [assignment,setAssignment]=useState<Assignment|null>(null),[templateId,setTemplateId]=useState(''),[user,setUser]=useState<CurrentUser|null>(null);
 const [error,setError]=useState(''),[busy,setBusy]=useState(false),[loading,setLoading]=useState(true),[selected,setSelected]=useState<number[]>([]),[previewOpen,setPreviewOpen]=useState(false);
 const canEdit=!!user&&['admin','direccion','gerencia'].includes(user.role);
 useEffect(()=>{let active=true;setLoading(true);setError('');setAssignment(null);setTemplateId('');setPreviewOpen(false);setSelected([]);
  void Promise.all([session(),api<{templates:Template[];stages:TemplateStage[];activities:TemplateActivity[]}>('methodologies_v12'),api<{assignments:Assignment[]}>('project_strategy_v12')]).then(([u,m,a])=>{
   if(!active)return;setUser(u);setTemplates(m.templates);setStages(m.stages);setActivities(m.activities);const found=a.assignments.find(x=>x.project_id===project.id)??null;setAssignment(found);setTemplateId(found?String(found.template_id):'');
  }).catch(e=>{if(active)setError(e instanceof Error?e.message:String(e))}).finally(()=>{if(active)setLoading(false)});
  return ()=>{active=false};
 },[project.id]);
 useEffect(()=>{setSelected([]);setPreviewOpen(false)},[project.initiativeId]);
 const projectStages=workspace.stages.filter(s=>s.projectId===project.id);
 const chosen=templates.find(t=>String(t.id)===templateId);
 const linked=!!assignment&&Number(assignment.template_id)===Number(templateId)&&Number(assignment.initiative_id)===Number(project.initiativeId);
 const preview=stages.filter(s=>Number(s.template_id)===Number(templateId)).sort((a,b)=>Number(a.stage_order)-Number(b.stage_order)).map(s=>{
  const matches=projectStages.filter(x=>x.order===Number(s.stage_order));const target=matches.length===1?matches[0]:undefined;
  return {stage:s,target,pending:pendingTemplateActivities(target,activities.filter(a=>Number(a.stage_id)===Number(s.id)),Number(templateId))};
 });
 const pending=preview.flatMap(p=>p.pending);
 const validStages=projectStages.length===6&&preview.length===6&&preview.every(p=>!!p.target);
 const save=async()=>{if(!canEdit||!chosen||!project.initiativeId||busy)return;setBusy(true);setError('');try{
  await api('project_strategy_v12','POST',{projectId:project.id,templateId:Number(templateId),initiativeId:project.initiativeId});
  const r=await api<{assignments:Assignment[]}>('project_strategy_v12');
  setAssignment(r.assignments.find(x=>x.project_id===project.id)??null);setPreviewOpen(false);setSelected([]);toast('Versión metodológica vinculada. Abre la vista previa para elegir actividades.');
 }catch(e){setError(e instanceof Error?e.message:String(e))}finally{setBusy(false)}};
 const incorporate=()=>{if(!canEdit||!linked||!validStages||!chosen||busy)return;
  const additions=preview.flatMap(p=>p.pending.filter(a=>selected.includes(Number(a.id))));if(!additions.length)return;
  setBusy(true);
  try{for(const p of preview){if(!p.target)continue;const chosenActivities=p.pending.filter(a=>selected.includes(Number(a.id)));if(!chosenActivities.length)continue;
   onUpdateStage(deriveStageFromActivities({...p.target,activities:[...p.target.activities,...chosenActivities.map(a=>({
    id:'activity-'+crypto.randomUUID(),name:a.title,deliverable:[a.deliverable,a.acceptance_criteria?'Criterio de aceptación: '+a.acceptance_criteria:''].filter(Boolean).join(' | '),
    ownerId:project.ownerId,startDate:p.target!.startDate||project.startDate,dueDate:p.target!.dueDate||project.dueDate,status:'Por iniciar' as const,progress:0,
    origin:{kind:'Metodología' as const,templateId:Number(templateId),version:Number(chosen.version),activityId:Number(a.id),incorporatedAt:new Date().toISOString()}
   }))]}));
  }setSelected([]);setPreviewOpen(false);toast('Se incorporaron '+additions.length+' actividades seleccionadas. Comprueba la sincronización antes de cerrar.');
  }finally{setBusy(false)}
 };
 return <section className="itm-planning-panel" aria-label="Plan desde metodología" style={{marginBottom:16}}>
  <h3>Plan desde metodología</h3><p>La iniciativa se toma de la vinculación estratégica del proyecto. Selecciona una versión publicada y revisa las actividades antes de incorporarlas.</p>
  {loading?<p role="status">Cargando versiones y vinculación…</p>:<>
   <p><strong>Versión vinculada:</strong> {assignment?assignment.methodology_name+' · v'+assignment.version:'Pendiente de vincular'}</p>
   {!project.initiativeId&&<p role="status">Selecciona primero la iniciativa en el botón «Iniciativa» del encabezado.</p>}
   {assignment&&!linked&&<p role="status">La selección difiere de la vinculación guardada. Guarda la vinculación antes de generar actividades.</p>}
   {canEdit?<div style={{display:'grid',gap:10}}><label>Versión metodológica publicada<select className="input" value={templateId} disabled={busy} onChange={e=>{setTemplateId(e.target.value);setPreviewOpen(false);setSelected([])}}><option value="">Seleccionar versión</option>{templates.filter(t=>t.status==='Publicada'||Number(t.id)===Number(assignment?.template_id)).map(t=><option key={t.id} value={t.id}>{t.name} · v{t.version}{t.status==='Publicada'?'':' · '+t.status}</option>)}</select></label>
    <button type="button" className="top-add-button" disabled={busy||!project.initiativeId||!chosen||chosen.status!=='Publicada'||linked} onClick={()=>void save()}>Guardar vinculación</button>
    <button type="button" className="text-action" disabled={busy||!linked||!validStages} onClick={()=>{setPreviewOpen(!previewOpen);setSelected([])}}>{previewOpen?'Cerrar vista previa':'Revisar actividades propuestas'}</button>
   </div>:<p>La vinculación y generación requiere Gerencia, Dirección o Administración.</p>}
   {templateId&&!validStages&&<p role="status">Para generar el plan se necesitan seis etapas con correspondencia única. Los proyectos históricos se conservan; regulariza sus etapas antes de generar.</p>}
   {previewOpen&&linked&&<div style={{display:'grid',gap:12,marginTop:16}}>
    <p>{pending.length} actividades faltantes · {pending.filter(a=>selected.includes(Number(a.id))).length} seleccionadas. No se reemplazan actividades, tareas ni evidencias existentes.</p>
    <label><input type="checkbox" checked={pending.length>0&&pending.every(a=>selected.includes(Number(a.id)))} onChange={e=>setSelected(e.target.checked?pending.map(a=>Number(a.id)):[])}/> Seleccionar todas las propuestas</label>
    {preview.map(p=><fieldset key={p.stage.id} style={{border:'1px solid #dce5f1',borderRadius:10,padding:14}}><legend>{p.stage.stage_order}. {p.stage.title}</legend>
     <p>Destino: {p.target?.name??'Etapa pendiente'} · {p.stage.weight}% en la plantilla</p>
     {!p.pending.length&&<p>Sin actividades nuevas por incorporar.</p>}
     {p.pending.map(a=><label key={a.id} style={{display:'block',marginBottom:12}}><input type="checkbox" checked={selected.includes(Number(a.id))} onChange={e=>setSelected(old=>e.target.checked?[...old,Number(a.id)]:old.filter(id=>id!==Number(a.id)))}/> <strong>{a.title}</strong><small style={{display:'block'}}>Entregable: {a.deliverable||'Por definir'} · Aceptación: {a.acceptance_criteria||'Por definir'}</small><small style={{display:'block'}}>Responsable inicial: {workspace.members.find(m=>m.id===project.ownerId)?.name||'Por asignar'} · {p.target?.startDate||project.startDate} → {p.target?.dueDate||project.dueDate} · Origen: {chosen?.name} v{chosen?.version}</small></label>)}
    </fieldset>)}
    <button type="button" className="top-add-button" disabled={busy||!pending.some(a=>selected.includes(Number(a.id)))} onClick={incorporate}>Incorporar actividades seleccionadas</button>
   </div>}
  </>}
  {error&&<p role="alert" className="po-auth-error">{error}</p>}
 </section>;
}
