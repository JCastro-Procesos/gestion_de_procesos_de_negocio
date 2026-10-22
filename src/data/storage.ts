import type { Workspace } from '../domain/model';
import { DEMO_WORKSPACE } from './demo';

export const STORAGE_KEY = 'itm-project-hub-v1';
const copy = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

export function isWorkspace(value: unknown): value is Workspace {
  if (!value || typeof value !== 'object') return false;
  const data = value as Partial<Workspace>;
  return data.schemaVersion === 1 && Array.isArray(data.projects) && Array.isArray(data.stages)
    && Array.isArray(data.tasks) && Array.isArray(data.raids) && Array.isArray(data.members)
    && Array.isArray(data.timeLogs);
}

export function loadWorkspace(): Workspace {
  try {
    const serialized = localStorage.getItem(STORAGE_KEY);
    if (serialized) {
      const parsed: unknown = JSON.parse(serialized);
      if (isWorkspace(parsed)) return parsed;
    }
  } catch (error) {
    console.warn('No fue posible leer el espacio local; se iniciará una copia de demostración.', error);
  }
  return copy(DEMO_WORKSPACE);
}

export function saveWorkspace(workspace: Workspace): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(workspace));
}

export function createEmptyWorkspace(): Workspace {
  return {
    schemaVersion: 1,
    workspaceName: 'ProcessOne · Espacio de trabajo',
    projects: [], stages: [], tasks: [], raids: [], members: [], timeLogs: [],
    graphSettings: { tenantId: '', clientId: '', redirectUri: typeof window === 'undefined' ? 'http://localhost:3000' : window.location.origin, accountType: 'organizations' },
    graphConnectedName: '', graphAccountId: '',
  };
}
