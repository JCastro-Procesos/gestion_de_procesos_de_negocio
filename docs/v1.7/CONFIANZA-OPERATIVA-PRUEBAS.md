# Confianza operativa · avance único, controles compartidos y solicitudes

## Preparación de pruebas

1. Descargar y comprobar un respaldo de la base de PRUEBAS y de sus archivos.
2. En phpMyAdmin seleccionar la base de PRUEBAS y ejecutar `SELECT DATABASE();`. Confirmar que no es la base productiva. Aplicar `database/migrations/20261103_project_requests_staging.sql` una sola vez (es idempotente). No usa `information_schema`, no contiene `USE`, no elimina ni modifica tablas existentes.
3. Ejecutar `deploy-processone.yml`: rama `feature/v1.7-confianza-operativa`, destino `pruebas`, confirmación vacía.
4. Usar al menos una cuenta solicitante y otra de Gerencia/Dirección/Administración para decidir. Nadie se aprueba su propia solicitud, ni Administración.
5. No pasar a producción hasta validar los casos de esta guía. La migración no se ejecuta automáticamente durante el despliegue.

## Avance oficial

Una fórmula compartida para portafolio, detalle, panel ejecutivo, Gantt, reportes, exportaciones y consolidado de iniciativas. Cada etapa usa el promedio de porcentajes registrados de sus actividades; sin actividades usa su progreso registrado. Con exactamente seis etapas únicas 1–6 se pondera por tipo de proyecto:

| Tipo | Inicio | Diagnóstico | Diseño | Validación | Implementación | Cierre |
|---|---:|---:|---:|---:|---:|---:|
| Tecnológico |10|15|20|15|30|10|
| Documentación |10|30|30|15|10|5|
| Optimización |10|25|25|10|20|10|

Planes históricos con otra estructura usan pesos uniformes. Se limita progreso a 0–100 y se redondea al consolidar; no se cambian datos ni estados guardados. El porcentaje mostrado puede cambiar frente a las fórmulas anteriores. Las horas estimadas/reales y los KPI de beneficios conservan su significado separado.

- [ ] Comparar el mismo proyecto en todas las pantallas y exportaciones; mismo porcentaje con iguales filtros.
- [ ] Proyecto tecnológico con sólo implementación al 100%: avance oficial 30%.
- [ ] Actividad al 60% en Inicio de Optimización, demás etapas a 0%: avance oficial 6%.
- [ ] Probar planes históricos sin seis etapas, sin actividades y sin avance: comportamiento explicado y sin valores inventados.

## Controles compartidos

Presupuesto, tarifa, costos, línea base, dependencias de actividades y beneficios ahora forman parte de `po_workspace.payload`, con la revisión del espacio. Se incluyen en exportación JSON general. Las preferencias de presentación y de alertas siguen locales.

- [ ] Registrar un costo y un beneficio; recargar y abrir desde otra cuenta/navegador: mismos valores.
- [ ] Capturar línea base y dependencia; comprobar desde otra sesión. Rechazar ciclos y dependencias de otro proyecto en el servidor.
- [ ] Gerencia/Dirección/Administración pueden autorizar presupuesto y tarifa; Especialista registra costos/beneficios/planeación, sin alterar autorizados. Ingeniero consulta controles.
- [ ] Confirmar importes no negativos, fechas válidas y registros vinculados al proyecto.
- [ ] Desde una cuenta autorizada, revisar el traslado de controles locales: muestra conteos, agrega sólo registros faltantes de proyectos existentes y conserva valores compartidos. Se mantiene intacta la copia local; no se importa automáticamente.
- [ ] Revisar Historial de controles: actor, revisión, fecha, presupuesto, pagado/comprometido y conteos de línea base/beneficios. Son instantáneas globales desde esta versión, dentro de las últimas 200 versiones. No reconstruyen la historia de datos locales.

## Solicitudes y decisiones

Alta de solicitudes por cualquier cuenta autenticada. Decisiones sólo para Gerencia, Dirección o Administración, con justificación obligatoria e independencia del solicitante. La identidad se obtiene de la sesión, nunca del texto enviado por el navegador.

- [ ] Crear solicitud completa; verificar que aparece en otra cuenta y permanece al recargar.
- [ ] Solicitante no ve aprobación propia; probar rechazo directo del servidor también.
- [ ] Aprobación requiere macroiniciativa existente y metodología vinculada, responsable del equipo y fechas válidas.
- [ ] Aprobar con otra cuenta: una transacción crea proyecto, relación, seis etapas y actividades corporativas/de metodología/macroiniciativa disponibles. Fechas respetan el período solicitado.
- [ ] Decisión simultánea o repetida devuelve conflicto; sólo se crea un proyecto. Rechazo y errores no crean proyectos parciales.
- [ ] Comprobar historial de solicitud y bitácora del servidor. La solicitud ya decidida conserva su decisión y no puede decidirse otra vez.
- [ ] Solicitudes locales antiguas se muestran separadas. Importar crea una nueva pendiente a nombre de la cuenta actual y conserva el original; no acredita decisiones pasadas. Repetir la misma importación no duplica el ID.
- [ ] Creación directa de Proyecto aprobado sólo para Gerencia/Dirección/Administración. Otros perfiles deben solicitarlo.

## Certeza del guardado

- [ ] Con red lenta mostrar Guardando hasta recibir acuse. Cambios adicionales se encolan; no confirmar antes del último acuse.
- [ ] Dos sesiones editan con la misma revisión: una guarda y la otra muestra Conflicto, conservando su borrador visible. Nunca reintenta sobrescribiendo automáticamente.
- [ ] Desconectar red durante un cambio: mostrar error, permitir descargar borrador sin confirmar y advertir antes de salir/recargar.
- [ ] Cargar versión del servidor requiere confirmación de reemplazo del borrador. Si falla la carga, conservar el borrador.
- [ ] Interrumpir sólo la consulta de actualizaciones: advertir que la vista puede estar desactualizada, sin borrar datos.
- [ ] Formulario de proyecto/solicitud conserva campos y error si la API rechaza; sólo cerrar y confirmar después del acuse.

El estado global describe el espacio compartido. Las solicitudes muestran su propio estado de envío/decisión. Sus transacciones incrementan la revisión del espacio al aprobar: un editor anterior puede recibir conflicto y debe conservar/conciliar su borrador.

## Alcance técnico

Sin nuevas dependencias. La API protege datos nuevos frente a clientes antiguos que omiten `projectControls`. Las validaciones y versiones se ejecutan en la misma transacción del guardado. Pruebas de integración contra MariaDB aislada cubren identidad, permisos, independencia, aprobación atómica, rollback y repetición. Ninguna prueba automática contacta producción ni importa datos reales.
