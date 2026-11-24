import {ALL_FACETS,facetsFromString,facetsToString,type Facets} from '../domain/portfolio';
const KEY='po-facets-v1';
/** Conserva el filtro (macroiniciativa · metodología · tipo) al pasar de Panel a Proyectos y viceversa. */
export function loadFacets():Facets{try{return facetsFromString(sessionStorage.getItem(KEY))}catch{return ALL_FACETS}}
export function saveFacets(f:Facets){try{sessionStorage.setItem(KEY,facetsToString(f))}catch{/* sin almacenamiento */}}
