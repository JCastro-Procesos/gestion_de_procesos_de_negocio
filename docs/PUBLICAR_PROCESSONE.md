# ProcessOne · Manual de publicación (GitHub → Hostinger)

## Resumen
| Acción | Dónde | Qué hace |
|---|---|---|
| Diagnosticar | Actions › **Diagnosticar servidor ProcessOne (solo lectura)** | Verifica SSH, rutas, PHP, config y sitio. No cambia nada. |
| Publicar | Actions › **Publicar ProcessOne (con aprobación)** | Valida, empaqueta, respalda, publica, verifica. Espera tu aprobación. |
| Revertir | Actions › **Revertir ProcessOne (con aprobación)** | Lista respaldos o restaura archivos de una versión anterior. |

Los flujos antiguos (`deploy-hostinger.yml` por FTPS y `deploy-pages.yml`) ya **no se ejecutan solos** al hacer push a `main`.

## Publicar una nueva versión
1. Asegúrate de que el Pull Request de la versión tenga la validación en verde.
2. GitHub › **Actions** › **Publicar ProcessOne (con aprobación)** › **Run workflow**.
3. Elige la rama, `destino` = `pruebas` o `produccion`. Para producción escribe `PUBLICAR` en *confirmación*.
4. Cuando el flujo llegue a **publicar**, GitHub mostrará **Review deployments**: revisa y pulsa **Approve and deploy**.
5. Al terminar, abre el resumen del run: versión, respaldo generado y resultado de la verificación.
6. Prueba manual breve: iniciar sesión, abrir proyectos, guardar un cambio de prueba.

### Qué hace automáticamente
1. TypeScript, pruebas, compilación Vite, sintaxis PHP, revisión de scripts.
2. Paquete con **lista blanca**: `index.html`, `.htaccess`, `assets/`, `api/index.php`, iconos, `version.json`. Bloquea `setup.php`, `config.php`, `.env`, `.sql`, claves y respaldos.
3. En el servidor: verifica checksum, que el destino sea ProcessOne (ruta permitida), que `config.php` exista **fuera** de `domains/` y apunte a `u378754586_processone`.
4. Respaldo de archivos y **volcado de solo lectura** de la base en `~/processone-backups/` (permisos 600, se conservan 10 de cada tipo).
5. Copia **sin borrar** archivos existentes; `index.html` se copia al final.
6. Verificación pública: `version.json`, sitio, bundle, API (401 sin sesión), `setup.php` no expuesto, `.htaccess` protegido.
7. Si la verificación falla, **restaura automáticamente los archivos** del respaldo recién creado.

### Qué NO hace (por diseño)
- No ejecuta migraciones de base de datos ni modifica datos.
- No toca `config.php`, otros dominios, ni las bases `cotizador` / `travelcrm`.
- No borra archivos del sitio.

## Migraciones de base de datos (manual)
1. Ejecuta primero una publicación o diagnóstico para tener respaldo reciente de la base.
2. hPanel › Bases de datos › phpMyAdmin › **u378754586_processone** › pestaña SQL.
3. Pega el contenido del archivo de `database/migrations/` indicado en el PR y ejecuta.
4. Solo después publica el código que depende de esa migración.

## Revertir
1. Actions › **Revertir ProcessOne** › `respaldo` = `listar` → copia el nombre `files-…tar.gz` deseado del log.
2. Ejecuta de nuevo con ese nombre y aprueba. Se guarda antes un respaldo del estado actual.
3. La base de datos **no** se revierte automáticamente. Si fuese necesario, restaurar el `db-…sql.gz` desde phpMyAdmin con apoyo técnico.

## Configuración (una sola vez)
Entorno GitHub **processone-production** (Settings › Environments):
- Regla: *Required reviewers* = propietario; ramas permitidas: `main` y `feature/processone-*`.
- Secreto: `HOSTINGER_SSH_KEY` (clave privada exclusiva para despliegue; nunca en el repositorio ni en el chat).
- Variables: `HOSTINGER_HOST`, `HOSTINGER_PORT`, `HOSTINGER_USER`, `HOSTINGER_HOST_FINGERPRINT` (ED25519 de hPanel › Acceso SSH), `HOSTINGER_DEPLOY_PATH` (confirmada por el diagnóstico), `PROCESSONE_DB_NAME` = `u378754586_processone`, `PROCESSONE_SITE_URL` = `https://procesos.viajescasal.com`.

Entorno **processone-staging**: mismas variables con su propia ruta, URL y base de datos de pruebas.

## Limitaciones conocidas
- El usuario SSH de Hostinger tiene alcance de toda la cuenta. La clave solo está disponible para los flujos aprobados del entorno protegido; los scripts rechazan cualquier ruta que no sea la de ProcessOne.
- Los archivos antiguos de `assets/` se acumulan (no se borran por seguridad).
- La reversión es de archivos; la de base de datos es manual.
