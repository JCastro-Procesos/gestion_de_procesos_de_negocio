import type {MacroProfile} from './macroinitiative';
import type {PlanKpi} from './alignment';

/**
 * Propuesta inicial de las cuatro macroiniciativas validadas de ITM (portafolio ITM).
 * Los vínculos proyecto–KPI–entregable son ilustrativos según el portafolio; la asignación oficial se confirma ahí.
 * No incluye responsables (se eligen al cargar), ni líneas base de KPIs (no se inventan cifras).
 */
export interface ItmMacroProposal {
  code: 'M1'|'M2'|'M3'|'M4';
  title: string;
  objective: string;
  /** Áreas que se proponen involucrar, con su papel. La primera es el área responsable. */
  areas: {name:string;role:string}[];
  /** Responsables sugeridos por cargo (la persona real se elige al cargar). */
  /** KPIs predeterminados: el primero es el KPI de resultado del portafolio ITM. */
  kpis: PlanKpi[];
  suggestedSponsorRole: string;
  suggestedOwnerRole: string;
  profile: Omit<MacroProfile,'sponsorUserId'|'processOwnerUserId'|'cellId'|'estimatedBudget'|'currency'>;
}
const START='2026-12-01';
const review='Mensual';
export const ITM_MACRO_PROPOSALS: ItmMacroProposal[] = [
 {code:'M1',title:'Optimización del revenue',
  objective:'Incrementar el ingreso por pasajero de crucero mediante un flujo de venta de tours portuarios más claro, medible y fácil de operar para Comercial.',
  areas:[{name:'Comercial',role:'Responsable: define la oferta, canales y reglas de venta'},{name:'Operaciones',role:'Valida capacidad y viabilidad operativa de cada tour'},{name:'Finanzas',role:'Costeo, márgenes y medición del ingreso por pasajero'},{name:'Procesos de Negocio (DIPP)',role:'Diseña el flujo TO-BE y da seguimiento'},{name:'Tecnología y Datos',role:'Habilita sistemas y datos para medir la venta'}],
  kpis:[{id:'m1-kpi-1',name:'Ingreso por pasajero de crucero',unit:'$ por pasajero',direction:'increase',formula:'Ingreso por tours portuarios / pasajeros atendidos',baseline:null,target:null,frequency:'Mensual',source:''},{id:'m1-kpi-2',name:'Conversión de venta de tours',unit:'%',direction:'increase',formula:'Pasajeros que compran tour / pasajeros con oferta × 100',baseline:null,target:null,frequency:'Mensual',source:''},{id:'m1-kpi-3',name:'Margen por tour',unit:'%',direction:'increase',formula:'(Ingreso − costo del tour) / ingreso × 100',baseline:null,target:null,frequency:'Mensual',source:''}],
  suggestedSponsorRole:'Dirección Comercial / Dirección General',suggestedOwnerRole:'Gerencia Comercial',
  profile:{code:'M1',strategicAlignment:'Ingresos y rentabilidad: aumentar el valor generado por cada pasajero de crucero.',
   problemStatement:'La venta de tours portuarios no tiene un flujo estandarizado de punta a punta, lo que dificulta vender más por pasajero, controlar el margen y medir qué funciona.',
   expectedBenefit:'Mayor ingreso por pasajero de crucero, con un flujo de venta definido, roles claros y medición periódica.',
   scopeText:'Proyecto ilustrativo: Venta de tours portuarios. Entregable clave: diseño TO-BE del flujo de venta. Incluye levantamiento AS-IS, diagnóstico, diseño TO-BE, impacto e implementación con Comercial y Operaciones.',
   exclusions:'Cambios de precio o de política comercial corporativa, y desarrollo de sistemas, hasta validar factibilidad (puerta de decisión).',
   department:'Comercial',startDate:START,targetDate:'2027-06-30',priority:'Alta',
   successCriteria:'Flujo TO-BE de venta validado y aceptado por Comercial; ingreso por pasajero de crucero medido contra su línea base.',
   measurementPlan:'KPI de resultado: ingreso por pasajero de crucero. Registrar línea base y meta en Indicadores antes de activar.',
   resources:'Equipo de Procesos (DIPP), tiempo de Comercial y Operaciones para sesiones de levantamiento y validación, y datos de ventas.',
   risks:'Baja disponibilidad de Comercial en temporada alta; datos de venta dispersos; cambios en itinerarios de cruceros.',
   dependencies:'Áreas involucradas: Comercial (responsable), Operaciones, Finanzas, Procesos de Negocio (DIPP), Tecnología y Datos. Se relaciona con M2 (catálogo de tours estandarizado).',
   reviewFrequency:review}},
 {code:'M2',title:'Estandarización de Procesos',
  objective:'Estandarizar el diseño y alta de tours para que cada expediente se cree de forma conforme, con manual operativo y responsabilidades (RACI) claras.',
  areas:[{name:'Operaciones',role:'Responsable: dueño de la operación y del manual operativo'},{name:'Comercial',role:'Define oferta y requisitos de cada tour'},{name:'Compras',role:'Alta y condiciones de proveedores'},{name:'Legal',role:'Revisión de contratos y requisitos del expediente'},{name:'Finanzas',role:'Costeo y alta financiera del tour'},{name:'Procesos de Negocio (DIPP)',role:'Documenta, estandariza y controla versiones'},{name:'Tecnología y Datos',role:'Alta del tour en sistemas'}],
  kpis:[{id:'m2-kpi-1',name:'Expedientes de alta conformes',unit:'%',direction:'increase',formula:'Expedientes conformes a la primera / expedientes de alta × 100',baseline:null,target:null,frequency:'Mensual',source:''},{id:'m2-kpi-2',name:'Tiempo de alta de un tour',unit:'días',direction:'decrease',formula:'Suma de días de solicitud a tour activo / tours dados de alta',baseline:null,target:null,frequency:'Mensual',source:''},{id:'m2-kpi-3',name:'Tours con manual operativo vigente',unit:'%',direction:'increase',formula:'Tours con manual vigente / tours activos × 100',baseline:null,target:null,frequency:'Trimestral',source:''}],
  suggestedSponsorRole:'Dirección de Operaciones',suggestedOwnerRole:'Gerencia de Operaciones',
  profile:{code:'M2',strategicAlignment:'Rentabilidad y sostenibilidad: procesos estándar que reducen retrabajo y errores.',
   problemStatement:'El alta de tours no sigue un procedimiento único; los expedientes llegan incompletos o con criterios distintos, lo que genera retrabajo y riesgo.',
   expectedBenefit:'Mayor porcentaje de expedientes de alta conformes, menos retrabajo y operación documentada y transferible.',
   scopeText:'Proyecto ilustrativo: Diseño y alta de tours. Entregable clave: manual operativo y RACI. Incluye procedimiento de creación y actualización de tours portuarios, con Comercial y Operaciones.',
   exclusions:'Rediseño de la oferta comercial y de tarifas; procesos de otras áreas fuera del alta de tours.',
   department:'Operaciones',startDate:START,targetDate:'2027-05-31',priority:'Alta',
   successCriteria:'Manual operativo y RACI aceptados; expedientes de alta conformes medidos contra su línea base.',
   measurementPlan:'KPI de resultado: % de expedientes de alta conformes. Registrar línea base y meta en Indicadores antes de activar.',
   resources:'Equipo de Procesos (DIPP), responsables de alta en Comercial y Operaciones, y expedientes recientes como evidencia.',
   risks:'Resistencia a cambiar prácticas actuales; variantes por destino o proveedor; falta de dueño formal del procedimiento.',
   dependencies:'Áreas involucradas: Operaciones (responsable), Comercial, Compras, Legal, Finanzas, Procesos de Negocio (DIPP), Tecnología y Datos. Alimenta a M1 con un catálogo de tours estandarizado.',
   reviewFrequency:review}},
 {code:'M3',title:'Productividad y eficiencia operativa',
  objective:'Reducir el tiempo promedio de aprobación del flujo de requisiciones de compra, con reglas claras, validaciones y responsables definidos.',
  areas:[{name:'Compras',role:'Responsable: dueño del flujo de requisiciones'},{name:'Construcción',role:'Principal área solicitante; valida el flujo en obra'},{name:'Finanzas',role:'Validación de presupuesto y autorizaciones'},{name:'Legal',role:'Revisión cuando se requiere contrato o instrumento especial'},{name:'Procesos de Negocio (DIPP)',role:'Diseña el flujo TO-BE y las validaciones'},{name:'Tecnología y Datos',role:'Habilita la herramienta y la trazabilidad'}],
  kpis:[{id:'m3-kpi-1',name:'Tiempo promedio de aprobación de requisiciones',unit:'días',direction:'decrease',formula:'Suma de días de solicitud a aprobación / requisiciones aprobadas',baseline:null,target:null,frequency:'Mensual',source:''},{id:'m3-kpi-2',name:'Requisiciones aprobadas a la primera',unit:'%',direction:'increase',formula:'Requisiciones sin devolución / requisiciones aprobadas × 100',baseline:null,target:null,frequency:'Mensual',source:''},{id:'m3-kpi-3',name:'Requisiciones devueltas por datos incompletos',unit:'%',direction:'decrease',formula:'Requisiciones devueltas por datos incompletos / requisiciones recibidas × 100',baseline:null,target:null,frequency:'Mensual',source:''}],
  suggestedSponsorRole:'Dirección de Finanzas / Dirección de Obra',suggestedOwnerRole:'Gerencia de Compras',
  profile:{code:'M3',strategicAlignment:'Rentabilidad y sostenibilidad: menos tiempo y esfuerzo en decisiones de compra.',
   problemStatement:'El flujo de requisiciones de compra tiene tiempos largos de aprobación y pasos poco claros entre solicitante, Compras, Finanzas y Legal.',
   expectedBenefit:'Menor tiempo promedio de aprobación, menos idas y vueltas y mayor claridad sobre quién autoriza qué.',
   scopeText:'Proyecto ilustrativo: Flujo de requisiciones de compra. Entregable clave: diseño TO-BE y validaciones. Se apoya en la herramienta de determinación de instrumento (Orden de Servicio, precontrato o contrato).',
   exclusions:'Selección o cambio de proveedores; políticas de autorización corporativas, salvo propuesta validada.',
   department:'Compras',startDate:START,targetDate:'2027-06-30',priority:'Media',
   successCriteria:'Flujo TO-BE y validaciones aceptados por Compras, Finanzas y Legal; tiempo promedio de aprobación medido contra su línea base.',
   measurementPlan:'KPI de resultado: tiempo promedio de aprobación. Registrar línea base y meta en Indicadores antes de activar.',
   resources:'Equipo de Procesos (DIPP), tiempo de Compras, Finanzas, Legal y Construcción, y registros de requisiciones recientes.',
   risks:'Volumen de requisiciones por temporada de obra; excepciones no documentadas; dependencia de cambios en sistemas.',
   dependencies:'Áreas involucradas: Compras (responsable), Construcción, Finanzas, Legal, Procesos de Negocio (DIPP), Tecnología y Datos. Se relaciona con M4 (validación presupuestal trazable).',
   reviewFrequency:review}},
 {code:'M4',title:'Información, control financiero y riesgos',
  objective:'Fortalecer el control presupuestal en PRESCORP para que cada requisición cuente con una validación trazable, con una matriz de controles definida.',
  areas:[{name:'Finanzas / Control Presupuestal',role:'Responsable: dueño del control y de la matriz de controles'},{name:'Compras',role:'Origina requisiciones sujetas a validación'},{name:'Tecnología y Datos',role:'Configuración y datos de PRESCORP'},{name:'Auditoría / Control Interno',role:'Revisión de controles y evidencia'},{name:'Procesos de Negocio (DIPP)',role:'Diseña controles y documenta el proceso'},{name:'Construcción',role:'Área solicitante principal'}],
  kpis:[{id:'m4-kpi-1',name:'Requisiciones con validación presupuestal trazable',unit:'%',direction:'increase',formula:'Requisiciones con validación y evidencia / requisiciones totales × 100',baseline:null,target:null,frequency:'Mensual',source:''},{id:'m4-kpi-2',name:'Requisiciones sin presupuesto validado',unit:'%',direction:'decrease',formula:'Requisiciones avanzadas sin validación / requisiciones totales × 100',baseline:null,target:null,frequency:'Mensual',source:''},{id:'m4-kpi-3',name:'Controles clave con evidencia vigente',unit:'%',direction:'increase',formula:'Controles con evidencia vigente / controles de la matriz × 100',baseline:null,target:null,frequency:'Trimestral',source:''}],
  suggestedSponsorRole:'Dirección de Finanzas',suggestedOwnerRole:'Gerencia de Control Presupuestal',
  profile:{code:'M4',strategicAlignment:'Sostenibilidad y rentabilidad: información confiable y control del gasto y los riesgos.',
   problemStatement:'La validación presupuestal de las requisiciones no siempre queda trazada, lo que limita el control del gasto y la rendición de cuentas.',
   expectedBenefit:'Mayor porcentaje de requisiciones con validación trazable, menor riesgo de gasto sin presupuesto y evidencia lista para auditoría.',
   scopeText:'Proyecto ilustrativo: Control presupuestal en PRESCORP. Entregable clave: matriz de controles presupuestarios.',
   exclusions:'Cambios al plan contable o a la política de presupuesto corporativa; desarrollo mayor en PRESCORP sin validar factibilidad.',
   department:'Finanzas / Control Presupuestal',startDate:START,targetDate:'2027-06-30',priority:'Alta',
   successCriteria:'Matriz de controles presupuestarios aceptada; requisiciones con validación trazable medidas contra su línea base.',
   measurementPlan:'KPI de resultado: % de requisiciones con validación trazable. Registrar línea base y meta en Indicadores antes de activar.',
   resources:'Equipo de Procesos (DIPP), Control Presupuestal, Tecnología y Datos para PRESCORP y accesos a información presupuestal.',
   risks:'Limitaciones técnicas de PRESCORP; calidad de los datos de origen; carga de trabajo del cierre contable.',
   dependencies:'Áreas involucradas: Finanzas / Control Presupuestal (responsable), Compras, Tecnología y Datos, Auditoría / Control Interno, Procesos de Negocio (DIPP), Construcción. Se relaciona con M3 (flujo de requisiciones).',
   reviewFrequency:review}}
];
