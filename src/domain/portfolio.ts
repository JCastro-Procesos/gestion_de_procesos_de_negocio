/**
 * ProcessOne · Lógica de portafolio para las vistas por macroiniciativa, metodología y trabajo personal.
 * Son funciones puras y aditivas: no modifican el modelo guardado ni las reglas de avance oficiales.
 */
import type {Activity, Project, Stage, StageStatus, TaskPriority, TaskStatus, Workspace} from './model';
import {projectIsAtRisk} from './metrics';
import {officialProjectProgress} from './projectProgress';
import {progressForActivityStatus} from './activityProgress';

/* ───────────── Tipos de proyecto ───────────── */

/**
 * Un proyecto puede:
 *  · Estratégico  → aportar a una macroiniciativa y trabajar con una metodología (libro de trabajo).
 *  · Metodológico → no pertenecer a una macroiniciativa, pero elaborarse con un libro de trabajo.
 *  · Análisis     → no requerir macroiniciativa ni metodología (estudio, diagnóstico o trabajo puntual).
 * El tipo se deduce de los datos del proyecto; así los proyectos históricos siguen siendo válidos.
 */
export type ProjectKind = 'Estratégico' | 'Metodológico' | 'Análisis';
export interface KindInfo { id: ProjectKind; label: string; short: string; description: string; needsMacro: boolean; needsMethod: boolean }
export const PROJECT_KINDS: readonly KindInfo[] = [
  { id: 'Estratégico', label: 'Ligado a una macroiniciativa', short: 'Macroiniciativa', description: 'Aporta a una macroiniciativa y se elabora con una metodología. Sus actividades se cargan automáticamente.', needsMacro: true, needsMethod: true },
  { id: 'Metodológico', label: 'Solo con metodología', short: 'Metodología', description: 'No pertenece a una macroiniciativa; usa un libro de trabajo (metodología) para elaborarse y carga sus actividades.', needsMacro: false, needsMethod: true },
  { id: 'Análisis', label: 'Análisis o trabajo libre', short: 'Análisis', description: 'Sin macroiniciativa ni metodología: estudio, diagnóstico o trabajo puntual con las seis etapas base.', needsMacro: false, needsMethod: false },
];
export const NO_METHODOLOGY = 0;
type KindFields = Pick<Project, 'initiativeId' | 'methodologyId'>;
export const hasMacro = (p: Pick<Project, 'initiativeId'>) => Number(p.initiativeId) > 0;
export const hasMethodology = (p: Pick<Project, 'methodologyId'>) => Number(p.methodologyId) > 0;
export function projectKind(p: KindFields): ProjectKind {
  if (hasMacro(p)) return 'Estratégico';
  return hasMethodology(p) ? 'Metodológico' : 'Análisis';
}
export const kindInfo = (kind: ProjectKind) => PROJECT_KINDS.find(k => k.id === kind)!;

/** Valida la combinación elegida al crear un proyecto. Devuelve el mensaje de error o ''. */
export function validateProjectLinks(p: KindFields, allowedMethodIds: readonly number[] | null, catalogMethodIds: readonly number[]): string {
  if (hasMacro(p)) {
    if (!hasMethodology(p)) return 'Un proyecto ligado a una macroiniciativa necesita una metodología.';
    if (allowedMethodIds && allowedMethodIds.length && !allowedMethodIds.includes(Number(p.methodologyId))) return 'La metodología no está vinculada a esa macroiniciativa.';
  }
  if (hasMethodology(p) && !catalogMethodIds.includes(Number(p.methodologyId))) return 'La metodología elegida no existe en el catálogo.';
  return '';
}

/* ───────────── Macroiniciativas: código y color ───────────── */

export interface MacroLike { id: number; title: string; objective?: string; status?: string; profile?: { code?: string } | null }
export interface MacroMeta { id: number; code: string; title: string; color: string; tint: string; ink: string; index: number }
/** Cada color se usa como acento; el texto sobre fondo claro usa la variante `ink` para mantener contraste. */
export const MACRO_PALETTE = [
  { color: '#1565c0', tint: '#e6f0fc', ink: '#0d4a92' },
  { color: '#0aa89f', tint: '#e0f7f5', ink: '#0a6b66' },
  { color: '#7c5cc4', tint: '#efeafb', ink: '#5a3d9c' },
  { color: '#e0872b', tint: '#fdf0e0', ink: '#8f5207' },
  { color: '#d6455d', tint: '#fde8ec', ink: '#a02339' },
  { color: '#4f8a3b', tint: '#e8f4e3', ink: '#33621f' },
] as const;
export const UNLINKED_META: Omit<MacroMeta, 'id' | 'index'> = { code: '—', title: 'Sin macroiniciativa', color: '#7b8aa5', tint: '#eef1f6', ink: '#47566f' };
export function macroMetas(items: readonly MacroLike[]): MacroMeta[] {
  return [...items].sort((a, b) => a.id - b.id).map((item, index) => {
    const palette = MACRO_PALETTE[index % MACRO_PALETTE.length];
    const declared = item.profile?.code?.trim();
    return { id: item.id, code: declared && /^M\d+$/i.test(declared) ? declared.toUpperCase() : 'M' + (index + 1), title: item.title, index, ...palette };
  });
}
export function macroOf(metas: readonly MacroMeta[], id: number | null | undefined): MacroMeta | null {
  return Number(id) > 0 ? metas.find(m => m.id === Number(id)) ?? null : null;
}

/* ───────────── Etapas y estados ───────────── */

export const STAGE_STATUS_ORDER: readonly StageStatus[] = ['Por iniciar', 'En curso', 'En revisión', 'Bloqueada', 'Completada'];
export const BOARD_STATUSES: readonly StageStatus[] = ['Por iniciar', 'En curso', 'En revisión', 'Completada'];
export const TASK_STATUSES: readonly TaskStatus[] = ['Por Hacer', 'En Proceso', 'En Revisión', 'Completado'];
export const TASK_TO_STAGE_STATUS: Record<TaskStatus, StageStatus> = { 'Por Hacer': 'Por iniciar', 'En Proceso': 'En curso', 'En Revisión': 'En revisión', Completado: 'Completada' };
export const STAGE_TO_TASK_STATUS: Record<StageStatus, TaskStatus> = { 'Por iniciar': 'Por Hacer', 'En curso': 'En Proceso', 'En revisión': 'En Revisión', Completada: 'Completado', Bloqueada: 'Por Hacer' };
export const isDone = (s: StageStatus) => s === 'Completada';
const today = () => new Date().toISOString().slice(0, 10);
const addDays = (days: number) => { const d = new Date(); d.setDate(d.getDate() + days); return d.toISOString().slice(0, 10); };

/** Etapa en la que está hoy un proyecto: la primera en curso/revisión/bloqueada; si no, la primera sin completar. */
export function currentStage(stages: readonly Stage[]): Stage | null {
  const sorted = [...stages].sort((a, b) => a.order - b.order);
  if (!sorted.length) return null;
  return sorted.find(s => ['En curso', 'En revisión', 'Bloqueada'].includes(s.status)) ?? sorted.find(s => s.status !== 'Completada') ?? null;
}
export const projectIsComplete = (stages: readonly Stage[]) => stages.length > 0 && stages.every(s => s.status === 'Completada');

/* ───────────── Elementos de trabajo (actividades + tareas) ───────────── */

export interface WorkItem {
  key: string; kind: 'activity' | 'task'; id: string; projectId: string; stageId: string; stageOrder: number; stageName: string;
  title: string; detail: string; status: StageStatus; ownerId: string; dueDate: string; overdue: boolean; dueSoon: boolean;
  priority?: TaskPriority; progress?: number; evidenceUrl?: string; source?: 'Metodología' | 'Macroiniciativa' | 'Manual'; hours?: { actual: number; estimated: number };
}
const isOpen = (s: StageStatus) => s !== 'Completada';
function flags(due: string, status: StageStatus) {
  const open = isOpen(status);
  return { overdue: open && !!due && due < today(), dueSoon: open && !!due && due >= today() && due <= addDays(7) };
}
export function activityItems(ws: Workspace, filter: { ownerId?: string; projectIds?: ReadonlySet<string> } = {}): WorkItem[] {
  const out: WorkItem[] = [];
  for (const stage of ws.stages) {
    if (filter.projectIds && !filter.projectIds.has(stage.projectId)) continue;
    for (const a of stage.activities) {
      if (filter.ownerId !== undefined && a.ownerId !== filter.ownerId) continue;
      out.push({ key: 'a:' + a.id, kind: 'activity', id: a.id, projectId: stage.projectId, stageId: stage.id, stageOrder: stage.order, stageName: stage.name, title: a.name, detail: a.deliverable || '', status: a.status, ownerId: a.ownerId, dueDate: a.dueDate, ...flags(a.dueDate, a.status), progress: a.progress, evidenceUrl: a.evidenceUrl, source: a.origin?.kind ?? 'Manual' });
    }
  }
  return out;
}
export function taskItems(ws: Workspace, filter: { assigneeId?: string; projectIds?: ReadonlySet<string> } = {}): WorkItem[] {
  const out: WorkItem[] = [];
  for (const t of ws.tasks) {
    if (filter.projectIds && !filter.projectIds.has(t.projectId)) continue;
    if (filter.assigneeId !== undefined && t.assigneeId !== filter.assigneeId) continue;
    const stage = ws.stages.find(s => s.id === t.stageId);
    const status = TASK_TO_STAGE_STATUS[t.status];
    out.push({ key: 't:' + t.id, kind: 'task', id: t.id, projectId: t.projectId, stageId: t.stageId, stageOrder: stage?.order ?? 0, stageName: stage?.name ?? 'Sin etapa', title: t.title, detail: t.description || '', status, ownerId: t.assigneeId, dueDate: t.dueDate, ...flags(t.dueDate, status), priority: t.priority, hours: { actual: t.actualHours, estimated: t.estimatedHours } });
  }
  return out;
}
/** Primero lo vencido, luego lo próximo; dentro de cada grupo, por fecha. Lo completado nunca aparece. */
export function nextSteps(items: readonly WorkItem[], limit = 5): WorkItem[] {
  const rank = (i: WorkItem) => (i.status === 'Bloqueada' ? 0 : i.overdue ? 1 : i.dueSoon ? 2 : 3);
  return items.filter(i => isOpen(i.status)).sort((a, b) => rank(a) - rank(b) || (a.dueDate || '9999').localeCompare(b.dueDate || '9999') || a.title.localeCompare(b.title, 'es')).slice(0, limit);
}

/* ───────────── Filtros por faceta (macroiniciativa · metodología · tipo) ───────────── */

export type FacetValue = 'all' | 'none' | number;
export interface Facets { macro: FacetValue; method: FacetValue; kind: 'all' | ProjectKind }
export const ALL_FACETS: Facets = { macro: 'all', method: 'all', kind: 'all' };
export function matchesFacets(p: Project, f: Facets): boolean {
  if (f.macro !== 'all' && (f.macro === 'none' ? hasMacro(p) : Number(p.initiativeId) !== f.macro)) return false;
  if (f.method !== 'all' && (f.method === 'none' ? hasMethodology(p) : Number(p.methodologyId) !== f.method)) return false;
  if (f.kind !== 'all' && projectKind(p) !== f.kind) return false;
  return true;
}
export const filterProjects = (ws: Workspace, f: Facets) => ws.projects.filter(p => matchesFacets(p, f));
/** Serialización para conservar el filtro al navegar entre pantallas. */
export const facetsToString = (f: Facets) => [f.macro, f.method, f.kind].join('|');
export function facetsFromString(value: string | null | undefined): Facets {
  const [macro, method, kind] = (value ?? '').split('|');
  const parse = (v: string | undefined): FacetValue => (v === 'none' ? 'none' : v && /^\d+$/.test(v) ? Number(v) : 'all');
  return { macro: parse(macro), method: parse(method), kind: PROJECT_KINDS.some(k => k.id === kind) ? (kind as ProjectKind) : 'all' };
}

/* ───────────── Resúmenes ───────────── */

export interface PortfolioSummary {
  projects: number; active: number; completed: number; average: number; atRisk: number;
  activities: number; activitiesDone: number; overdueItems: number; openItems: number; blocked: number;
  stageCounts: Record<StageStatus, number>; byCurrentStage: number[]; next: WorkItem[];
}
export function summarize(ws: Workspace, projects: readonly Project[], nextLimit = 4): PortfolioSummary {
  const ids = new Set(projects.map(p => p.id));
  const stagesOf = (id: string) => ws.stages.filter(s => s.projectId === id);
  const average = projects.length ? Math.round(projects.reduce((n, p) => n + officialProjectProgress(stagesOf(p.id), p.planType), 0) / projects.length) : 0;
  const acts = activityItems(ws, { projectIds: ids });
  const tasks = taskItems(ws, { projectIds: ids });
  const stageCounts = Object.fromEntries(STAGE_STATUS_ORDER.map(s => [s, 0])) as Record<StageStatus, number>;
  acts.forEach(a => { stageCounts[a.status]++; });
  const byCurrentStage = [0, 0, 0, 0, 0, 0, 0];
  projects.forEach(p => { const st = stagesOf(p.id); const cur = currentStage(st); byCurrentStage[projectIsComplete(st) || !cur ? 6 : Math.min(5, Math.max(0, cur.order - 1))]++; });
  return {
    projects: projects.length, completed: projects.filter(p => p.status === 'Completado' || projectIsComplete(stagesOf(p.id))).length,
    active: projects.filter(p => p.status !== 'Completado' && !projectIsComplete(stagesOf(p.id))).length, average,
    atRisk: projects.filter(p => projectIsAtRisk(p, ws.stages, ws.raids)).length,
    activities: acts.length, activitiesDone: acts.filter(a => a.status === 'Completada').length,
    overdueItems: [...acts, ...tasks].filter(i => i.overdue).length, openItems: [...acts, ...tasks].filter(i => isOpen(i.status)).length,
    blocked: acts.filter(a => a.status === 'Bloqueada').length, stageCounts, byCurrentStage, next: nextSteps([...acts, ...tasks], nextLimit),
  };
}

/* ───────────── Trabajo personal ───────────── */

/** Proyectos en los que una persona participa: responsable, con actividades a su cargo o con tareas asignadas. */
export function projectsForMember(ws: Workspace, memberId: string): Project[] {
  const ids = new Set<string>();
  ws.projects.forEach(p => { if (p.ownerId === memberId) ids.add(p.id); });
  activityItems(ws, { ownerId: memberId }).forEach(i => ids.add(i.projectId));
  taskItems(ws, { assigneeId: memberId }).forEach(i => ids.add(i.projectId));
  return ws.projects.filter(p => ids.has(p.id));
}
export function memberWork(ws: Workspace, memberId: string) {
  const activities = activityItems(ws, { ownerId: memberId });
  const tasks = taskItems(ws, { assigneeId: memberId });
  return { projects: projectsForMember(ws, memberId), activities, tasks, items: [...activities, ...tasks] };
}

/** Aplica un cambio de estado de actividad conservando el avance oficial (mismas reglas que el detalle del proyecto). */
export function withActivityStatus(activity: Activity, status: StageStatus): Activity {
  return { ...activity, status, progress: progressForActivityStatus(status) };
}
