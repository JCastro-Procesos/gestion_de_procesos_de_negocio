# Flujo integrado de ProcessOne

## Resultado
La sección Metodología e iniciativas abre con una vista general y tres etapas navegables: Macroiniciativas → Metodologías de trabajo → Proyectos. La vista general explica las relaciones y muestra proyectos agrupados por macroiniciativa y metodología, junto con sus etapas, actividades y avance.

## Catálogo inicial restaurado
Cinco marcos disponibles sin alta manual: Gobierno y Arquitectura de Procesos; Ingeniería y Mejora de Procesos; Portafolio de Iniciativas y Transformación; Arquitectura Proceso–Tecnología–Datos; Gestión y Control DIPP. Se transcribieron los 46 contenidos de la imagen validada que entregó el usuario. Las actividades se asignaron a las seis etapas vigentes como propuesta editable; los KPIs de referencia son sugerencias, sin valores de línea base ni meta inventados.

El botón Editar metodología permite actualizar propósito, contenidos, actividades, entregables, aceptación, etapa, duración referencial, rol e indicadores. Se conserva el identificador de cada marco y se incrementa su versión. Las actividades ya generadas conservan su información y origen.

## Macroiniciativas
Se reutilizan las iniciativas actuales, sin crear un segundo catálogo. Se conserva su arquitectura corporativa/departamental y asociación a células. Cada macroiniciativa puede vincular metodologías, registrar actividades comunes y utilizar los KPIs y mediciones existentes. Sin una selección metodológica explícita se mantienen los cinco marcos disponibles para compatibilidad con históricos.

## Proyectos y generación
Los proyectos aprobados nuevos requieren macroiniciativa principal, metodología y área cliente. Se genera el plan con las seis etapas existentes, sus entregables base y actividades faltantes de ambas fuentes. La creación desde solicitudes conserva la macroiniciativa y metodología; solicitudes antiguas pueden completarlas antes de aprobar.

Para proyectos existentes, el panel Plan integrado del proyecto ofrece una vista previa y selección individual/total. No reemplaza actividades, tareas ni evidencias. Las propuestas equivalentes en la misma etapa se consolidan, conservando ambos orígenes. Los identificadores de origen impiden duplicación incluso al renombrar la actividad o mover su propuesta de etapa. Los planes históricos necesitan regularizar sus seis etapas antes de incorporar.

Los KPIs de macroiniciativa y las definiciones metodológicas se muestran como referencia en el proyecto; no se suman beneficios económicos ni se confunde el avance de ejecución con el impacto. La duración estimada es referencial: las fechas iniciales usan las fechas de etapa; no se añadió un calendario laboral automático.

## Persistencia y permisos
El catálogo editable y las asociaciones macroiniciativa–metodología se guardan en el payload compartido de po_workspace, con el control de revisión existente. No requiere SQL adicional. La API valida estructura, límites, tipos, etapas y coherencia de metas; únicamente Gerencia, Dirección y Administración pueden modificar el catálogo. Se deja auditoría. Una versión antigua que omita el catálogo al guardar no lo elimina.

Los proyectos existentes sin macroiniciativa se conservan. Las versiones metodológicas almacenadas anteriormente en tablas permanecen accesibles en secciones plegables. No se borran datos ni se ejecutan migraciones.

## Validación y prueba en staging
Ver CI del PR #48 para TypeScript, Vitest, compilación, PHP y empaquetado. Pruebas locales de dominio: generación de ambas fuentes, selección, identidad de origen, movimientos de etapa, compatibilidad con históricos y conservación de evidencia. Pruebas de interacción DOM con API simulada: navegación, cinco marcos, edición/guardado del catálogo, vínculos de macroiniciativa y selección/incorporación. La comprobación visual y el guardado autenticado real deben verificarse en staging.

Publicar mediante workflow nuevo: rama feature/v1.2-bloque3-integracion-proyectos, destino pruebas, confirmación vacía. No fusionar ni publicar producción hasta validar.

1. Abrir Vista general y las tres etapas del encabezado.
2. Verificar los cinco marcos y su contenido frente a la imagen; editar uno, guardar y recargar en otra sesión autorizada.
3. Crear macroiniciativa; vincular marcos, registrar actividad común y KPI con medición.
4. Crear proyecto aprobado con macroiniciativa/metodología y revisar las seis etapas, actividades, responsables y origen.
5. En proyecto existente, incorporar solo una propuesta; repetir, renombrar y recargar: no duplicar.
6. Confirmar que un perfil sin permiso no edita el catálogo, y que se conservan tareas, bloqueos y evidencias actuales.

Producción permanece sin cambios mientras este PR no se fusione ni se publique allí.
