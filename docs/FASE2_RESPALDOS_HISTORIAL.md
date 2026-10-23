# Fase 2 · Respaldo, restauración e historial

## DAT-03 · Política de respaldos
- La exportación JSON del espacio compartido **no equivale** a un respaldo completo de MySQL: no incluye usuarios, iniciativas, autorizaciones ni bitácoras.
- Antes de cada publicación: respaldo consistente de **la base exclusiva ProcessOne** y del directorio de aplicación, con registro de fecha, versión y operador.
- No almacenar respaldos SQL con contraseñas, correos o hashes en el repositorio público, en el navegador ni dentro de public_html.
- Guardar cifrado en ubicación privada con acceso limitado, rotación y política de retención definida por la organización.
- Verificar integridad del respaldo (SHA-256) y practicar restauración en una base aislada antes de autorizar producción.
- No habilitar un botón web de restauración directa sobre la base de producción: requiere doble confirmación, respaldo previo y ventana aprobada.
- No incluir ni tocar las bases de datos de CRM ni del cotizador.

## DAT-04 · Historial
- `po_audit_log` ya registra eventos de identidad y operaciones; `po_governance_events` conserva las decisiones de Gobierno.
- Próximo paso: vista de consulta de eventos con paginación, filtros y permiso de administrador, sin opción de modificar eventos.
- Registrar diferencias de campo cuando sea apropiado; nunca contraseñas, tokens ni secretos.
- Registrar cambios de proyectos/tareas con detalles resumidos y versiones sin copiar datos sensibles completos.

## Criterios de aceptación
1. Exportación con fecha, actor y total de registros.
2. Restauración ensayada y verificada en base aislada.
3. Auditoría consultable por administrador y trazabilidad de decisiones.
4. Sin cambios automáticos en producción ni acceso a bases ajenas.
