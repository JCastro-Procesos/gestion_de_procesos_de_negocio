# Referencias oficiales: Microsoft Graph

Documentación consultada para implementar el conector SPA y delimitar permisos.

## Calendario de Outlook

La creación de un evento en el calendario del usuario se realiza con `POST /me/calendar/events` o `POST /me/calendars/{id}/events` y requiere permiso delegado mínimo `Calendars.ReadWrite`.

- [Create event — Microsoft Graph v1.0](https://learn.microsoft.com/en-us/graph/api/calendar-post-events?view=graph-rest-1.0)

## Microsoft To Do

La creación de una tarea en una lista To Do se realiza con `POST /me/todo/lists/{todoTaskListId}/tasks` y requiere permiso delegado `Tasks.ReadWrite`. La API no ofrece permiso de aplicación para esta operación.

- [Create todoTask — Microsoft Graph v1.0](https://learn.microsoft.com/en-us/graph/api/todotasklist-post-tasks?view=graph-rest-1.0)

## Registro de la aplicación SPA

Una SPA requiere un registro de aplicación en Microsoft Entra, Client ID, Tenant ID y URI de redirección en la plataforma SPA. Se usa MSAL para iniciar sesión y adquirir el token de acceso; esta implementación usa el flujo seguro de MSAL y permisos delegados.

- [Single-page application: Code configuration — Microsoft identity platform](https://learn.microsoft.com/en-us/entra/identity-platform/scenario-spa-app-configuration)
- [Microsoft Graph permissions reference](https://learn.microsoft.com/en-us/graph/permissions-reference)
- [Microsoft identity platform authorization code flow](https://learn.microsoft.com/en-us/entra/identity-platform/v2-oauth2-auth-code-flow)

## Permisos implementados en la interfaz

- `User.Read`: leer el perfil básico del usuario conectado.
- `Calendars.ReadWrite`: enviar un hito a un calendario seleccionado.
- `Tasks.ReadWrite`: listar las listas To Do y enviar una tarea a una lista seleccionada.

El consentimiento y la habilitación real dependen de la configuración de Entra y de las políticas de la organización. No se incluye `client_secret`; una aplicación SPA es un cliente público. Esta versión inicia los envíos a petición del usuario y no implementa sincronización bidireccional o en segundo plano.
