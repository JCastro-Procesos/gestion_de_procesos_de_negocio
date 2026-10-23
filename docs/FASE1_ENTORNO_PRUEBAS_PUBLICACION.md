# ProcessOne · Entorno de pruebas y publicación controlada

**Estado:** preparado en GitHub; no hay despliegue a producción ni un entorno de pruebas en Hostinger configurado.

## Aislamiento obligatorio
- Producción: https://procesos.viajescasal.com/ y base de datos `u378754586_processone`.
- Pruebas: crear **otro subdominio o directorio protegido**, **otra base MySQL**, **otro usuario de base de datos** y un `config.php` privado exclusivo de pruebas.
- Nunca reutilizar credenciales, sesiones ni el archivo de configuración de producción.
- No utilizar bases de datos de otros sitios (cotizador/travelcrm).
- Restringir el acceso al entorno de pruebas con autenticación HTTP o lista de IPs; evitar indexación.
- No copiar información personal real a pruebas; usar datos ficticios o anonimizados.

## Validación automática
El workflow `Validación ProcessOne (sin despliegue)` ejecuta TypeScript, pruebas, compilación y comprobación sintáctica PHP en cada pull request. El artefacto resultante **no contiene el backend PHP ni la configuración de Hostinger**, y no se publica automáticamente.

## Protocolo de publicación
1. Registrar alcance, riesgos, cambios de esquema y plan de reversión.
2. Ejecutar CI y pruebas manuales en el entorno aislado con perfiles diferentes.
3. Probar creación, edición simultánea, errores de red, conflictos de revisión, importación y permisos.
4. Generar respaldo verificado de archivos y base de datos de producción.
5. Solicitar aprobación expresa del propietario del sistema.
6. Construir el paquete de publicación **solo después de la aprobación**. Revisar que no incluya `setup.php` ni secretos.
7. Aplicar migraciones compatibles y publicar en ventana acordada.
8. Ejecutar pruebas de humo: login, lectura, escritura, permisos y reportes.
9. Ante fallo, restaurar paquete y base de datos del respaldo compatible; documentar incidente.

## Concurrencia
La API usa un contador de revisión y responde HTTP 409 ante escrituras obsoletas. La interfaz ahora serializa las escrituras locales y, al detectar conflicto o fallo, **bloquea nuevas ediciones** hasta recargar. Esto evita sobrescrituras silenciosas, pero **no implementa aún fusión de cambios ni recuperación automática de ediciones no guardadas**.

## Pendiente de esta fase
- Crear y proteger el subdominio y la base de pruebas en Hostinger.
- Migrar Gobierno, preferencias y otros registros locales a MySQL con controles de acceso.
- Añadir pruebas de concurrencia con dos usuarios y restauración comprobada.
- Separar `setup.php` del ZIP de producción; usarlo solo durante aprovisionamiento inicial controlado.
