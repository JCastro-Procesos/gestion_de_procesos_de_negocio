import type { Workspace } from '../domain/model';
export type CurrentUser={id:number;name:string;email:string;role:'admin'|'direccion'|'gerencia'|'especialista'|'ingeniero';active:number};
let csrf='';
export async function api<T>(action:string,method:'GET'|'POST'|'PUT'|'DELETE'='GET',body?:unknown):Promise<T>{
 const response=await fetch('/api/index.php?action='+encodeURIComponent(action),{
 method,credentials:'same-origin',cache:'no-store',
 headers:{...(method!=='GET'?{'Content-Type':'application/json','X-CSRF-Token':csrf}:{})},
 ...(body===undefined?{}:{body:JSON.stringify(body)})
 });
 const data=await response.json().catch(()=>({error:'Respuesta inválida del servidor'})) as T & {error?:string};
 if(!response.ok)throw new Error(data.error||'Error de comunicación');
 return data;
}
export async function login(email:string,password:string){const result=await api<{user:CurrentUser;csrf:string}>('login','POST',{email,password});csrf=result.csrf;return result.user}
export async function session(){const result=await api<{user:CurrentUser;csrf:string}>('session');csrf=result.csrf;return result.user}
export async function logout(){await api('logout','POST');csrf=''}
export type SharedWorkspace={workspace:Workspace|null;revision:number};
