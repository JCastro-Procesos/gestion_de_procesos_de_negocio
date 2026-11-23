import {useState} from 'react';
import type {Workspace} from '../domain/model';
import type {SaveStatus} from './useSharedWorkspace';
import {downloadText,buildBackup} from '../data/exchange';
import {Button} from '../components/ui';
export function SharedSaveStatus({status,at,error,workspace,onReload}:{status:SaveStatus;at:string|null;error:string;workspace:Workspace;onReload:()=>Promise<void>}){
 const [busy,setBusy]=useState(false),[message,setMessage]=useState('');const failed=status==='error'||status==='conflict';
 return <section className={'po-shared-save '+(failed?'po-shared-save-error':'')} aria-label="Estado de guardado compartido"><div role="status" aria-live="polite"><strong>{status==='saving'?'Guardando en MySQL…':status==='conflict'?'Conflicto: borrador sin confirmar':status==='error'?'Cambios sin confirmar en el servidor':status==='loading'?'Conectando…':'Datos confirmados por MySQL'}</strong>{at&&<small>Última confirmación: {new Date(at).toLocaleTimeString('es-MX')}</small>}</div>{failed&&<><p>{error}</p><div className="modal-actions"><Button onClick={()=>downloadText('ProcessOne_borrador_sin_confirmar.json',JSON.stringify({...buildBackup(workspace),unconfirmedDraft:true},null,2),'application/json')}>Descargar borrador sin confirmar</Button><Button disabled={busy} onClick={async()=>{if(!window.confirm('Se reemplazará el borrador visible con la versión del servidor. Descarga primero el borrador si necesitas conservarlo. ¿Continuar?'))return;setBusy(true);try{await onReload();setMessage('')}catch(e){setMessage(e instanceof Error?e.message:'No se pudo cargar')}finally{setBusy(false)}}}>{busy?'Cargando…':'Cargar versión del servidor'}</Button></div>{message&&<p role="alert">{message}</p>}</>}</section>;
}
