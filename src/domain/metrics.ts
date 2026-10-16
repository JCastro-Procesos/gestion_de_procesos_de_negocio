import type { Project, RaidItem, Stage, Task, TeamMember, Workspace } from './model';

const today = () => new Date().toISOString().slice(0, 10);
const openStatus = (status: string) => !['Completado', 'Completada', 'Cerrado'].includes(status);

export function projectProgress(projectId: string, stages: Stage[]): number {
  const selected = stages.filter((stage) => stage.projectId === projectId);
  return selected.length ? Math.round(selected.reduce((total, stage) => total + Math.max(0, Math.min(100, stage.progress)), 0) / selected.length) : 0;
}

export function lateMilestones(workspace: Workspace): { label: string; project: Project; dueDate: string; ownerId: string }[] {
  const result: { label: string; project: Project; dueDate: string; ownerId: string }[] = [];
  workspace.projects.forEach((project) => {
    if (project.dueDate && project.dueDate < today() && project.status !== 'Completado') {
      result.push({ label: 'Fecha objetivo del proyecto', project, dueDate: project.dueDate, ownerId: project.ownerId });
    }
    workspace.stages.filter((stage) => stage.projectId === project.id && stage.dueDate && stage.dueDate < today() && stage.status !== 'Completada').forEach((stage) => {
      result.push({ label: stage.name, project, dueDate: stage.dueDate, ownerId: workspace.tasks.find((task) => task.stageId === stage.id)?.assigneeId ?? project.ownerId });
    });
  });
  return result.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
}

export function projectIsAtRisk(project: Project, stages: Stage[], raids: RaidItem[]): boolean {
  const criticalRaid = raids.some((raid) => raid.projectId === project.id && raid.status !== 'Cerrado' && ['Crítica', 'Alta'].includes(raid.severity));
  const overdue = project.dueDate && project.dueDate < today() && project.status !== 'Completado';
  const incompleteLateStage = stages.some((stage) => stage.projectId === project.id && stage.dueDate < today() && stage.status !== 'Completada');
  return project.semaforo !== 'Verde' || Boolean(criticalRaid || overdue || incompleteLateStage || project.status === 'Bloqueado');
}

export function executiveMetrics(workspace: Workspace) {
  const count = workspace.projects.length;
  const average = count ? Math.round(workspace.projects.reduce((sum, project) => sum + projectProgress(project.id, workspace.stages), 0) / count) : 0;
  const atRisk = workspace.projects.filter((project) => projectIsAtRisk(project, workspace.stages, workspace.raids));
  const overdue = lateMilestones(workspace);
  const critical = workspace.projects.filter((project) => project.semaforo === 'Rojo' || project.status === 'Bloqueado' || workspace.raids.some((raid) => raid.projectId === project.id && raid.status !== 'Cerrado' && raid.severity === 'Crítica'));
  const isRed = (project: Project) => project.semaforo === 'Rojo' || project.status === 'Bloqueado' || workspace.raids.some((raid) => raid.projectId === project.id && raid.status !== 'Cerrado' && raid.severity === 'Crítica');
  const red = workspace.projects.filter(isRed).length;
  const yellow = workspace.projects.filter((project) => !isRed(project) && (project.semaforo === 'Amarillo' || projectIsAtRisk(project, workspace.stages, workspace.raids))).length;
  return { total: count, average, atRisk: atRisk.length, overdue: overdue.length, critical, green: count - red - yellow, yellow, red };
}

export function memberWorkload(member: TeamMember, tasks: Task[]) {
  const open = tasks.filter((task) => task.assigneeId === member.id && task.status !== 'Completado');
  const estimated = open.reduce((sum, task) => sum + Math.max(0, task.estimatedHours), 0);
  const real = tasks.filter((task) => task.assigneeId === member.id).reduce((sum, task) => sum + Math.max(0, task.actualHours), 0);
  const available = Math.max(1, member.capacityHours);
  return { openTasks: open.length, estimated, real, available, load: Math.round((estimated / available) * 100) };
}

export function taskHours(task: Task): { estimated: number; actual: number; delta: number } {
  return { estimated: task.estimatedHours, actual: task.actualHours, delta: task.actualHours - task.estimatedHours };
}

export function dueDateOverdue(date: string, status: string) { return Boolean(date && date < today() && openStatus(status)); }
