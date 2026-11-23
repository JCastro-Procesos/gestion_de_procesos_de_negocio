import type {Workspace,Project,RaidItem} from './model';
import type {GovernanceItem} from './governance';
import {governanceOverdue,localCalendarDate} from './governance';
import {projectProgress} from './metrics';
export const automationRules=[
 {id:'taskDue',name:'Vencimientos de tareas',detail:'Tareas abiertas vencidas o próximas a su fecha compromiso.'},
 {id:'activityDue',name:'Actividades y entregables',detail:'Actividades abiertas próximas o vencidas por etapa.'},
 {id:'blocker',name:'Bloqueos',detail:'Proyectos, etapas y actividades bloqueadas.'},
 {id:'dependency',name:'Dependencias pendientes',detail:'Tareas próximas o en ejecución con predecesoras sin completar o inexistentes.'},
 {id:'raid',name:'Riesgos y decisiones',detail:'RAID abierto de impacto alto/crítico o con compromiso vencido.'},
 {id:'projectDue',name:'Fechas de proyectos',detail:'Fecha objetivo próxima o vencida en proyectos activos.'},
 {id:'capacity',name:'Carga de los próximos siete días',detail:'Horas estimadas pendientes de tareas con fecha hasta hoy + 6 días, incluidas vencidas, frente a capacidad semanal.'},
 {id:'governance',name:'Revisiones y compromisos de Gobierno',detail:'Pendientes sin revisor, devoluciones, vencimientos y resultados por verificar.'},
 {id:'forecast',name:'Señales de retraso',detail:'Puntaje explicable por tareas vencidas, bloqueos, RAID crítico, fecha de proyecto y semáforo.'},
 {id:'missingOwner',name:'Asignaciones incompletas',detail:'Tareas y actividades abiertas sin responsable disponible en el equipo.'}
] as const;
export type AutomationRuleId=typeof automationRules[number]['id'];
export type AutomationSettings={version:1;warningDays:number;capacityPercent:number;enabled:Record<AutomationRuleId,boolean>};
export const defaultAutomationSettings=():AutomationSettings=>({version:1,warningDays:7,capacityPercent:125,enabled:Object.fromEntries(automationRules.map(r=>[r.id,true])) as Record<AutomationRuleId,boolean>});
export function automationSettingsError(value:unknown):string{
 const v=value as AutomationSettings;if(!v||v.version!==1||!Number.isInteger(v.warningDays)||v.warningDays<1||v.warningDays>30||!Number.isInteger(v.capacityPercent)||v.capacityPercent<100||v.capacityPercent>200||!v.enabled||Object.keys(v.enabled).length!==automationRules.length||automationRules.some(r=>typeof v.enabled[r.id]!=='boolean'))return 'Revisa anticipación (1–30 días), capacidad (100–200%) y reglas.';return '';
}
export function automationSettingsFor(w:Workspace):AutomationSettings{return w.automationSettings&&!automationSettingsError(w.automationSettings)?w.automationSettings:defaultAutomationSettings()}
export function validDate(s:string|undefined|null):s is string{if(!s||!/^\d{4}-\d{2}-\d{2}$/.test(s))return false;const t=new Date(s+'T12:00:00Z');return Number.isFinite(t.getTime())&&t.toISOString().slice(0,10)===s;}
export const addCalendarDays=(date:string,n:number):string=>{const d=new Date(date+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10)};
export const dateDistance=(a:string,b:string):number=>Math.round((Date.parse(b+'T12:00:00Z')-Date.parse(a+'T12:00:00Z'))/86400000);
export type FollowUpAlert={id:string;rule:AutomationRuleId;level:'Crítica'|'Alta'|'Media';category:string;projectId:string;title:string;reason:string;action:string;dueDate?:string;ownerId?:string;taskId?:string;stageId?:string;governanceId?:string;raidId?:string;fingerprint:string};
export interface Forecast {project:Project;progress:number;overdue:number;remaining:number;score:number;risk:'Alto'|'Medio'|'Bajo';reasons:string[]}
const remaining=(estimated:number,actual:number)=>Math.max(0,(Number.isFinite(estimated)?estimated:0)-(Number.isFinite(actual)?actual:0));
export function automationForecast(w:Workspace,today=localCalendarDate()):Forecast[]{return w.projects.filter(p=>p.status!=='Completado').map(p=>{
 const tasks=w.tasks.filter(t=>t.projectId===p.id&&t.status!=='Completado');const overdue=tasks.filter(t=>validDate(t.dueDate)&&t.dueDate<today).length;const reasons:string[]=[];let score=0;
 if(overdue){score+=Math.min(50,overdue*15);reasons.push(`${overdue} tareas vencidas (+${Math.min(50,overdue*15)})`)}
 const blocked=p.status==='Bloqueado'||w.stages.some(s=>s.projectId===p.id&&(s.status==='Bloqueada'||s.activities.some(a=>a.status==='Bloqueada')));
 if(blocked){score+=30;reasons.push('Bloqueo activo (+30)')}
 if(w.raids.some(r=>r.projectId===p.id&&r.status!=='Cerrado'&&r.severity==='Crítica')){score+=25;reasons.push('RAID crítico abierto (+25)')}
 if(validDate(p.dueDate)&&p.dueDate<today){score+=25;reasons.push('Fecha de proyecto vencida (+25)')}
 if(p.semaforo!=='Verde'){const n=p.semaforo==='Rojo'?20:10;score+=n;reasons.push(`Semáforo ${p.semaforo.toLowerCase()} (+${n})`)}
 score=Math.min(100,score);return {project:p,progress:projectProgress(p.id, w.stages, p.planType),overdue,remaining:tasks.reduce((n,t)=>n+remaining(t.estimatedHours,t.actualHours),0),score,risk:score>=60?'Alto' as const:score>=25?'Medio' as const:'Bajo' as const,reasons};
 }).sort((a,b)=>b.score-a.score||a.project.id.localeCompare(b.project.id));}
export function automationAlerts(w:Workspace,governance:GovernanceItem[]=[],today=localCalendarDate(),settings=automationSettingsFor(w)):FollowUpAlert[]{
 const out:FollowUpAlert[]=[];const active=new Map(w.projects.filter(p=>p.status!=='Completado').map(p=>[p.id,p]));const members=new Set(w.members.map(m=>m.id));
 const add=(rule:AutomationRuleId,id:string,rest:Omit<FollowUpAlert,'id'|'rule'|'fingerprint'>)=>{if(!settings.enabled[rule])return;const key=rule+':'+id;out.push({id:key,rule,...rest,fingerprint:JSON.stringify([key,rest.title,rest.reason,rest.level,rest.dueDate,rest.ownerId])})};
 const due=(rule:AutomationRuleId,id:string,title:string,date:string,projectId:string,extra:Partial<FollowUpAlert>={})=>{if(!validDate(date))return;const n=dateDistance(today,date);if(n>settings.warningDays)return;add(rule,id,{projectId,title,category:rule==='projectDue'?'Proyecto':'Vencimiento',level:n<0?'Crítica':n<=2?'Alta':'Media',dueDate:date,reason:n<0?`Vencido hace ${-n} días.`:n===0?'Compromiso para hoy.':`Compromiso en ${n} días.`,action:'Confirmar avance, responsable y fecha.',...extra})};
 w.tasks.filter(t=>active.has(t.projectId)&&t.status!=='Completado').forEach(t=>{
  due('taskDue',t.id,'Tarea: '+t.title,t.dueDate,t.projectId,{taskId:t.id,stageId:t.stageId,ownerId:t.assigneeId});
  if(!members.has(t.assigneeId))add('missingOwner','task:'+t.id,{projectId:t.projectId,taskId:t.id,stageId:t.stageId,title:'Asignar responsable: '+t.title,category:'Asignación',level:'Alta',reason:'La tarea no tiene un responsable disponible en el equipo.',action:'Asignar responsable en la tarea.'});
  const deps=(t.blockedByTaskIds??[]).map(id=>w.tasks.find(x=>x.id===id));if(deps.length&&(t.status!=='Por Hacer'||validDate(t.startDate)&&t.startDate<=addCalendarDays(today,settings.warningDays))&&deps.some(x=>!x||x.status!=='Completado'))add('dependency',t.id,{projectId:t.projectId,taskId:t.id,stageId:t.stageId,ownerId:t.assigneeId,title:'Dependencia pendiente: '+t.title,category:'Dependencia',level:'Alta',reason:deps.filter(x=>!x||x.status!=='Completado').map(x=>x?.title??'Predecesora no disponible').join(' · '),action:'Revisar predecesoras antes de continuar.'});
 });
 w.stages.filter(s=>active.has(s.projectId)&&s.status!=='Completada').forEach(s=>{
  if(s.status==='Bloqueada')add('blocker','stage:'+s.id,{projectId:s.projectId,stageId:s.id,title:'Etapa bloqueada: '+s.name,category:'Bloqueo',level:'Crítica',reason:'La etapa permanece bloqueada.',action:'Revisar causa y respuesta en Riesgos y decisiones.'});
  s.activities.filter(a=>a.status!=='Completada').forEach(a=>{
   due('activityDue',s.id+':'+a.id,'Actividad: '+a.name,a.dueDate,s.projectId,{stageId:s.id,ownerId:a.ownerId});
   if(a.status==='Bloqueada')add('blocker','activity:'+s.id+':'+a.id,{projectId:s.projectId,stageId:s.id,title:'Actividad bloqueada: '+a.name,category:'Bloqueo',level:'Crítica',reason:'La actividad está marcada como Bloqueada.',action:'Revisar el registro de bloqueo en Riesgos y decisiones.'});
   if(!members.has(a.ownerId))add('missingOwner','activity:'+s.id+':'+a.id,{projectId:s.projectId,stageId:s.id,title:'Asignar responsable: '+a.name,category:'Asignación',level:'Alta',reason:'La actividad no tiene responsable disponible.',action:'Asignar un responsable en el proyecto.'});
  });
 });
 active.forEach(p=>{due('projectDue',p.id,'Proyecto: '+p.name,p.dueDate,p.id,{ownerId:p.ownerId});if(p.status==='Bloqueado')add('blocker','project:'+p.id,{projectId:p.id,title:'Proyecto bloqueado: '+p.name,category:'Bloqueo',level:'Crítica',reason:p.blockerReason||'El proyecto está marcado como Bloqueado.',action:'Validar desbloqueo y respuesta RAID.'})});
 w.raids.filter(r=>active.has(r.projectId)&&r.status!=='Cerrado').forEach(r=>{const late=validDate(r.dueDate)&&r.dueDate<today;if(late||['Crítica','Alta'].includes(r.severity))add('raid',r.id,{projectId:r.projectId,raidId:r.id,ownerId:r.ownerId,title:r.type+': '+r.description,category:r.type==='Decisión'?'Decisión':'RAID',level:late||r.severity==='Crítica'?'Crítica':'Alta',dueDate:validDate(r.dueDate)?r.dueDate:undefined,reason:late?'La respuesta o decisión tiene fecha vencida.':'RAID abierto de impacto '+r.severity.toLowerCase()+'.',action:'Actualizar respuesta, responsable y compromiso.'})});
 w.members.forEach(m=>{const tasks=w.tasks.filter(t=>active.has(t.projectId)&&t.status!=='Completado'&&t.assigneeId===m.id&&validDate(t.dueDate)&&t.dueDate<=addCalendarDays(today,6));const demand=tasks.reduce((n,t)=>n+remaining(t.estimatedHours,t.actualHours),0);if(m.capacityHours>0&&demand>m.capacityHours*settings.capacityPercent/100)add('capacity',m.id,{projectId:'',ownerId:m.id,title:'Carga próxima: '+m.name,category:'Capacidad',level:'Alta',reason:`${demand.toFixed(1)} h pendientes con fecha hasta ${addCalendarDays(today,6)} frente a ${m.capacityHours} h de capacidad semanal. Incluye vencidas; excluye tareas sin fecha.`,action:'Redistribuir carga o acordar nuevos compromisos.'})});
 governance.filter(g=>g.status!=='Rechazado'&&!(g.status==='Aprobado'&&g.implementationStatus==='Verificado')).forEach(g=>{
  const late=governanceOverdue(g,today);let reason='';if(!g.approverUserId&&g.status==='Pendiente')reason='Pendiente de asignar revisor independiente.';else if(g.status==='Devuelto')reason='Requiere corregir y reenviar la ficha.';else if(g.status==='Aprobado'&&g.implementationStatus==='Implementado')reason='Implementación pendiente de verificación independiente.';else if(late)reason='Compromiso de Gobierno vencido.';else if(validDate(g.dueDate)&&dateDistance(today,g.dueDate)<=settings.warningDays)reason='Revisión o ejecución próxima a su compromiso.';
  if(reason)add('governance',g.id,{projectId:g.projectId??'',governanceId:g.id,title:'Gobierno: '+g.title,category:'Gobierno',dueDate:validDate(g.dueDate)?g.dueDate:undefined,level:late?'Crítica':'Alta',reason:reason+(late&&!reason.includes('vencido')?' Compromiso vencido.':''),action:'Abrir ficha de Gobierno y registrar el siguiente paso.'});
 });
 automationForecast(w,today).filter(f=>f.risk!=='Bajo').forEach(f=>add('forecast',f.project.id,{projectId:f.project.id,title:'Señal de retraso: '+f.project.name,category:'Seguimiento',level:f.risk==='Alto'?'Alta':'Media',reason:`${f.score}/100: ${f.reasons.join('; ')}.`,action:'Revisar bloqueos, fechas y responsables; este puntaje no es una probabilidad.'}));
 return out.sort((a,b)=>({Crítica:0,Alta:1,Media:2}[a.level]-{Crítica:0,Alta:1,Media:2}[b.level])||(a.dueDate??'9999').localeCompare(b.dueDate??'9999')||a.id.localeCompare(b.id));
}
export interface PersonalAlertState {fingerprint:string;read?:boolean;snoozedUntil?:string}
export type PersonalAlerts=Record<string,PersonalAlertState>;
export function alertIsSnoozed(a:FollowUpAlert,state:PersonalAlerts,today:string):boolean{const s=state[a.id];return s?.fingerprint===a.fingerprint&&validDate(s.snoozedUntil)&&s.snoozedUntil>today;}
export function alertIsRead(a:FollowUpAlert,state:PersonalAlerts):boolean{return state[a.id]?.fingerprint===a.fingerprint&&!!state[a.id]?.read;}
export function weeklyBrief(w:Workspace,governance:GovernanceItem[],alerts:FollowUpAlert[],today=localCalendarDate(),projectId=''):string{
 const weekday=new Date(today+'T12:00:00Z').getUTCDay();const start=addCalendarDays(today,-((weekday+6)%7)),end=addCalendarDays(start,6);
 const projects=w.projects.filter(p=>!projectId||p.id===projectId);const selected=new Set(projects.map(p=>p.id));const pending=w.tasks.filter(t=>selected.has(t.projectId)&&t.status!=='Completado'&&projects.find(p=>p.id===t.projectId)?.status!=='Completado');
 const scoped=alerts.filter(a=>!projectId||a.projectId===projectId);
 return ['PROCESSONE · RESUMEN SEMANAL',`Semana ${start} a ${end} · Corte ${today}`,projectId?'Proyecto: '+(projects[0]?.name??'No disponible'):'Portafolio completo','',`${projects.length} proyectos · ${projects.filter(p=>p.status!=='Completado').length} activos · ${pending.length} tareas pendientes`,`${scoped.length} alertas detectadas · ${scoped.filter(a=>a.level==='Crítica').length} críticas`,'','PRIORIDADES',...(scoped.length?scoped.slice(0,15).map(a=>`[${a.level}] ${a.title}\nMotivo: ${a.reason}\nSiguiente paso: ${a.action}`):['Sin alertas con las reglas activas.']),'','COMPROMISOS ABIERTOS CON FECHA ESTA SEMANA',...pending.filter(t=>validDate(t.dueDate)&&t.dueDate>=start&&t.dueDate<=end).map(t=>`${t.dueDate} · ${t.title} · ${w.members.find(m=>m.id===t.assigneeId)?.name??'Sin responsable'}`),'','GOBIERNO',...governance.filter(g=>(!projectId||g.projectId===projectId)&&g.status!=='Rechazado'&&!(g.status==='Aprobado'&&g.implementationStatus==='Verificado')).map(g=>`${g.title} · ${g.status} · ${g.implementationStatus??'Pendiente'} · compromiso ${g.dueDate||'sin fecha'}`),'','Situación actual, no historial de cambios de la semana. No se infieren avances ni logros no registrados. Puntajes basados en reglas; no son probabilidades ni fechas pronosticadas.'].join('\n');
}
export function followUpFromAlert(a:FollowUpAlert,ownerId:string,dueDate:string,note:string,now=new Date().toISOString()):RaidItem{return {id:crypto.randomUUID(),automationKey:a.id,automationFingerprint:a.fingerprint,projectId:a.projectId,type:'Riesgo',severity:a.level==='Crítica'?'Crítica':'Alta',description:'Seguimiento: '+a.title,ownerId,dueDate,status:'Abierto',response:note,createdAt:now,relatedTaskId:a.taskId,relatedStageId:a.stageId};}
