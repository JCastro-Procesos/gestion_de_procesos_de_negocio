# ProcessOne · Fundamentos UI/UX

## Contexto y alcance

Aplicación interna de gestión de procesos y portafolio sobre React 19 / TypeScript / Vite. Usuarios: administración, dirección, gerencia, especialistas e ingenieros. Las tareas dominan el diseño: revisar avance, registrar trabajo y tomar decisiones con evidencia.

Conservar identidad actual (azul marino, acento turquesa, superficies claras, Lucide, tipografía de sistema/Inter), estructuras de proyecto y navegación autorizada por rol. No añadir campañas, hero comercial, fuentes remotas ni movimiento ornamental. La recomendación Data-Dense Dashboard de UI UX Pro Max respalda jerarquía, tablas y filtros; su patrón comercial Enterprise Gateway no aplica a este producto y se descarta.

## Tokens y componentes

Fuente de implementación: `src/ux-foundation.css`, cargada después de estilos heredados, sin modificar reglas del dominio.

- Texto principal `--po-text: #243451`; secundario `--po-text-muted: #52627b`.
- Fondo y marca: conservar `--page`, `--surface`, `--navy` y `--blue` actuales.
- Foco `--po-focus: #176b95`, 3 px y separación de 3 px; sobre navegación oscura usar turquesa claro.
- Tipografía: cuerpo 14 px escritorio / 16 px móvil; etiquetas y notas de componentes compartidos al menos 12 px; títulos 20–28 px, interlineado 1.3. No sustituir tamaños internos de gráficos mediante reglas globales.
- Controles compartidos: mínimo 40 px de alto escritorio / 44 px móvil; inputs 16 px móvil para evitar zoom automático. Botones secundarios con borde visible, principal marino, destructivo con etiqueta y color de peligro.
- Espaciado: 8/12/16/20/24 px; formularios 18 px de separación; ventanas con cabecera fija y cuerpo desplazable.
- Cifras tabulares en métricas y tablas; contenido largo envuelve antes de perder información.
- Movimiento reducido: desactivar animación decorativa y respetar preferencia también al navegar mediante JavaScript.

## Navegación adaptable

Escritorio mantiene sidebar. Hasta 720 px, mostrar barra compacta con módulo actual y botón Menú; abrir lista vertical con agrupaciones, texto e icono, sin tira de 17 opciones diminutas. La lista conserva el filtro de permisos existente, resalta y anuncia la ubicación actual con `aria-current`.

Menú móvil: cerrar con botón, Escape, fondo o selección de módulo; bloquear scroll de fondo, mantener foco dentro, devolverlo al disparador y liberar bloqueo al pasar a escritorio. Enlace Saltar al contenido al inicio del documento.

## Ventanas y feedback

Componente Modal compartido: portal al body, título/descripción asociados, foco inicial, bucle Tab/Shift+Tab, Escape sólo para la ventana superior, retorno al disparador y preservación del bloqueo de scroll en ventanas anidadas. No reabrir/reiniciar foco cuando cambia la referencia de onClose.

Toast anuncia sin robar foco. ErrorBanner utiliza alerta accesible. No alterar validación de negocio, roles, aprobación, datos ni persistencia.

## Verificación y límites

Probar 375, 768, 1024 y 1440 px, orientación horizontal y zoom 200%. Recorrer Tab, Shift+Tab y Escape, formulario largo, campos y títulos extensos. Mantener scroll horizontal sólo donde es necesario: tablas/Gantt. No declarar certificación WCAG sin auditar todos los módulos, gráficos y formularios heredados. Esta entrega mejora componentes comunes; no añade un tema oscuro.
