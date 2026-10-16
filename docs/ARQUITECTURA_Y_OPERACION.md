# ITM Project Hub · arquitectura y operación

## Propósito y estado

Aplicación web para controlar proyectos de procesos, planes de trabajo, tareas, capacidad, riesgos y decisiones. La versión inicial es local: el único estado persistente de negocio vive en el `localStorage` del navegador. El kit ITM contiene cinco metodologías de consultoría; el equipo aprobó por separado el marco operativo de cinco etapas.

Los datos de demostración son ficticios, se identifican como tales y pueden reemplazarse o eliminarse. El prototipo `project_management_hub.html` fue descrito en la solicitud, pero no estaba incluido como archivo disponible; se implementaron sus funciones enumeradas en el requerimiento.

## Arquitectura

- **Presentación:** React 19 + TypeScript + Vite. Diseño responsive con CSS; Lucide para iconografía y Recharts para gráficos. Los módulos de cada sección se cargan bajo demanda; MSAL/Graph solo se descarga al abrir Microsoft 365.
- **Dominio:** modelos de tipos, catálogo ITM, creación de etapas, cálculos de avance, riesgo, plazos y capacidad.
- **Persistencia:** `useWorkspace` coordina el estado del navegador; `storage.ts` lee y guarda el espacio completo mediante la clave `itm-project-hub-v1`. Sin base de datos, backend de negocio o cuenta institucional.
- **Intercambio:** JSON completo (IDs estables y versión) y CSV de proyectos, tareas y RAID. El CSV de tareas exige un `Proyecto ID` existente; reemplazar CSV de tareas requiere importar proyectos primero o combinar.
- **Microsoft Graph:** MSAL Browser autentica a una cuenta Microsoft como cliente público SPA. Las acciones Graph se ejecutan desde el navegador con permisos delegados; no se exporta el token, Client ID o Tenant ID en la copia JSON. No hay sincronización periódica o bidireccional.
- **Evolución:** adaptar el repositorio a una API segura con SharePoint/Microsoft Lists o Dataverse. Requiere autenticación, permisos, estrategia de concurrencia, auditoría y modelo de acceso.

### Módulos

```text
src/
├── app/                  Shell, navegación y estado compartido (App, useWorkspace)
├── components/           Controles y componentes visuales reutilizables
├── data/                 Datos ficticios, localStorage, validación e intercambio
├── domain/               Tipos, métricas, metodologías, etapas y pruebas
├── features/
│   ├── dashboard/        KPIs ejecutivos, semáforo y alertas
│   ├── projects/         Portafolio y detalle de etapa/actividad
│   ├── tasks/            Tabla, Kanban, subtareas y temporizador
│   ├── team/             Integrantes, capacidad y carga
│   ├── raid/              Riesgos, supuestos, incidencias, dependencias y decisiones
│   ├── reports/          Indicadores, gráficas y resumen descargable
│   ├── methodologies/    Catálogo ITM
│   ├── data/              Importación, exportación y persistencia
│   └── integrations/     Configuración y acciones Graph
├── integrations/         Cliente MSAL y Microsoft Graph v1.0
├── main.tsx              Punto de entrada
└── styles.css            Sistema visual y breakpoints
public/                   Manifiesto de rutas e isotipo SVG
samples/                  Reservado para plantillas de intercambio
 docs/                     Arquitectura, diagrama, integración y referencias
```

## Flujo funcional

1. El shell lee el espacio desde `localStorage`; en un navegador nuevo carga un espacio de demostración.
2. El Dashboard calcula indicadores a partir de proyectos, etapas, fechas, riesgos y tareas. Desde alertas se abre el proyecto o su plan.
3. Cada proyecto usa cinco etapas editables; cada etapa conserva actividades, entregables, responsables, fechas, estado y avance.
4. Las tareas se vinculan a proyecto y etapa, se gestionan en tabla o Kanban y alimentan horas reales/carga. El temporizador detiene el intervalo anterior si se inicia otro.
5. El registro RAID sirve para asignar dueño, respuesta, severidad, fecha y estado; los elementos abiertos alimentan alertas de riesgo.
6. Reportes y capacidad leen las mismas entidades locales y muestran sus reglas de cálculo.
7. Las exportaciones crean artefactos descargables. Las importaciones pueden combinar por ID o reemplazar el espacio; reemplazar solicita confirmación.
8. Si se configura Microsoft Entra, una persona inicia sesión y puede elegir enviar una tarea a To Do o crear un evento para un hito en Outlook. La persona confirma cada envío.

El diagrama Mermaid está en [flujo-funcional.mmd](./flujo-funcional.mmd).

## Metodología y etapas

La metodología de cinco etapas se acordó para esta implementación; no se afirma que sea una metodología oficial literal del kit. Los planes tipo Express, Estándar y Transformación aplican diferente distribución temporal a las mismas cinco etapas. Se parte del catálogo del kit para objetivos y entregables típicos:

1. **Inicio y alcance:** necesidad, patrocinio, objetivos, alcance, exclusiones y criterios de aceptación. Entregable típico: acta de inicio y alcance.
2. **Diagnóstico y análisis:** AS-IS, datos, causas, brechas, riesgos y oportunidades. Entregable típico: diagnóstico y análisis de brechas.
3. **Diseño y recomendaciones:** TO-BE, opciones, controles y priorización. Entregable típico: diseño futuro y recomendaciones priorizadas.
4. **Validación e implementación:** validación con el cliente, plan de implementación, piloto, adopción y KPIs. Entregable típico: plan validado y evidencia de prueba.
5. **Cierre y transferencia:** aceptación, pendientes, lecciones, transferencia y medición de beneficios. Entregable típico: acta de aceptación y transferencia.

Cada etapa tiene actividades, entregables, responsable, inicio y fin, estado y avance. Nombres y contenidos son editables para adoptar la nomenclatura formal del equipo.

## Indicadores (reglas en esta versión)

- **Avance de proyecto:** promedio simple de avance de sus etapas; **avance del portafolio:** promedio simple de proyectos.
- **Riesgo:** semáforo distinto de verde, bloqueo, hitos vencidos o RAID abierto de severidad alta/crítica.
- **Hitos vencidos:** fecha objetivo de proyecto o fecha de cierre de etapa antes del día actual, si no está completada. Si vencen ambas se cuentan ambas.
- **Semáforo:** color editable; recomendación de riesgo deriva de RAID, fechas y estado. La distribución visual asigna rojo a rojo/bloqueo/RAID crítico; amarillo a otras desviaciones y verde al resto.
- **Carga:** horas estimadas abiertas asignadas / capacidad semanal. El total abierto puede abarcar varias semanas; es una señal temprana de demanda frente a capacidad, no una calendarización por semanas. Las horas reales son historia de esfuerzo y no se restan de la capacidad futura.
- **Horas reales:** valor capturado manualmente más intervalos cerrados por el temporizador.

## Microsoft 365: implementación completa vs. pendiente

### Completamente implementado en el código

- Formulario de Client ID, Tenant ID, tipo de cuenta y redirect URI, guardados localmente.
- Inicio/cierre con MSAL Browser, autenticación popup y caché de MSAL en `sessionStorage`; el respaldo JSON no incluye token ni identificadores de cuenta.
- Solicitud de permisos delegados `User.Read`, `Calendars.ReadWrite` y `Tasks.ReadWrite`.
- Lectura de listas To Do y calendarios y selección del destino.
- Envío manual a `POST /me/todo/lists/{id}/tasks`; prioridad se mapea a alta/normal/baja y estado “En Revisión” a `notStarted`, al no existir equivalencia nativa directa.
- Creación manual de un evento de 30 minutos para las 09:00 locales del día de vencimiento en `POST /me/calendars/{id}/events`.
- Se guarda el ID del recurso externo para evitar reenvíos ordinarios; el ID no es sincronización bidireccional.
- Los errores devueltos por Graph se presentan al usuario.

### Configuración y capacidades pendientes

- Registrar una app en Microsoft Entra y configurar una URI de redirect como plataforma **Single-page application (SPA)** para cada origen (Preview/pruebas/producción).
- Aportar Client ID/Tenant ID, activar permisos delegados y obtener consentimiento de administrador si lo exige el tenant.
- La solicitud no incluyó tenant ni credenciales: **no se afirma que la conexión institucional esté activada ni probada**.
- No se incluye `client_secret` ni debe añadirse a una SPA; es un cliente público.
- No hay acceso a cuentas de otros usuarios, backend, sincronización automática/bidireccional, reconciliación, webhooks, registro centralizado ni resolución de conflictos.
- SharePoint, Microsoft Lists y Dataverse son opciones futuras, no conectores activos.

Guía de configuración y permisos: [Microsoft Graph](./MICROSOFT_GRAPH_REFERENCIAS.md).

## Instalación y ejecución

Requisitos: Node.js 22 recomendado y pnpm 11.

```bash
pnpm install --frozen-lockfile
pnpm dev
```

Abre `http://localhost:3000`.

```bash
pnpm typecheck
pnpm test
pnpm build
```

El sitio estático queda en `dist/`. En un despliegue propio, sirve la SPA por HTTPS y registra el origen publicado como URI de redirección. No publiques un secreto en el paquete.

## Supuestos

- Las cinco etapas provienen del acuerdo de diseño y son una estructura operativa propuesta, no una metodología oficial externa.
- El promedio simple es una regla inicial; se puede sustituir por una ponderación aprobada.
- Los datos de demo son ficticios y no representan a ITM ni a sus clientes.
- Los CSV son por entidad; etapas, actividades y subtareas se preservan con más fidelidad en JSON.
- El semáforo manual no se altera automáticamente al guardar una alerta.
- “Integración Microsoft” se interpreta como envío explícito en una dirección, no como sincronización automática.
- Cada navegador conserva su propia copia; continuidad entre dispositivos requiere respaldo/importación.

## Datos reales pendientes

1. Nombre del espacio, áreas, cartera, patrocinadores, nombres y correos del equipo.
2. Capacidad semanal y restricciones/ausencias por persona.
3. Nombres finales de etapas, criterios de aceptación, objetivos, entregables, responsables y calendario por proyecto.
4. Catálogo de actividades y evidencias por etapa; estados y reglas de aprobación.
5. IDs, metodologías, estados, semáforos, prioridades, esfuerzo estimado/real, responsables y fechas.
6. Registro vigente de riesgos/supuestos/incidencias/dependencias/decisiones, severidad, mitigación y responsables.
7. Definición institucional de KPIs, ponderaciones, umbrales, escalamiento y cadencias.
8. Tenant ID, Application (client) ID, redirect URI(s) HTTPS, permisos Graph y administrador que aprueba consentimiento.
9. Decisión futura de repositorio multiusuario (SharePoint/Lists, Dataverse u otra API) con dueño, permisos, auditoría y soporte.
