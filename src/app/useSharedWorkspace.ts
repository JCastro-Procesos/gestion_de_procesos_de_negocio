import {useCallback,useEffect,useRef,useState} from 'react';
import type {Workspace,WorkspaceAction} from '../domain/model';
import {createEmptyWorkspace} from '../data/storage';
import {api,ApiError,type SharedWorkspace} from '../data/processoneApi';
export function shouldApplyRemote(state:{loaded:boolean;blocked:boolean;saving:boolean;hasPending:boolean;startRevision:number;currentRevision:number;remoteRevision:number;hasRemoteWorkspace:boolean}):boolean{
 return state.loaded&&!state.blocked&&!state.saving&&!state.hasPending&&state.currentRevision===state.startRevision&&state.hasRemoteWorkspace&&state.remoteRevision>state.currentRevision;
}
export const SYNC_INTERVAL_MS=10_000;
export type SaveStatus='loading'|'saving'|'saved'|'conflict'|'error';
type Waiter={resolve:()=>void;reject:(e:Error)=>void};
export function useSharedWorkspace(){
 const [workspace,setWorkspace]=useState<Workspace>(()=>createEmptyWorkspace()),[loading,setLoading]=useState(true),[storageError,setStorageError]=useState(''),[syncWarning,setSyncWarning]=useState(''),[saveStatus,setSaveStatus]=useState<SaveStatus>('loading'),[lastSavedAt,setLastSavedAt]=useState<string|null>(null);
 const generation=useRef(0),revision=useRef(0),loaded=useRef(false),blocked=useRef(false),current=useRef<Workspace>(createEmptyWorkspace()),pending=useRef<{workspace:Workspace;waiters:Waiter[]}|null>(null),saving=useRef(false),mounted=useRef(true);
 const fail=useCallback((error:unknown)=>{
  const e=error instanceof Error?error:new Error('No se pudo guardar');blocked.current=true;
  if(mounted.current){setSaveStatus(e instanceof ApiError&&e.status===409?'conflict':'error');setStorageError(e.message+' Conserva el borrador antes de cargar la versión del servidor.');}
  return e;
 },[]);
 const flush=useCallback(async()=>{
  if(saving.current||blocked.current)return;saving.current=true;
  try{while(pending.current&&!blocked.current){const next=pending.current;pending.current=null;
   try{const result=await api<{revision:number}>('workspace','PUT',{workspace:next.workspace,revision:revision.current});revision.current=result.revision;next.waiters.forEach(w=>w.resolve());if(mounted.current){setStorageError('');setLastSavedAt(new Date().toISOString());if(!pending.current)setSaveStatus('saved')}}
   catch(error){const e=fail(error);next.waiters.forEach(w=>w.reject(e));const waiting=pending.current as {workspace:Workspace;waiters:Waiter[]}|null;waiting?.waiters.forEach(w=>w.reject(e));pending.current=null;}
  }}finally{saving.current=false}
 },[fail]);
 const reload=useCallback(async()=>{
  if(saving.current||pending.current)throw new Error('Espera a que termine el guardado antes de actualizar el espacio');
  const run=++generation.current;const result=await api<SharedWorkspace>('workspace');if(run!==generation.current||!mounted.current)return;revision.current=result.revision;current.current=result.workspace??createEmptyWorkspace();loaded.current=true;blocked.current=false;
  if(mounted.current){setWorkspace(current.current);setLoading(false);setStorageError('');setSyncWarning('');setSaveStatus('saved');setLastSavedAt(new Date().toISOString())}
 },[]);
 useEffect(()=>{mounted.current=true;void reload().catch(e=>{fail(e);setLoading(false)});return()=>{mounted.current=false;generation.current++}},[reload,fail]);
 useEffect(()=>{let inFlight=false;const refresh=async()=>{
  if(inFlight||!loaded.current||blocked.current||saving.current||pending.current||document.visibilityState==='hidden')return;
  inFlight=true;const before=revision.current;
  try{const result=await api<SharedWorkspace>('workspace');if(!mounted.current)return;setSyncWarning('');if(shouldApplyRemote({loaded:loaded.current,blocked:blocked.current,saving:saving.current,hasPending:!!pending.current,startRevision:before,currentRevision:revision.current,remoteRevision:result.revision,hasRemoteWorkspace:!!result.workspace})&&result.workspace){revision.current=result.revision;current.current=result.workspace;setWorkspace(result.workspace);setLastSavedAt(new Date().toISOString())}}
  catch{if(mounted.current)setSyncWarning('No se pudo comprobar la versión remota. Los datos visibles pueden estar desactualizados.');}finally{inFlight=false}
 };const timer=window.setInterval(refresh,SYNC_INTERVAL_MS);const visible=()=>{if(document.visibilityState==='visible')void refresh()};document.addEventListener('visibilitychange',visible);window.addEventListener('focus',visible);return()=>{window.clearInterval(timer);document.removeEventListener('visibilitychange',visible);window.removeEventListener('focus',visible)}},[]);
 useEffect(()=>{const leave=(event:BeforeUnloadEvent)=>{if(saving.current||pending.current||(blocked.current&&loaded.current)){event.preventDefault();event.returnValue=''}};window.addEventListener('beforeunload',leave);return()=>window.removeEventListener('beforeunload',leave)},[]);
 const update=useCallback((action:WorkspaceAction):Promise<void>=>{
  let promise:Promise<void>;
  if(!loaded.current||blocked.current)promise=Promise.reject(new Error('El guardado está bloqueado. Conserva el borrador y carga la versión del servidor.'));
  else{try{const next=action(current.current);if(next===current.current)return Promise.resolve();generation.current++;current.current=next;setWorkspace(next);setSaveStatus('saving');promise=new Promise((resolve,reject)=>{const waiters=[...(pending.current?.waiters??[]),{resolve,reject}];pending.current={workspace:next,waiters}});void flush()}catch(e){promise=Promise.reject(e)}}
  // Legacy callbacks may ignore the promise; explicit consumers can await acknowledgement.
  void promise.catch(()=>{});return promise;
 },[flush]);
 const replace=useCallback((next:Workspace)=>update(()=>next),[update]);
 return {workspace,update,replace,storageError,loading,saveStatus,lastSavedAt,syncWarning,reload};
}
