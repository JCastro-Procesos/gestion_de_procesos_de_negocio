import type {Workspace} from './model';
import type {GovernanceItem} from './governance';
import {addCalendarDays,validDate,automationAlerts,automationForecast} from './automation';
// Compatibilidad para otros consumidores; el cálculo se centraliza en el nuevo motor.
export const localAlerts=(w:Workspace,days=7)=>automationAlerts({...w,automationSettings:{version:1,warningDays:days,capacityPercent:125,enabled:{taskDue:true,activityDue:true,blocker:true,dependency:true,raid:true,projectDue:true,capacity:true,governance:true,forecast:true,missingOwner:true}}}).map(a=>({...a,message:a.title}));
export const projectForecast=automationForecast;
const escape=(s:string)=>s.replace(/\\/g,'\\\\').replace(/\r\n|\r|\n/g,'\\n').replace(/,/g,'\\,').replace(/;/g,'\\;');
function fold(line:string):string{const rows:string[]=[];let row='',bytes=0;for(const c of line){const size=new TextEncoder().encode(c).length;if(bytes+size>75){rows.push(row);row=' ';bytes=1}row+=c;bytes+=size}rows.push(row);return rows.join('\r\n')}
export function calendarFile(w:Workspace,governance:GovernanceItem[]=[],now=new Date()):string{
 const active=new Set(w.projects.filter(p=>p.status!=='Completado').map(p=>p.id));
 const entries=[...w.tasks.filter(t=>active.has(t.projectId)&&t.status!=='Completado'&&validDate(t.dueDate)).map(t=>({id:'task-'+t.id,title:'ProcessOne · '+t.title,date:t.dueDate,desc:'Tarea del proyecto '+w.projects.find(p=>p.id===t.projectId)?.name})),...w.projects.filter(p=>active.has(p.id)&&validDate(p.dueDate)).map(p=>({id:'project-'+p.id,title:'ProcessOne · '+p.name,date:p.dueDate,desc:p.goal})),...governance.filter(g=>g.status!=='Rechazado'&&!(g.status==='Aprobado'&&g.implementationStatus==='Verificado')&&validDate(g.dueDate)).map(g=>({id:'gov-'+g.id,title:'ProcessOne · Revisión '+g.title,date:g.dueDate!,desc:g.description}))];
 const stamp=(s:string)=>s.replace(/-/g,'');return ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//ProcessOne//Seguimiento//ES','CALSCALE:GREGORIAN',...entries.flatMap(e=>['BEGIN:VEVENT','UID:'+encodeURIComponent(e.id)+'@processone','DTSTAMP:'+now.toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,''),'DTSTART;VALUE=DATE:'+stamp(e.date),'DTEND;VALUE=DATE:'+stamp(addCalendarDays(e.date,1)),'SUMMARY:'+escape(e.title),'DESCRIPTION:'+escape(e.desc??''),'END:VEVENT']),'END:VCALENDAR'].map(fold).join('\r\n')+'\r\n';
}
