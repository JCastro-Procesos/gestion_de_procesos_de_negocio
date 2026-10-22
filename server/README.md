# ProcessOne · instalación inicial en Hostinger

## Estado
Código en preparación. No está desplegado ni validado en Hostinger. No compartir contraseñas en el chat o GitHub.

## Requisitos
- PHP 8.1 o superior con PDO MySQL, HTTPS.
- Base `u378754586_processone` con las siete tablas ya importadas.
- Importar adicionalmente `database/processone_live_patch.sql` en esa misma base (crea `po_workspace` y `po_login_attempts`).
- Compilar frontend con `pnpm exec tsc -b && pnpm exec vite build --config vite.hostinger.config.ts`. El workflow `Preparar paquete Hostinger` genera un ZIP con React + API PHP.
- Confirmar que la raíz real del subdominio corresponde exclusivamente a ProcessOne. Nunca descomprimir en la raíz de otros sitios.

## Credenciales de MySQL
Crear un archivo **fuera de public_html** en `/home/u378754586/processone-private/config.php` con:

```php
<?php
return [
  'host' => 'localhost',
  'database' => 'u378754586_processone',
  'username' => 'u378754586_processone',
  'password' => 'REEMPLAZAR_LOCALMENTE',
  'rate_secret' => 'CADENA_ALEATORIA_LARGA',
  'bootstrap_token' => 'OTRA_CADENA_ALEATORIA_DE_32_CARACTERES_O_MAS'
];
```

No guardar este archivo en GitHub ni en un directorio accesible por web. Confirmar con Hostinger la ruta de usuario si difiere. Ajustar la ruta en `server/api/index.php` y `server/api/setup.php` antes de compilar si fuese necesario.

## Primer administrador
1. **Solo después de confirmar HTTPS, conexión PDO y tablas:** abrir `https://procesos.viajescasal.com/api/setup.php`.
2. Introducir el token aleatorio guardado en config.php y una contraseña nueva de al menos 14 caracteres. El instalador crea exclusivamente `castro.j@outlook.com` como administrador.
3. **Eliminar inmediatamente `api/setup.php` del servidor** y quitar `bootstrap_token` de config.php.
4. Iniciar sesión en ProcessOne con ese correo.

## Datos previos
El espacio compartido comienza vacío. Los proyectos que estén en el navegador anterior **no se transfieren automáticamente**. Exportar respaldo JSON de la versión anterior y después importar desde el módulo Datos, una vez autenticado y tras revisar la estructura. No eliminar el respaldo.

## Precauciones
- La edición del workspace es global y usa revisión optimista; si hay cambios simultáneos, el servidor rechaza la segunda escritura (409). Falta un flujo visual para resolver conflictos.
- Los usuarios se crean desde el panel administrador con contraseña temporal. Falta cambio de contraseña/autoservicio, recuperación de acceso y correo de invitación. No compartir claves temporales por medios inseguros.
- El frontend y API aún requieren pruebas reales de compilación, PHP lint, sesiones, privilegios y múltiples usuarios.
- No fusionar ni publicar en producción antes de completar pruebas y resolver las limitaciones anteriores.
