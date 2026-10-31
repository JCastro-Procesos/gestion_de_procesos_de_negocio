import {useEffect,useState} from 'react';
import type {Project,Workspace} from '../../domain/model';
import {catalogFor,proposeProjectPlan,projectStageNames,methodsForMacro} from '../../domain/alignment';
import {useCurrentUser,canManageMethodology} from '../../data/useCurrentUser';
import {api} from '../../data/processoneApi';
export function ProjectWorkPlanPanel({project,workspace,onApplyPlan}:{project:Project;workspace:Workspace;onApplyPlan:(projectId:string,keys:string[])=>void}){
 const user=useCurrentUser();const canEdit=canManageMethodology(user);
 const catalog=catalogFor(workspace),method=catalog.methodologies.find(m=>m.id===project.methodologyId);
 const proposals=proposeProjectPlan(project,workspace.stages,catalog);
 const [selected,setSelected]=useState<string[]>([]),[open,setOpen]=useState(false),[kpis,setKpis]=useState<{id:number;initiative_id:number;name:string;baseline:string;target:string;unit:string}[]>([]),[kpiError,setKpiError]=useState('');
 const stages=workspace.stages.filter(s=>s.projectId===project.id);
 const aligned=methodsForMacro(catalog,project.initiativeId).some(m=>m.id===project.methodologyId);
 const valid=stages.length===6&&[1,2,3,4,5,6].every(n=>stages.filter(s=>s.order===n).length===1);
 useEffect(()=>{setSelected([]);setOpen(false)},[project.id,project.initiativeId,project.methodologyId,workspace.alignmentCatalog]);
 useEffect(()=>{let active=true;setKpis([]);setKpiError('');void api<{kpis:typeof kpis}>('initiative_kpis_v12').then(r=>{if(active)setKpis(r.kpis)}).catch(e=>{if(active)setKpiError(String(e))});return()=>{active=false}},[project.initiativeId]);
 return <section className="itm-planning-panel"><h3>Plan integrado del proyecto</h3><p>Macroiniciativa principal + {method?.name??'Metodología pendiente'} → seis etapas → actividades y entregables.</p>
  {!project.initiativeId&&<p role="status">Vincula una macroiniciativa principal desde el encabezado o Editar proyecto para generar el plan integrado.</p>}
  <p>{proposals.length} actividades nuevas propuestas. Cambiar el catálogo no reemplaza el trabajo registrado.</p>
  {!aligned&&<p role="status">La metodología actual no está entre las vinculadas a la macroiniciativa. Revisa Editar proyecto antes de generar actividades.</p>}
  {!valid&&<p role="status">Este proyecto requiere regularizar sus seis etapas antes de incorporar actividades. Sus registros históricos se conservan.</p>}
  {canEdit?<button className="top-add-button" type="button" disabled={!valid||!aligned||!project.initiativeId||!method} onClick={()=>{setOpen(!open);setSelected([])}}>{open?'Cerrar vista previa':'Revisar y seleccionar actividades'}</button>:<p>La incorporación requiere Gerencia, Dirección o Administración.</p>}
  {open&&<div className="po-catalog-editor"><label><input type="checkbox" checked={proposals.length>0&&proposals.every(p=>selected.includes(p.key))} onChange={e=>setSelected(e.target.checked?proposals.map(p=>p.key):[])}/> Seleccionar todas las propuestas</label>
   {projectStageNames.map((name,i)=><fieldset key={name}><legend>{i+1}. {name}</legend>{proposals.filter(p=>p.stageOrder===i+1).map(p=><label className="po-plan-proposal" key={p.key}><span><input type="checkbox" checked={selected.includes(p.key)} onChange={e=>setSelected(old=>e.target.checked?[...old,p.key]:old.filter(k=>k!==p.key))}/> <strong>{p.title}</strong></span><small>Origen: {p.sourceNames.join(' + ')}</small><small>Entregable: {p.deliverable}</small><small>Aceptación: {p.acceptanceCriteria}</small><small>Responsable inicial: {workspace.members.find(m=>m.id===project.ownerId)?.name||'Por asignar'} · Duración referencial: {p.estimatedDays||'Por estimar'} días</small></label>)}{!proposals.some(p=>p.stageOrder===i+1)&&<p>Sin actividades nuevas.</p>}</fieldset>)}
   <button type="button" className="top-add-button" disabled={!selected.some(k=>proposals.some(p=>p.key===k))} onClick={()=>{onApplyPlan(project.id,selected);setSelected([]);setOpen(false)}}>Incorporar actividades seleccionadas</button>
  </div>}
  <details className="po-alignment-details"><summary>KPIs relacionados y criterios de éxito</summary><h4>Macroiniciativa</h4>{kpiError?<p role="alert">No fue posible cargar los KPIs: {kpiError}</p>:kpis.filter(k=>Number(k.initiative_id)===Number(project.initiativeId)).map(k=><p key={k.id}>{k.name} · Base: {k.baseline} · Meta: {k.target} {k.unit}</p>)}{!kpiError&&!kpis.some(k=>Number(k.initiative_id)===Number(project.initiativeId))&&<p>Sin KPIs registrados en la macroiniciativa.</p>}<h4>Metodología de trabajo · indicadores de referencia</h4>{method?.kpis.map(k=><p key={k.id}><strong>{k.name}</strong> · Base: {k.baseline??'Por medir'} · Meta: {k.target??'Por definir'} {k.unit}<small style={{display:'block'}}>{k.formula} · {k.frequency}</small></p>)}<p>Objetivo del proyecto: {project.goal||'Por definir'}. La ejecución de actividades y el impacto de los KPIs se revisan por separado.</p></details>
 </section>;
}
