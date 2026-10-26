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

export const CORPORATE_STAGE_BLUEPRINT = [
 {name:'Inicio y alcance',objective:'Registrar necesidad, objetivos, alcance, responsables y autorización inicial.',gate:'Alcance, cronograma y criterios de éxito aprobados por patrocinador.',deliverables:['Solicitud y ficha de proyecto','Alcance, objetivos y criterios de éxito','Interesados y responsables','Plan y cronograma base','Acta de inicio aprobada']},
 {name:'Diagnóstico AS-IS',objective:'Levantar operación actual, riesgos, hallazgos y línea base.',gate:'AS-IS y hallazgos validados por el dueño del proceso.',deliverables:['Plan y evidencias de levantamiento','Mapa y flujos AS-IS','Matriz de roles, sistemas y controles','Hallazgos, riesgos y oportunidades','Línea base y validación']},
 {name:'Diseño TO-BE',objective:'Diseñar solución futura, controles, KPIs y plan de implementación.',gate:'Diseño completo y listo para evaluación formal.',deliverables:['Evaluación de alternativas','Diseño de solución TO-BE','RACI, reglas y controles','Documentación técnica y operativa','KPIs y criterios de aceptación','Plan de implementación']},
 {name:'Validación y aprobación',objective:'Revisar factibilidad, pruebas, observaciones y autorización.',gate:'Sin observaciones críticas; solución autorizada para implementar.',deliverables:['Revisión con usuarios','Observaciones resueltas','Pruebas preliminares','Versión final controlada','Aprobación para implementación']},
 {name:'Implementación y estabilización',objective:'Desplegar, capacitar, probar, corregir y estabilizar.',gate:'Solución operativa, pruebas aceptadas y sin incidentes críticos bloqueantes.',deliverables:['Plan de despliegue','Capacitación y comunicación','Solución implementada','Pruebas operativas y aceptación','Incidencias y estabilización']},
 {name:'Cierre y resultados',objective:'Medir beneficios, transferir documentación y cerrar formalmente.',gate:'Resultados verificados o desviaciones aceptadas formalmente; transferencia y cierre autorizados.',deliverables:['Informe de resultados y KPIs','Acta de transferencia','Repositorio actualizado','Lecciones y pendientes','Acta de cierre']}
] as const;
export const PROJECT_TYPE_WEIGHTS: Record<'Tecnológico'|'Documentación'|'Optimización',number[]> = {
 'Tecnológico':[10,15,20,15,30,10],
 'Documentación':[10,30,30,15,10,5],
 'Optimización':[10,25,25,10,20,10]
};
export const PROJECT_DELIVERABLE_ALIASES: Record<string,Record<string,string>> = {
 'Tecnológico':{'Diseño de solución TO-BE':'Diseño funcional, datos e integraciones','Documentación técnica y operativa':'Requerimientos y especificaciones','Pruebas preliminares':'Prototipos y pruebas funcionales','Solución implementada':'Configuración, migración y puesta en producción','Pruebas operativas y aceptación':'Pruebas UAT y aceptación de usuarios'},
 'Documentación':{'Diseño de solución TO-BE':'Procedimientos y flujos TO-BE','Documentación técnica y operativa':'Manuales, instructivos y formatos','Solución implementada':'Documentos publicados y en uso'},
 'Optimización':{'Diseño de solución TO-BE':'Rediseño optimizado y controles','Pruebas preliminares':'Piloto de mejoras','Informe de resultados y KPIs':'Beneficios medidos frente a línea base'}
};
export function createStages(projectId:string,startDate:string,dueDate:string,members:TeamMember[],_mode:'Express'|'Estándar'|'Transformación'='Estándar',planType:'Tecnológico'|'Documentación'|'Optimización'='Optimización'):Stage[]{
 const start=new Date((startDate||new Date().toISOString().slice(0,10))+'T12:00:00');
 const end=new Date((dueDate||startDate||new Date().toISOString().slice(0,10))+'T12:00:00');
 const days=Math.max(6,Math.round((end.getTime()-start.getTime())/86400000));
 const weights=PROJECT_TYPE_WEIGHTS[planType],total=weights.reduce((a,b)=>a+b,0);let cumulative=0;
 const at=(fraction:number)=>{const d=new Date(start);d.setDate(d.getDate()+Math.round(days*fraction));return d.toISOString().slice(0,10)};
 return CORPORATE_STAGE_BLUEPRINT.map((stage,index):Stage=>{
  const from=cumulative/total;cumulative+=weights[index];const to=cumulative/total;
  const a=at(from),b=at(to);
  return {id:'stage-'+crypto.randomUUID(),projectId,order:index+1,name:stage.name,objective:stage.objective+' Puerta: '+stage.gate,startDate:a,dueDate:b,status:'Por iniciar',progress:0,activities:stage.deliverables.map(name=>({id:'activity-'+crypto.randomUUID(),name,deliverable:PROJECT_DELIVERABLE_ALIASES[planType][name]||name,ownerId:members[0]?.id||'',startDate:a,dueDate:b,status:'Por iniciar',progress:0}))};
 });
}
export function weightedProjectProgress(stages:Stage[],type:'Tecnológico'|'Documentación'|'Optimización'='Optimización'):number{
 const ordered=[...stages].sort((a,b)=>a.order-b.order);
 const weights=ordered.length===6?PROJECT_TYPE_WEIGHTS[type]:ordered.map(()=>100/Math.max(1,ordered.length));
 const total=weights.reduce((a,b)=>a+b,0);
 return total?Math.round(ordered.reduce((sum,stage,i)=>sum+weights[i]*(stage.activities.length?stage.activities.reduce((n,a)=>n+(a.status==='Completada'?1:a.status==='En revisión'?.5:0),0)/stage.activities.length:stage.status==='Completada'?1:0),0)/total*100):0;
}

export const methodFor = (id: number) => METHODOLOGIES.find((method) => method.id === id) ?? METHODOLOGIES[1];
