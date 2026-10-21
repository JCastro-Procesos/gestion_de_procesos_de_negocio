# Bloque 4 · Supabase + Microsoft Entra ID

## Estado
El repositorio incluye una **migración SQL para Supabase** y una **vista local de validación funcional** de solicitudes, aprobaciones y cambios. **NO está conectada** todavía al backend; no utilizar como autorización real. El resto de ITM Project Hub continúa en localStorage y no se migra ni sincroniza automáticamente.

## Configuración requerida por el administrador ITM
1. Crear proyecto Supabase bajo una organización aprobada por TI, seleccionar región y definir políticas de tratamiento de datos.
2. Ejecutar `supabase/migrations/20261021_governance.sql` desde SQL Editor. Revisar tablas, triggers y RLS.
3. Configurar proveedor **Azure/Microsoft** en Supabase Auth. En Microsoft Entra ID registrar la aplicación, su client ID y secreto, y la URL de callback **exacta** proporcionada por Supabase Auth. Configurar dominios corporativos permitidos.
4. Dar de alta al primer administrador **desde SQL Editor**, con su UUID real de `auth.users`:
   `insert into public.itm_memberships(user_id,role) values ('UUID_REAL','admin');`
   Nunca habilitar autoconcesión de permisos desde el frontend.
5. Definir matriz definitiva de autorizaciones (gerencia, especialista, responsable, consulta), segregación de funciones y política de aprobación de cambios críticos.
6. Integrar cliente autenticado en React y sustituir los almacenes locales por consultas autenticadas y operaciones transaccionales. No mezclar datos demo con información productiva.
7. Migrar datos existentes mediante un proceso controlado: exportar respaldo JSON, validar schema, resolver duplicados, probar en ambiente de ensayo y conservar copia anterior.
8. Probar dos usuarios distintos y verificar denegaciones RLS: consulta no escribe, especialista no aprueba, gerencia decide, administrador gestiona membresías.
9. Habilitar copias de seguridad, retención, monitoreo, políticas de privacidad y recuperación.

## Consideraciones de seguridad
- GitHub Pages es hosting estático. No guardar `service_role`, secreto Entra ni claves privadas en Vite o el repositorio.
- La clave pública/anon de Supabase puede estar en cliente **solo con RLS correcto** y validado.
- El token de Microsoft Graph existente **no equivale** automáticamente a una sesión de Supabase.
- Para auditoría, usar triggers de base de datos y no registros modificables desde el navegador.
- La tabla `itm_workspace` incluye `revision` para futura protección contra conflictos; el cliente aún no implementa sincronización ni control de concurrencia.
- En el modelo inicial `itm_governance`, solo admin/gerencia pueden decidir; definir y probar reglas de segregación (p. ej., prohibir autoaprobación) antes de producción.
- El portal local de responsables sirve para validar flujos y terminología, no para control de acceso real.

## Validación de alcance
- #37 Política: propuesta visible, pendiente aprobación institucional.
- #38 Aprobaciones: flujo de prueba local; tablas y RLS listos para configurar.
- #39 Cambios: clasificación menor/mayor/crítico, pendiente reglas definitivas.
- #40 Portal: bandeja de prueba, pendiente identidad real.
- #41 Centralización: estructura SQL lista, **no conectada**.
- #42 Roles: esquema RLS listo, **sin login operativo**.
- #43 Auditoría: triggers SQL preparados, **sin registros remotos** hasta configurar.
