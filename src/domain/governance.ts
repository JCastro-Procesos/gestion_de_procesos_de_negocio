export type GovKind='Solicitud'|'Entregable'|'Cambio';
export type GovSeverity='Menor'|'Mayor'|'Crítico';
export type GovStatus='Pendiente'|'Aprobado'|'Rechazado'|'Devuelto';
export type ImplementationStatus='Pendiente'|'En curso'|'Implementado'|'Verificado';
export interface GovernanceItem {id:string;kind:GovKind;projectId:string|null;title:string;description:string;severity:GovSeverity;status:GovStatus;owner:string;ownerUserId:number|null;approverUserId:number|null;createdBy:number;reviewerName:string|null;comment:string;createdAt:string;updatedAt:string;dueDate:string|null;evidenceUrl:string;impactSummary:string;implementationStatus:ImplementationStatus;implementationNote:string;revision:number}
export interface GovernancePerson {id:number;name:string;reviewImpacts:GovSeverity[]}
export interface GovernanceEvent {revision?:number|null;id:number;itemId:string;action:string;actor:string;at:string;note:string;beforeStatus:string|null;afterStatus:string|null}
export interface GovernanceDraft {kind:GovKind;projectId:string;title:string;description:string;severity:GovSeverity;ownerUserId:string;approverUserId:string;dueDate:string;evidenceUrl:string;impactSummary:string}
export const emptyGovernanceDraft=():GovernanceDraft=>({kind:'Solicitud',projectId:'',title:'',description:'',severity:'Menor',ownerUserId:'',approverUserId:'',dueDate:'',evidenceUrl:'',impactSummary:''});
export const draftFromItem=(i:GovernanceItem):GovernanceDraft=>({kind:i.kind,projectId:i.projectId??'',title:i.title,description:i.description,severity:i.severity,ownerUserId:i.ownerUserId?String(i.ownerUserId):'',approverUserId:i.approverUserId?String(i.approverUserId):'',dueDate:i.dueDate??'',evidenceUrl:i.evidenceUrl??'',impactSummary:i.impactSummary??''});
export function localCalendarDate(now=new Date()):string{return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;}
export function governanceOverdue(i:GovernanceItem,today=localCalendarDate()):boolean{return !!i.dueDate&&i.dueDate<today&&i.status!=='Rechazado'&&!(i.status==='Aprobado'&&i.implementationStatus==='Verificado');}
export function governanceReviewer(i:GovernanceItem,uid:number,role:string):boolean{
 const level=({admin:5,direccion:4,gerencia:3,especialista:2,ingeniero:1} as Record<string,number>)[role]??0;
 return level>=(i.severity==='Menor'?3:4)&&Number(i.createdBy)!==uid&&Number(i.ownerUserId)!==uid&&(Number(i.approverUserId)===uid||role==='admin');
}
export function governanceCandidates(d:GovernanceDraft,creatorId:number,people:GovernancePerson[]):GovernancePerson[]{return people.filter(p=>p.reviewImpacts.includes(d.severity)&&Number(p.id)!==creatorId&&Number(p.id)!==Number(d.ownerUserId));}
export function governanceFormError(d:GovernanceDraft,creatorId:number,people:GovernancePerson[]):string{
 if(!d.title.trim()||!d.description.trim()||!d.ownerUserId||!d.dueDate)return 'Completa título, justificación, responsable, revisor y fecha compromiso.';
 if(d.ownerUserId===d.approverUserId||Number(d.approverUserId)===creatorId)return 'El revisor debe ser distinto del creador y del responsable.';
 if(!d.approverUserId&&governanceCandidates(d,creatorId,people).length)return 'Selecciona un revisor autorizado para el impacto.';
 const reviewer=people.find(p=>Number(p.id)===Number(d.approverUserId));if(d.approverUserId&&!reviewer?.reviewImpacts.includes(d.severity))return 'Selecciona un revisor autorizado para el impacto.';
 const date=new Date(d.dueDate+'T12:00:00Z');if(!/^\d{4}-\d{2}-\d{2}$/.test(d.dueDate)||!Number.isFinite(date.getTime())||date.toISOString().slice(0,10)!==d.dueDate)return 'Fecha compromiso inválida.';
 if(d.kind==='Cambio'&&!d.impactSummary.trim())return 'Describe el impacto del cambio en alcance, plazo, costo y riesgo.';
 if(d.kind==='Entregable'&&!d.evidenceUrl.trim())return 'Agrega evidencia del entregable.';
 if(d.evidenceUrl){try{const url=new URL(d.evidenceUrl);if(url.protocol!=='https:'||url.username||url.password)return 'Utiliza una evidencia HTTPS sin credenciales.';}catch{return 'Utiliza una URL HTTPS válida.'}}
 return '';
}
