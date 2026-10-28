# ProcessOne v1.2 — Bloque 1: Fundamentos y datos

**Estado:** desarrollo aislado; NO desplegado, NO migrado, NO fusionado a main.

## Decisiones aprobadas
- Conservar las seis etapas corporativas existentes y sus IDs históricos.
- Daily por célula; seguimiento semanal por proyecto; comité por iniciativa.
- Proyecto aprobado: iniciativa principal, célula, metodología, Process Owner y responsable del proyecto obligatorios.
- Borradores y proyectos existentes no quedan bloqueados retroactivamente.
- Actividades de metodología + iniciativa + gobierno se consolidarán sin duplicados en un bloque posterior.

## Alcance implementado en esta rama
1. Contratos TypeScript aditivos en `src/domain/initiativeArchitecture.ts` para células, miembros, iniciativas, vínculos, asignaciones, versiones, plantillas, KPIs y mediciones.
2. Validador de campos obligatorios para **proyectos aprobados** (todavía sin conexión a formularios ni API).
3. Borrador de esquema MySQL en `docs/v1.2/01-schema-propuesto-no-ejecutar.sql` sin ejecución ni cambios de tablas existentes.
4. Pruebas unitarias de validación del dominio.

## Hallazgos en main
- `Workspace` utiliza `schemaVersion: 1`; no modificarlo hasta diseñar migración.
- `Project` tiene `ownerId`, `methodologyId` y etapas; no distingue Process Owner de responsable del proyecto.
- `InitiativesPage` consume la API de iniciativas con campos básicos y lista de IDs de proyecto. Debe preservarse el acceso a esos datos.
- Las seis etapas están definidas en `src/domain/methodologies.ts`.
- La identidad real de usuarios en MySQL y el almacenamiento compartido del workspace requieren revisión para fijar tipos y claves foráneas.

## Plan de migración (pendiente de validación)
1. Obtener `SHOW CREATE TABLE` de usuarios, iniciativas, proyectos/workspace y migraciones, SIN exponer contraseñas ni secretos.
2. Revisar nombres, colisiones, tipos de IDs, integridad referencial y permisos del usuario de BD.
3. Generar migración versionada e idempotente, con respaldo completo de staging.
4. Ejecutar **únicamente en staging**, con rollback probado; nunca automáticamente en despliegue de producción.
5. Crear registros de regularización para proyectos existentes sin alterar estados, fechas ni evidencias.
6. Probar que una iniciativa puede vincular N proyectos, que un proyecto tiene a lo sumo una iniciativa principal y que la validación se exige solo al aprobar.
7. Integrar API con permisos verificados en servidor; mantener compatibilidad con endpoints existentes.

## Riesgos y decisiones técnicas
- El SQL es un borrador: NO ejecutarlo sin validar compatibilidad MySQL/Hostinger y los tipos reales de IDs.
- No existen FKs hacia tablas históricas hasta comprobar su esquema. La integridad debe reforzarse en API y luego con migraciones seguras.
- La relación entre proyectos e iniciativas existentes requiere migración, no reemplazo silencioso.
- La unicidad de iniciativa principal se modela con columna generada y UNIQUE; validar versión del servidor antes de adoptar.
- Los roles de negocio (Process Owner, líder de célula) son asignaciones, no sustituyen permisos de acceso (Dirección, Gerencia, etc.).
- No se incluyen seeds automáticos: seis células y doce iniciativas propuestas requieren validación organizacional antes de cargarse.

## Criterios de aceptación del Bloque 1
- [x] Contratos de dominio independientes y sin cambios destructivos al modelo vigente.
- [x] Esquema SQL propuesto, no ejecutado.
- [x] Reglas básicas de validación definidas.
- [ ] Inspección de esquema MySQL real y compatibilidad.
- [ ] Migración idempotente ejecutada en staging y reversión comprobada.
- [ ] API de células e iniciativas con control de acceso en servidor.
- [ ] Catálogo de células conectado a UI y persistencia.
- [ ] Pruebas de integración y seguridad con datos reales de staging.

**No publicar ni fusionar** hasta cerrar los criterios pendientes.

## Avance adicional 2026-10-28
- Confirmado: **Process Owner y responsable del proyecto son roles independientes**; una persona puede ocupar ambos.
- Comparados los tipos base con `database/processone_mysql.sql`: `po_users.id` e `po_initiatives.id` son BIGINT UNSIGNED; `po_projects.id` es VARCHAR(100).
- Se conserva `po_initiatives` y `po_initiative_projects` existentes; la propuesta agrega detalles sin duplicar ni eliminar registros.
- Endpoint `cells_v12` de lectura, alta y edición con autenticación, CSRF, validaciones, control de permisos y auditoría. Requiere instalar migración antes de habilitarlo.
- Pantalla de células integrada en Iniciativas, con registro y edición básica; asignación de líder e integrantes sigue pendiente.
- Se añadieron pruebas para roles independientes, validación de usuarios activos e iniciativa principal única.

## Estado de cierre
**No se puede considerar el bloque desplegado o validado**: falta ejecutar CI, revisar el DDL con MySQL real, probar migración y rollback en staging, integrar membresías y persistencia de asignaciones, y verificar permisos con sesiones reales. No fusionar este PR a main hasta completar esas verificaciones.

## Advertencia sobre despliegue
El endpoint nuevo sólo funciona después de crear las tablas de staging. La rama no debe desplegarse antes de la migración. El esquema sigue marcado como propuesta: `CREATE TABLE IF NOT EXISTS` no verifica equivalencia de una tabla preexistente.
