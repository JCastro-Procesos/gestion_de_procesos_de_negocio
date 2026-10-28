import {useEffect,useState} from 'react';
import {api,session,type CurrentUser} from '../../data/processoneApi';
type Cell={id:number;code:string;name:string;mission:string;leader_user_id:number|null;leader_name:string|null;status:'Borrador'|'Activa'|'Pausada'|'Archivada';capacity_hours_week:string|null};
const empty={code:'',name:'',mission:'',status:'Borrador' as Cell['status'],capacityHoursPerWeek:''};
export function CellsPanel(){
 const [cells,setCells]=useState<Cell[]>([]),[user,setUser]=useState<CurrentUser|null>(null),[error,setError]=useState(''),[message,setMessage]=useState('');
 const [editing,setEditing]=useState<number|null>(null),[form,setForm]=useState(empty),[busy,setBusy]=useState(false);
 const canEdit=!!user&&['admin','direccion','gerencia'].includes(user.role);
 const reload=async()=>{const result=await api<{cells:Cell[]}>('cells_v12');setCells(result.cells);};
 useEffect(()=>{void session().then(setUser).catch(()=>{});void reload().catch(e=>setError(String(e)));},[]);
 const edit=(cell:Cell)=>{setEditing(cell.id);setForm({code:cell.code,name:cell.name,mission:cell.mission,status:cell.status,capacityHoursPerWeek:cell.capacity_hours_week??''});};
 const save=async(e:React.FormEvent)=>{e.preventDefault();setBusy(true);setError('');setMessage('');
  try{
   await api('cells_v12',editing?'PUT':'POST',{...(editing?{id:editing}:{}),code:form.code,name:form.name,mission:form.mission,status:form.status,capacityHoursPerWeek:form.capacityHoursPerWeek===''?null:Number(form.capacityHoursPerWeek),leaderUserId:null});
   await reload();setEditing(null);setForm(empty);setMessage('Célula guardada correctamente');
  }catch(err){setError(err instanceof Error?err.message:String(err));}finally{setBusy(false);}
 };
 return <section className="itm-planning-panel" aria-label="Células de optimización">
  <h2>Células de optimización</h2><p>Catálogo de células para vincular iniciativas y proyectos en la siguiente fase.</p>
  {error&&<p role="alert" className="po-auth-error">{error}</p>}{message&&<p role="status">{message}</p>}
  <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))',gap:12}}>
   {cells.map(cell=><article key={cell.id} style={{padding:14,border:'1px solid #dfe7f3',borderRadius:12}}>
    <strong>{cell.code} · {cell.name}</strong><p>{cell.mission}</p><small>{cell.status} · Capacidad: {cell.capacity_hours_week??'Sin definir'} h/semana</small>
    {canEdit&&<div><button type="button" onClick={()=>edit(cell)}>Editar célula</button></div>}
   </article>)}
  </div>
  {canEdit&&<form onSubmit={save} style={{display:'grid',gap:10,maxWidth:620,marginTop:18}}>
   <h3>{editing?'Editar célula':'Registrar célula'}</h3>
   <label>Código<input className="input" required maxLength={32} pattern="[A-Za-z0-9_-]{2,32}" value={form.code} onChange={e=>setForm(x=>({...x,code:e.target.value}))}/></label>
   <label>Nombre<input className="input" required minLength={3} maxLength={190} value={form.name} onChange={e=>setForm(x=>({...x,name:e.target.value}))}/></label>
   <label>Misión<textarea className="input" maxLength={5000} value={form.mission} onChange={e=>setForm(x=>({...x,mission:e.target.value}))}/></label>
   <label>Estado<select className="input" value={form.status} onChange={e=>setForm(x=>({...x,status:e.target.value as Cell['status']}))}>{(['Borrador','Activa','Pausada','Archivada'] as const).map(v=><option key={v}>{v}</option>)}</select></label>
   <label>Capacidad semanal (horas)<input className="input" type="number" min={0} max={999999} step="0.5" value={form.capacityHoursPerWeek} onChange={e=>setForm(x=>({...x,capacityHoursPerWeek:e.target.value}))}/></label>
   <div style={{display:'flex',gap:10}}><button className="top-add-button" type="submit" disabled={busy}>{busy?'Guardando…':'Guardar célula'}</button>{editing&&<button type="button" onClick={()=>{setEditing(null);setForm(empty)}}>Cancelar</button>}</div>
   <small>La asignación de líder e integrantes se habilitará después de conectar el directorio de usuarios.</small>
  </form>}
 </section>;
}
