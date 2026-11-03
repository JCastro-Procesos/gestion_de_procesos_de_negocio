import type {Project,Stage} from './model';
export const PROJECT_TYPE_WEIGHTS:Record<NonNullable<Project['planType']>,number[]>={
 'Tecnológico':[10,15,20,15,30,10],
 'Documentación':[10,30,30,15,10,5],
 'Optimización':[10,25,25,10,20,10]
};
const percent=(n:number)=>Number.isFinite(n)?Math.max(0,Math.min(100,n)):0;
export function officialStageProgress(stage:Stage):number{
 return stage.activities.length?stage.activities.reduce((sum,a)=>sum+percent(a.progress),0)/stage.activities.length:percent(stage.progress);
}
/** Six canonical stages use the project-type weights. Historical plans use equal weights. */
export function officialProjectProgress(stages:Stage[],type:Project['planType']='Optimización'):number{
 if(!stages.length)return 0;
 const canonical=stages.length===6&&[1,2,3,4,5,6].every(order=>stages.filter(s=>s.order===order).length===1);
 const weights=PROJECT_TYPE_WEIGHTS[type??'Optimización'];
 const total=stages.reduce((sum,s)=>sum+officialStageProgress(s)*(canonical?weights[s.order-1]:100/stages.length),0);
 return Math.round(total/100);
}
