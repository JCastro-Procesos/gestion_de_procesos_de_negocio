import { useCallback, useEffect, useRef, useState } from 'react';
import type { Workspace, WorkspaceAction } from '../domain/model';
import { createEmptyWorkspace } from '../data/storage';
import { api, type SharedWorkspace } from '../data/processoneApi';

/** Decide si una versión remota puede reemplazar la local sin perder cambios. */
export function shouldApplyRemote(state:{loaded:boolean;blocked:boolean;saving:boolean;hasPending:boolean;startRevision:number;currentRevision:number;remoteRevision:number;hasRemoteWorkspace:boolean}):boolean {
 if(!state.loaded || state.blocked || state.saving || state.hasPending) return false;
 if(state.currentRevision !== state.startRevision) return false; // hubo una escritura local durante la consulta
 return state.hasRemoteWorkspace && state.remoteRevision > state.currentRevision;
}

/** Cada cuánto se consultan cambios hechos en otras sesiones. */
export const SYNC_INTERVAL_MS = 10_000;

/** Serializa escrituras y bloquea ediciones cuando existe un conflicto remoto. */
export function useSharedWorkspace() {
 const [workspace,setWorkspace] = useState<Workspace>(()=>createEmptyWorkspace());
 const [loading,setLoading] = useState(true);
 const [storageError,setStorageError] = useState('');
 const revision = useRef(0);
 const loaded = useRef(false);
 const blocked = useRef(false);
 const current = useRef<Workspace>(createEmptyWorkspace());
 const pending = useRef<Workspace|null>(null);
 const saving = useRef(false);
 const mounted = useRef(true);

 const flush = useCallback(async () => {
  if(saving.current || blocked.current) return;
  saving.current = true;
  try {
   while(pending.current && !blocked.current) {
    const next = pending.current;
    pending.current = null;
    try {
     const result = await api<{revision:number}>('workspace','PUT',{workspace:next,revision:revision.current});
     revision.current = result.revision;
     if(mounted.current) setStorageError('');
    } catch(error) {
     // Nunca sobrescribir silenciosamente cambios de otro colaborador.
     blocked.current = true;
     pending.current = null;
     if(mounted.current) setStorageError(error instanceof Error ? error.message+' Recarga la página para recuperar la versión del servidor antes de editar.' : 'No se pudo guardar. Recarga la página antes de continuar.');
    }
   }
  } finally { saving.current = false; }
 }, []);

 useEffect(() => {
  mounted.current = true;
  api<SharedWorkspace>('workspace').then(result => {
   if(!mounted.current) return;
   revision.current = result.revision;
   current.current = result.workspace ?? createEmptyWorkspace();
   setWorkspace(current.current);
   loaded.current = true;
  }).catch(error => {
   blocked.current = true;
   if(mounted.current) setStorageError(error instanceof Error ? error.message : 'No se pudo cargar el espacio compartido');
  }).finally(() => {if(mounted.current) setLoading(false);});
  return () => {mounted.current = false;};
 }, []);

 // Sincronización entre sesiones: consulta periódica y al volver a la pestaña.
 // Solo aplica la versión remota si no hay cambios locales pendientes, para no perder ediciones.
 useEffect(() => {
  let inFlight = false;
  const refresh = async () => {
   if(inFlight || !loaded.current || blocked.current || saving.current || pending.current) return;
   if(typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
   inFlight = true;
   const startRevision = revision.current;
   try {
    const result = await api<SharedWorkspace>('workspace');
    if(!mounted.current) return;
    if(shouldApplyRemote({loaded:loaded.current,blocked:blocked.current,saving:saving.current,hasPending:!!pending.current,startRevision,currentRevision:revision.current,remoteRevision:result.revision,hasRemoteWorkspace:!!result.workspace}) && result.workspace) {
     revision.current = result.revision;
     current.current = result.workspace;
     setWorkspace(result.workspace);
    }
   } catch { /* sin conexión o sesión expirada: se reintenta en el siguiente ciclo */ }
   finally { inFlight = false; }
  };
  const timer = window.setInterval(refresh, SYNC_INTERVAL_MS);
  const onVisible = () => { if(document.visibilityState === 'visible') void refresh(); };
  document.addEventListener('visibilitychange', onVisible);
  window.addEventListener('focus', onVisible);
  return () => { window.clearInterval(timer); document.removeEventListener('visibilitychange', onVisible); window.removeEventListener('focus', onVisible); };
 }, []);

 const update = useCallback((action:WorkspaceAction) => {
  if(!loaded.current || blocked.current) return;
  // Calcular una sola vez fuera del setter evita efectos secundarios en render de React.
  const next = action(current.current);
  current.current = next;
  pending.current = next;
  setWorkspace(next);
  void flush();
 },[flush]);

 const replace = useCallback((next:Workspace) => {
  if(!loaded.current || blocked.current) return;
  current.current = next;
  pending.current = next;
  setWorkspace(next);
  void flush();
 },[flush]);

 return {workspace,update,replace,storageError,loading};
}
