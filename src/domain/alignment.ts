import {METHODOLOGIES, CORPORATE_STAGE_BLUEPRINT} from './methodologies';
import type {Activity, Project, Stage, Workspace} from './model';
import {deriveStageFromActivities} from './activityProgress';

export interface PlanActivity {id:string;title:string;deliverable:string;acceptanceCriteria:string;stageOrder:number;estimatedDays:number;suggestedRole:string}
export interface PlanKpi {id:string;name:string;unit:string;direction:'increase'|'decrease';baseline:number|null;target:number|null;frequency:string;formula:string;source:string}
export interface WorkMethod {id:number;name:string;description:string;version:number;outputs:string[];activities:PlanActivity[];kpis:PlanKpi[]}
export interface AlignmentCatalog {version:1;methodologies:WorkMethod[];macroMethodologyIds?:Record<string,number[]>;macroActivities:Record<string,PlanActivity[]>}
export const VALIDATED_CONTENT:Record<number,string[]>={
 1:['Inventario / Catálogo Maestro de Procesos','Arquitectura y taxonomía de procesos','Dueños de proceso','Matriz Corporativo vs. UDN','RACI de procesos','Evaluación de madurez de procesos','KPIs asociados a procesos','Control de versiones y cambios'],
 2:['Registro AS-IS','Diseño TO-BE','Diagramas BPMN','Identificación de oportunidades de mejora','Matriz de priorización','Requerimientos funcionales','Matriz de impactos','Riesgos y controles del proceso','Beneficios esperados y obtenidos','Registro de mejoras implementadas'],
 3:['Inventario / Portafolio de iniciativas','Pipeline de proyectos','Priorización de iniciativas','Matriz de dependencias','RAID Log (riesgos, acciones, issues y dependencias)','RACI de iniciativas','Registro de decisiones','Control de entregables e hitos','Matriz Proyecto x Proceso','Seguimiento de beneficios'],
 4:['Matriz Procesos x Sistemas','Sistemas que soportan cada proceso','Flujos / dependencias de información','Integraciones entre sistemas','Nivel de automatización','Procesos candidatos a automatización','Requerimientos tecnológicos derivados del proceso','Relación Proceso x Sistema x Iniciativa','Impactos de cambios tecnológicos sobre procesos'],
 5:['Plan de trabajo DIPP','Backlog / registro de solicitudes','Priorización de demanda','Capacidad y carga de trabajo del equipo','Seguimiento de proyectos e iniciativas asignadas a DIPP','KPIs / OKRs de DIPP','Dashboard ejecutivo DIPP','Cumplimiento de objetivos y entregables','Registro de temas críticos y escalaciones']
};
const STAGE_MAP:Record<number,number[]>={1:[2,3,1,2,3,2,6,6],2:[2,3,2,2,2,3,3,3,6,5],3:[1,1,1,3,2,1,4,5,2,6],4:[2,2,2,3,2,3,3,3,3],5:[1,1,1,1,5,3,5,6,5]};
const KPI_SUGGESTIONS:Record<number,[string,string,'increase'|'decrease',string][]>= {
 1:[['Procesos con dueño y RACI definidos','%','increase','Procesos con dueño y RACI / procesos inventariados × 100'],['Procesos con documentación vigente','%','increase','Procesos con documentación vigente / procesos documentados × 100']],
 2:[['Tiempo de ciclo del proceso','días','decrease','Suma de tiempos de ciclo / casos medidos'],['Tasa de retrabajo','%','decrease','Casos con retrabajo / casos procesados × 100']],
 3:[['Hitos cumplidos en fecha','%','increase','Hitos cumplidos en fecha / hitos comprometidos × 100'],['Beneficios verificados','%','increase','Beneficios verificados / beneficios comprometidos × 100']],
 4:[['Procesos con soporte tecnológico identificado','%','increase','Procesos con sistemas identificados / procesos evaluados × 100'],['Pasos automatizados','%','increase','Pasos automatizados / pasos evaluados × 100']],
 5:[['Entregables aceptados en fecha','%','increase','Entregables aceptados en fecha / entregables comprometidos × 100'],['Carga frente a capacidad','%','decrease','Horas comprometidas / horas disponibles × 100']]
};
export function defaultAlignmentCatalog():AlignmentCatalog{
 return {version:1,macroActivities:{},macroMethodologyIds:{},methodologies:METHODOLOGIES.map(m=>({id:m.id,name:m.name,description:m.description,version:1,outputs:[...VALIDATED_CONTENT[m.id]],
 activities:VALIDATED_CONTENT[m.id].map((title,i)=>({id:'method-'+m.id+'-activity-'+(i+1),title,deliverable:title,acceptanceCriteria:'Entregable revisado por el responsable y evidencia documentada.',stageOrder:STAGE_MAP[m.id][i],estimatedDays:0,suggestedRole:''})),
 kpis:KPI_SUGGESTIONS[m.id].map(([name,unit,direction,formula],i)=>({id:'method-'+m.id+'-kpi-'+i,name,unit,direction,formula,baseline:null,target:null,frequency:'Mensual',source:''}))}))};
}
export function catalogFor(workspace:Workspace):AlignmentCatalog{return workspace.alignmentCatalog??defaultAlignmentCatalog()}
export function methodsForMacro(catalog:AlignmentCatalog,id:number|null|undefined):WorkMethod[]{const assigned=catalog.macroMethodologyIds?.[String(id)];return assigned?.length?catalog.methodologies.filter(m=>assigned.includes(m.id)):catalog.methodologies}
export interface PlanProposal extends PlanActivity {key:string;sources:string[];sourceNames:string[];kind:'Metodología'|'Macroiniciativa';sourceId:number;version:number}
const normalized=(s:string)=>s.trim().toLocaleLowerCase();
export function proposeProjectPlan(project:Project,stages:Stage[],catalog:AlignmentCatalog):PlanProposal[]{
 const method=catalog.methodologies.find(m=>m.id===project.methodologyId);
 const candidates:PlanProposal[]=[...(catalog.macroActivities[String(project.initiativeId)]??[]).map(a=>({...a,key:'macro:'+project.initiativeId+':'+a.id,sources:['macro:'+project.initiativeId+':'+a.id],sourceNames:['Macroiniciativa'],kind:'Macroiniciativa' as const,sourceId:Number(project.initiativeId),version:1})),...(method?.activities??[]).map(a=>({...a,key:'method:'+method!.id+':'+a.id,sources:['method:'+method!.id+':'+a.id],sourceNames:[method!.name+' · v'+method!.version],kind:'Metodología' as const,sourceId:method!.id,version:method!.version}))];
 const merged=new Map<string,PlanProposal>();
 for(const a of candidates){if(!a.title.trim()||!Number.isInteger(a.stageOrder)||a.stageOrder<1||a.stageOrder>6)continue;const signature=a.stageOrder+':'+normalized(a.title);const old=merged.get(signature);if(old){old.sources.push(...a.sources);old.sourceNames.push(...a.sourceNames);old.deliverable=[...new Set([old.deliverable,a.deliverable].filter(Boolean))].join(' | ');old.acceptanceCriteria=[...new Set([old.acceptanceCriteria,a.acceptanceCriteria].filter(Boolean))].join(' | ')}else merged.set(signature,{...a,sources:[...a.sources],sourceNames:[...a.sourceNames]})}
 const existing=stages.filter(s=>s.projectId===project.id).flatMap(s=>s.activities.map(a=>({stage:s.order,activity:a})));
 return [...merged.values()].filter(p=>!existing.some(({stage,activity})=>(stage===p.stageOrder&&normalized(activity.name)===normalized(p.title))||(activity.origin?.sourceKeys??[]).some(k=>p.sources.includes(k))));
}
export function incorporateProjectPlan(project:Project,stages:Stage[],catalog:AlignmentCatalog,keys:readonly string[]):Stage[]{
 const proposals=proposeProjectPlan(project,stages,catalog).filter(p=>keys.includes(p.key));
 return stages.map(stage=>{if(stage.projectId!==project.id)return stage;const additions=proposals.filter(p=>p.stageOrder===stage.order);if(!additions.length)return stage;
 const activities:Activity[]=additions.map(p=>({id:'activity-'+crypto.randomUUID(),name:p.title,deliverable:p.deliverable,acceptanceCriteria:p.acceptanceCriteria,estimatedDays:p.estimatedDays,ownerId:project.ownerId,startDate:stage.startDate||project.startDate,dueDate:stage.dueDate||project.dueDate,status:'Por iniciar',progress:0,origin:{kind:p.kind,templateId:p.sourceId,version:p.version,activityId:p.id,incorporatedAt:new Date().toISOString(),sourceKeys:p.sources,sourceNames:p.sourceNames}}));
 return deriveStageFromActivities({...stage,activities:[...stage.activities,...activities]});
 });
}
export const projectStageNames=CORPORATE_STAGE_BLUEPRINT.map(s=>s.name);
