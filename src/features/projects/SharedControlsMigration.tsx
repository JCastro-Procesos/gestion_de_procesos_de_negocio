import {useState} from 'react';
import type {Workspace} from '../../domain/model';
import {controlsFor,legacyControls,mergeLegacyControls} from '../../domain/projectControls';
import {useSharedControls} from '../../app/ProjectControlsContext';
import {Button,Modal} from '../../components/ui';
export function SharedControlsMigration({workspace}:{workspace:Workspace}){
 const shared=useSharedControls(),[open,setOpen]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const local=legacyControls(),next=mergeLegacyControls(workspace,local),changed=JSON.stringify(next)!==JSON.stringify(controlsFor(workspace));
 if(!shared.canAuthorize||!changed)return null;
 return <><div className="po-readonly-note"><strong>Hay controles locales pendientes de compartir</strong><p>Presupuesto, planeación o beneficios de este navegador. La copia local se conserva; los datos compartidos existentes tienen prioridad.</p><Button onClick={()=>setOpen(true)}>Revisar traslado a MySQL</Button></div><Modal open={open} title="Compartir controles locales" onClose={()=>{if(!busy)setOpen(false)}}><p>Se agregarán sólo registros de proyectos existentes que todavía no estén en el espacio compartido.</p><ul><li>{Object.keys(next.budgets).length-Object.keys(controlsFor(workspace).budgets).length} presupuestos</li><li>{Object.keys(next.planning).length-Object.keys(controlsFor(workspace).planning).length} planes</li><li>{next.benefits.length-controlsFor(workspace).benefits.length} beneficios</li></ul><p>Se requiere autorización para trasladar presupuestos. Esta operación no borra la copia local ni incorpora decisiones de solicitudes antiguas.</p>{error&&<p role="alert">{error}</p>}<Button disabled={busy||shared.blocked} onClick={async()=>{setBusy(true);try{await shared.update(w=>({...w,projectControls:mergeLegacyControls(w,legacyControls())}));setOpen(false)}catch(e){setError(e instanceof Error?e.message:'No se pudo trasladar')}finally{setBusy(false)}}}>{busy?'Compartiendo…':'Confirmar traslado'}</Button></Modal></>;
}
