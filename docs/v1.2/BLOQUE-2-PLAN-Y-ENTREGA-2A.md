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
