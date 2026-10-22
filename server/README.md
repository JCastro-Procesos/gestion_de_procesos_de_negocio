# Instalación segura en Hostinger
1. PHP 8.1+ con PDO MySQL, HTTPS y base MySQL ya creada.
2. Importar database/processone_live_patch.sql en u378754586_processone.
3. Colocar server/api/index.php como public_html/procesos/api/index.php (si el subdominio usa public_html/procesos como raíz, colocar en api/index.php dentro de esa raíz).
4. Crear archivo **fuera de la raíz pública**: /home/u378754586/processone-private/config.php con contenido PHP que retorne array ['host'=>'localhost','database'=>'u378754586_processone','username'=>'u378754586_processone','password'=>'CLAVE-REAL']; no incluir este archivo en GitHub.
5. La API requiere HTTPS. No registrar contraseñas en el frontend. El usuario admin inicial se debe aprovisionar con password_hash de PHP desde CLI segura, nunca con contraseñas en SQL plano.
6. **No publicar como producción hasta completar y probar integración React/API y aprovisionamiento inicial.** El módulo de workspace usa una revisión optimista y rechaza colisiones con HTTP 409. No hay sincronización automática.
7. Esta API es una base de desarrollo: antes de producción añadir límites de intentos de login, recuperación de contraseña, controles por entidad y migración validada de datos.
