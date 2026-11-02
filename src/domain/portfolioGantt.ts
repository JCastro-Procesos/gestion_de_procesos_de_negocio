import type {Workspace,Project,Stage} from './model';
import {validDate,addCalendarDays,dateDistance} from './automation';
import {localCalendarDate} from './governance';
export const ganttStageColors=['#aeb6c4','#35a7d4','#eda987','#ab86ce','#3ec76a','#258f89'];
export type DateInterval={start:string;end:string};
export function ganttInterval(start:string,end:string):DateInterval|null{return validDate(start)&&validDate(end)&&end>=start?{start,end}:null;}
export function ganttPosition(interval:DateInterval,start:string,end:string):{left:number;width:number;clippedStart:boolean;clippedEnd:boolean}|null{
 if(interval.end<start||interval.start>end)return null;const total=dateDistance(start,end)+1;const a=interval.start<start?start:interval.start,b=interval.end>end?end:interval.end;
 return {left:dateDistance(start,a)/total*100,width:(dateDistance(a,b)+1)/total*100,clippedStart:interval.start<start,clippedEnd:interval.end>end};
}
export function ganttMonths(start:string,count:number):{start:string;end:string;label:string}[]{const d=new Date(start+'T12:00:00Z');d.setUTCDate(1);return Array.from({length:count},(_,i)=>{const a=new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth()+i,1,12)),b=new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth()+i+1,0,12));return {start:a.toISOString().slice(0,10),end:b.toISOString().slice(0,10),label:a.toLocaleDateString('es-MX',{month:'short',year:'numeric',timeZone:'UTC'})}})}
export function ganttWeeks(start:string,end:string):{start:string;end:string;label:string}[]{const result=[];let day=start;while(day<=end){const weekday=new Date(day+'T12:00:00Z').getUTCDay();let last=addCalendarDays(day,weekday===0?0:7-weekday);if(last>end)last=end;result.push({start:day,end:last,label:day.slice(8,10)+'/'+day.slice(5,7)});day=addCalendarDays(last,1)}return result;}
export interface GanttStage {stage:Stage;interval:DateInterval;lane:number}
export interface GanttRow {project:Project;interval:DateInterval|null;stages:GanttStage[];lanes:number;invalidStages:Stage[]}
export function portfolioGanttRows(w:Workspace):GanttRow[]{return w.projects.map(project=>{
 const all=w.stages.filter(s=>s.projectId===project.id);const invalidStages=all.filter(s=>!ganttInterval(s.startDate,s.dueDate));const valid=all.filter(s=>ganttInterval(s.startDate,s.dueDate)).sort((a,b)=>a.startDate.localeCompare(b.startDate)||a.order-b.order||a.id.localeCompare(b.id));
 const ends:string[]=[];const stages=valid.map(stage=>{const interval=ganttInterval(stage.startDate,stage.dueDate)!;let lane=ends.findIndex(e=>e<interval.start);if(lane<0)lane=ends.length;ends[lane]=interval.end;return {stage,interval,lane}});
 return {project,interval:ganttInterval(project.startDate,project.dueDate),stages,lanes:Math.max(1,ends.length),invalidStages};
 });}
export function initialGanttMonth(w:Workspace,today=localCalendarDate()):string{const dates=w.projects.flatMap(p=>[p.startDate,...w.stages.filter(s=>s.projectId===p.id).map(s=>s.startDate)]).filter(validDate).sort();return (dates[0]??today).slice(0,7)+'-01';}
