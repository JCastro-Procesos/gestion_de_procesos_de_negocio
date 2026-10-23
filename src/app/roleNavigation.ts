import type {ProcessOneRole} from '../domain/access';
const ACCESS:Record<string,ProcessOneRole[]>={
 perfil:['admin','direccion','gerencia','especialista','ingeniero'],
 dashboard:['admin','direccion','gerencia','especialista','ingeniero'],
 proyectos:['admin','direccion','gerencia','especialista','ingeniero'],
 iniciativas:['admin','direccion','gerencia','especialista'],
 'mi-trabajo':['admin','direccion','gerencia','especialista','ingeniero'],
 tareas:['admin','direccion','gerencia','especialista','ingeniero'],
 equipo:['admin','direccion','gerencia','especialista'],
 raid:['admin','direccion','gerencia','especialista','ingeniero'],
 reportes:['admin','direccion','gerencia','especialista'],
 metodologias:['admin','direccion','gerencia','especialista','ingeniero'],
 gobierno:['admin','direccion','gerencia','especialista','ingeniero'],
 datos:['admin'],
 usuarios:['admin'],
 auditoria:['admin'],
 automatizacion:['admin','direccion','gerencia'],
 integraciones:['admin']
};
export function canSeeModule(role:ProcessOneRole|undefined,page:string){return !!role&&!!ACCESS[page]?.includes(role)}
export function defaultPageForRole(role:ProcessOneRole|undefined){return role==='ingeniero'?'mi-trabajo':'dashboard'}
