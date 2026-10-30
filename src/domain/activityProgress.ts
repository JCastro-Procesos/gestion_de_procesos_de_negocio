import type {Activity,Stage,StageStatus} from './model';
/** A workflow state determines a default percentage; completion is the only 100% state. */
export function progressForActivityStatus(status:StageStatus):number{
 switch(status){case 'Por iniciar':return 0;case 'En curso':return 50;case 'En revisión':return 90;case 'Completada':return 100;case 'Bloqueada':return 0;default:return 0}
}
export function deriveStageFromActivities(stage:Stage):Stage{
 const items:Activity[]=stage.activities;
 if(!items.length)return stage;
 const progress=Math.round(items.reduce((sum,a)=>sum+Math.max(0,Math.min(100,a.progress)),0)/items.length);
 const status:StageStatus=items.every(a=>a.status==='Completada')?'Completada':items.some(a=>a.status==='Bloqueada')?'Bloqueada':items.some(a=>a.status==='En revisión')?'En revisión':items.every(a=>a.status==='Por iniciar')?'Por iniciar':'En curso';
 return {...stage,progress,status};
}
