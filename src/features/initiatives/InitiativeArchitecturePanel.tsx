import {useEffect,useState} from 'react';
import {api,session,type CurrentUser} from '../../data/processoneApi';

type Initiative={id:number;title:string};
type Detail={initiative_id:number;code:string|null;initiative_level:'Corporativa'|'Departamental';parent_initiative_id:number|null;department:string|null;problem_statement:string|null;expected_benefit:string|null;scope_text:string|null;priority:'Baja'|'Media'|'Alta'|'Crítica';cell_id:number|null;sponsor_user_id:number|null;process_owner_user_id:number|null;start_date:string|null;target_date:string|null};
type Option={id:number;name:string;code?:string};
type Form={initiativeId:string;code:string;initiativeLevel:'Corporativa'|'Departamental';parentInitiativeId:string;department:string;problemStatement:string;expectedBenefit:string;scopeText:string;priority:Detail['priority'];cellId:string;sponsorUserId:string;processOwnerUserId:string;startDate:string;targetDate:string};
const blank=():Form=>({initiativeId:'',code:'',initiativeLevel:'Departamental',parentInitiativeId:'',department:'',problemStatement:'',expectedBenefit:'',scopeText:'',priority:'Media',cellId:'',sponsorUserId:'',processOwnerUserId:'',startDate:'',targetDate:''});
const style:React.CSSProperties={width:'100%',padding:9,border:'1px solid #dce5f1',borderRadius:9,background:'#fff'};
export function InitiativeArchitecturePanel({initiatives}:{initiatives:Initiative[]}){
 const [user,setUser]=useState<CurrentUser|null>(null),[details,setDetails]=useState<Detail[]>([]),[users,setUsers]=useState<Option[]>([]),[cells,setCells]=useState<Option[]>([]);
 const [form,setForm]=useState<Form>(blank),[error,setError]=useState(''),[success,setSuccess]=useState(''),[busy,setBusy]=useState(false);
 const canEdit=!!user&&['admin','direccion','gerencia'].includes(user.role);
 const reload=async()=>{const r=await api<{details:Detail[];users:Option[];cells:Option[]}>('initiative_details_v12');setDetails(r.details);setUsers(r.users);setCells(r.cells)};
 useEffect(()=>{void session().then(setUser).catch(()=>{});void reload().catch(e=>setError(String(e)))},[]);
 const choose=(id:string)=>{
  const d=details.find(x=>String(x.initiative_id)===id);
  setForm(d?{initiativeId:id,code:d.code??'',initiativeLevel:d.initiative_level,parentInitiativeId:String(d.parent_initiative_id??''),department:d.department??'',problemStatement:d.problem_statement??'',expectedBenefit:d.expected_benefit??'',scopeText:d.scope_text??'',priority:d.priority,cellId:String(d.cell_id??''),sponsorUserId:String(d.sponsor_user_id??''),processOwnerUserId:String(d.process_owner_user_id??''),startDate:d.start_date??'',targetDate:d.target_date??''}:{...blank(),initiativeId:id});
 };
 const set=(k:keyof Form,v:string)=>setForm(old=>({...old,[k]:v,...(k==='initiativeLevel'&&v==='Corporativa'?{parentInitiativeId:'',department:''}:{})}));
 const save=async(e:React.FormEvent)=>{e.preventDefault();setBusy(true);setError('');setSuccess('');try{
  await api('initiative_details_v12','POST',{...form,initiativeId:Number(form.initiativeId),parentInitiativeId:form.parentInitiativeId?Number(form.parentInitiativeId):null,cellId:form.cellId?Number(form.cellId):null,sponsorUserId:form.sponsorUserId?Number(form.sponsorUserId):null,processOwnerUserId:form.processOwnerUserId?Number(form.processOwnerUserId):null});
  await reload();setSuccess('Arquitectura de iniciativa guardada');}
  catch(err){setError(err instanceof Error?err.message:String(err))}finally{setBusy(false)}};
 const corporate=details.filter(d=>d.initiative_level==='Corporativa'&&String(d.initiative_id)!==form.initiativeId);
 return <section className="itm-planning-panel" aria-label="Arquitectura de iniciativas">
  <h2>Arquitectura de iniciativas · Bloque 2A</h2>
  <p>Completa la información estratégica sin modificar el registro ni los proyectos vinculados a cada iniciativa.</p>
  {error&&<p role="alert" className="po-auth-error">{error}</p>}{success&&<p role="status">{success}</p>}
  <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))',gap:10,marginBottom:14}}>
   <div><strong>{details.filter(x=>x.initiative_level==='Corporativa').length}</strong><small style={{display:'block'}}>Corporativas clasificadas</small></div>
   <div><strong>{details.filter(x=>x.initiative_level==='Departamental').length}</strong><small style={{display:'block'}}>Departamentales clasificadas</small></div>
   <div><strong>{initiatives.length-details.length}</strong><small style={{display:'block'}}>Pendientes de clasificar</small></div>
  </div>
  {canEdit?<form onSubmit={save} style={{display:'grid',gap:11,maxWidth:900}}>
   <label>Iniciativa existente *<select style={style} required value={form.initiativeId} onChange={e=>choose(e.target.value)}><option value="">Seleccionar iniciativa</option>{initiatives.map(i=><option key={i.id} value={i.id}>{i.title}</option>)}</select></label>
   <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:10}}>
    <label>Nivel *<select style={style} value={form.initiativeLevel} onChange={e=>set('initiativeLevel',e.target.value)}><option>Corporativa</option><option>Departamental</option></select></label>
    <label>Código<input style={style} maxLength={32} pattern="[A-Za-z0-9_-]{2,32}" value={form.code} onChange={e=>set('code',e.target.value)} placeholder="CORP-001"/></label>
    <label>Prioridad<select style={style} value={form.priority} onChange={e=>set('priority',e.target.value)}>{(['Baja','Media','Alta','Crítica'] as const).map(x=><option key={x}>{x}</option>)}</select></label>
   </div>
   {form.initiativeLevel==='Departamental'&&<div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:10}}>
    <label>Iniciativa corporativa superior *<select style={style} required value={form.parentInitiativeId} onChange={e=>set('parentInitiativeId',e.target.value)}><option value="">Seleccionar</option>{corporate.map(d=><option key={d.initiative_id} value={d.initiative_id}>{initiatives.find(i=>i.id===Number(d.initiative_id))?.title??d.code??d.initiative_id}</option>)}</select></label>
    <label>Departamento *<input style={style} required maxLength={120} value={form.department} onChange={e=>set('department',e.target.value)}/></label>
   </div>}
   <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:10}}>
    <label>Célula responsable<select style={style} value={form.cellId} onChange={e=>set('cellId',e.target.value)}><option value="">Sin asignar</option>{cells.map(x=><option key={x.id} value={x.id}>{x.code} · {x.name}</option>)}</select></label>
    <label>Patrocinador<select style={style} value={form.sponsorUserId} onChange={e=>set('sponsorUserId',e.target.value)}><option value="">Sin asignar</option>{users.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select></label>
    <label>Process Owner<select style={style} value={form.processOwnerUserId} onChange={e=>set('processOwnerUserId',e.target.value)}><option value="">Sin asignar</option>{users.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select></label>
   </div>
   <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:10}}>
    <label>Fecha de inicio<input type="date" style={style} value={form.startDate} onChange={e=>set('startDate',e.target.value)}/></label>
    <label>Fecha meta<input type="date" style={style} min={form.startDate||undefined} value={form.targetDate} onChange={e=>set('targetDate',e.target.value)}/></label>
   </div>
   <label>Problema u oportunidad<textarea style={style} maxLength={10000} rows={2} value={form.problemStatement} onChange={e=>set('problemStatement',e.target.value)}/></label>
   <label>Beneficio esperado<textarea style={style} maxLength={10000} rows={2} value={form.expectedBenefit} onChange={e=>set('expectedBenefit',e.target.value)}/></label>
   <label>Alcance<textarea style={style} maxLength={10000} rows={2} value={form.scopeText} onChange={e=>set('scopeText',e.target.value)}/></label>
   <button className="top-add-button" type="submit" disabled={busy||!form.initiativeId}>{busy?'Guardando…':'Guardar arquitectura de iniciativa'}</button>
  </form>:<p className="po-readonly-note">La clasificación y edición requiere Gerencia, Dirección o Administración.</p>}
 </section>;
}
