import {useEffect,useState} from 'react';
import {CalendarDays,Clock} from 'lucide-react';

/** Reloj en vivo para el panel ejecutivo. Se actualiza cada segundo y se pausa cuando la pestaña no está visible. */
export function LiveClock(){
  const [now,setNow]=useState(()=>new Date());
  useEffect(()=>{
    let id:number|undefined;
    const start=()=>{setNow(new Date());id=window.setInterval(()=>setNow(new Date()),1000)};
    const stop=()=>{if(id!==undefined){window.clearInterval(id);id=undefined}};
    const vis=()=>{document.hidden?stop():(stop(),start())};
    start();document.addEventListener('visibilitychange',vis);
    return()=>{stop();document.removeEventListener('visibilitychange',vis)};
  },[]);
  const time=now.toLocaleTimeString('es-MX',{hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:true});
  const raw=now.toLocaleDateString('es-MX',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
  const date=raw.charAt(0).toUpperCase()+raw.slice(1);
  return <div className="pd-clock" role="timer" aria-label={`Hora local ${time}. ${date}`}>
    <span className="pd-clock-label"><Clock size={14} aria-hidden="true"/> HORA LOCAL · EN VIVO</span>
    <b className="pd-clock-time">{time}</b>
    <span className="pd-clock-date"><CalendarDays size={14} aria-hidden="true"/> {date}</span>
  </div>;
}
