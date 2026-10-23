import {useEffect,useState} from 'react';
import {api,session,type CurrentUser} from '../../data/processoneApi';
type Event={id:number;action:string;entity_type:string;entity_id:string;created_at:string;actor:string|null};
export function AuditPage(){
 const [user,setUser]=useState<CurrentUser|null>(null),[events,setEvents]=useState<Event[]>([]),[offset,setOffset]=useState(0),[error,setError]=useState(''),[loading,setLoading]=useState(false);
 useEffect(()=>{void session().then(setUser).catch(e=>setError(String(e)));},[]);
 useEffect(()=>{if(user?.role!=='admin')return;setLoading(true);void api<{events:Event[]}>('audit&limit=50&offset='+offset).then(r=>setEvents(r.events)).catch(e=>setError(String(e))).finally(()=>setLoading(false));},[user,offset]);
 return <div className="page-stack"><section className="itm-planning-panel"><h2>Historial de cambios</h2><p>Eventos registrados por el servidor. Solo lectura; no incluye contraseñas ni tokens.</p>
 {user?.role!=='admin'?<p>Esta consulta está reservada para Administración.</p>:<>
 {error&&<div className="po-auth-error" role="alert">{error}</div>}
 <div style={{overflowX:'auto'}}><table className="data-table"><thead><tr><th>Fecha</th><th>Usuario</th><th>Acción</th><th>Entidad</th><th>Identificador</th></tr></thead><tbody>{events.map(e=><tr key={e.id}><td>{e.created_at}</td><td>{e.actor||'Sistema'}</td><td>{e.action}</td><td>{e.entity_type}</td><td>{e.entity_id}</td></tr>)}</tbody></table></div>
 {loading&&<p>Cargando…</p>}<div style={{display:'flex',gap:12,marginTop:12}}><button disabled={offset===0||loading} onClick={()=>setOffset(v=>Math.max(0,v-50))}>Anterior</button><button disabled={events.length<50||loading} onClick={()=>setOffset(v=>v+50)}>Siguiente</button></div>
 </>}</section></div>;
}
