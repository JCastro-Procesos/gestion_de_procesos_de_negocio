/**
 * ProcessOne v1.2 — Contratos de dominio del Bloque 1.
 * Son modelos aditivos: no modifican Workspace(schemaVersion:1) ni Project existente.
 * La persistencia, migración y API se integrarán tras contrastar el esquema MySQL real.
 */
export type CellStatus = 'Borrador' | 'Activa' | 'Pausada' | 'Archivada';
export type InitiativeStatusV12 = 'Borrador' | 'Propuesta' | 'Aprobada' | 'En ejecución' | 'En riesgo' | 'Pausada' | 'Completada' | 'Cancelada';
export type ProjectInitiativeRole = 'Principal' | 'Secundaria';
export type ProjectGovernanceRole = 'Process Owner' | 'Responsable del proyecto' | 'Sponsor' | 'Líder de célula';
export type TemplateOrigin = 'Metodología' | 'Iniciativa' | 'Gobierno';
export type KpiDirection = 'increase' | 'decrease';

export interface OptimizationCell {
  id: string;
  code: string;
  name: string;
  mission: string;
  leaderUserId: string | null;
  status: CellStatus;
  capacityHoursPerWeek: number | null;
  createdAt: string;
  updatedAt: string;
}
export interface CellMembership {
  cellId: string;
  userId: string;
  role: 'Líder' | 'Integrante';
  allocatedHoursPerWeek: number | null;
  effectiveFrom: string;
  effectiveTo: string | null;
}
export interface StrategicInitiative {
  id: string;
  code: string;
  title: string;
  objective: string;
  problemStatement: string;
  cellId: string | null;
  sponsorUserId: string | null;
  ownerUserId: string | null;
  status: InitiativeStatusV12;
  startDate: string | null;
  targetDate: string | null;
  baselinePlan: string | null;
  createdAt: string;
  updatedAt: string;
}
export interface InitiativeProjectLink {
  initiativeId: string;
  projectId: string;
  role: ProjectInitiativeRole;
  contributionDescription: string | null;
}
export interface ProjectGovernanceAssignment {
  projectId: string;
  userId: string;
  role: ProjectGovernanceRole;
  cellId: string | null;
}
export interface MethodologyTemplateVersion {
  id: string;
  methodologyId: number;
  version: number;
  status: 'Borrador' | 'Publicada' | 'Archivada';
  stageCount: 6;
  publishedAt: string | null;
}
export interface ActivityTemplate {
  id: string;
  origin: TemplateOrigin;
  sourceId: string;
  version: number;
  canonicalKey: string;
  stageOrder: 1 | 2 | 3 | 4 | 5 | 6;
  title: string;
  deliverable: string | null;
  estimatedWorkingDays: number | null;
  suggestedRole: ProjectGovernanceRole | null;
  required: boolean;
}
export interface GeneratedActivityOrigin {
  projectId: string;
  activityId: string;
  templateId: string;
  templateVersion: number;
  origin: TemplateOrigin;
}
export interface InitiativeKpiDefinition {
  id: string;
  initiativeId: string;
  name: string;
  unit: string;
  direction: KpiDirection;
  baseline: number | null;
  target: number | null;
  targetDate: string | null;
  dataSource: string;
  ownerUserId: string | null;
}
export interface InitiativeKpiMeasurement {
  id: string;
  kpiId: string;
  measuredAt: string;
  actual: number;
  evidenceUrl: string | null;
}
/** Sólo proyectos aprobados: los borradores y proyectos históricos se regularizan sin bloqueo retroactivo. */
export interface ApprovedProjectGovernance {
  projectId: string;
  primaryInitiativeId: string;
  cellId: string;
  processOwnerUserId: string;
  projectManagerUserId: string;
  methodologyTemplateVersionId: string;
}
export function validateApprovedProjectGovernance(value: Partial<ApprovedProjectGovernance>): string[] {
  const required: (keyof ApprovedProjectGovernance)[] = ['projectId','primaryInitiativeId','cellId','processOwnerUserId','projectManagerUserId','methodologyTemplateVersionId'];
  return required.filter(key => !value[key]?.trim()).map(key => 'Falta '+key);
}
export function validateCellCapacity(value: number | null): boolean {
  return value === null || (Number.isFinite(value) && value >= 0);
}
export function validateTemplateStage(order: number): order is ActivityTemplate['stageOrder'] {
  return Number.isInteger(order) && order >= 1 && order <= 6;
}

/**
 * Process Owner representa al cliente responsable de aceptar resultados.
 * Project Manager coordina la ejecución. Pueden ser la misma persona.
 * No se fusionan los roles ni se heredan privilegios de acceso entre ellos.
 */
export function validateGovernanceAssignments(
  value: Partial<ApprovedProjectGovernance>,
  activeUserIds: ReadonlySet<string>
): string[] {
  const errors = validateApprovedProjectGovernance(value);
  for (const key of ['processOwnerUserId','projectManagerUserId'] as const) {
    const id = value[key]?.trim();
    if (id && !activeUserIds.has(id)) errors.push('Usuario inactivo o inexistente: '+key);
  }
  return errors;
}

/** Vínculos históricos se aceptan sin principal mientras se regularizan. */
export function validateInitiativeLinks(
  projectId: string,
  links: readonly InitiativeProjectLink[],
  approved: boolean
): string[] {
  const scoped = links.filter(link => link.projectId === projectId);
  const primary = scoped.filter(link => link.role === 'Principal');
  const errors: string[] = [];
  if (primary.length > 1) errors.push('Un proyecto no puede tener más de una iniciativa principal');
  if (approved && primary.length !== 1) errors.push('Un proyecto aprobado requiere exactamente una iniciativa principal');
  if (new Set(scoped.map(link => link.initiativeId)).size !== scoped.length) errors.push('Iniciativas duplicadas en el proyecto');
  return errors;
}
