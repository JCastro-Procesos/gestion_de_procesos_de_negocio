import {useEffect,useState} from 'react';
import {App} from './App';
import {api,login,logout,session,type CurrentUser} from '../data/processoneApi';
export function AuthGate(){
 const params=new URLSearchParams(window.location.search);
 const token=params.get('token')||'',purpose=params.get('auth')||'';
 const isToken=!!token&&['invite','reset'].includes(purpose);
 const [user,setUser]=useState<CurrentUser|null>(null),[loading,setLoading]=useState(true);
 const [email,setEmail]=useState(''),[password,setPassword]=useState(''),[repeat,setRepeat]=useState(''),[old,setOld]=useState('');
 const [error,setError]=useState(''),[message,setMessage]=useState(''),[working,setWorking]=useState(false),[mode,setMode]=useState(isToken?'token':'login');
 useEffect(()=>{session().then(setUser).catch(()=>{}).finally(()=>setLoading(false))},[]);
 const submit=async(e:React.FormEvent)=>{e.preventDefault();setError('');setMessage('');setWorking(true);
 try{
  if(mode==='token'){
   if(password!==repeat)throw new Error('Las contraseñas no coinciden.');
   await api('token_consume','POST',{token,purpose,password});
   window.history.replaceState(null,'',window.location.pathname);setMode('login');setPassword('');setRepeat('');setMessage('Contraseña establecida. Ya puedes iniciar sesión.');
  }else if(mode==='forgot'){
   const r=await api<{message:string}>('password_forgot','POST',{email});setMessage(r.message);
  }else if(mode==='change'){
   await api('password_change','POST',{oldPassword:old,newPassword:password});setOld('');setPassword('');setMode('login');setMessage('Contraseña actualizada.');
  }else{setUser(await login(email,password));setPassword('');}
 }catch(e){setError(e instanceof Error?e.message:'No se pudo completar la operación');}finally{setWorking(false);}};
 if(loading)return <div className="po-auth"><div className="po-auth-card">Conectando con ProcessOne…</div></div>;
 if(!user||mode==='token')return <div className="po-auth"><form className="po-auth-card" onSubmit={submit}>
 <img src="/processone.svg" width="65" height="65" alt="ProcessOne"/><h1>ProcessOne</h1><p>IDEAS · PROCESOS · RESULTADOS</p>
 {mode==='token'?<><h3>{purpose==='invite'?'Activar mi cuenta':'Restablecer contraseña'}</h3><label>Nueva contraseña (mínimo 12 caracteres)<input required type="password" minLength={12} autoComplete="new-password" value={password} onChange={e=>setPassword(e.target.value)}/></label><label>Confirmar contraseña<input required type="password" minLength={12} value={repeat} onChange={e=>setRepeat(e.target.value)}/></label></>:
 <>{mode==='forgot'?<h3>Recuperar acceso</h3>:null}<label>Correo electrónico<input required type="email" autoComplete="username" value={email} onChange={e=>setEmail(e.target.value)}/></label>{mode==='login'&&<label>Contraseña<input required type="password" autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)}/></label>}</>}
 {error&&<div role="alert" className="po-auth-error">{error}</div>}{message&&<p role="status">{message}</p>}
 <button type="submit" disabled={working}>{working?'Procesando…':mode==='token'?'Guardar contraseña':mode==='forgot'?'Enviar instrucciones':'Iniciar sesión'}</button>
 {mode!=='token'&&<button type="button" onClick={()=>{setMode(mode==='login'?'forgot':'login');setError('');setMessage('');}}>{mode==='login'?'Olvidé mi contraseña':'Volver al acceso'}</button>}
 </form></div>;
 return <><div className="po-session-banner"><span>Conectado: <b>{user.name}</b></span><button onClick={async()=>{try{await logout();setUser(null)}catch(e){setError(String(e))}}}>Cerrar sesión</button></div><App/></>;
}
