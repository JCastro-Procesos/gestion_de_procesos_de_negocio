# Mejoras UI/UX · ProcessOne

Publicar con `deploy-processone.yml`, rama `feature/v1.6-mejoras-ui-ux`, destino `pruebas`, confirmación vacía. No requiere SQL, cambios de credenciales ni nuevas dependencias. Producción permanece en main.

## Cambios visibles

Controles compartidos más grandes; jerarquía y notas más legibles; bordes de formulario definidos; etiquetas de navegación y estado actual; menú vertical en móvil; cabeceras, formularios y ventanas con espaciado consistente. Se conservan marca, funciones, reglas y datos actuales.

## Checklist funcional y visual

- [ ] Escritorio (1440 y 1024 px): sidebar visible, módulo activo marcado, cabecera sin superposición de sesión/acciones. Abrir proyectos, iniciativas, gobierno, reportes y validación.
- [ ] Tablet (768 px): navegación y acciones accesibles; contenido sin recortes ni botones montados.
- [ ] Móvil (375 px): Menú abre listado vertical; opciones legibles; cierre con botón, fondo y Escape; seleccionar navega al módulo correcto y cierra listado. Probar giro horizontal.
- [ ] Abrir menú móvil y ampliar a escritorio: sidebar se mantiene visible y vuelve el desplazamiento de página. Abrir/cerrar repetidamente sin perder interacción.
- [ ] Teclado: Tab muestra Saltar al contenido y Enter lleva al área principal. Foco visible en controles y ubicación actual anunciada en navegación.
- [ ] Ventanas: foco permanece dentro con Tab/Shift+Tab; Escape cierra únicamente la superior; al cerrar vuelve al disparador y se recupera scroll. Probar una ventana sobre otra y formulario con listas/fechas.
- [ ] Crear/editar un registro de prueba: mismas validaciones y guardado. Probar mensajes de error, guardar/cancelar y formularios largos con el teclado móvil visible.
- [ ] Revisión a zoom 200%: nombres largos, etiquetas, estado, botones y valores completos, sin pérdida de funciones. Scroll horizontal permitido en tablas/Gantt.
- [ ] Preferencia de movimiento reducido: navegación sin desplazamiento suave, sin animaciones innecesarias.
- [ ] Regresión: flujo macroiniciativa–metodología–proyecto, gobierno/revisor independiente, alertas, exportación Gantt y validación integral.

## Verificación técnica

Pruebas de interfaz local: foco y retorno en StrictMode, navegación circular de Tab, ventanas anidadas/Escape, captura de foco exterior, menú móvil/selección y transición a escritorio. Ejecutadas junto con los escenarios previos de alineación, gobierno, sesión, automatización, Gantt y validación. Pruebas del dominio y compilación se ejecutan por separado.

El navegador remoto de revisión no alcanza el servidor local (conexión rechazada). La validación DOM no comprueba geometría visual; completar los puntos de tamaños, contraste y superposiciones sobre la publicación de pruebas antes de autorizar producción. No se reclama una auditoría completa WCAG.

## Ajustes de tarjetas y reporte Gantt

- [ ] Pasar mouse por métricas de proyectos, opciones de metodología, listas de macroiniciativas, pestañas y resultados de búsqueda: conservar el fondo base, con realce de borde/sombra; no rellenar de azul por hover. La opción seleccionada mantiene su identificación y el foco del teclado sigue visible.
- [ ] Filtrar Gantt por Metodología, combinado con área, responsable y estado. Comparar con los proyectos del catálogo actual. Ver nombre de metodología en la fila y completo al abrir detalle.
- [ ] Revisar Proyectos por metodología y sus conteos con los filtros activos. Proyectos sin metodología o con ID fuera del catálogo permanecen visibles y filtrables.
- [ ] Con una lista larga, desplazar verticalmente dentro del Gantt: calendario permanece arriba y leyenda debajo del área desplazable. Sólo las filas se desplazan verticalmente. Desplazamiento horizontal mantiene meses y barras alineados.
- [ ] Cambiar horizonte y escala, buscar un proyecto y abrir una etapa; conservar funcionamiento previo.
- [ ] Descargar SVG después de desplazar la lista: archivo completo con todos los proyectos filtrados, calendario y leyenda, sin recorte de la vista actual.

La fijación del calendario/leyenda corresponde al desplazamiento interno del reporte; no bloquea el desplazamiento normal de toda la página. No se alteran fechas ni clasificaciones guardadas.
