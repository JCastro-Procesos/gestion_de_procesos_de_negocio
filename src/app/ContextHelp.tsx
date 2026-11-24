import {useEffect,useState} from 'react';
import {X,Search} from 'lucide-react';
export const HELP:Record<string,{title:string;summary:string;steps:string[]}>={
 dashboard:{title:'Panel ejecutivo',summary:'Resumen de todos los proyectos: avance, siguientes pasos y alertas.',steps:['Elige "Agrupar por" macroiniciativa o libro de trabajo.','Haz clic en un grupo para filtrar el resto del panel.','Revisa los pasos críticos y abre el proyecto para atenderlos.']},
 perfil:{title:'Mi perfil',summary:'Tu nombre y tu animal de perfil.',steps:['Cambia tu nombre si lo necesitas.','Elige tu animal.','Mueve a tu equipo en la zona del equipo.']},
 validacion:{title:'Validación integral',summary:'Revisa que la información del sistema esté completa.',steps:['Revisa los hallazgos.','Corrige en el apartado correspondiente.','Vuelve a validar.']},
 proyectos:{title:'Proyectos',summary:'Crea y administra proyectos: con macroiniciativa, solo con un libro de trabajo, o libres (análisis).',steps:['Usa Nuevo proyecto y elige su tipo.','Cambia entre Lista, Tablero por etapa y Por macroiniciativa.','Atiende las solicitudes en la pestaña Solicitudes.']},
 iniciativas:{title:'Metodología e iniciativas',summary:'Mapa de macroiniciativas, libros de trabajo y etapas.',steps:['Toca una macroiniciativa o un libro para ver con qué se relaciona.','Revisa las actividades por etapa de cada libro.','Consulta qué proyectos usan cada uno.']},
 'mi-trabajo':{title:'Mi trabajo',summary:'Tu vista personal: tus proyectos con sus actividades (cargadas del plan) y tus tareas.',steps:['Elige Lista, Tablero o Lienzo.','Cambia el estado o registra un bloqueo.','Para gestionar tareas a fondo (horas, Gantt), usa Tareas del equipo.']},
 tareas:{title:'Tareas del equipo',summary:'Gestión operativa de las tareas de todo el equipo: asignación, seguimiento y horas.',steps:['Filtra por proyecto, estado o prioridad.','Elige tabla, tablero, clasificación o lienzo.','Registra horas y revisa Gantt, calendario y bloqueos.']},
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
 useEffect(()=>{const h=(e:Event)=>{const d=(e as CustomEvent<{page?:string}>).detail;setSelected(d?.page&&HELP[d.page]?d.page:page);setSearch('');setOpen(true)};window.addEventListener('po-help',h);return()=>window.removeEventListener('po-help',h)},[page]);
 useEffect(()=>{if(!open)return;const handler=(e:KeyboardEvent)=>{if(e.key==='Escape')setOpen(false)};window.addEventListener('keydown',handler);return()=>window.removeEventListener('keydown',handler)},[open]);
 const entries=Object.entries(HELP).filter(([,t])=>(t.title+' '+t.summary).toLowerCase().includes(search.toLowerCase()));
 const topic=HELP[selected]||HELP.dashboard;
 return <div className="po-help-anchor">
 {open&&<section className="po-help-panel" aria-label="Ayuda de ProcessOne"><header><strong>Centro de ayuda</strong><button aria-label="Cerrar ayuda" onClick={()=>setOpen(false)}><X size={18}/></button></header>
 <label className="po-help-search"><Search size={15}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar una función" aria-label="Buscar ayuda"/></label>
 {search?<div className="po-help-results">{entries.map(([id,t])=><button key={id} onClick={()=>{setSelected(id);setSearch('')}}>{t.title}</button>)}{entries.length===0&&<p>No encontramos resultados. Prueba otra palabra.</p>}</div>:<div className="po-help-body"><small>GUÍA CONTEXTUAL</small><h3>{topic.title}</h3><p>{topic.summary}</p><ol>{topic.steps.map(s=><li key={s}>{s}</li>)}</ol><button onClick={()=>{onNavigate(selected);setOpen(false)}}>Ir a esta sección →</button>{selected!==page&&<button onClick={()=>setSelected(page)}>Ayuda de la pantalla actual</button>}</div>}
 <footer>Ayuda integrada · No es un chat con IA.</footer></section>}
</div>;
}
