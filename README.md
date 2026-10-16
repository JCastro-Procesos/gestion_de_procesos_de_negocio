# ITM Project Hub

Sistema web local para gestión de proyectos y procesos, con cinco etapas metodológicas, tareas en tabla/Kanban, carga de trabajo, RAID, reportes e intercambio JSON/CSV. Incluye un conector opcional de Microsoft Graph para Outlook Calendar y To Do, que requiere configuración institucional de Entra.

## Inicio rápido

```bash
pnpm install --frozen-lockfile
pnpm dev
```

Abre `http://localhost:3000`. Para validar y compilar:

```bash
pnpm typecheck
pnpm test
pnpm build
```

## Arquitectura, flujo, supuestos y datos pendientes

Consulta [Arquitectura y operación](./docs/ARQUITECTURA_Y_OPERACION.md), [referencias oficiales de Microsoft Graph](./docs/MICROSOFT_GRAPH_REFERENCIAS.md) y el [diagrama funcional](./docs/flujo-funcional.mmd).

## Persistencia

La app guarda un único espacio en `localStorage` (clave `itm-project-hub-v1`). Exporta JSON periódicamente; la información no se comparte entre navegadores ni dispositivos. La demo es ficticia y editable.

## Microsoft 365

El código de autenticación MSAL y los flujos Graph están integrados, pero la conexión requiere registrar la SPA en Microsoft Entra, completar Client ID/Tenant ID/URI de redirección y otorgar permisos delegados. Esta entrega no incluye una conexión institucional ya configurada ni sincronización bidireccional.
