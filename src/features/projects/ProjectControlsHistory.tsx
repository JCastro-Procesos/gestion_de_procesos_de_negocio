import {useState} from 'react';
import {api} from '../../data/processoneApi';
import {Button,Modal} from '../../components/ui';
import {useSharedControls} from '../../app/ProjectControlsContext';
type Version={revision:number;actor:string;at:string;approved:number|null;hourRate:number|null;paid:number;committed:number;baselineActivities:number;benefits:number};
export function ProjectControlsHistory({projectId}:{projectId:string}){
 const shared=useSharedControls(),[open,setOpen]=useState(false),[rows,setRows]=useState<Version[]>([]),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 if(!shared.canAuthorize)return null;
 return <><Button onClick={async()=>{setOpen(true);setBusy(true);setError('');try{const r=await api<{versions:Version[]}>('project_controls_history','GET',undefined,{projectId});setRows(r.versions)}catch(e){setError(e instanceof Error?e.message:'No se pudo cargar')}finally{setBusy(false)}}}>Historial de controles compartidos</Button><Modal open={open} title="Historial de controles del proyecto" onClose={()=>setOpen(false)} size="xl"><p>Instantáneas confirmadas del espacio compartido. Se conservan desde la activación de este bloque; no reconstruyen cambios locales anteriores. Mostradas dentro de las últimas 200 versiones globales.</p>{busy&&<p role="status">Cargando historial…</p>}{error&&<p role="alert">{error}</p>}<div className="table-scroll"><table className="data-table"><thead><tr><th>Versión / fecha</th><th>Registró</th><th>Autorizado / tarifa</th><th>Pagado / comprometido</th><th>Actividades base / beneficios</th></tr></thead><tbody>{rows.map(r=><tr key={r.revision}><td>{r.revision} · {r.at}</td><td>{r.actor}</td><td>{r.approved??'—'} / {r.hourRate??'—'} MXN</td><td>{r.paid} / {r.committed} MXN</td><td>{r.baselineActivities} / {r.benefits}</td></tr>)}</tbody></table></div>{!busy&&!error&&!rows.length&&<p>Aún no hay versiones de controles para este proyecto.</p>}</Modal></>;
}
