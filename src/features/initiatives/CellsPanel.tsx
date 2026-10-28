import {useEffect,useState} from 'react';
import {api,session,type CurrentUser} from '../../data/processoneApi';
type Status='Borrador'|'Activa'|'Pausada'|'Archivada';
type Cell={id:number;code:string;name:string;mission:string;leader_user_id:number|null;leader_name:string|null;status:Status;capacity_hours_week:string|null};
type Member={cell_id:number;user_id:number;role:'Líder'|'Integrante';allocated_hours_week:string|null;user_name:string};
type Person={id:number;name:string;role:string};
type Assigned={userId:number;allocatedHoursPerWeek:string};
type Form={code:string;name:string;mission:string;status:Status;capacityHoursPerWeek:string;leaderUserId:string;members:Assigned[]};
const empty=():Form=>({code:'',name:'',mission:'',status:'Borrador',capacityHoursPerWeek:'',leaderUserId:'',members:[]});
export function CellsPanel(){
 const [cells,setCells]=useState<Cell[]>([]),[members,setMembers]=useState<Member[]>([]),[people,setPeople]=useState<Person[]>([]);
 const [user,setUser]=useState<CurrentUser|null>(null),[error,setError]=useState(''),[message,setMessage]=useState('');
 const [editing,setEditing]=useState<number|null>(null),[form,setForm]=useState<Form>(empty),[busy,setBusy]=useState(false);
 const canEdit=!!user&&['admin','direccion','gerencia'].includes(user.role);
 const reload=async()=>{const r=await api<{cells:Cell[];members:Member[];users:Person[]}>('cells_v12');setCells(r.cells);setMembers(r.members);setPeople(r.users);};
 useEffect(()=>{void session().then(setUser).catch(()=>{});void reload().catch(e=>setError(e instanceof Error?e.message:String(e)));},[]);
 const edit=(cell:Cell)=>{
  setEditing(cell.id);
  setForm({code:cell.code,name:cell.name,mission:cell.mission,status:cell.status,capacityHoursPerWeek:cell.capacity_hours_week??'',leaderUserId:cell.leader_user_id===null?'':String(cell.leader_user_id),members:members.filter(m=>Number(m.cell_id)===Number(cell.id)).map(m=>({userId:Number(m.user_id),allocatedHoursPerWeek:m.allocated_hours_week??''}))});
 };
 const save=async(e:React.FormEvent)=>{e.preventDefault();setBusy(true);setError('');setMessage('');
  try{
   if(form.leaderUserId&&!form.members.some(m=>m.userId===Number(form.leaderUserId)))throw new Error('El líder debe estar incluido entre los integrantes');
   await api('cells_v12',editing?'PUT':'POST',{...(editing?{id:editing}:{}),code:form.code,name:form.name,mission:form.mission,status:form.status,leaderUserId:form.leaderUserId?Number(form.leaderUserId):null,capacityHoursPerWeek:form.capacityHoursPerWeek===''?null:Number(form.capacityHoursPerWeek),members:form.members.map(m=>({userId:m.userId,allocatedHoursPerWeek:m.allocatedHoursPerWeek===''?null:Number(m.allocatedHoursPerWeek)}))});
   await reload();setEditing(null);setForm(empty());setMessage('Célula e integrantes guardados correctamente');
  }catch(err){setError(err instanceof Error?err.message:String(err));}finally{setBusy(false);}
 };
 return <section className="itm-planning-panel" aria-label="Células de optimización">
  <h2>Células de optimización</h2><p>Asigna un líder y miembros activos; una persona puede participar en varias células.</p>
  {error&&<p role="alert" className="po-auth-error">{error}</p>}{message&&<p role="status">{message}</p>}
  <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))',gap:12}}>
   {cells.map(cell=><article key={cell.id} style={{padding:14,border:'1px solid #dfe7f3',borderRadius:12}}>
    <strong>{cell.code} · {cell.name}</strong><p>{cell.mission}</p>
    <p><small>Estado: {cell.status} · Capacidad: {cell.capacity_hours_week??'Sin definir'} h/semana</small></p>
    <p><small>Líder: {cell.leader_name??'Sin asignar'} · Integrantes: {members.filter(m=>Number(m.cell_id)===Number(cell.id)).length}</small></p>
    {canEdit&&<button type="button" onClick={()=>edit(cell)}>Editar célula y equipo</button>}
   </article>)}
  </div>
  {canEdit&&<form onSubmit={save} style={{display:'grid',gap:10,maxWidth:680,marginTop:18}}>
   <h3>{editing?'Editar célula y equipo':'Registrar célula'}</h3>
   <label>Código<input className="input" required maxLength={32} pattern="[A-Za-z0-9_-]{2,32}" value={form.code} onChange={e=>setForm(x=>({...x,code:e.target.value}))}/></label>
   <label>Nombre<input className="input" required minLength={3} maxLength={190} value={form.name} onChange={e=>setForm(x=>({...x,name:e.target.value}))}/></label>
   <label>Misión<textarea className="input" maxLength={5000} value={form.mission} onChange={e=>setForm(x=>({...x,mission:e.target.value}))}/></label>
   <label>Estado<select className="input" value={form.status} onChange={e=>setForm(x=>({...x,status:e.target.value as Status}))}>{(['Borrador','Activa','Pausada','Archivada'] as const).map(v=><option key={v}>{v}</option>)}</select></label>
   <label>Capacidad semanal de la célula (horas)<input className="input" type="number" min={0} max={999999} step="0.5" value={form.capacityHoursPerWeek} onChange={e=>setForm(x=>({...x,capacityHoursPerWeek:e.target.value}))}/></label>
   <fieldset style={{border:'1px solid #dfe7f3',borderRadius:12,padding:12}}>
    <legend>Integrantes y horas semanales asignadas</legend>
    {people.map(p=>{const member=form.members.find(m=>m.userId===Number(p.id));return <div key={p.id} style={{display:'flex',gap:10,alignItems:'center',padding:5,flexWrap:'wrap'}}>
     <label style={{flex:'1 1 220px'}}><input type="checkbox" checked={!!member} onChange={e=>setForm(x=>({...x,members:e.target.checked?[...x.members,{userId:Number(p.id),allocatedHoursPerWeek:''}]:x.members.filter(m=>m.userId!==Number(p.id)),leaderUserId:!e.target.checked&&x.leaderUserId===String(p.id)?'':x.leaderUserId}))}/> {p.name} ({p.role})</label>
     {member&&<label>Horas/semana <input className="input" style={{width:115}} type="number" min={0} max={999999} step="0.5" value={member.allocatedHoursPerWeek} onChange={e=>setForm(x=>({...x,members:x.members.map(m=>m.userId===Number(p.id)?{...m,allocatedHoursPerWeek:e.target.value}:m)}))}/></label>}
    </div>})}
    {people.length===0&&<p>No hay colaboradores activos disponibles.</p>}
   </fieldset>
   <label>Líder de la célula<select className="input" value={form.leaderUserId} onChange={e=>setForm(x=>({...x,leaderUserId:e.target.value}))}>
    <option value="">Sin asignar</option>{people.filter(p=>form.members.some(m=>m.userId===Number(p.id))).map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
   </select></label>
   <div style={{display:'flex',gap:10}}><button className="top-add-button" type="submit" disabled={busy}>{busy?'Guardando…':'Guardar célula y equipo'}</button>{editing&&<button type="button" onClick={()=>{setEditing(null);setForm(empty())}}>Cancelar</button>}</div>
   <small>Los cambios en integrantes quedan registrados con fechas de vigencia; se requiere la migración v1.2 en staging antes de usar este módulo.</small>
  </form>}
 </section>;
}
