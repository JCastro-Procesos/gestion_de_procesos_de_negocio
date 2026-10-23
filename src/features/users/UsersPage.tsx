import { useEffect,useState } from 'react';
import {api,session,type CurrentUser} from '../../data/processoneApi';
import {ROLE_LABELS,type ProcessOneRole} from '../../domain/access';
type User={id:number;name:string;email?:string;role?:ProcessOneRole;active?:number;invitation_pending?:number};
export function UsersPage(){
 const [current,setCurrent]=useState<CurrentUser|null>(null),[users,setUsers]=useState<User[]>([]);
 const [name,setName]=useState(''),[email,setEmail]=useState(''),[role,setRole]=useState<ProcessOneRole>('ingeniero');
 const [error,setError]=useState(''),[message,setMessage]=useState(''),[busy,setBusy]=useState(false);
 const [oldPassword,setOldPassword]=useState(''),[newPassword,setNewPassword]=useState('');
 const reload=async()=>{const r=await api<{users:User[]}>('users');setUsers(r.users);};
 useEffect(()=>{void session().then(setCurrent).catch(e=>setError(String(e)));void reload().catch(e=>setError(String(e)));},[]);
 const create=async(e:React.FormEvent)=>{e.preventDefault();setBusy(true);setError('');setMessage('');try{
  const r=await api<{message:string}>('users','POST',{name,email,role});setMessage(r.message);setName('');setEmail('');await reload();
 }catch(e){setError(e instanceof Error?e.message:String(e));}finally{setBusy(false);}};
 const edit=async(u:User)=>{const nextName=window.prompt('Nombre del colaborador',u.name);if(nextName===null)return;
  const nextRole=window.prompt('Perfil: direccion, gerencia, especialista o ingeniero',u.role||'ingeniero');if(nextRole===null)return;
  setError('');try{await api('users','PUT',{id:u.id,name:nextName,role:nextRole,active:!!u.active});await reload();setMessage('Colaborador actualizado.');}catch(e){setError(String(e));}};
 const toggle=async(u:User)=>{if(!window.confirm((u.active?'Desactivar':'Activar')+' a '+u.name+'?'))return;
  setError('');try{await api('users','PUT',{id:u.id,name:u.name,role:u.role,active:!u.active});await reload();}catch(e){setError(String(e));}};
 const resend=async(u:User)=>{setError('');try{const r=await api<{message:string}>('users_resend','POST',{id:u.id});setMessage(r.message);}catch(e){setError(String(e));}};
 return <div className="page-stack"><section className="itm-planning-panel">
 <h2>Usuarios y perfiles</h2><p>Las cuentas se activan mediante invitación. Cada colaborador establece su contraseña.</p>
 {error&&<div role="alert" className="po-auth-error">{error}</div>}{message&&<p role="status">{message}</p>}
 {current?.role==='admin'&&<form onSubmit={create} style={{display:'grid',gap:10,maxWidth:560}}>
  <h3>Invitar colaborador</h3>
  <label>Nombre completo<input className="input" required minLength={2} value={name} onChange={e=>setName(e.target.value)}/></label>
  <label>Correo electrónico<input className="input" type="email" required value={email} onChange={e=>setEmail(e.target.value)}/></label>
  <label>Perfil<select className="input" value={role} onChange={e=>setRole(e.target.value as ProcessOneRole)}>{(Object.keys(ROLE_LABELS) as ProcessOneRole[]).filter(r=>r!=='admin').map(r=><option key={r} value={r}>{ROLE_LABELS[r]}</option>)}</select></label>
  <button type="submit" className="top-add-button" disabled={busy}>{busy?'Registrando…':'Enviar invitación'}</button>
  <small>El enlace vence en 48 horas. El envío requiere correo saliente configurado en el servidor.</small>
 </form>}
 <h3>Directorio</h3><div style={{display:'grid',gap:9}}>{users.map(u=><div key={u.id} style={{border:'1px solid #e0e7f3',padding:12,borderRadius:10,display:'flex',justifyContent:'space-between',gap:10,flexWrap:'wrap'}}>
 <div><strong>{u.name}</strong>{current?.role==='admin'&&<div style={{fontSize:12}}>{u.email} · {u.role?ROLE_LABELS[u.role]:''} · {!u.active?'Inactivo':u.invitation_pending?'Invitación pendiente':'Activo'}</div>}</div>
 {current?.role==='admin'&&u.role!=='admin'&&<div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
 <button onClick={()=>void edit(u)}>Editar</button><button onClick={()=>void toggle(u)}>{u.active?'Desactivar':'Activar'}</button>
 {!!u.invitation_pending&&!!u.active&&<button onClick={()=>void resend(u)}>Reenviar invitación</button>}</div>}
 </div>)}</div>
 </section><section className="itm-planning-panel"><h3>Cambiar mi contraseña</h3><form style={{display:'grid',gap:9,maxWidth:450}} onSubmit={async e=>{e.preventDefault();setError('');try{await api('password_change','POST',{oldPassword,newPassword});setOldPassword('');setNewPassword('');setMessage('Contraseña actualizada correctamente.');}catch(e){setError(String(e));}}}><label>Contraseña actual<input className="input" required type="password" value={oldPassword} onChange={e=>setOldPassword(e.target.value)}/></label><label>Nueva contraseña (mínimo 12 caracteres)<input className="input" required minLength={12} type="password" value={newPassword} onChange={e=>setNewPassword(e.target.value)}/></label><button className="top-add-button" type="submit">Actualizar mi contraseña</button></form></section></div>;
}
