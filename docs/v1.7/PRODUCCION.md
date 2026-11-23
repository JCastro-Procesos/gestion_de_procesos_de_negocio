# Pase a producción · Confianza operativa

Versión funcional aprobada en pruebas: `205f4b87692c66b59e2aee0084041c3d7a8356cb`. El preparado añade únicamente esta guía y una copia identificada para producción del SQL ya validado; no cambia la aplicación.

1. Conservar un respaldo SQL integral descargado y verificado, además de los archivos/configuración de producción. Evitar ediciones durante la publicación.
2. En phpMyAdmin seleccionar la base productiva y ejecutar `SELECT DATABASE();`. Debe devolver `u378754586_processone`.
3. Aplicar `database/migrations/20261103_project_requests_production.sql` en esa base. Crea de forma idempotente `po_project_requests_shared` y `po_project_control_versions`; no migra controles locales automáticamente ni elimina tablas/datos. La migración es manual y no se revierte con ROLLBACK.
4. Ejecutar `deploy-processone.yml` desde `main`, destino `produccion`, confirmación `PUBLICAR`. Aprobar el entorno si GitHub lo solicita. Esperar que Validar, Empaquetar y publicar terminen correctamente.
5. En https://procesos.viajescasal.com comprobar: avance idéntico entre vistas, costo visible desde otra cuenta, solicitud de prueba aprobada por una segunda cuenta autorizada, historial y estado Guardado tras el acuse. Usar registros claramente identificados de prueba y conservar las evidencias de aceptación.
6. Los controles locales sólo se trasladan desde Revisar traslado a MySQL con una cuenta autorizada y confirmación explícita; los registros compartidos existentes tienen prioridad. Las solicitudes locales antiguas se incorporan como nuevas pendientes, sin acreditar decisiones previas.

Si la verificación falla, detener ediciones y revisar el resultado del flujo. La reversión de archivos no revierte SQL ni decisiones posteriores; no eliminar las tablas nuevas para intentar revertir y no restaurar una copia de base sobre cambios posteriores sin conciliarlos. El borrador descargable se identifica como sin confirmar, no como respaldo integral.

Las pruebas detalladas y la matriz de roles están en `docs/v1.7/CONFIANZA-OPERATIVA-PRUEBAS.md`.
