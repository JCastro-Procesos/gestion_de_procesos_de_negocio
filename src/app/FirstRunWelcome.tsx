import {useEffect,useState} from 'react';
import type {CurrentUser} from '../data/processoneApi';
type Props={user:CurrentUser;onNavigate:(page:string)=>void};
export function FirstRunWelcome({user,onNavigate}:Props){
 const key='processone-welcome-v1-'+user.id;
 const [open,setOpen]=useState(()=>localStorage.getItem(key)!=='done');
 useEffect(()=>{setOpen(localStorage.getItem(key)!=='done')},[key]);
 if(!open)return null;
 const close=()=>{localStorage.setItem(key,'done');setOpen(false)};
 return <div className="po-onboarding-overlay" role="dialog" aria-modal="true" aria-label="Bienvenida a ProcessOne">
 <section className="po-onboarding-card"><span className="po-onboarding-kicker">BIENVENIDO A PROCESSONE</span><h2>Hola, {user.name.split(' ')[0]} 👋</h2>
 <p>Tu espacio de gestión de proyectos, tareas y mejora continua. Comienza con tres pasos:</p>
 <ol><li>Consulta tus compromisos en <b>Mi trabajo</b>.</li><li>Explora el <b>Panel ejecutivo</b> para revisar alertas y prioridades.</li><li>Abre <b>Proyectos</b> para registrar o revisar una iniciativa.</li></ol>
 <div style={{display:'flex',gap:10,flexWrap:'wrap'}}><button className="top-add-button" onClick={()=>{close();onNavigate('mi-trabajo')}}>Ir a Mi trabajo</button><button onClick={close}>Explorar por mi cuenta</button></div>
 <small>Esta guía se muestra una vez por navegador y usuario. No altera datos compartidos.</small></section></div>;
}
