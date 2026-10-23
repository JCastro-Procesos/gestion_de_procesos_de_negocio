import { useCallback, useEffect, useRef, useState } from 'react';
import type { Workspace,WorkspaceAction } from '../domain/model';
import { createEmptyWorkspace } from '../data/storage';
import { api,type SharedWorkspace } from '../data/processoneApi';
export function useSharedWorkspace(){
 const [workspace,setWorkspace]=useState<Workspace>(()=>createEmptyWorkspace());
 const [loading,setLoading]=useState(true);const [storageError,setStorageError]=useState('');
 const revision=useRef(0);const loaded=useRef(false);const pending=useRef<Workspace|null>(null);const saving=useRef(false);
 const flush=useCallback(async()=>{
  if(saving.current)return;saving.current=true;
  try{
   while(pending.current){
    const next=pending.current;pending.current=null;
    try{const result=await api<{revision:number}>('workspace','PUT',{workspace:next,revision:revision.current});revision.current=result.revision;setStorageError('')}
    catch(e){setStorageError(e instanceof Error?e.message:'Error al guardar.');pending.current=null;break}
   }
  }finally{saving.current=false}
 },[]);
 useEffect(()=>{api<SharedWorkspace>('workspace').then(r=>{revision.current=r.revision;setWorkspace(r.workspace??createEmptyWorkspace());loaded.current=true}).catch(e=>setStorageError(e instanceof Error?e.message:'No se pudo cargar el espacio compartido')).finally(()=>setLoading(false))},[]);
 const update=useCallback((action:WorkspaceAction)=>{if(!loaded.current)return;setWorkspace(current=>{const next=action(current);pending.current=next;void flush();return next})},[flush]);
 const replace=useCallback((next:Workspace)=>{if(!loaded.current)return;pending.current=next;setWorkspace(next);void flush()},[flush]);
 return {workspace,update,replace,storageError,loading};
}
