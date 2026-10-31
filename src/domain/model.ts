import type {AlignmentCatalog} from './alignment';
export type Semaforo = 'Verde' | 'Amarillo' | 'Rojo';
export type ProjectStatus = 'Por iniciar' | 'En diagnóstico' | 'En ejecución' | 'En validación' | 'Bloqueado' | 'Completado';
export type StageStatus = 'Por iniciar' | 'En curso' | 'En revisión' | 'Bloqueada' | 'Completada';
export type TaskStatus = 'Por Hacer' | 'En Proceso' | 'En Revisión' | 'Completado';
export type TaskPriority = 'Baja' | 'Media' | 'Alta' | 'Urgente';
export type RaidType = 'Riesgo' | 'Supuesto' | 'Incidencia' | 'Dependencia' | 'Decisión';
export type RaidSeverity = 'Baja' | 'Media' | 'Alta' | 'Crítica';
export type RaidStatus = 'Abierto' | 'En tratamiento' | 'Escalado' | 'Cerrado';

export interface Methodology { id: number; name: string; description: string; when: string; tools: string[]; outputs: string[]; result: string; }
export interface ActivityOrigin { kind: 'Metodología' | 'Macroiniciativa'; sourceKeys?: string[]; sourceNames?: string[]; templateId: number; version: number; activityId: number | string; incorporatedAt: string; }
export interface Activity { acceptanceCriteria?:string; estimatedDays?:number; origin?: ActivityOrigin; id: string; name: string; deliverable: string; ownerId: string; startDate: string; dueDate: string; status: StageStatus; progress: number; evidenceUrl?: string; verifiedBy?: string; verifiedAt?: string; }
export interface Stage { id: string; projectId: string; order: number; name: string; objective: string; startDate: string; dueDate: string; status: StageStatus; progress: number; activities: Activity[]; }
export interface Project { id: string; name: string; area: string; priority?: 'Baja' | 'Media' | 'Alta'; scopeAreas?: string[]; ownerId: string; sponsor: string; methodologyId: number;
  initiativeId?: number | null; status: ProjectStatus; semaforo: Semaforo; startDate: string; dueDate: string; goal: string; description: string; createdAt: string; updatedAt: string; problemStatement?: string; parentProjectId?: string; blockerReason?: string; planType?: 'Tecnológico' | 'Documentación' | 'Optimización'; externalCalendarEventId?: string; }
export interface Subtask { id: string; title: string; done: boolean; }
export interface Task { id: string; projectId: string; stageId: string; title: string; description: string; assigneeId: string; status: TaskStatus; priority: TaskPriority; estimatedHours: number; actualHours: number; startDate: string; dueDate: string; subtasks: Subtask[]; externalToDoTaskId?: string; externalToDoListId?: string; timerStartedAt?: string; blockedByTaskIds?: string[]; }
export interface RaidItem { id: string; projectId: string; type: RaidType; severity: RaidSeverity; description: string; ownerId: string; dueDate: string; status: RaidStatus; response: string; createdAt: string; relatedTaskId?: string; relatedStageId?: string; }
export interface TeamMember { id: string; name: string; role: string; capacityHours: number; email: string; color: string; }
export interface TimeLog { id: string; taskId: string; memberId: string; startedAt: string; endedAt: string; seconds: number; source: 'Temporizador' | 'Manual'; note: string; }
export interface GraphSettings { tenantId: string; clientId: string; redirectUri: string; accountType: 'organizations' | 'common'; }
export interface PerformanceIndicator { id:string;projectId:string;name:string;target:number;actual:number;unit:string;direction:'increase'|'decrease';updatedAt:string; }
export interface Workspace { alignmentCatalog?:AlignmentCatalog; indicators?: PerformanceIndicator[]; schemaVersion: 1; workspaceName: string; projects: Project[]; stages: Stage[]; tasks: Task[]; raids: RaidItem[]; members: TeamMember[]; timeLogs: TimeLog[]; graphSettings: GraphSettings; graphConnectedName: string; graphAccountId: string; }
export type WorkspaceAction = (current: Workspace) => Workspace;
