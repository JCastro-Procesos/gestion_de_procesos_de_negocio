import {useEffect,useState} from 'react';
import {MessageCircle,X,Search} from 'lucide-react';
export const HELP:Record<string,{title:string;summary:string;steps:string[]}>={
 dashboard:{title:'Panel ejecutivo',summary:'Revisa alertas y prioridades.',steps:['Identifica proyectos en riesgo.','Abre el proyecto para revisar sus causas.','Registra acciones en RAID.']},
 proyectos:{title:'Proyectos',summary:'Crea y administra proyectos en cinco etapas.',steps:['Selecciona Nuevo proyecto.','Completa el asistente de tres pasos.','Registra actividades y entregables.']},
 iniciativas:{title:'Iniciativas',summary:'Relaciona objetivos estratégicos con proyectos.',steps:['Registra la iniciativa.','Vincula proyectos.','Revisa su avance consolidado.']},
 'mi-trabajo':{title:'Mi trabajo',summary:'Consulta las tareas asignadas a tu cuenta.',steps:['Revisa pendientes y vencidas.','Actualiza estados.','Abre el proyecto asociado.']},
 tareas:{title:'Tareas',summary:'Gestiona responsables, fechas y prioridades.',steps:['Filtra las tareas.','Actualiza su avance.','Registra horas reales.']},
 equipo:{title:'Equipo y capacidad',summary:'Revisa la disponibilidad del equipo.',steps:['Comprueba los integrantes.','Verifica sus correos.','Distribuye responsabilidades.']},
 raid:{title:'Riesgos y decisiones',summary:'Registra riesgos, incidencias y dependencias.',steps:['Selecciona el proyecto.','Asigna responsable y fecha.','Da seguimiento hasta cerrar.']},
 reportes:{title:'Reportes',summary:'Analiza indicadores y resultados.',steps:['Consulta los KPIs.','Detecta desviaciones.','Abre el detalle correspondiente.']},
 metodologias:{title:'Metodologías',summary:'Consulta métodos y entregables.',steps:['Revisa las metodologías.','Selecciona la apropiada.','Adapta sus actividades.']},
 gobierno:{title:'Gobierno y autorizaciones',summary:'Consulta solicitudes y decisiones auditables.',steps:['Registra la solicitud.','Espera revisión autorizada.','Consulta la decisión y bitácora.']},
 usuarios:{title:'Usuarios y perfiles',summary:'Administra cuentas e invitaciones.',steps:['Registra el colaborador.','Envía la invitación.','Revisa el estado de activación.']},
 auditoria:{title:'Historial de cambios',summary:'Consulta acciones registradas por el servidor.',steps:['Filtra los eventos disponibles.','Revisa actor y fecha.','Investiga movimientos inesperados.']},
 datos:{title:'Datos y respaldos',summary:'Exporta información del espacio.',steps:['Exporta el JSON.','Recuerda que no es respaldo integral de MySQL.','Solicita respaldo completo antes de cambios críticos.']},
 automatizacion:{title:'Automatización',summary:'Consulta alertas y reglas.',steps:['Revisa los avisos.','Comprueba las condiciones.','Verifica integraciones pendientes.']},
 integraciones:{title:'Microsoft 365',summary:'Configura conexiones de Microsoft.',steps:['Consulta el estado.','Verifica permisos.','No compartas credenciales.']}
};
export function ContextHelp({page,onNavigate}:{page:string;onNavigate:(page:string)=>void}){
 const [open,setOpen]=useState(false),[search,setSearch]=useState(''),[selected,setSelected]=useState(page);
 useEffect(()=>setSelected(page),[page]);
 useEffect(()=>{if(!open)return;const handler=(e:KeyboardEvent)=>{if(e.key==='Escape')setOpen(false)};window.addEventListener('keydown',handler);return()=>window.removeEventListener('keydown',handler)},[open]);
 const entries=Object.entries(HELP).filter(([,t])=>(t.title+' '+t.summary).toLowerCase().includes(search.toLowerCase()));
 const topic=HELP[selected]||HELP.dashboard;
 return <div className="po-help-anchor">
 {open&&<section className="po-help-panel" aria-label="Ayuda de ProcessOne"><header><strong>Centro de ayuda</strong><button aria-label="Cerrar ayuda" onClick={()=>setOpen(false)}><X size={18}/></button></header>
 <label className="po-help-search"><Search size={15}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar una función" aria-label="Buscar ayuda"/></label>
 {search?<div className="po-help-results">{entries.map(([id,t])=><button key={id} onClick={()=>{setSelected(id);setSearch('')}}>{t.title}</button>)}{entries.length===0&&<p>No encontramos resultados. Prueba otra palabra.</p>}</div>:<div className="po-help-body"><small>GUÍA CONTEXTUAL</small><h3>{topic.title}</h3><p>{topic.summary}</p><ol>{topic.steps.map(s=><li key={s}>{s}</li>)}</ol><button onClick={()=>{onNavigate(selected);setOpen(false)}}>Ir a esta sección →</button>{selected!==page&&<button onClick={()=>setSelected(page)}>Ayuda de la pantalla actual</button>}</div>}
 <footer>Ayuda integrada · No es un chat con IA.</footer></section>}
 <button className="po-help-fab" onClick={()=>setOpen(v=>!v)} aria-label={open?'Cerrar ayuda':'Abrir ayuda'} aria-expanded={open}>{open?<X size={20}/>:<MessageCircle size={20}/>} Ayuda</button></div>;
}
