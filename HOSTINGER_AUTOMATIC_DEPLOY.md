# Publicación automática en Hostinger

La versión de GitHub Pages continúa independiente. El destino de producción es **https://procesos.viajescasal.com/**.

## 1. Identificar la ruta FTP correcta
En Hostinger > Sitios web > procesos.viajescasal.com > Administrador de archivos, identificar la carpeta raíz del subdominio (donde ya están index.html y assets). En Hostinger > FTP, identificar el **host FTP** (46.202.198.147), **usuario FTP** (`u378754586.procesos.viajescasal.com`) y configurar una contraseña FTP. Crear preferentemente un usuario FTP limitado exclusivamente a la carpeta del subdominio. No compartir credenciales por chat.

**Importante:** la ruta visible en el Administrador de archivos puede ser distinta de la ruta que ve el usuario FTP. Confirmar la ruta con Hostinger antes de continuar. No usar la raíz de viajescasal.com.

## 2. Guardar credenciales en GitHub
Repositorio > Settings > Environments > New environment: `hostinger-production`. Dentro de este environment:
- **Environment secrets**: `HOSTINGER_FTP_HOST`, `HOSTINGER_FTP_USER`, `HOSTINGER_FTP_PASSWORD`.
- **Environment variable**: `HOSTINGER_REMOTE_DIR`, con el valor `public_html`, según la pantalla FTP del sitio `procesos.viajescasal.com`. Verificar antes que el usuario FTP corresponda exclusivamente al subdominio.

Si la sesión FTP inicia ya dentro de `public_html`, se necesitará ajustar la ruta en el workflow antes de habilitarlo. La ruta debe comprobarse con el usuario FTP real.

## 3. Primera prueba
GitHub > Actions > **Publicar ITM Project Hub en Hostinger** > Run workflow. Comprobar que la ejecución termine verde y probar https://procesos.viajescasal.com/ . La acción exige FTPS con TLS y validación de certificado; si el servidor no admite FTPS correctamente, la ejecución fallará sin degradarse a FTP inseguro.

## 4. Actualizaciones futuras
Al integrar cambios a `main`, se ejecutará el flujo automáticamente. Primero valida TypeScript y genera la versión de producción; luego transfiere los archivos a la carpeta verificada. No elimina archivos remotos y no modifica el sitio principal cuando la ruta y el usuario FTP están limitados al subdominio.

**Precauciones:** la actualización no sincroniza datos guardados en localStorage entre navegadores; no proporciona autenticación corporativa ni base de datos. Mantener copias de seguridad. Si el proyecto usa un FTP que no soporta TLS, evaluar SFTP por SSH en vez de desactivar la protección.
