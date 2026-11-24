import {useEffect,useState} from 'react';
import {api,session,type CurrentUser} from '../../data/processoneApi';
import {ROLE_LABELS} from '../../domain/access';
import {ANIMALS,AnimalArena,AnimalAvatar,animalInfo} from '../../components/pd/Animal';
import {Button} from '../../components/ui';
type Person={id:number;name:string;avatar_animal?:string|null};
export function ProfilePage(){
 const [user,setUser]=useState<CurrentUser|null>(null),[name,setName]=useState(''),[avatar,setAvatar]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
 const [team,setTeam]=useState<Person[]>([]);
 const loadTeam=()=>api<{users:Person[]}>('users').then(r=>setTeam(r.users)).catch(()=>{});
 useEffect(()=>{void session().then(u=>{setUser(u);setName(u.name);setAvatar(u.avatar_animal||'')}).catch(e=>setError(String(e)));void loadTeam()},[]);
 const save=async(e:React.FormEvent)=>{e.preventDefault();setBusy(true);setError('');setNotice('');try{const r=await api<{user:CurrentUser}>('profile','PUT',{name,avatar_animal:avatar});setUser(r.user);setNotice('Perfil actualizado. La cabecera reflejará los cambios al recargar.');void loadTeam()}catch(e){setError(String(e))}finally{setBusy(false)}};
 const info=animalInfo(avatar);
 return <div className="pd-page">
  {user&&<section className="pd-animal-hero"><AnimalAvatar emoji={avatar} name={name} size={96} bob/><div><span className="pd-eyebrow" style={{color:'#bfe0ff'}}>MI PERFIL</span><h2>{name||user.name}</h2><p>{ROLE_LABELS[user.role]} · {user.email}{info?` · ${info.name}`:''}</p></div></section>}
  {error&&<p role="alert" className="error-banner">{error}</p>}{notice&&<p role="status" className="pd-card">{notice}</p>}
  {user&&<div className="pd-split">
   <form className="pd-card pd-page" onSubmit={save}>
    <header><h3>Tu identidad en ProcessOne</h3><p className="pd-sub" style={{margin:0}}>Tu correo y perfil de acceso solo pueden modificarse mediante administración.</p></header>
    <div className="pd-grid pd-g2"><label className="pd-field">Nombre visible<input required minLength={2} maxLength={120} value={name} onChange={e=>setName(e.target.value)}/></label><label className="pd-field">Correo electrónico<input readOnly value={user.email}/></label></div>
    <fieldset style={{border:0,padding:0,margin:0}}><legend style={{fontWeight:700,color:'#102a5c',marginBottom:8}}>Elige tu animal</legend><div className="pd-picker">{ANIMALS.map(a=><button type="button" key={a.emoji} className="pd-pick" aria-pressed={avatar===a.emoji} onClick={()=>setAvatar(a.emoji)}><AnimalAvatar emoji={a.emoji} size={46}/>{a.name}</button>)}</div></fieldset>
    <div><Button variant="primary" type="submit" disabled={busy}>{busy?'Guardando…':'Guardar mi perfil'}</Button></div>
   </form>
   <section className="pd-card"><header><h3>Zona del equipo</h3><p className="pd-sub">Mueve los avatares a tu gusto: es solo para ti.</p></header><AnimalArena people={team.map(t=>({id:String(t.id),name:t.name,emoji:t.avatar_animal}))}/></section>
  </div>}
 </div>;
}
