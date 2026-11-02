# Gobierno y colaboración — revisión para pruebas

## Alcance entregado

- Portafolio, Por revisar y Mis compromisos, con contadores, búsqueda y filtros por tipo, estado, proyecto y vencimiento.
- Altas de solicitudes, entregables y cambios con responsable y revisor de cuentas activas, fecha, justificación, evidencia e impacto.
- Revisión independiente: menor permite Gerencia o superior; mayor y crítico requieren Dirección o Administración. El creador y el responsable no deciden ni verifican. Administración independiente puede cubrir una revisión asignada a otra persona; su intervención queda registrada.
- Devolver → corregir ficha → reenviar → decidir. No se admite decidir directamente una devolución ni reenviar sin guardar la corrección posterior a la devolución.
- Aprobado → En curso → Implementado → Verificado. Evidencia HTTPS obligatoria en los dos últimos pasos; verificación independiente. Se puede devolver una implementación a En curso antes de verificarla, con motivo.
- Comentarios, bitácora por solicitud paginada sin descartar eventos y fichas históricas por revisión. Los registros heredados conservan su contenido antes de su primera modificación.
- Permisos y control de revisión en servidor; una edición concurrente responde conflicto y exige actualizar el detalle. Autenticación y CSRF de la API siguen siendo obligatorios.
- La bandeja usa la identidad autenticada, no el selector local de perfil. Los revisores se muestran por nombre.

La aprobación en Gobierno registra la decisión, no aplica cambios automáticamente al alcance, presupuesto o plan del proyecto ni sustituye su aprobación de alta. Las notificaciones por correo y las integraciones externas quedan fuera de esta revisión.

## Preparación de pruebas

1. Respaldar la base de pruebas.
2. En phpMyAdmin seleccionar la base exclusiva de PRUEBAS. No usar la de producción.
3. Abrir SQL y ejecutar el contenido completo de `database/migrations/20261102_governance_collaboration_staging.sql`. La migración solo crea dos tablas con sus índices y relaciones; no modifica ni elimina filas anteriores. Es idempotente y fue incorporada a pruebas contra MariaDB aislada.
4. Publicar manualmente `feature/v1.3-gobierno-colaboracion` con destino `pruebas` y confirmación vacía en `deploy-processone.yml`.
5. Entrar a Gobierno. Si falta la migración en esa base, la interfaz muestra el aviso y conserva consulta del historial previo, bloqueando mutaciones.

La migración no se ejecuta automáticamente ni se distribuye dentro del directorio público. Los dos módulos PHP nuevos sí están incluidos explícitamente en el paquete y en su lista blanca.

## Matriz de aceptación

| Caso | Resultado esperado |
| --- | --- |
| Especialista crea solicitud menor | Exige responsable, revisor independiente, fecha y justificación |
| Cambio sin impacto / entregable sin evidencia | Impide enviar |
| Ingeniero abre la bandeja | Consulta y comentarios; sin alta ni decisiones |
| Revisor ve Por revisar | Solo pendientes que puede revisar por identidad, asignación e impacto |
| Creador o responsable intenta decidir | Servidor rechaza incluso con perfil administrador |
| Gerencia intenta aprobar mayor/crítico | Servidor rechaza |
| Devolución | No puede aprobarse hasta corregir y reenviar |
| Dos sesiones modifican la misma revisión | Segunda escritura devuelve conflicto; no pierde datos |
| Aprobación | Ejecución sigue pendiente; no altera el plan del proyecto |
| Implementación sin evidencia | Servidor rechaza |
| Responsable verifica su ejecución | Servidor rechaza; revisión corresponde al revisor independiente |
| Historial >100 eventos | Cargar historial anterior permite seguir consultándolo sin mezclar solicitudes |
| Abrir ficha histórica | Consulta el contenido anterior sin restaurarlo ni editarlo |
| Solicitud previa a la migración | Continúa consultable; se completa ficha para aprobar; se conserva versión heredada |
| Fecha compromiso hoy / ayer | Solo ayer figura vencido; rechazados y verificados no cuentan |

## Verificación técnica

Pruebas TypeScript de bandejas y validaciones, pruebas PHP de reglas de autorización, integración del handler PHP con MariaDB aislada (incluye migración repetida, transacciones, revisiones, historial y versiones), escenarios DOM locales y compilación. El harness de integración usa únicamente localhost:33306 y la base processone_governance_test; no carga configuración ni datos de hosting y no se publica en el sitio.

## Producción y reversión

Esta rama es para pruebas. No fusionar ni publicar en producción hasta revisar los casos anteriores. Al aprobarse, la migración aditiva se aplica también en producción después de respaldo y antes del despliegue. Para revertir la aplicación, restaurar el paquete anterior mediante el flujo existente; conservar ambas tablas y su historial, sin DROP ni borrado de decisiones.

## Corrección del primer despliegue de pruebas

El paquete incluía governance.php y governance_policy.php, pero la copia remota conservaba la lista anterior de módulos y no los enviaba al sitio. Se corrigió la validación PHP y la publicación para utilizar una lista explícita de los siete módulos, verificar su copia y publicar index.php después de sus dependencias. Tres pruebas reproducen la copia en un sitio temporal, comprueban el contenido y los permisos y conservan el controlador previo si falta una dependencia. La interfaz solo anuncia una migración faltante cuando la API lo confirma, no cuando falla su respuesta.

Publicar una ejecución nueva desde la misma rama de pruebas para recoger la corrección. Si el SQL ya se ejecutó correctamente en esa base no es necesario repetirlo.
