import type { Project, RaidItem, RaidStatus, RaidSeverity, RaidType, Stage, Task, Workspace } from '../domain/model';
import { createEmptyWorkspace } from './storage';
import { createStages, DEFAULT_STAGE_BLUEPRINT, METHODOLOGIES } from '../domain/methodologies';

const str = (value: unknown) => String(value ?? '').trim();
const newId = (prefix: string) => `${prefix}-${crypto.randomUUID()}`;
const csvCell = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`;
const origin = () => typeof window === 'undefined' ? 'http://localhost:3000' : window.location.origin;

export function buildBackup(workspace: Workspace) {
  return {
    ...workspace,
    graphSettings: { tenantId: '', clientId: '', redirectUri: origin(), accountType: workspace.graphSettings?.accountType || 'organizations' },
    graphConnectedName: '', graphAccountId: '',
    exportedAt: new Date().toISOString(), product: 'ITM Project Hub', formatVersion: 1,
  };
}

export function downloadText(name: string, text: string, mime: string) {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url; anchor.download = name; anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 500);
}

export function exportJson(workspace: Workspace) {
  downloadText(`itm-project-hub-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(buildBackup(workspace), null, 2), 'application/json;charset=utf-8');
}

export function exportCsv(name: string, headers: string[], rows: unknown[][]) {
  const content = [headers, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n');
  downloadText(name, `\ufeff${content}`, 'text/csv;charset=utf-8');
}

export function exportProjectsCsv(workspace: Workspace) {
  exportCsv('itm-proyectos.csv', ['ID', 'Proyecto', 'Área', 'Responsable ID', 'Patrocinador', 'Metodología ID', 'Estado', 'Semáforo', 'Inicio', 'Fecha objetivo', 'Objetivo', 'Descripción'], workspace.projects.map((p) => [p.id, p.name, p.area, p.ownerId, p.sponsor, p.methodologyId, p.status, p.semaforo, p.startDate, p.dueDate, p.goal, p.description]));
}

export function exportTasksCsv(workspace: Workspace) {
  exportCsv('itm-tareas.csv', ['ID', 'Proyecto ID', 'Etapa ID', 'Tarea', 'Descripción', 'Responsable ID', 'Estado', 'Prioridad', 'Horas estimadas', 'Horas reales', 'Inicio', 'Vencimiento', 'Subtareas completadas', 'Total subtareas'], workspace.tasks.map((task) => [task.id, task.projectId, task.stageId, task.title, task.description, task.assigneeId, task.status, task.priority, task.estimatedHours, task.actualHours, task.startDate, task.dueDate, task.subtasks.filter((subtask) => subtask.done).length, task.subtasks.length]));
}

export function exportRaidCsv(workspace: Workspace) {
  exportCsv('itm-raid.csv', ['ID', 'Proyecto ID', 'Tipo', 'Severidad', 'Descripción', 'Responsable ID', 'Fecha compromiso', 'Estado', 'Respuesta'], workspace.raids.map((r) => [r.id, r.projectId, r.type, r.severity, r.description, r.ownerId, r.dueDate, r.status, r.response]));
}

export function parseCsv(text: string): string[][] {
  const rows: string[][] = []; let row: string[] = []; let cell = ''; let quoted = false;
  const source = text.replace(/^\uFEFF/, '');
  for (let i = 0; i < source.length; i += 1) {
    const char = source[i];
    if (char === '"' && quoted && source[i + 1] === '"') { cell += '"'; i += 1; }
    else if (char === '"') quoted = !quoted;
    else if (char === ',' && !quoted) { row.push(cell); cell = ''; }
    else if ((char === '\n' || char === '\r') && !quoted) { if (char === '\r' && source[i + 1] === '\n') i += 1; row.push(cell); cell = ''; if (row.some((value) => value.trim())) rows.push(row); row = []; }
    else cell += char;
  }
  if (cell.length || row.length) { row.push(cell); if (row.some((value) => value.trim())) rows.push(row); }
  if (quoted) throw new Error('El CSV contiene una celda entre comillas sin cerrar.');
  return rows;
}

const normalizeHeader = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
const taskStatuses = ['Por Hacer', 'En Proceso', 'En Revisión', 'Completado'] as const;
const projectStatuses = ['Por iniciar', 'En diagnóstico', 'En ejecución', 'En validación', 'Bloqueado', 'Completado'] as const;
const raidStatuses: RaidStatus[] = ['Abierto', 'En tratamiento', 'Escalado', 'Cerrado'];
const raidTypes: RaidType[] = ['Riesgo', 'Supuesto', 'Incidencia', 'Dependencia', 'Decisión'];
const severities: RaidSeverity[] = ['Baja', 'Media', 'Alta', 'Crítica'];
const pick = <T extends string>(value: string, allowed: readonly T[], fallback: T): T => allowed.includes(value as T) ? value as T : fallback;

export function importCsv(text: string, current: Workspace): { workspace: Workspace; message: string } {
  const rows = parseCsv(text);
  if (rows.length < 2) throw new Error('El CSV no contiene filas para importar.');
  const headers = rows[0].map(normalizeHeader);
  const idx = (...keys: string[]) => headers.findIndex((header) => keys.map(normalizeHeader).includes(header));
  const cell = (row: string[], ...keys: string[]) => { const index = idx(...keys); return index >= 0 ? str(row[index]) : ''; };
  const looksLikeTask = idx('Tarea', 'Título', 'Title') >= 0 && idx('Estado') >= 0 && idx('Prioridad') >= 0;
  const looksLikeRaid = idx('Tipo') >= 0 && idx('Severidad') >= 0 && idx('Descripción') >= 0;
  const looksLikeProject = idx('Proyecto', 'Nombre del proyecto', 'Nombre') >= 0 && idx('Área', 'UDN') >= 0;
  if (!looksLikeTask && !looksLikeRaid && !looksLikeProject) throw new Error('Las columnas no corresponden a un CSV exportado de proyectos, tareas o RAID.');
  const incoming: Workspace = structuredClone(current);
  let added = 0;
  for (const row of rows.slice(1)) {
    const itemId = cell(row, 'ID') || newId(looksLikeTask ? 'task' : looksLikeRaid ? 'raid' : 'project');
    if (looksLikeTask) {
      const projectId = cell(row, 'Proyecto ID', 'ID Proyecto') || incoming.projects[0]?.id || '';
      if (!projectId || !incoming.projects.some((project) => project.id === projectId)) throw new Error('Las tareas deben referenciar un Proyecto ID existente en el espacio actual.');
      const task: Task = {
        id: itemId, projectId, stageId: cell(row, 'Etapa ID') || incoming.stages.find((stage) => stage.projectId === projectId)?.id || '',
        title: cell(row, 'Tarea', 'Título', 'Title'), description: cell(row, 'Descripción'), assigneeId: cell(row, 'Responsable ID'),
        status: pick(cell(row, 'Estado'), taskStatuses, 'Por Hacer'), priority: pick(cell(row, 'Prioridad'), ['Baja', 'Media', 'Alta', 'Urgente'] as const, 'Media'),
        estimatedHours: Math.max(0, Number(cell(row, 'Horas estimadas')) || 0), actualHours: Math.max(0, Number(cell(row, 'Horas reales')) || 0),
        startDate: cell(row, 'Inicio'), dueDate: cell(row, 'Vencimiento'), subtasks: [],
      };
      if (!task.title) continue;
      incoming.tasks = incoming.tasks.filter((existing) => existing.id !== task.id); incoming.tasks.push(task);
    } else if (looksLikeRaid) {
      const raid: RaidItem = {
        id: itemId, projectId: cell(row, 'Proyecto ID', 'ID Proyecto'), type: pick(cell(row, 'Tipo'), raidTypes, 'Riesgo'),
        severity: pick(cell(row, 'Severidad'), severities, 'Media'), description: cell(row, 'Descripción'), ownerId: cell(row, 'Responsable ID'),
        dueDate: cell(row, 'Fecha compromiso', 'Vencimiento'), status: pick(cell(row, 'Estado'), raidStatuses, 'Abierto'),
        response: cell(row, 'Respuesta', 'Mitigación'), createdAt: cell(row, 'Fecha creación') || new Date().toISOString(),
      };
      if (!raid.description) continue;
      incoming.raids = incoming.raids.filter((existing) => existing.id !== raid.id); incoming.raids.push(raid);
    } else {
      const project: Project = {
        id: itemId, name: cell(row, 'Proyecto', 'Nombre del proyecto', 'Nombre'), area: cell(row, 'Área', 'UDN'),
        ownerId: cell(row, 'Responsable ID', 'Owner ID'), sponsor: cell(row, 'Patrocinador'), methodologyId: Number(cell(row, 'Metodología ID')) || 2,
        status: pick(cell(row, 'Estado'), projectStatuses, 'Por iniciar'), semaforo: pick(cell(row, 'Semáforo'), ['Verde', 'Amarillo', 'Rojo'] as const, 'Verde'),
        startDate: cell(row, 'Inicio'), dueDate: cell(row, 'Fecha objetivo', 'Vencimiento'), goal: cell(row, 'Objetivo'), description: cell(row, 'Descripción'),
        createdAt: new Date().toISOString().slice(0, 10), updatedAt: new Date().toISOString().slice(0, 10),
      };
      if (!project.name || !project.area) continue;
      incoming.projects = incoming.projects.filter((existing) => existing.id !== project.id); incoming.projects.push(project);
      if (!incoming.stages.some((stage) => stage.projectId === project.id)) incoming.stages.push(...createStages(project.id, project.startDate, project.dueDate, incoming.members));
    }
    added += 1;
  }
  return { workspace: incoming, message: `${added} registro(s) de ${looksLikeTask ? 'tareas' : looksLikeRaid ? 'RAID' : 'proyectos'} importado(s).` };
}

function legacyStatus(value: unknown, kind: 'stage' | 'task' | 'raid' | 'project'): string {
  const text = str(value).toLowerCase();
  if (kind === 'task') return text.includes('complet') ? 'Completado' : text.includes('revisi') ? 'En Revisión' : text.includes('proceso') ? 'En Proceso' : 'Por Hacer';
  if (kind === 'project') return text.includes('bloque') ? 'Bloqueado' : text.includes('complet') ? 'Completado' : text.includes('valid') ? 'En validación' : text.includes('diagn') ? 'En diagnóstico' : text.includes('ejec') ? 'En ejecución' : 'Por iniciar';
  if (kind === 'raid') return text.includes('cerr') || text.includes('resuelt') ? 'Cerrado' : text.includes('escal') ? 'Escalado' : text.includes('trat') ? 'En tratamiento' : 'Abierto';
  return text.includes('complet') ? 'Completada' : text.includes('bloque') ? 'Bloqueada' : text.includes('revisi') ? 'En revisión' : text.includes('curso') || text.includes('proceso') ? 'En curso' : 'Por iniciar';
}

export function importJson(value: unknown, current: Workspace, mode: 'merge' | 'replace'): { workspace: Workspace; message: string } {
  if (!value || typeof value !== 'object') throw new Error('El archivo no contiene un objeto JSON.');
  const raw = value as Record<string, unknown>;
  if (!Array.isArray(raw.projects)) throw new Error('El respaldo debe incluir un arreglo de proyectos.');
  const base = mode === 'replace' ? createEmptyWorkspace() : structuredClone(current);
  const upsert = <T extends { id: string }>(oldItems: T[], newItems: T[] = []) => { const map = new Map(oldItems.map((item) => [item.id, item])); newItems.forEach((item) => { if (item?.id) map.set(item.id, item); }); return [...map.values()]; };
  const incomingMembers = Array.isArray(raw.members) ? raw.members as Workspace['members'] : [];
  base.members = upsert(base.members, incomingMembers);
  const ownerIdFor = (value: unknown) => {
    const owner = str(value); if (!owner) return '';
    const existing = base.members.find((member) => member.id === owner || member.name.toLowerCase() === owner.toLowerCase());
    if (existing) return existing.id;
    const memberId = newId('member');
    base.members.push({ id: memberId, name: owner, role: 'Por definir', capacityHours: 36, email: '', color: '#5367d8' });
    return memberId;
  };
  const methodIdFor = (value: unknown) => {
    const numeric = Number(value); if (Number.isInteger(numeric) && METHODOLOGIES.some((item) => item.id === numeric)) return numeric;
    const text = str(value).toLowerCase(); return METHODOLOGIES.find((item) => item.name.toLowerCase() === text || item.name.toLowerCase().includes(text) && text.length > 7)?.id ?? 2;
  };
  const projects = (raw.projects as Record<string, unknown>[]).map((item, index): Project => {
    const id = str(item.id ?? item.projectId) || `project-import-${index + 1}-${crypto.randomUUID()}`;
    return {
      id, name: str(item.name ?? item.project ?? item.title) || `Proyecto importado ${index + 1}`,
      area: str(item.area ?? item.udn ?? item.businessUnit) || 'Área por definir',
      ownerId: ownerIdFor(item.ownerId ?? item.owner ?? item.responsible), sponsor: str(item.sponsor ?? item.sponsorName),
      methodologyId: methodIdFor(item.methodologyId ?? item.methodology ?? item.method), status: legacyStatus(item.status, 'project') as Project['status'],
      semaforo: pick(str(item.semaforo ?? item.signal), ['Verde', 'Amarillo', 'Rojo'] as const, 'Verde'),
      startDate: str(item.startDate ?? item.start ?? item.start_date), dueDate: str(item.dueDate ?? item.end ?? item.targetDate ?? item.due_date),
      goal: str(item.goal ?? item.objective), description: str(item.description ?? item.notes),
      createdAt: str(item.createdAt) || new Date().toISOString().slice(0, 10), updatedAt: str(item.updatedAt) || new Date().toISOString().slice(0, 10),
    };
  });
  base.projects = upsert(base.projects, projects);
  if (Array.isArray(raw.tasks)) base.tasks = upsert(base.tasks, raw.tasks.filter((item) => item && typeof item === 'object' && 'id' in item) as Task[]);
  if (Array.isArray(raw.stages)) base.stages = upsert(base.stages, raw.stages.filter((item) => item && typeof item === 'object' && 'id' in item) as Stage[]);
  if (Array.isArray(raw.raids)) base.raids = upsert(base.raids, raw.raids.filter((item) => item && typeof item === 'object' && 'id' in item) as RaidItem[]);
  if (Array.isArray(raw.timeLogs)) base.timeLogs = upsert(base.timeLogs, raw.timeLogs.filter((item) => item && typeof item === 'object' && 'id' in item) as Workspace['timeLogs']);

  if (raw.plans && typeof raw.plans === 'object') {
    const groupedIndexes = [[0], [1], [2, 3], [4, 5], [6, 7, 8, 9, 10]];
    Object.entries(raw.plans as Record<string, unknown>).forEach(([projectId, value]) => {
      if (!Array.isArray(value) || base.stages.some((stage) => stage.projectId === projectId)) return;
      const rows = value as Record<string, unknown>[];
      DEFAULT_STAGE_BLUEPRINT.forEach((blueprint, stageIndex) => {
        const grouped = groupedIndexes[stageIndex].map((index) => rows[index]).filter(Boolean);
        const activities = grouped.map((plan, index) => {
          const activityName = str(plan.activity ?? plan.name ?? plan.task) || `Actividad migrada ${index + 1}`;
          return { id: newId('activity'), name: activityName, deliverable: str(plan.deliverable ?? plan.output ?? plan.activity), ownerId: ownerIdFor(plan.owner ?? plan.responsible), startDate: str(plan.start ?? plan.startDate), dueDate: str(plan.end ?? plan.dueDate), status: legacyStatus(plan.status, 'stage') as Stage['status'], progress: Math.min(100, Math.max(0, Number(plan.progress) || 0)) };
        });
        const allDates = activities.flatMap((activity) => [activity.startDate, activity.dueDate]).filter(Boolean).sort();
        const stageProgress = activities.length ? Math.round(activities.reduce((sum, item) => sum + item.progress, 0) / activities.length) : 0;
        const stageStatus: Stage['status'] = stageProgress === 100 ? 'Completada' : activities.some((item) => item.status === 'Bloqueada') ? 'Bloqueada' : activities.some((item) => item.status === 'En revisión') ? 'En revisión' : activities.some((item) => item.status === 'En curso') ? 'En curso' : 'Por iniciar';
        base.stages.push({ id: newId('stage'), projectId, order: stageIndex + 1, name: blueprint.name, objective: blueprint.objective, startDate: allDates[0] || '', dueDate: allDates.at(-1) || '', status: stageStatus, progress: stageProgress, activities });
      });
    });
  }
  base.projects.forEach((project) => { if (!base.stages.some((stage) => stage.projectId === project.id)) base.stages.push(...createStages(project.id, project.startDate, project.dueDate, base.members)); });
  base.workspaceName = mode === 'replace' ? 'Espacio importado' : current.workspaceName;
  return { workspace: base, message: mode === 'replace' ? `${base.projects.length} proyecto(s) cargado(s) desde el respaldo.` : `Respaldo combinado: ${base.projects.length} proyecto(s) en el espacio.` };
}
