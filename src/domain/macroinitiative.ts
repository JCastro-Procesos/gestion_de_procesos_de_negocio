export type MacroStatus='Planeada'|'En ejecución'|'Completada'|'En riesgo';
export interface MacroProfile {
 code:string;strategicAlignment:string;problemStatement:string;expectedBenefit:string;scopeText:string;exclusions:string;department:string;
 sponsorUserId:number|null;processOwnerUserId:number|null;cellId:number|null;startDate:string;targetDate:string;priority:'Baja'|'Media'|'Alta'|'Crítica';
 successCriteria:string;measurementPlan:string;resources:string;risks:string;dependencies:string;reviewFrequency:string;estimatedBudget:string;currency:string;
}
export interface MacroInitiative {id:number;title:string;objective:string;status:MacroStatus;owner_id:number|null;project_ids:string|null;created_at:string;profile?:MacroProfile}
export const emptyMacroProfile=():MacroProfile=>({code:'',strategicAlignment:'',problemStatement:'',expectedBenefit:'',scopeText:'',exclusions:'',department:'',sponsorUserId:null,processOwnerUserId:null,cellId:null,startDate:'',targetDate:'',priority:'Media',successCriteria:'',measurementPlan:'',resources:'',risks:'',dependencies:'',reviewFrequency:'Mensual',estimatedBudget:'',currency:'MXN'});
export function validateMacroProfile(profile:MacroProfile):string{
 for(const [key,label] of [['strategicAlignment','alineación estratégica'],['problemStatement','problema u oportunidad'],['expectedBenefit','beneficio esperado'],['scopeText','alcance'],['department','área responsable'],['successCriteria','criterio de éxito'],['measurementPlan','plan de medición']] as const)if(!profile[key].trim())return 'Completa '+label+'.';
 if(!profile.sponsorUserId||!profile.processOwnerUserId)return 'Asigna patrocinador y responsable de resultados.';
 const date=(value:string)=>{if(!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;const d=new Date(value+'T12:00:00Z');return Number.isFinite(d.getTime())&&d.toISOString().slice(0,10)===value};
 if(!date(profile.startDate)||!date(profile.targetDate)||profile.targetDate<profile.startDate)return 'Indica fechas válidas; la meta no puede ser anterior al inicio.';
 if(profile.code&&!/^[A-Za-z0-9_-]{2,32}$/.test(profile.code))return 'Código: utiliza de 2 a 32 caracteres alfanuméricos, guiones o guion bajo.';
 if(profile.estimatedBudget!==''&&(!Number.isFinite(Number(profile.estimatedBudget))||Number(profile.estimatedBudget)<0))return 'El presupuesto estimado debe ser un número no negativo.';
 return '';
}
