# Validación integral · pruebas de aceptación

## Publicar en pruebas

Ejecutar `deploy-processone.yml` con rama `feature/v1.5-validacion-integral`, destino `pruebas`, confirmación vacía. No ejecutar producción para esta revisión. No requiere migración SQL, nuevas dependencias ni configuración adicional.

Entrar a https://procesos-pruebas.viajescasal.com y abrir **Validación integral** en Control. Disponible a todos los roles autenticados; sólo lee el espacio que la aplicación ya carga. No amplía permisos de escritura ni sustituye la auditoría administrativa.

## Diagnóstico automático

Revisa identificadores duplicados, vínculos proyecto/etapa/tarea, responsables del equipo, fechas válidas e intervalos, fechas fuera del padre, etapas y metodología/relación principal ausentes, avances y cierres inconsistentes, actividades cerradas sin evidencia, horas negativas, dependencias inexistentes/autorreferencias/ciclos, KPI de proyecto y registros de tiempo.

Errores indican inconsistencias estructurales o valores imposibles. Advertencias requieren revisión del plan o información incompleta; no siempre representan defectos de software. No compara porcentajes de etapa con una fórmula alternativa ni inventa fechas o métricas.

Alcance: instantánea del workspace cargado. No consulta los catálogos SQL separados de iniciativas, metodologías, KPI de iniciativas, usuarios ni solicitudes de gobierno. Comprueba presencia de metodología y macroiniciativa, no la existencia real del ID en esos catálogos. No verifica URLs de evidencia, autenticidad de documentos, disponibilidad del servidor ni permisos del backend: se incluyen en el checklist manual. Presupuesto y costos siguen locales al navegador y deben auditarse por separado.

## Casos iniciales

1. Abrir un espacio vacío: diagnóstico sin hallazgos, checklist pendiente; no mostrar aprobación automática.
2. En un proyecto de prueba, dejar fechas/responsable incompletos: identificar advertencias y abrir el proyecto desde el hallazgo.
3. Corregir el registro y guardar: el diagnóstico anterior avisa que el espacio cambió. Nueva revisión actualiza los resultados y reinicia el checklist.
4. Filtrar por proyecto, severidad y área, buscar texto, recorrer la lista con teclado y desplazamiento vertical; no modifica los datos.
5. Escribir evidencia en una prueba manual y marcar Conforme. Sin evidencia Conforme está deshabilitado; borrar la nota devuelve a Pendiente.
6. Exportar JSON: confirmar ambiente, fecha de diagnóstico y exportación, fuente desactualizada/error si aplica, todos los hallazgos (aunque haya filtros) y checklist con evidencia. Guardarlo antes de navegar o recargar: el checklist es temporal del módulo.
7. Completar los ocho casos del checklist en pruebas: alineación; ejecución; gobierno; permisos; persistencia/concurrencia; reportes/Gantt/alertas; presupuesto local; despliegue/recuperación.
8. Registrar observaciones y evidencias. Cero hallazgos no certifica la aplicación ni autoriza producción.

## Cobertura técnica

Pruebas unitarias de determinismo y ausencia de mutaciones, fechas imposibles/invertidas, relaciones cruzadas, responsables inválidos, ciclos vs dependencias compartidas, cierre inconsistente, horas negativas, duplicados e indicadores huérfanos. La revisión UI local cubre filtros/navegación, requisito de evidencia, reinicio y aviso de cambios/error de fuente.

No se crean datos de prueba automáticamente, no se ejecutan restauraciones y no se altera el esquema de MySQL. Mantener esta rama separada de main hasta la aceptación funcional.
