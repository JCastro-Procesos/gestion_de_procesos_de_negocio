import { describe, expect, it } from 'vitest';
import type { Project, Stage, Task, Workspace } from './model';
import { executiveMetrics, lateMilestones, memberWorkload, projectProgress } from './metrics';
import { DEMO_WORKSPACE } from '../data/demo';
import { buildBackup, importCsv, importJson, parseCsv } from '../data/exchange';

const project: Project = { id: 'p', name: 'Proceso', area: 'Operaciones', ownerId: 'm', sponsor: '', methodologyId: 2, status: 'En ejecución', semaforo: 'Verde', startDate: '2020-01-01', dueDate: '', goal: '', description: '', createdAt: '2020-01-01', updatedAt: '2020-01-01' };
const stage = (id: string, progress: number, dueDate = ''): Stage => ({ id, projectId: 'p', order: Number(id), name: `Etapa ${id}`, objective: '', startDate: '', dueDate, status: progress === 100 ? 'Completada' : 'En curso', progress, activities: [] });
const baseWorkspace = (): Workspace => ({ schemaVersion: 1, workspaceName: 'Prueba', projects: [project], stages: [stage('1', 40), stage('2', 80)], tasks: [], raids: [], members: [{ id: 'm', name: 'Ana Consultora', role: 'Consultora', capacityHours: 20, email: '', color: '#5367d8' }], timeLogs: [], graphSettings: { tenantId: '', clientId: '', redirectUri: 'http://localhost:3000', accountType: 'organizations' }, graphConnectedName: '', graphAccountId: '' });

describe('métricas de proyectos', () => {
  it('promedia el progreso de las cinco etapas sin promediar por actividad', () => {
    expect(projectProgress('p', [stage('1', 40), stage('2', 80)])).toBe(60);
    expect(projectProgress('sin-etapas', [])).toBe(0);
  });
  it('cuenta riesgos de forma excluyente y detecta hitos vencidos', () => {
    const workspace = baseWorkspace();
    workspace.projects.push({ ...project, id: 'p2', semaforo: 'Rojo' });
    workspace.stages.push(stage('3', 0, '2000-01-01'));
    const metrics = executiveMetrics(workspace);
    expect(metrics.total).toBe(2);
    expect(metrics.critical.some((item) => item.id === 'p2')).toBe(true);
    expect(metrics.green + metrics.yellow + metrics.red).toBe(metrics.total);
    expect(lateMilestones(workspace).some((item) => item.label === 'Etapa 3')).toBe(true);
  });
  it('contrasta la demanda abierta con capacidad, separada de horas reales', () => {
    const workspace = baseWorkspace();
    workspace.tasks = [{ id: 't', projectId: 'p', stageId: '1', title: 'Analizar', description: '', assigneeId: 'm', status: 'En Proceso', priority: 'Alta', estimatedHours: 30, actualHours: 5, startDate: '', dueDate: '', subtasks: [] } satisfies Task];
    expect(memberWorkload(workspace.members[0], workspace.tasks)).toMatchObject({ openTasks: 1, estimated: 30, real: 5, load: 150 });
  });
});

describe('intercambio de datos', () => {
  it('interpreta comas y comillas escapadas en CSV', () => {
    expect(parseCsv('Nombre,Nota\r\n"Proceso, compras","Dijo ""aprobado"""')).toEqual([['Nombre','Nota'], ['Proceso, compras','Dijo "aprobado"']]);
    expect(() => parseCsv('A,B\n"sin cierre,valor')).toThrow(/comillas/);
  });
  it('importa tareas CSV por ID y valida el proyecto de referencia', () => {
    const workspace = baseWorkspace();
    const result = importCsv('ID,Proyecto ID,Tarea,Estado,Prioridad,Horas estimadas,Horas reales\nt-1,p,Validar muestra,En Proceso,Alta,4,1.5', workspace);
    expect(result.workspace.tasks[0]).toMatchObject({ id: 't-1', projectId: 'p', title: 'Validar muestra', estimatedHours: 4, actualHours: 1.5 });
    expect(() => importCsv('Proyecto ID,Tarea,Estado,Prioridad\nno-existe,T,Por Hacer,Media', workspace)).toThrow(/Proyecto ID/);
  });
  it('importa filas CSV de RAID y conserva su severidad, estado y proyecto', () => {
    const result = importCsv('ID,Proyecto ID,Tipo,Severidad,Descripción,Estado\nr-1,p,Riesgo,Crítica,Acceso bloqueado,En tratamiento', baseWorkspace());
    expect(result.workspace.raids[0]).toMatchObject({ id: 'r-1', projectId: 'p', type: 'Riesgo', severity: 'Crítica', status: 'En tratamiento' });
  });
  it('migra un plan heredado de siete pasos a cinco etapas manteniendo actividades', () => {
    const raw = { projects: [{ id: 'legacy', name: 'Proyecto kit', area: 'UDN', owner: 'Paula Líder', methodology: 'Portafolio de Iniciativas y Transformación' }], plans: { legacy: Array.from({ length: 7 }, (_, index) => ({ stage: `Paso ${index + 1}`, activity: `Actividad ${index + 1}`, owner: 'Paula Líder', start: '2026-01-01', end: '2026-01-07', status: index < 2 ? 'Completado' : 'En proceso', progress: index < 2 ? 100 : 25 })) } };
    const result = importJson(raw, DEMO_WORKSPACE, 'replace');
    expect(result.workspace.projects[0].methodologyId).toBe(3);
    expect(result.workspace.stages.filter((item) => item.projectId === 'legacy')).toHaveLength(5);
    expect(result.workspace.stages.find((item) => item.projectId === 'legacy' && item.order === 3)?.activities).toHaveLength(2);
    expect(result.workspace.members.some((member) => member.name === 'Paula Líder')).toBe(true);
  });
  it('excluye los datos de conexión de Graph del JSON exportable', () => {
    const backup = buildBackup({ ...DEMO_WORKSPACE, graphSettings: { tenantId: 'tenant-real', clientId: 'client-real', redirectUri: 'https://example.com', accountType: 'organizations' }, graphConnectedName: 'Ana', graphAccountId: 'home-account' });
    expect(backup.graphSettings.clientId).toBe('');
    expect(backup.graphSettings.tenantId).toBe('');
    expect(backup.graphConnectedName).toBe('');
  });
});
