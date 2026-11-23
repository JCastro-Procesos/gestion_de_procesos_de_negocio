# Pase a producción: Metodología e iniciativas

Versión funcional validada: 844aa57222d1d7be4aeb0542dd87dd522dd2ce1e.
Validación automática: https://github.com/JCastro-Procesos/gestion_de_procesos_de_negocio/actions/runs/41082949597
Publicación en pruebas correcta: https://github.com/JCastro-Procesos/gestion_de_procesos_de_negocio/actions/runs/41084606948
El usuario confirmó satisfactoriamente las pruebas funcionales.
PR: https://github.com/JCastro-Procesos/gestion_de_procesos_de_negocio/pull/47

## Estado
Preparación documental completa. Publicación y fusión pendientes. Falta verificar el esquema real de producción; no afirmar que la migración está lista para ejecutar sin esta comprobación.

## Alcance
Arquitectura corporativa y departamental de iniciativas, metodologías versionadas, KPIs y mediciones, vinculación de proyectos, avance automático, captura de bloqueos y RAID; rojo limitado a líneas de avance y títulos sin referencias a bloques.

## Orden de ejecución
1. Ejecutar únicamente database/migrations/v1_2_production_preflight_readonly.sql en la base de producción. Confirmar base esperada y motor, tipos de po_users.id y po_initiatives.id, columnas y restricciones de tablas v12. Guardar resultado fuera del repositorio si contiene información privada.
2. Comparar con las tres migraciones del bloque 2. Si faltan tablas, preparar migración específica tras verificar dependencias (incluida po_cells_v12). Si existen tablas de propuestas anteriores, CREATE TABLE IF NOT EXISTS NO corrige diferencias; preparar ALTER específico revisado. No ejecutar docs/v1.2/01-schema-propuesto-no-ejecutar.sql: es una propuesta histórica y contiene definiciones distintas.
3. Antes de cualquier DDL: obtener y verificar respaldo independiente de la base de producción. MySQL DDL no se revierte con ROLLBACK. Mantener datos reales; no copiar workspace, usuarios ni registros ficticios de pruebas. Las plantillas publicadas que deban existir en producción requieren creación o transferencia controlada por separado.
4. Aplicar solo los cambios de esquema revisados y comprobar columnas, claves y acceso API autenticado.
5. Fusionar PR #47 a main una vez satisfechos los requisitos. Verificar CI del resultado final. La rama no presentaba conflictos al preparar este pase.
6. En Actions > Publicar ProcessOne (con aprobación), seleccionar main, destino produccion y confirmación PUBLICAR. No ejecutar desde la rama feature. El workflow respalda archivos y base antes de copiar archivos, verifica sitio/API y revierte archivos si falla la comprobación. No ejecuta migraciones.
7. Validar en producción: login; iniciativas/metodologías; crear/seleccionar iniciativa; guardado tras recargar; permisos; actividad Bloqueada con detalle obligatorio; incidencia en Riesgos y decisiones; líneas de avance rojas; títulos sin Bloque 2A; proyectos y evidencias existentes conservados.

## Reversión
Usar Rollback ProcessOne con el respaldo de archivos registrado por la publicación y verificar sitio/API. Conservar tablas aditivas y registros nuevos; no borrar tablas ni restaurar automáticamente una base antigua. Cualquier restauración de datos exige revisar escrituras posteriores al respaldo.

## Pendiente antes de autorizar publicación
- Resultado del preflight de producción y resolución de diferencias, si existen.
- Respaldo verificado antes de DDL, cuando aplique.
- CI del commit que llegue a main.
- Ejecución manual final de publicación.
