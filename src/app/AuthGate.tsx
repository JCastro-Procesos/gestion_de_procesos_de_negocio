import { useEffect, useState } from 'react';
import { App } from './App';
import { login,logout,session,type CurrentUser } from '../data/processoneApi';
export function AuthGate(){
 const [user,setUser]=useState<CurrentUser|null>(null);const [loading,setLoading]=useState(true);
 const [email,setEmail]=useState('');const [password,setPassword]=useState('');const [error,setError]=useState('');const [working,setWorking]=useState(false);
 useEffect(()=>{session().then(setUser).catch(()=>{}).finally(()=>setLoading(false))},[]);
 const submit=async(e:React.FormEvent)=>{e.preventDefault();setError('');setWorking(true);try{setUser(await login(email,password));setPassword('')}catch(e){setError(e instanceof Error?e.message:'No se pudo iniciar sesión')}finally{setWorking(false)}};
 if(loading)return <div className="po-auth"><div className="po-auth-card">Conectando con ProcessOne…</div></div>;
 if(!user)return <div className="po-auth"><form className="po-auth-card" onSubmit={submit}><img src="/processone.svg" width="65" height="65" alt="ProcessOne"/><h1>ProcessOne</h1><p>IDEAS · PROCESOS · RESULTADOS</p><label>Correo electrónico<input required type="email" autoComplete="username" value={email} onChange={e=>setEmail(e.target.value)}/></label><label>Contraseña<input required type="password" autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)}/></label>{error&&<div role="alert" className="po-auth-error">{error}</div>}<button type="submit" disabled={working}>{working?'Verificando…':'Iniciar sesión'}</button><small>Acceso exclusivo para colaboradores autorizados.</small></form></div>;
 return <><div className="po-session-banner"><span>Conectado: <b>{user.name}</b></span><button onClick={async()=>{try{await logout();setUser(null)}catch(e){setError(String(e))}}}>Cerrar sesión</button></div><App/></>;
}
