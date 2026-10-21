# ITM Project Hub en procesos.viajescasal.com

Este paquete **no modifica** la versión de GitHub Pages. No se requiere base de datos ni permisos de Azure para el despliegue estático.

## Crear el paquete
1. Abrir el repositorio en GitHub > Actions > **Preparar paquete Hostinger**.
2. Pulsar **Run workflow** y esperar a que finalice correctamente.
3. Descargar el artefacto **itm-project-hub-hostinger**. GitHub entrega un ZIP contenedor: descomprimirlo para obtener **itm-project-hub-hostinger.zip**.
4. Descomprimir este último ZIP en la carpeta raíz del subdominio: el archivo **index.html**, **assets/** y **.htaccess** deben quedar directamente en la carpeta raíz del sitio, no dentro de una subcarpeta.

## En Hostinger hPanel
1. Comprobar que viajescasal.com está conectado a la cuenta y que el plan permite subdominios.
2. Crear el subdominio **procesos** para **viajescasal.com** y localizar su **directorio raíz** desde hPanel. La ubicación exacta varía por plan.
3. Activar SSL/HTTPS para **procesos.viajescasal.com**.
4. En **Administrador de archivos**, abrir la raíz de ese subdominio y subir/extractar el ZIP interno. **No tocar public_html del sitio principal** salvo que Hostinger identifique explícitamente esa ruta como raíz del subdominio.
5. Verificar https://procesos.viajescasal.com/ y probar recarga, navegación, gráficas y exportación PDF.

## Consideraciones
- El proyecto sigue guardando parte de la información en **localStorage**: el subdominio tiene almacenamiento distinto del sitio de GitHub Pages. Exportar respaldo JSON en el sitio antiguo e importarlo en el nuevo cuando corresponda; algunos módulos adicionales guardan datos fuera del respaldo general.
- El sitio estático no proporciona autenticación corporativa real ni acceso multiusuario centralizado.
- No compartir contraseñas, tokens o credenciales en GitHub.
- Cada nueva versión debe generar y subir un nuevo paquete. El flujo actual es **manual**, sin acceso automático a Hostinger.
