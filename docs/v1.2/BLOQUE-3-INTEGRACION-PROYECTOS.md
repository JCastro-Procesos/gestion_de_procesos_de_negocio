# Integración con proyectos — entrega 3A
Base: main 1e5dd98. Decisión del usuario: vista previa y selección antes de incorporar actividades.
## Implementado
- Panel en detalle de proyecto conectado al endpoint existente, sin segundo selector de iniciativa.
- Vinculación explícita a versión publicada; vista previa por etapa, entregable, criterio, responsable y fechas.
- Selección individual o total, incorporación de faltantes, origen persistido en cada actividad.
- Prevención de duplicados por origen incluso tras renombrar; compatibilidad con históricos por nombre.
- Requiere seis etapas de correspondencia única; no migra proyectos históricos automáticamente.
- No requiere SQL adicional.
## Verificación
CI del PR: TypeScript, Vitest, compilación y validaciones PHP y paquete.
Pendiente: prueba funcional autenticada en staging, guardado y recarga, permisos, proyectos históricos y bloqueo/RAID sin regresiones.
No fusionar ni publicar producción antes de validar staging.
## Siguientes entregas del bloque 3
- Ficha de gobierno: célula, área cliente, Process Owner, patrocinador, responsable e iniciativas secundarias.
- KPIs de iniciativa/proyecto y criterios de éxito.
- Orígenes adicionales (iniciativa y gobierno), dependencias y planificación por duración.
Esta entrega solo cubre generación selectiva desde metodología. Las fechas iniciales usan las de la etapa; no calcula calendario laboral.
