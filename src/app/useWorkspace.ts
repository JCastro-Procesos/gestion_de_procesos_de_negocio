import { useCallback, useEffect, useState } from 'react';
import type { Workspace, WorkspaceAction } from '../domain/model';
import { loadWorkspace, saveWorkspace } from '../data/storage';

export function useWorkspace() {
  const [workspace, setWorkspace] = useState<Workspace>(() => loadWorkspace());
  const [storageError, setStorageError] = useState('');

  useEffect(() => {
    try { saveWorkspace(workspace); setStorageError(''); }
    catch { setStorageError('No fue posible guardar en este navegador. Descarga un respaldo JSON y revisa el espacio disponible.'); }
  }, [workspace]);

  const update = useCallback((action: WorkspaceAction) => {
    setWorkspace((current) => action(current));
  }, []);

  const replace = useCallback((next: Workspace) => setWorkspace(next), []);

  return { workspace, update, replace, storageError };
}
