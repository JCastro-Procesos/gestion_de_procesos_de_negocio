import { describe, expect, it } from 'vitest';
import { shouldApplyRemote } from './useSharedWorkspace';

const base = { loaded: true, blocked: false, saving: false, hasPending: false, startRevision: 5, currentRevision: 5, remoteRevision: 6, hasRemoteWorkspace: true };

describe('sincronización entre sesiones', () => {
  it('aplica la versión remota más nueva cuando no hay cambios locales', () => {
    expect(shouldApplyRemote(base)).toBe(true);
  });
  it('no aplica si la versión remota no es más nueva', () => {
    expect(shouldApplyRemote({ ...base, remoteRevision: 5 })).toBe(false);
  });
  it('no pisa cambios locales pendientes o en guardado', () => {
    expect(shouldApplyRemote({ ...base, hasPending: true })).toBe(false);
    expect(shouldApplyRemote({ ...base, saving: true })).toBe(false);
  });
  it('descarta la respuesta si hubo una escritura local durante la consulta', () => {
    expect(shouldApplyRemote({ ...base, currentRevision: 6, remoteRevision: 7 })).toBe(false);
  });
  it('no aplica si el espacio está bloqueado por conflicto o aún no carga', () => {
    expect(shouldApplyRemote({ ...base, blocked: true })).toBe(false);
    expect(shouldApplyRemote({ ...base, loaded: false })).toBe(false);
  });
  it('no aplica si el servidor no devuelve espacio', () => {
    expect(shouldApplyRemote({ ...base, hasRemoteWorkspace: false })).toBe(false);
  });
});
