import {useState} from 'react';
import {Bell} from 'lucide-react';
import type {Workspace} from '../domain/model';
import {localAlerts} from '../domain/localAutomation';
export function NotificationBell({workspace,onNavigate}:{workspace:Workspace;onNavigate:(page:string)=>void}){
 const [open,setOpen]=useState(false);
 const alerts=localAlerts(workspace,7);
 return <div className="po-notifications"><button aria-label="Ver notificaciones" aria-expanded={open} onClick={()=>setOpen(!open)}><Bell size={18}/>{alerts.length>0&&<b>{alerts.length}</b>}</button>
 {open&&<section className="po-notification-panel"><h3>Notificaciones automáticas</h3><p>Alertas calculadas desde las fechas, tareas y riesgos del espacio.</p>
 {alerts.slice(0,8).map(a=><p key={a.id}><strong>{a.level}: </strong>{a.message}</p>)}
 {!alerts.length&&<p>No hay alertas activas.</p>}
 <button onClick={()=>{onNavigate('automatizacion');setOpen(false)}}>Ver centro de alertas</button></section>}</div>;
}
