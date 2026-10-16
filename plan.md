# Plan de implementación · ITM Project Hub

## Alcance y referencia

Construir una aplicación web integral en español, modular y responsive, con los módulos solicitados. El único adjunto disponible fue `ITM_Kit_Consultoria_Procesos_v2(2).html`. El archivo `project_management_hub.html` no fue adjuntado; se usaron las funciones detalladas en la solicitud como requisitos.

El kit contiene **cinco metodologías**, no una etapa oficial común de cinco pasos. Sus planes de ejemplo incluyen cuatro o siete pasos. Por acuerdo expreso del usuario, la aplicación conserva un marco operativo configurable de cinco etapas, agrupando la estructura de siete pasos:

1. **Inicio y alcance:** necesidad, objetivos, exclusiones, patrocinio y criterios de aceptación.
2. **Diagnóstico y análisis:** AS-IS, información, causas, brechas, riesgos y oportunidades.
3. **Diseño y recomendaciones:** TO-BE, alternativas, controles y priorización.
4. **Validación e implementación:** validación con el cliente, plan, piloto, adopción y KPIs.
5. **Cierre y transferencia:** aceptación, pendientes, lecciones, transferencia y beneficios.

Cada etapa tiene actividades, entregables, responsables, fechas, estado y avance. Los nombres son editables. El catálogo de métodos ITM y los planes Express/Estándar/Transformación permanecen diferenciados del número de etapas.

## Implementación y estructura

- **React 19 + TypeScript + Vite**, en componentes y módulos por capacidad; CSS propio con Inter y Manrope, paleta azul marino ITM, semáforos, estados textuales y breakpoints. Lucide para iconografía; Recharts para visualización; las vistas se cargan bajo demanda.
- **`src/app/`:** shell, navegación, persistencia/CRUD y coordinación de estados.
- **`src/components/`:** controles compartidos, badges, diálogos, tablas y notificaciones.
- **`src/domain/`:** tipos, fórmulas KPI, metodologías, blueprint de etapas y pruebas.
- **`src/data/`:** demo explícita, persistencia local y adaptadores JSON/CSV.
- **`src/features/`:** dashboard, proyectos, tareas, equipo, RAID, reportes, metodología, datos e integración Microsoft.
- **`src/integrations/`:** cliente MSAL y Graph.
- **`docs/` y `public/`:** arquitectura/guías/diagrama y recursos web.

### Funcionalidades

- Dashboard: total, avance promedio calculado desde etapas, riesgo, fechas vencidas, distribución de semáforos, alertas por proyecto crítico y carga.
- Proyectos: alta/edición y vista de cinco etapas; actividades y entregables; responsables/fechas; RAID; tareas relacionadas.
- Tareas: estados Por Hacer / En Proceso / En Revisión / Completado, prioridades Baja / Media / Alta / Urgente, horas estimadas y reales, subtareas, temporizador, Tabla/Kanban, filtros.
- Equipo: capacidad semanal editable y demanda estimada abierta asignada; horas reales en indicador separado.
- RAID: riesgos, supuestos, incidencias, dependencias y decisiones con responsable, severidad, respuesta, fecha y estado.
- Reportes: KPIs y resumen descargable con reglas de cálculo explicadas.
- Persistencia: localStorage versionado; backup JSON completo; CSV de proyectos, tareas y RAID; importación con combinación por ID o reemplazo confirmado; migración de planes ITM a cinco etapas.
- Microsoft: MSAL Browser con permisos delegados; acciones manuales de envío de tarea y creación de evento de hito. Los IDs externos se guardan localmente.

## Integración y límites

La conexión Microsoft queda preparada en el código, no activada: requiere registro de SPA de Microsoft Entra, Client ID, Tenant ID, redirect URI, permisos delegados y consentimiento de administrador cuando aplique. La aplicación no incluye secretos de cliente, backend, sincronización automática/bidireccional, webhook o auditoría institucional. Los datos del workspace viven solo en el navegador; las credenciales de Entra y la sesión no se exportan en el backup JSON.

No se activa ni se publica un backend, base de datos, SharePoint, Microsoft Lists o Dataverse. La arquitectura separa repositorio/vistas para habilitar un reemplazo posterior con autenticación, control de concurrencia, permisos, auditoría y migración institucional.

## Reglas de diseño y operación

- Progreso del proyecto = promedio simple de cinco etapas; progreso del portafolio = promedio simple de proyectos.
- Hito vencido = objetivo de proyecto o fecha final de etapa antes de hoy, si el elemento no está completado. Proyecto y etapa pueden contarse por separado.
- La recomendación de riesgo deriva de semáforo manual, bloqueos, RAID abierto y atrasos. El color manual no se reemplaza silenciosamente.
- Carga = horas estimadas abiertas / capacidad semanal; es una señal de demanda, no una programación semanal detallada cuando las tareas abarcan varios períodos.
- Horas reales = captura manual más intervalos cerrados de temporizador.
- Se incluye una demo ficticia identificada y reemplazable; nuevas instalaciones pueden iniciar con proyectos/tareas de muestra.
- No se publica ni se conecta un tenant externo durante la entrega local.

## Comprobaciones y entrega

- Validar tipos, pruebas de dominio/intercambio y compilación estática.
- Inspeccionar Preview en escritorio y móvil.
- Entregar la aplicación ejecutable en Preview, el código fuente completo con lockfile y documentación de instalación, arquitectura, diagrama, metodología, límites, supuestos y datos pendientes.
