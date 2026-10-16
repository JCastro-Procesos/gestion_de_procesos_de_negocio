import type { Workspace } from '../domain/model';

const today = new Date();
const date = (offset: number) => { const value = new Date(today); value.setDate(value.getDate() + offset); return value.toISOString().slice(0, 10); };

export const DEMO_WORKSPACE: Workspace = {
  schemaVersion: 1,
  workspaceName: 'Espacio de demostración · ITM',
  graphSettings: { tenantId: '', clientId: '', redirectUri: typeof window === 'undefined' ? 'http://localhost:3000' : window.location.origin, accountType: 'organizations' },
  graphConnectedName: '',
  graphAccountId: '',
  members: [
    { id: 'm-lucia', name: 'Lucía Mendoza', role: 'Consultora sénior', capacityHours: 36, email: 'lucia.mendoza@ejemplo.com', color: '#5367d8' },
    { id: 'm-andres', name: 'Andrés Pineda', role: 'Analista de procesos', capacityHours: 32, email: 'andres.pineda@ejemplo.com', color: '#12a68a' },
    { id: 'm-sofia', name: 'Sofía Robles', role: 'Líder de transformación', capacityHours: 36, email: 'sofia.robles@ejemplo.com', color: '#e0993e' },
    { id: 'm-marco', name: 'Marco Suárez', role: 'Especialista de datos', capacityHours: 30, email: 'marco.suarez@ejemplo.com', color: '#8b5fc7' },
  ],
  projects: [
    { id: 'p-cxp', name: 'Estandarización de cuentas por pagar', area: 'Finanzas · Taino', ownerId: 'm-lucia', sponsor: 'Dirección de Finanzas', methodologyId: 2, status: 'En ejecución', semaforo: 'Verde', startDate: date(-32), dueDate: date(26), goal: 'Reducir reprocesos y mejorar trazabilidad del flujo de facturas.', description: 'Iniciativa ficticia de ejemplo. Validar alcance y datos con el equipo.', createdAt: date(-35), updatedAt: date(-2) },
    { id: 'p-portfolio', name: 'Priorización del portafolio DIPP', area: 'Transformación', ownerId: 'm-sofia', sponsor: 'VP de Operaciones', methodologyId: 3, status: 'En validación', semaforo: 'Amarillo', startDate: date(-54), dueDate: date(-3), goal: 'Definir criterios comunes de priorización y capacidad.', description: 'Ejemplo ficticio con hito vencido para demostrar alertas.', createdAt: date(-60), updatedAt: date(-1) },
    { id: 'p-data', name: 'Trazabilidad de datos de proceso', area: 'Tecnología y Datos', ownerId: 'm-marco', sponsor: 'Arquitectura Empresarial', methodologyId: 4, status: 'En diagnóstico', semaforo: 'Rojo', startDate: date(-17), dueDate: date(12), goal: 'Alinear fuentes de datos, procesos y reportes ejecutivos.', description: 'Ejemplo ficticio bloqueado por dependencia externa.', createdAt: date(-20), updatedAt: date(-1) },
    { id: 'p-governance', name: 'Gobierno de procesos comerciales', area: 'Comercial', ownerId: 'm-andres', sponsor: 'Dirección Comercial', methodologyId: 1, status: 'Por iniciar', semaforo: 'Verde', startDate: date(5), dueDate: date(58), goal: 'Establecer catálogo, ownership y métricas de procesos.', description: 'Ejemplo ficticio listo para planificación.', createdAt: date(-3), updatedAt: date(-1) },
  ],
  stages: [
    { id: 's1', projectId: 'p-cxp', order: 1, name: 'Inicio y alcance', objective: 'Acordar alcance y criterios de aceptación.', startDate: date(-32), dueDate: date(-23), status: 'Completada', progress: 100, activities: [{ id: 'a1', name: 'Acordar objetivos y alcance', deliverable: 'Acta de inicio', ownerId: 'm-lucia', startDate: date(-32), dueDate: date(-23), status: 'Completada', progress: 100 }] },
    { id: 's2', projectId: 'p-cxp', order: 2, name: 'Diagnóstico y análisis', objective: 'Documentar AS-IS y brechas.', startDate: date(-22), dueDate: date(-7), status: 'Completada', progress: 100, activities: [{ id: 'a2', name: 'Mapear proceso actual', deliverable: 'Mapa AS-IS validado', ownerId: 'm-andres', startDate: date(-22), dueDate: date(-7), status: 'Completada', progress: 100 }] },
    { id: 's3', projectId: 'p-cxp', order: 3, name: 'Diseño y recomendaciones', objective: 'Diseñar mejoras y priorizar beneficios.', startDate: date(-6), dueDate: date(8), status: 'En curso', progress: 56, activities: [{ id: 'a3', name: 'Diseñar flujo futuro y controles', deliverable: 'Diseño TO-BE', ownerId: 'm-lucia', startDate: date(-6), dueDate: date(8), status: 'En curso', progress: 56 }] },
    { id: 's4', projectId: 'p-cxp', order: 4, name: 'Validación e implementación', objective: 'Validar diseño y preparar piloto.', startDate: date(9), dueDate: date(20), status: 'Por iniciar', progress: 0, activities: [{ id: 'a4', name: 'Validar propuesta con Finanzas', deliverable: 'Aprobación del diseño', ownerId: 'm-lucia', startDate: date(9), dueDate: date(20), status: 'Por iniciar', progress: 0 }] },
    { id: 's5', projectId: 'p-cxp', order: 5, name: 'Cierre y transferencia', objective: 'Obtener aceptación y transferir beneficios.', startDate: date(21), dueDate: date(26), status: 'Por iniciar', progress: 0, activities: [{ id: 'a5', name: 'Transferir tablero y plan de beneficios', deliverable: 'Paquete de cierre', ownerId: 'm-lucia', startDate: date(21), dueDate: date(26), status: 'Por iniciar', progress: 0 }] },
    { id: 's6', projectId: 'p-portfolio', order: 1, name: 'Inicio y alcance', objective: 'Definir gobierno del portafolio.', startDate: date(-54), dueDate: date(-46), status: 'Completada', progress: 100, activities: [] },
    { id: 's7', projectId: 'p-portfolio', order: 2, name: 'Diagnóstico y análisis', objective: 'Consolidar demanda, capacidad y dependencias.', startDate: date(-45), dueDate: date(-28), status: 'Completada', progress: 100, activities: [] },
    { id: 's8', projectId: 'p-portfolio', order: 3, name: 'Diseño y recomendaciones', objective: 'Validar criterios y score de priorización.', startDate: date(-27), dueDate: date(-11), status: 'Completada', progress: 100, activities: [] },
    { id: 's9', projectId: 'p-portfolio', order: 4, name: 'Validación e implementación', objective: 'Aprobar criterios y probar modelo.', startDate: date(-10), dueDate: date(-3), status: 'En revisión', progress: 62, activities: [{ id: 'a9', name: 'Validar criterios con patrocinador', deliverable: 'Scorecard aprobado', ownerId: 'm-sofia', startDate: date(-10), dueDate: date(-3), status: 'En revisión', progress: 62 }] },
    { id: 's10', projectId: 'p-portfolio', order: 5, name: 'Cierre y transferencia', objective: 'Transferir el ciclo de priorización.', startDate: date(-2), dueDate: date(4), status: 'Por iniciar', progress: 0, activities: [] },
    { id: 's11', projectId: 'p-data', order: 1, name: 'Inicio y alcance', objective: 'Alinear actores, sistemas y alcance.', startDate: date(-17), dueDate: date(-10), status: 'Completada', progress: 100, activities: [] },
    { id: 's12', projectId: 'p-data', order: 2, name: 'Diagnóstico y análisis', objective: 'Revisar calidad y linaje de datos.', startDate: date(-9), dueDate: date(-1), status: 'Bloqueada', progress: 20, activities: [{ id: 'a12', name: 'Solicitar acceso al diccionario de datos', deliverable: 'Inventario de fuentes', ownerId: 'm-marco', startDate: date(-9), dueDate: date(-1), status: 'Bloqueada', progress: 20 }] },
    { id: 's13', projectId: 'p-data', order: 3, name: 'Diseño y recomendaciones', objective: 'Diseñar trazabilidad y modelo objetivo.', startDate: date(0), dueDate: date(6), status: 'Por iniciar', progress: 0, activities: [] },
    { id: 's14', projectId: 'p-data', order: 4, name: 'Validación e implementación', objective: 'Validar el modelo y las fuentes.', startDate: date(7), dueDate: date(10), status: 'Por iniciar', progress: 0, activities: [] },
    { id: 's15', projectId: 'p-data', order: 5, name: 'Cierre y transferencia', objective: 'Transferir inventario y recomendaciones.', startDate: date(11), dueDate: date(12), status: 'Por iniciar', progress: 0, activities: [] },
    ...(['p-governance'] as const).flatMap((projectId) => [
      { id: 's16', projectId, order: 1, name: 'Inicio y alcance', objective: 'Definir alcance.', startDate: date(5), dueDate: date(12), status: 'Por iniciar' as const, progress: 0, activities: [] },
      { id: 's17', projectId, order: 2, name: 'Diagnóstico y análisis', objective: 'Inventariar procesos.', startDate: date(13), dueDate: date(25), status: 'Por iniciar' as const, progress: 0, activities: [] },
      { id: 's18', projectId, order: 3, name: 'Diseño y recomendaciones', objective: 'Diseñar gobierno.', startDate: date(26), dueDate: date(39), status: 'Por iniciar' as const, progress: 0, activities: [] },
      { id: 's19', projectId, order: 4, name: 'Validación e implementación', objective: 'Aprobar y pilotear.', startDate: date(40), dueDate: date(51), status: 'Por iniciar' as const, progress: 0, activities: [] },
      { id: 's20', projectId, order: 5, name: 'Cierre y transferencia', objective: 'Transferir el modelo.', startDate: date(52), dueDate: date(58), status: 'Por iniciar' as const, progress: 0, activities: [] },
    ]),
  ],
  tasks: [
    { id: 't1', projectId: 'p-cxp', stageId: 's3', title: 'Diseñar flujo futuro de aprobación', description: 'Integrar controles y casos de excepción.', assigneeId: 'm-lucia', status: 'En Proceso', priority: 'Alta', estimatedHours: 16, actualHours: 11.5, startDate: date(-6), dueDate: date(5), subtasks: [{ id: 'st1', title: 'Validar matriz de roles', done: true }, { id: 'st2', title: 'Documentar controles', done: false }] },
    { id: 't2', projectId: 'p-cxp', stageId: 's3', title: 'Validar reglas de contabilización', description: 'Alinear excepciones con el área contable.', assigneeId: 'm-andres', status: 'En Revisión', priority: 'Media', estimatedHours: 8, actualHours: 7, startDate: date(-4), dueDate: date(2), subtasks: [{ id: 'st3', title: 'Recopilar ejemplos', done: true }] },
    { id: 't3', projectId: 'p-portfolio', stageId: 's9', title: 'Aprobar scorecard con patrocinador', description: 'Confirmar ponderación y umbrales.', assigneeId: 'm-sofia', status: 'En Revisión', priority: 'Urgente', estimatedHours: 5, actualHours: 3, startDate: date(-8), dueDate: date(-2), subtasks: [] },
    { id: 't4', projectId: 'p-data', stageId: 's12', title: 'Solicitar accesos a diccionario', description: 'Falta aprobación del administrador de datos.', assigneeId: 'm-marco', status: 'Por Hacer', priority: 'Urgente', estimatedHours: 6, actualHours: 0, startDate: date(-8), dueDate: date(-1), subtasks: [{ id: 'st4', title: 'Enviar solicitud formal', done: false }] },
    { id: 't5', projectId: 'p-cxp', stageId: 's2', title: 'Mapear proceso actual', description: 'Mapa validado con el área.', assigneeId: 'm-andres', status: 'Completado', priority: 'Media', estimatedHours: 10, actualHours: 9.5, startDate: date(-20), dueDate: date(-8), subtasks: [] },
    { id: 't6', projectId: 'p-governance', stageId: 's16', title: 'Preparar entrevistas con dueños', description: 'Agenda y guía de entrevistas.', assigneeId: 'm-andres', status: 'Por Hacer', priority: 'Baja', estimatedHours: 4, actualHours: 0, startDate: date(7), dueDate: date(12), subtasks: [] },
  ],
  raids: [
    { id: 'r1', projectId: 'p-data', type: 'Dependencia', severity: 'Crítica', description: 'Acceso al repositorio de datos pendiente de aprobación.', ownerId: 'm-marco', dueDate: date(-1), status: 'Escalado', response: 'Escalar a Arquitectura Empresarial; confirmar fecha de habilitación.', createdAt: date(-8) },
    { id: 'r2', projectId: 'p-portfolio', type: 'Riesgo', severity: 'Alta', description: 'Disponibilidad limitada del patrocinador para aprobar scorecard.', ownerId: 'm-sofia', dueDate: date(2), status: 'En tratamiento', response: 'Agendar comité ejecutivo y circular propuesta previa.', createdAt: date(-10) },
    { id: 'r3', projectId: 'p-cxp', type: 'Supuesto', severity: 'Media', description: 'Los registros de aprobación estarán disponibles para análisis.', ownerId: 'm-lucia', dueDate: date(8), status: 'Abierto', response: 'Solicitar muestra a Finanzas y validar calidad.', createdAt: date(-12) },
  ],
  timeLogs: [
    { id: 'tl1', taskId: 't1', memberId: 'm-lucia', startedAt: date(-3), endedAt: date(-3), seconds: 14400, source: 'Manual', note: 'Sesión de diseño' },
    { id: 'tl2', taskId: 't2', memberId: 'm-andres', startedAt: date(-2), endedAt: date(-2), seconds: 10800, source: 'Manual', note: 'Validación contable' },
  ],
};
