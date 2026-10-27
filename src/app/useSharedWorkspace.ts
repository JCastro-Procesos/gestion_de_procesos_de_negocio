import { useCallback, useEffect, useRef, useState } from 'react';
import type { Workspace, WorkspaceAction } from '../domain/model';
import { createEmptyWorkspace } from '../data/storage';
import { api, type SharedWorkspace } from '../data/processoneApi';

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
