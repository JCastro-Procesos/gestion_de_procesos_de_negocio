import {useEffect,useState} from 'react';
import {session,type CurrentUser} from './processoneApi';
import {canPerform} from '../domain/access';
let cached:Promise<CurrentUser>|null=null;
/** Usuario autenticado (una sola consulta compartida por todas las pantallas). */
export function useCurrentUser(){
 const [user,setUser]=useState<CurrentUser|null>(null);
 useEffect(()=>{let alive=true;(cached??=session().catch(e=>{cached=null;throw e;})).then(u=>{if(alive)setUser(u)}).catch(()=>{});return()=>{alive=false};},[]);
 return user;
}
/** Gerencia, Dirección y Administración pueden modificar metodologías e iniciativas. */
export function canManageMethodology(user:CurrentUser|null){return !!user&&canPerform(user.role,'gerencia')}
