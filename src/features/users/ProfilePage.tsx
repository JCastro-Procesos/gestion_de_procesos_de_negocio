import {useEffect,useState} from 'react';
import {api,session,type CurrentUser} from '../../data/processoneApi';
import {ROLE_LABELS} from '../../domain/access';
const AVATARS=['🦊','🐯','🦁','🐼','🐻','🦉','🐬','🦋','🐢','🦄','🐺','🦜'];
export function ProfilePage(){
 const [user,setUser]=useState<CurrentUser|null>(null),[name,setName]=useState(''),[avatar,setAvatar]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
 useEffect(()=>{void session().then(u=>{setUser(u);setName(u.name);setAvatar(u.avatar_animal||'')}).catch(e=>setError(String(e)))},[]);
 const save=async(e:React.FormEvent)=>{e.preventDefault();setBusy(true);setError('');setNotice('');try{const r=await api<{user:CurrentUser}>('profile','PUT',{name,avatar_animal:avatar});setUser(r.user);setNotice('Perfil actualizado. La cabecera reflejará los cambios al recargar.')}catch(e){setError(String(e))}finally{setBusy(false)}};
 return <div className="page-stack"><section className="itm-planning-panel"><h2>Mi perfil</h2><p>Personaliza tu identidad en ProcessOne. Tu correo y rol solo pueden modificarse mediante administración.</p>{error&&<p role="alert" className="po-auth-error">{error}</p>}{notice&&<p role="status">{notice}</p>}
 {user&&<form className="po-profile-form" onSubmit={save}><div className="po-profile-preview" aria-label="Avatar seleccionado">{avatar||user.name.slice(0,1).toUpperCase()}</div><label>Nombre visible<input required minLength={2} maxLength={120} value={name} onChange={e=>setName(e.target.value)}/></label><label>Correo electrónico<input readOnly value={user.email}/></label><label>Perfil de acceso<input readOnly value={ROLE_LABELS[user.role]}/></label><fieldset><legend>Elige tu avatar</legend><div className="po-avatar-grid">{AVATARS.map(a=><button type="button" key={a} className={avatar===a?'selected':''} aria-pressed={avatar===a} aria-label={'Avatar '+a} onClick={()=>setAvatar(a)}>{a}</button>)}</div></fieldset><button className="top-add-button" type="submit" disabled={busy}>{busy?'Guardando…':'Guardar mi perfil'}</button></form>}</section></div>;
}
