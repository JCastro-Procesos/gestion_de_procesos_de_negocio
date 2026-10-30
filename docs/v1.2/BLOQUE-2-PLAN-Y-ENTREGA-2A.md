# ProcessOne v1.2 — Bloque 2: plan y avance

## Alcance del bloque
- **2A Iniciativas y alineación:** jerarquía corporativa/departamental, responsables, células, prioridad, alcance, beneficio, fechas y validaciones.
- **2B Metodologías:** catálogo versionado, seis etapas corporativas, plantillas de actividades y entregables; no modificar metodología vigente sin aprobación.
- **2C KPIs:** línea base, meta, unidad, periodicidad, responsable, mediciones, evidencias y cumplimiento.

## Entrega 2A — primera implementación en rama feature/v1.2-bloque2a-iniciativas
- La tabla aditiva `po_initiative_details_v12` complementa `po_initiatives` sin modificar sus registros.
- El endpoint `initiative_details_v12` permite consultar y guardar metadatos; requiere sesión y permisos de Gerencia/Dirección/Administración para cambios.
- El panel "Arquitectura de iniciativas" aparece en Iniciativas y permite clasificar iniciativas existentes y asociarlas a una iniciativa corporativa, una célula y responsables.
- La relación con proyectos en `po_initiative_projects` permanece intacta.
- Las iniciativas departamentales deben depender de una iniciativa corporativa clasificada previamente. Los registros antiguos no clasificados se conservan.
- **No se ha ejecutado la migración, ni se ha desplegado esta rama.**

## Precondiciones antes de staging
1. Respaldar la base de pruebas y verificar `po_initiatives`, `po_users`, `po_cells_v12`.
2. Ejecutar exclusivamente `database/migrations/v1_2_block2a_staging.sql` sobre `u378754586_po_pruebas`.
3. Validar que se creó `po_initiative_details_v12`.
4. Ejecutar el workflow manual con rama de Bloque 2A y destino `pruebas` (nunca producción).
5. Probar: consulta de iniciativas previas; clasificar corporativa; clasificar departamental con padre; validar error sin padre; editar; revisar célula y roles; comprobar que proyectos existentes siguen vinculados; pruebas con usuario sin permiso.
6. Validar build, pruebas automatizadas, seguridad y regresión antes de fusionar.

## Pendientes / no incluidos todavía
- Creación de objetivos de área como entidad propia.
- Reglas de aprobación de iniciativas y métricas de beneficios reales.
- Versionado de metodologías (2B).
- KPIs y mediciones (2C).
- Migración a producción y despliegue: requieren aprobación explícita posterior.

## Compatibilidad
No hay ALTER/DROP de tablas actuales, ni escritura a `po_initiatives` o `po_initiative_projects` desde el nuevo endpoint. No confundir este script con el SQL exploratorio de Bloque 1, que contiene otras tablas no aprobadas.

## Actualización: integración 2B + 2C en el mismo PR
- `server/api/strategy_v12.php`: metodologías versionadas y KPIs con mediciones, protegidos por sesión y CSRF para escritura.
- `src/features/initiatives/StrategyManagementPanel.tsx`: seis etapas y ponderación total 100%; registro de indicadores y mediciones con evidencia HTTPS.
- `database/migrations/v1_2_block2bc_staging.sql`: cinco tablas aditivas para metodología, etapas, actividades, KPIs y mediciones.
- Empaquetado, instalador, validación PHP y smoke test ampliados para el nuevo módulo.
- **No desplegado.** Ambas migraciones 2A y 2BC requieren revisión, respaldo y ejecución manual exclusivamente en la base de pruebas antes del primer despliegue.

### Limitaciones explícitas de esta iteración
- Las metodologías nuevas se guardan como borradores versionados, sin asignación automática a proyectos ni publicación/aprobación desde UI.
- Las actividades de plantilla no crean ni alteran tareas existentes de proyectos.
- Los KPIs muestran cumplimiento por última medición, sin agregación ponderada entre iniciativas ni aprobaciones.
- La jerarquía actual soporta corporativa → departamental; objetivos de área como entidad independiente siguen pendientes.
- La validación de la compilación, pruebas de regresión y staging no está confirmada.

## Integración con proyectos (rama de desarrollo)
- `po_project_methodology_v12` enlaza proyecto existente, iniciativa y versión metodológica, sin reescribir el workspace.
- `project_strategy_v12.php` valida existencia de proyecto/iniciativa, exige metodología publicada, seis etapas y rol Gerencia o superior; deja auditoría.
- En el detalle del proyecto, `ProjectStrategyPanel` permite vincular y generar **solo las actividades faltantes** a partir de la versión seleccionada. No borra tareas, etapas ni evidencias existentes.
- Publicación de metodología requiere justificación y se registra en auditoría.
- Pruebas unitarias para cálculo KPI y prevención de duplicados añadidas.
- Hostinger: acceso de lectura verificado para ambos subdominios. No se han ejecutado migraciones ni despliegues.
- Pendiente de validación técnica real: compilación, tests CI, estructura SQL real y ejecución de migraciones **solo en pruebas**. No fusionar ni desplegar en producción.
