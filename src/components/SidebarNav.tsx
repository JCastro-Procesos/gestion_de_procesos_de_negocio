import {useEffect,useState,type ComponentType} from 'react';
import {ChevronDown,CircleHelp} from 'lucide-react';

export type NavItem={id:string;label:string;icon:ComponentType<{size?:number;'aria-hidden'?:boolean}>;group?:string;count?:string};

/** Resumen de una línea de cada apartado (se usa en la ayuda por bloque y como descripción del icono cuando el menú está contraído). */
export const NAV_INFO:Record<string,string>={
  dashboard:'Resumen de proyectos, avances, siguientes pasos y alertas. Agrupa por macroiniciativa o libro de trabajo.',
  proyectos:'Crea y administra proyectos. Verlos en lista, tablero por etapa o por macroiniciativa, y atender solicitudes.',
  iniciativas:'Mapa de macroiniciativas, libros de trabajo (metodologías) y sus etapas.',
  'mi-trabajo':'Tu vista personal: tus proyectos con sus actividades y tareas, en lista, tablero o lienzo.',
  perfil:'Tu nombre y tu animal de perfil, y la zona del equipo.',
  tareas:'Gestión operativa de las tareas del equipo: responsables, fechas, horas, Gantt, calendario y bloqueos.',
  equipo:'Disponibilidad y carga de trabajo de cada integrante.',
  raid:'Registro de riesgos, supuestos, incidencias y decisiones con responsable y fecha.',
  reportes:'Indicadores clave y reportes para dar seguimiento a resultados.',
  validacion:'Revisión integral de que la información del sistema esté completa y consistente.',
  gobierno:'Solicitudes, autorizaciones y decisiones con bitácora.',
  datos:'Exportar e importar información del espacio de trabajo.',
  usuarios:'Alta de personas, roles, invitaciones y animal de perfil.',
  auditoria:'Historial de quién cambió qué y cuándo.',
  automatizacion:'Alertas y reglas automáticas.',
  integraciones:'Conexión con Microsoft 365.'
};
export const GROUP_INFO:Record<string,string>={
  'Espacio de trabajo':'Tu operación diaria: ver el estado general, administrar proyectos y metodologías y trabajar tus pendientes.',
  'Control':'Seguimiento y revisión: indicadores, validación de la información y autorizaciones.',
  'Configuración':'Administración del sistema: datos, personas, historial, alertas e integraciones.'
};
const KEY='po-nav-closed-v1';
const readClosed=():string[]=>{try{const v=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(v)?v.filter(x=>typeof x==='string'):[]}catch{return[]}};

export function SidebarNav({items,page,onNavigate,count,collapsed}:{items:NavItem[];page:string;onNavigate:(id:string)=>void;count:(key?:string)=>number;collapsed:boolean}){
  const groups:{name:string;items:NavItem[]}[]=[];
  items.forEach(it=>{if(it.group||groups.length===0)groups.push({name:it.group||'Espacio de trabajo',items:[]});groups[groups.length-1].items.push(it)});
  const [closed,setClosed]=useState<string[]>(readClosed);
  const [help,setHelp]=useState<string|null>(null);
  useEffect(()=>{try{localStorage.setItem(KEY,JSON.stringify(closed))}catch{/* sin almacenamiento */}},[closed]);
  // Al navegar a una página, su bloque se abre solo.
  useEffect(()=>{const g=groups.find(x=>x.items.some(i=>i.id===page));if(g&&closed.includes(g.name))setClosed(c=>c.filter(n=>n!==g.name))},[page]); // eslint-disable-line react-hooks/exhaustive-deps
  const toggle=(name:string)=>setClosed(c=>c.includes(name)?c.filter(n=>n!==name):[...c,name]);
  return <nav className="side-nav po-nav" aria-label="Navegación principal">{groups.map(g=>{
    const isClosed=!collapsed&&closed.includes(g.name),bodyId='po-nav-'+g.name.replace(/\s+/g,'-');
    const hasActive=g.items.some(i=>i.id===page);
    return <section key={g.name} className={`po-nav-group ${isClosed?'is-closed':''} ${hasActive?'has-active':''}`}>
      {!collapsed&&<div className="po-nav-head">
        <button type="button" className="po-nav-toggle" aria-expanded={!isClosed} aria-controls={bodyId} onClick={()=>toggle(g.name)}>
          <ChevronDown size={14} aria-hidden="true"/><span>{g.name}</span>{isClosed&&hasActive&&<i className="po-nav-dot" aria-label="Contiene la pantalla actual"/>}
        </button>
        <button type="button" className="po-nav-help" aria-label={`Ayuda del bloque ${g.name}`} aria-expanded={help===g.name} title="¿Qué hay en este bloque?" onClick={()=>setHelp(h=>h===g.name?null:g.name)}><CircleHelp size={15} aria-hidden="true"/></button>
      </div>}
      {!collapsed&&help===g.name&&<div className="po-nav-helpbox" role="note"><p>{GROUP_INFO[g.name]||''}</p><ul>{g.items.map(i=><li key={i.id}><button type="button" onClick={()=>{setHelp(null);onNavigate(i.id)}}><b>{i.label}</b><span>{NAV_INFO[i.id]||''}</span></button></li>)}</ul></div>}
      {collapsed&&<div className="po-nav-sep" aria-hidden="true"/>}
      <div id={bodyId} className="po-nav-body" hidden={isClosed}>{g.items.map(item=>{const Icon=item.icon,n=item.count?count(item.count):0;
        return <button key={item.id} type="button" aria-current={page===item.id?'page':undefined} aria-label={collapsed?item.label:undefined} title={collapsed?`${item.label} — ${NAV_INFO[item.id]||''}`:undefined} className={`nav-link ${page===item.id?'nav-active':''}`} onClick={()=>onNavigate(item.id)}><Icon size={18} aria-hidden={true}/><span>{item.label}</span>{n>0&&<b className="nav-count">{n}</b>}</button>})}</div>
    </section>})}</nav>;
}
