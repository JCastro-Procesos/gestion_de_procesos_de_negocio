import {createContext,useContext} from 'react';
import type {ProjectControls} from '../domain/projectControls';
import type {WorkspaceAction} from '../domain/model';
export const SharedControlsContext=createContext<{update:(action:WorkspaceAction)=>Promise<void>;canEdit:boolean;canAuthorize:boolean;blocked:boolean;isSaving:boolean}|null>(null);
export function useSharedControls(){const value=useContext(SharedControlsContext);if(!value)throw new Error('Shared controls provider missing');return value;}
export type ControlsChange=(next:ProjectControls)=>void;
