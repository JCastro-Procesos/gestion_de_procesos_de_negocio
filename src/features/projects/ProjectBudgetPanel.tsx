import { useState } from 'react';
import type { Workspace } from '../../domain/model';
type Expense = { id:string;description:string;amount:number;date:string;type:'Comprometido'|'Pagado' };
type Budget = { approved:number;hourRate:number;expenses:Expense[] };
const KEY='itm-budget-costs-v1';
function read():Record<string,Budget>{try{return JSON.parse(localStorage.getItem(KEY)||'{}') as Record<string,Budget>;}catch{return {};}}
const field:React.CSSProperties={border:'1px solid #dfe5f0',borderRadius:8,padding:'8px 10px',fontSize:12,width:'100%'};
const btn:React.CSSProperties={...field,width:'auto',background:'#eaf1fb',color:'#243b67',fontWeight:700,cursor:'pointer'};
const money=(v:number)=>new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN'}).format(v);
export function ProjectBudgetPanel({workspace,projectId}:{workspace:Workspace;projectId:string}){
 const [expanded,setExpanded]=useState(false);
 const [all,setAll]=useState(read);const [desc,setDesc]=useState('');const [amount,setAmount]=useState(0);const [type,setType]=useState<Expense['type']>('Comprometido');
 const budget=all[projectId]||{approved:0,hourRate:0,expenses:[]};
 const update=(next:Budget)=>{const data={...all,[projectId]:next};setAll(data);localStorage.setItem(KEY,JSON.stringify(data));};
 const tasks=workspace.tasks.filter(t=>t.projectId===projectId);
 const estimated=tasks.reduce((n,t)=>n+t.estimatedHours,0),actual=tasks.reduce((n,t)=>n+t.actualHours,0);
 const committed=budget.expenses.filter(e=>e.type==='Comprometido').reduce((n,e)=>n+e.amount,0);
 const paid=budget.expenses.filter(e=>e.type==='Pagado').reduce((n,e)=>n+e.amount,0);
 const projectedLabor=estimated*budget.hourRate,realLabor=actual*budget.hourRate;
 const available=budget.approved-paid-committed-realLabor;
 const tiles=[['Presupuesto autorizado',money(budget.approved)],['Gastos pagados',money(paid)],['Compromisos pendientes',money(committed)],['Costo real de horas',money(realLabor)],['Saldo disponible',money(available)],['Desviación de horas',((actual-estimated)>=0?'+':'')+(actual-estimated).toFixed(1)+' h']];
 return <section style={{background:'#fff',border:'1px solid #e6eaf2',borderRadius:12,padding:16,display:'grid',gap:12}}>
 <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,flexWrap:"wrap"}}><div><strong style={{color:"#243b67",fontSize:14}}>Presupuesto y costos · MXN</strong><p style={{fontSize:11,color:"#7c8ba2"}}>Control financiero, compromisos y horas de trabajo del proyecto.</p></div><button type="button" aria-expanded={expanded} onClick={()=>setExpanded(v=>!v)} style={btn}>{expanded?"▲ Ocultar presupuesto":"▼ Ver presupuesto y costos"}</button></div>
 {expanded&&<>
 <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))',gap:9}}>{tiles.map(([label,value])=><div key={label} style={{background:'#f8faff',borderRadius:9,padding:12}}><small style={{color:'#66758e'}}>{label}</small><strong style={{display:'block',color:label==='Saldo disponible'&&available<0?'#c83f57':'#274b87',fontSize:19,marginTop:6}}>{value}</strong></div>)}</div>
 <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:10}}><label style={{fontSize:11}}>Presupuesto autorizado (MXN)<input aria-label="Presupuesto autorizado" type="number" min="0" step="0.01" style={field} value={budget.approved} onChange={e=>update({...budget,approved:Math.max(0,Number(e.target.value))})}/></label><label style={{fontSize:11}}>Tarifa interna por hora (MXN)<input aria-label="Tarifa por hora" type="number" min="0" step="0.01" style={field} value={budget.hourRate} onChange={e=>update({...budget,hourRate:Math.max(0,Number(e.target.value))})}/></label></div>
 <div style={{fontSize:11,color:'#52627e'}}>Horas estimadas: <b>{estimated.toFixed(1)} h</b> ({money(projectedLabor)}) · Horas reales: <b>{actual.toFixed(1)} h</b> ({money(realLabor)}). El costo laboral se estima con una tarifa única por proyecto; no se contabiliza automáticamente como gasto pagado.</div>
 <form onSubmit={e=>{e.preventDefault();if(!desc.trim()||amount<=0)return;update({...budget,expenses:[...budget.expenses,{id:crypto.randomUUID(),description:desc.trim(),amount,date:new Date().toISOString().slice(0,10),type}]});setDesc('');setAmount(0);}} style={{display:'flex',gap:7,flexWrap:'wrap',alignItems:'end'}}><label style={{flex:'2 1 190px',fontSize:11}}>Concepto<input required style={field} value={desc} onChange={e=>setDesc(e.target.value)} placeholder="Ej. Licencia, proveedor, traslado"/></label><label style={{flex:'1 1 100px',fontSize:11}}>Monto MXN<input required type="number" min="0.01" step="0.01" style={field} value={amount||''} onChange={e=>setAmount(Number(e.target.value))}/></label><label style={{flex:'1 1 130px',fontSize:11}}>Tipo<select style={field} value={type} onChange={e=>setType(e.target.value as Expense['type'])}><option>Comprometido</option><option>Pagado</option></select></label><button style={btn} type="submit">Agregar costo</button></form>
 {budget.expenses.length>0&&<div style={{overflowX:'auto'}}><table className="data-table"><thead><tr><th>Concepto</th><th>Fecha</th><th>Monto</th><th>Estado</th><th>Acción</th></tr></thead><tbody>{budget.expenses.map(e=><tr key={e.id}><td>{e.description}</td><td>{e.date}</td><td>{money(e.amount)}</td><td><select aria-label={'Estado '+e.description} style={field} value={e.type} onChange={v=>update({...budget,expenses:budget.expenses.map(x=>x.id===e.id?{...x,type:v.target.value as Expense['type']}:x)})}><option>Comprometido</option><option>Pagado</option></select></td><td><button type="button" style={btn} onClick={()=>{if(window.confirm('¿Eliminar este costo?'))update({...budget,expenses:budget.expenses.filter(x=>x.id!==e.id)})}}>Eliminar</button></td></tr>)}</tbody></table></div>}
 <small style={{color:'#8490a5'}}>Este módulo guarda los presupuestos en el navegador actual, separado del respaldo general. No equivale a un sistema contable ni a una autorización de gasto.</small>
 </>}</section>;
}
