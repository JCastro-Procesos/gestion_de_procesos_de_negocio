import type { Methodology, Stage, TeamMember } from './model';

export const METHODOLOGIES: Methodology[] = [
  {
    id: 1,
    name: 'Gobierno y Arquitectura de Procesos',
    description: 'Ordena, clasifica y establece el gobierno del universo de procesos.',
    when: 'Cuando se requiere visibilidad del universo de procesos, responsables, estandarización, indicadores o diferencias entre UDN.',
    tools: ['Inventario / catálogo maestro', 'Arquitectura y taxonomía', 'Dueños de proceso', 'Matriz Corporativo vs. UDN', 'RACI de procesos', 'Evaluación de madurez', 'KPIs asociados', 'Control de versiones'],
    outputs: ['Catálogo maestro validado', 'Mapa / arquitectura de procesos', 'RACI y dueños asignados', 'Matriz de variantes por UDN', 'Diagnóstico de madurez y KPIs'],
    result: 'Visibilidad, ownership y reglas comunes para gestionar procesos.',
  },
  {
    id: 2,
    name: 'Ingeniería y Mejora de Procesos',
    description: 'Entiende el proceso actual y diseña una operación futura más efectiva.',
    when: 'Cuando existen errores, retrabajos, tiempos altos, controles débiles o necesidad de rediseño y estandarización.',
    tools: ['Registro AS-IS', 'Diseño TO-BE', 'Diagramas BPMN', 'Análisis de causas', 'Matriz de priorización', 'Requerimientos funcionales', 'Riesgos y controles', 'Registro de mejoras'],
    outputs: ['Mapa AS-IS validado', 'Análisis de brechas y causas', 'Diseño TO-BE', 'Backlog priorizado de mejoras', 'Matriz de riesgos y controles', 'Beneficios e indicadores'],
    result: 'Proceso futuro viable con cambios priorizados y beneficios medibles.',
  },
  {
    id: 3,
    name: 'Portafolio de Iniciativas y Transformación',
    description: 'Prioriza y gobierna iniciativas de cambio con enfoque en valor.',
    when: 'Cuando hay múltiples solicitudes, proyectos concurrentes, dependencias, capacidad limitada o necesidad de visibilidad ejecutiva.',
    tools: ['Inventario / portafolio', 'Pipeline de proyectos', 'Priorización', 'Matriz de dependencias', 'RAID Log', 'RACI de iniciativas', 'Registro de decisiones', 'Seguimiento de beneficios'],
    outputs: ['Portafolio consolidado', 'Matriz de priorización', 'Roadmap e hitos', 'RAID Log y decisiones', 'Responsables por iniciativa', 'Seguimiento de beneficios'],
    result: 'Portafolio transparente y alineado con prioridades del negocio.',
  },
  {
    id: 4,
    name: 'Arquitectura Proceso – Tecnología – Datos',
    description: 'Conecta la operación con sistemas, información y automatización.',
    when: 'Cuando un cambio depende de sistemas, integraciones, datos, automatización o transformación digital.',
    tools: ['Matriz Proceso × Sistemas', 'Flujos de información', 'Integraciones', 'Nivel de automatización', 'Requerimientos tecnológicos', 'Relación Proceso × Sistema × Iniciativa', 'Impactos tecnológicos'],
    outputs: ['Matriz proceso-sistema', 'Mapa de información e integraciones', 'Requerimientos funcionales / técnicos', 'Candidatos a automatización', 'Impactos y plan de cambio'],
    result: 'Soluciones operativas y tecnológicas alineadas y sostenibles.',
  },
  {
    id: 5,
    name: 'Gestión y Control DIPP',
    description: 'Administra demanda, capacidad, desempeño y compromisos del equipo.',
    when: 'Cuando se necesita ordenar backlog, balancear cargas, controlar entregables o dar visibilidad a dirección.',
    tools: ['Plan de trabajo DIPP', 'Backlog', 'Priorización de demanda', 'Capacidad y carga', 'Seguimiento de iniciativas', 'KPIs / OKRs', 'Dashboard ejecutivo', 'Temas críticos y escalaciones'],
    outputs: ['Plan de trabajo del área', 'Backlog priorizado', 'Plan de capacidad', 'Dashboard ejecutivo', 'KPIs / OKRs', 'Registro de bloqueos'],
    result: 'Control operativo y ejecutivo de demanda, capacidad y valor entregado.',
  },
];

export const DEFAULT_STAGE_BLUEPRINT = [
  { name: 'Inicio y alcance', objective: 'Acordar necesidad, objetivos, alcance, patrocinio y criterios de aceptación.', deliverable: 'Acta de inicio y alcance aprobado.' },
  { name: 'Diagnóstico y análisis', objective: 'Documentar la situación actual, datos, brechas, causas, riesgos y oportunidades.', deliverable: 'Diagnóstico AS-IS y análisis de brechas.' },
  { name: 'Diseño y recomendaciones', objective: 'Diseñar la solución futura y priorizar acciones, controles y beneficios.', deliverable: 'Diseño TO-BE y recomendaciones priorizadas.' },
  { name: 'Validación e implementación', objective: 'Validar con el cliente, ejecutar el plan de implementación y comprobar resultados.', deliverable: 'Plan de implementación validado y evidencia de pruebas.' },
  { name: 'Cierre y transferencia', objective: 'Obtener aceptación formal, transferir pendientes y acordar medición de beneficios.', deliverable: 'Acta de aceptación, transferencia y próximos pasos.' },
] as const;

export function createStages(projectId: string, startDate: string, dueDate: string, members: TeamMember[], mode: 'Express' | 'Estándar' | 'Transformación' = 'Estándar'): Stage[] {
  const start = new Date(`${startDate || new Date().toISOString().slice(0, 10)}T12:00:00`);
  const end = new Date(`${dueDate || startDate || new Date().toISOString().slice(0, 10)}T12:00:00`);
  const duration = Math.max(7, Math.ceil((end.getTime() - start.getTime()) / 86_400_000));
  const fractions = mode === 'Express'
    ? [[0, .12], [.13, .48], [.49, .76], [.77, .92], [.93, 1]]
    : mode === 'Transformación'
      ? [[0, .06], [.07, .23], [.24, .43], [.44, .86], [.87, 1]]
      : [[0, .1], [.11, .32], [.33, .53], [.54, .85], [.86, 1]];
  const dateAt = (fraction: number) => {
    const date = new Date(start);
    date.setDate(date.getDate() + Math.round((duration - 1) * fraction));
    return date.toISOString().slice(0, 10);
  };
  const defaultOwner = members[0]?.id ?? '';
  return DEFAULT_STAGE_BLUEPRINT.map((blueprint, index): Stage => ({
    id: `stage-${crypto.randomUUID()}`,
    projectId,
    order: index + 1,
    name: blueprint.name,
    objective: blueprint.objective,
    startDate: dateAt(fractions[index][0]),
    dueDate: dateAt(fractions[index][1]),
    status: 'Por iniciar',
    progress: 0,
    activities: [{
      id: `activity-${crypto.randomUUID()}`,
      name: `Completar: ${blueprint.name}`,
      deliverable: blueprint.deliverable,
      ownerId: defaultOwner,
      startDate: dateAt(fractions[index][0]),
      dueDate: dateAt(fractions[index][1]),
      status: 'Por iniciar',
      progress: 0,
    }],
  }));
}

export const methodFor = (id: number) => METHODOLOGIES.find((method) => method.id === id) ?? METHODOLOGIES[1];
