/** Progreso hacia la meta: 0% en línea base, 100% al alcanzar meta.
 * Un indicador sin medición no es 0%: es null.
 * Compatible con metas crecientes y decrecientes. */
export function kpiProgress(baseline:number,target:number,actual:number|null):number|null {
 if(actual===null||![baseline,target,actual].every(Number.isFinite)||baseline===target)return null;
 const progress=(actual-baseline)/(target-baseline)*100;
 return Math.min(100,Math.max(0,progress));
}
export function aggregateKpiProgress(progresses:readonly (number|null)[]):number|null {
 const measured=progresses.filter((p):p is number=>p!==null&&Number.isFinite(p));
 return measured.length?measured.reduce((sum,p)=>sum+p,0)/measured.length:null;
}
