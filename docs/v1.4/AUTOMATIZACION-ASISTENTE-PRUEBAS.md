# Automatización y asistente — versión para pruebas

## Qué incluye

- Un solo motor para el centro de seguimiento y la campana: tareas y actividades próximas/vencidas, bloqueos, dependencias, RAID, fechas de proyectos, asignaciones incompletas, carga próxima y compromisos de Gobierno.
- Actualización al cambiar workspace, al volver a la pestaña y cada minuto visible. Gobierno se consulta por API; si falla, se señala evaluación parcial y última carga correcta, sin presentar un cero como una confirmación de ausencia de pendientes.
- Reglas compartidas: anticipación 1–30 días, umbral de carga semanal 100–200% y diez interruptores de reglas. Gerencia, Dirección y Administración pueden modificar; todos los perfiles pueden consultar el asistente.
- Preferencias personales de leída y posposición hasta mañana. Guardadas por cuenta, host y ruta en este navegador. No son acuses compartidos ni resuelven tareas. Cambiar la condición reactiva la alerta. No se reutilizan los descartes globales del módulo anterior.
- Asistente por consultas: qué requiere atención, próximos siete días, bloqueos y decisiones, sin responsable y capacidad. Incluye datos y razones, no respuestas generadas por un servicio externo.
- Puntaje explicable por proyecto activo: tareas vencidas (+15 cada una, máximo 50), bloqueo (+30), RAID crítico abierto (+25), proyecto vencido (+25), semáforo rojo (+20) o amarillo (+10). Total limitado a 100; bajo <25, medio 25–59, alto >=60. No es probabilidad ni pronóstico estadístico.
- Resumen de la semana actual (lunes–domingo), corte de hoy, estado actual, compromisos y alertas. No atribuye avances actuales a la semana ni inventa logros históricos. Descarga TXT con saltos reales.
- Calendario ICS con vencimientos abiertos e identidad estable, fin exclusivo al día siguiente, escape de texto y plegado UTF-8. Importación manual en Outlook u otro calendario; no crea conexión ni envía invitaciones.
- Abrir tarea, proyecto y ficha de Gobierno desde la alerta. RAID abre su módulo y capacidad abre Equipo cuando el perfil tiene acceso.
- Preparar un seguimiento RAID muestra una ficha para confirmar responsable, fecha y acción. Solo Especialista o superior; crea un riesgo sin cambiar fechas/estado del origen. Clave de deduplicación y comprobación de condición vigente antes de incorporarlo al workspace. Bloqueos/RAID y Gobierno se resuelven en su origen, sin duplicarlos automáticamente.

## Persistencia y límites

Configuración en `po_workspace.payload.automationSettings`; la API valida estructura, rangos, permisos y registra cambios de reglas en auditoría. Sesiones antiguas que omiten la propiedad la conservan. Se usa el control de revisión existente para conflictos. Las preferencias personales requieren almacenamiento local del navegador y no viajan entre dispositivos.

No requiere SQL adicional. Requiere la instalación de Gobierno ya validada. `automation_policy.php` está incluido en paquete, lista blanca, publicación y validación PHP del servidor; la prueba de copia del despliegue incluye esa dependencia.

Las evaluaciones ocurren mientras ProcessOne está abierto; no hay servicio programado de fondo, correo, push ni integración externa nueva. El módulo de Microsoft 365 existente permanece separado.

El cálculo de carga compara horas pendientes estimadas de tareas activas fechadas hasta hoy + 6 días (incluye atrasadas) con capacidad semanal. Excluye tareas sin fecha y de proyectos completados. Sin capacidad definida no estima sobrecarga. Horas consumidas no equivalen a avance real: es una señal para revisar la estimación restante.

## Publicar en pruebas

1. Abrir GitHub Actions → Publicar ProcessOne.
2. Nueva ejecución desde `feature/v1.4-automatizacion-asistente`.
3. Destino `pruebas`; confirmación vacía.
4. Entrar en Automatización y alertas, revisar las cuatro vistas y contrastar con la campana.

## Casos de aceptación

| Caso | Resultado esperado |
| --- | --- |
| Tarea vence hoy / ayer | Hoy próximo compromiso; ayer crítico vencido |
| Completar tarea o proyecto | Desaparece la alerta temporal correspondiente |
| Actividad bloqueada | Alerta con motivo y acceso al proyecto |
| Dependencia pendiente | Muestra predecesora pendiente o no disponible |
| Tarea sin responsable | Alerta de asignación; no inventa una persona |
| Tarea de 40 h para dentro de un mes | No se cuenta como carga de la próxima semana |
| Gobierno devuelto / sin revisor / por verificar | Alerta específica y apertura de su ficha |
| Marcar leída en el centro | Contador de la campana cambia en la misma sesión |
| Posponer hasta mañana | Se oculta personalmente; aparece en asistente y resumen; retorna mañana o si cambia la condición |
| Dos cuentas en mismo navegador | Preferencias personales separadas por cuenta |
| Desactivar regla y recargar otra sesión | Regla compartida conservada; conflicto de revisión si se guardan cambios simultáneos |
| Especialista / Ingeniero | Consultan; no editan reglas; Ingeniero no crea seguimientos RAID |
| Preparar seguimiento | No crea nada antes de confirmar; no repite la clave ya registrada |
| Cambia la condición mientras se confirma | Exige volver a revisar la alerta |
| Resumen semanal | Semana, corte, ámbito y compromisos corresponden a los datos registrados |
| API de Gobierno falla | Aviso de evaluación parcial con última carga; no se oculta el error |
| Descargar ICS | Importa días completos y conserva acentos/saltos como texto |

## Validaciones técnicas

Pruebas de dominio para calendario, fechas, configuración, reglas, capacidad temporal, cierre de pendientes, Gobierno, reactivación y resúmenes. Escenarios DOM para campana/centro, posposición, consultas, reglas, permisos y confirmación de RAID, además de regresión del bloque anterior. PHP prueba preservación de configuración con clientes antiguos y permisos/rangos. CI ejecuta integración existente de Gobierno con MariaDB aislada, validación del paquete y simulación de publicación de todos los módulos.

Producción permanece sin cambios. Revisar esta matriz antes de autorizar integración en main.

## Ajustes de visualización: alertas y Gantt del portafolio

- Prioridades limita la altura de sus resultados y permite desplazamiento vertical independiente, por teclado y rueda. El total, filtros y acciones permanecen fuera de esa lista.
- KPIs y reportes agrega navegación Dashboard y KPIs / Gantt de proyectos, conservando el dashboard anterior.
- Pipeline Gantt con proyectos por fila, seis colores por orden de etapa, meses y semanas de calendario reales, corte de hoy, resumen por estado y cierres planificados opcionales. Un cierre planificado no equivale a una aprobación.
- Filtros propios de Gantt por área, responsable, estado y búsqueda; mes inicial, horizonte de 3/6/12/24 meses y tres escalas. Los intervalos solapados se separan en carriles. Los huecos y fechas fuera del horizonte se conservan, sin convertir etapas en una secuencia ficticia.
- Detalle accesible mediante clic o teclado con fechas, estado y avance; botón para abrir el proyecto. Registros sin fechas completas o con rangos invertidos se señalan como calidad de datos; no reciben fechas inventadas.
- Descarga SVG independiente con leyenda, fechas y línea de hoy, sin dependencias externas. Se revisó el render con un caso de muestra que incluye etapas solapadas y cambio de año.
- No requiere SQL ni cambia proyectos/fechas desde el reporte. Validación local: 75 pruebas de dominio, 22 escenarios DOM y compilación.

Validar en pruebas: desplazamiento de las 39 coincidencias sin alargar toda la página; cambio entre Dashboard/Gantt; filtros; fechas y anchos de etapas; solapamientos; etapas sin fecha; mes actual; intervalo fuera de pantalla; apertura de detalles/proyecto; descarga SVG y persistencia intacta del cronograma original.
