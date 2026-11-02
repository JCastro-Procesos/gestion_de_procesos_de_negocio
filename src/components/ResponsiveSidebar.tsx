import {useEffect,useRef,useState,type ReactNode} from 'react';
import {Menu,X} from 'lucide-react';
import {useDialogBehavior} from './useDialogBehavior';

export function ResponsiveSidebar({children,currentTitle}:{children:ReactNode;currentTitle:string}){
 const [mobile,setMobile]=useState(()=>typeof window.matchMedia==='function'&&window.matchMedia('(max-width: 720px)').matches);
 const [open,setOpen]=useState(false),ref=useRef<HTMLElement>(null);
 useEffect(()=>{const media=window.matchMedia('(max-width: 720px)');const change=()=>{setMobile(media.matches);setOpen(false)};media.addEventListener('change',change);return()=>media.removeEventListener('change',change)},[]);
 useDialogBehavior(ref,mobile&&open,()=>setOpen(false));
 return <>
  <div className="po-mobile-bar"><span><b>Process<span>One</span></b><small>{currentTitle}</small></span><button type="button" className="po-menu-toggle" aria-label="Abrir menú de navegación" aria-expanded={mobile&&open} aria-controls="processone-navigation" onClick={()=>setOpen(true)}><Menu size={20} aria-hidden="true"/> Menú</button></div>
  {mobile&&open&&<div className="po-nav-scrim" onClick={()=>setOpen(false)} aria-hidden="true"/>}
  <aside ref={ref} id="processone-navigation" className={`sidebar ${mobile&&open?'po-sidebar-open':''}`} hidden={mobile&&!open} role={mobile&&open?'dialog':undefined} aria-modal={mobile&&open?true:undefined} aria-label="Menú de ProcessOne" tabIndex={-1} onClick={event=>{if(mobile&&event.target instanceof Element&&event.target.closest('nav button,.sidebar-footer button'))setOpen(false)}}>
   <div className="po-mobile-menu-heading"><strong>Navegación</strong><button type="button" className="po-menu-toggle" aria-label="Cerrar menú de navegación" onClick={()=>setOpen(false)}><X size={20} aria-hidden="true"/></button></div>
   {children}
  </aside>
 </>;
}
