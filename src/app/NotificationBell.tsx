import {useState} from 'react';
import {Bell} from 'lucide-react';
import type {AutomationCenter} from '../features/automation/useAutomationCenter';
import type {FollowUpAlert} from '../domain/automation';
export function NotificationBell({center,onNavigate,onOpenAlert}:{center:AutomationCenter;onNavigate:(page:string)=>void;onOpenAlert:(alert:FollowUpAlert)=>void}){
 const [open,setOpen]=useState(false);
 return <div className="po-notifications"><button aria-label="Ver notificaciones" aria-expanded={open} onClick={()=>setOpen(!open)}><Bell size={18}/>{center.unread.length>0&&<b>{center.unread.length}</b>}</button>
 {open&&<section className="po-notification-panel"><h3>Notificaciones de seguimiento</h3><p>{center.active.length} alertas activas · {center.unread.length} no leídas</p>{center.governanceError&&<p role="alert">Gobierno no se pudo actualizar. La evaluación es parcial.</p>}
 {center.unread.slice(0,8).map(a=><button className="po-auto-bell-item" key={a.id} onClick={()=>{center.change(a,'read');setOpen(false);onOpenAlert(a)}}><strong>{a.level} · {a.title}</strong><small>{a.reason}</small></button>)}
 {!center.unread.length&&<p>No hay alertas nuevas con las reglas activas.</p>}
 <button onClick={()=>{onNavigate('automatizacion');setOpen(false)}}>Ver centro de seguimiento</button></section>}</div>;
}
