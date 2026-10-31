import {AlignmentHub} from './AlignmentHub';
import type {AlignmentCatalog} from '../../domain/alignment';
import { useEffect,useState } from 'react';
import type { Workspace } from '../../domain/model';
import { api,session,type CurrentUser } from '../../data/processoneApi';
import type {MacroInitiative} from '../../domain/macroinitiative';
import {MacroInitiativesPanel} from './MacroInitiativesPanel';
export function InitiativesPage({workspace,onSaveCatalog,onOpenProject,onNewProject}:{workspace:Workspace;onSaveCatalog:(catalog:AlignmentCatalog)=>void;onOpenProject:(id:string)=>void;onNewProject:()=>void}){
 const [items,setItems]=useState<MacroInitiative[]>([]),[user,setUser]=useState<CurrentUser|null>(null),[error,setError]=useState('');
 const canEdit=!!user&&['admin','direccion','gerencia'].includes(user.role);
 const load=async()=>{const r=await api<{initiatives:MacroInitiative[]}>('initiatives');setItems(r.initiatives);setError('')};
 useEffect(()=>{session().then(setUser).catch(e=>setError(String(e)));void load().catch(e=>setError(String(e)))},[]);
 return <AlignmentHub workspace={workspace} items={items} canEdit={canEdit} onSaveCatalog={onSaveCatalog} onOpenProject={onOpenProject} onNewProject={onNewProject}>{error&&<p role="alert" className="po-auth-error">{error}</p>}<MacroInitiativesPanel workspace={workspace} items={items} canEdit={canEdit} onReload={load} onSaveCatalog={onSaveCatalog} onOpenProject={onOpenProject}/></AlignmentHub>;
}
