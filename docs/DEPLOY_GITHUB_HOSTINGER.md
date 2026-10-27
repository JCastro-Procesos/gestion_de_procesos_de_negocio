# GitHub → Hostinger: preparación de despliegue ProcessOne

Estado: workflow preparado en rama de trabajo, **sin conexión ni publicación realizadas**.

## Configuración pendiente
1. Confirmar acceso SSH de Hostinger y ruta real de producción, que debe terminar en `/procesos`.
2. Crear clave SSH de despliegue con permisos mínimos.
3. En GitHub → Settings → Environments crear `processone-production` y configurar Required reviewers y restricción de ramas (comprobar disponibilidad según plan).
4. Registrar como secrets de ese environment: `HOSTINGER_HOST`, `HOSTINGER_PORT`, `HOSTINGER_USER`, `HOSTINGER_SSH_KEY`, `HOSTINGER_KNOWN_HOSTS` (huella verificada por canal confiable), `HOSTINGER_DEPLOY_PATH` y `HOSTINGER_BACKUP_PATH` (fuera de public_html).
5. Verificar la estructura real de assets y las rutas del hosting.
6. Preparar respaldo integral y restauración probada de la base MySQL ProcessOne **por separado**. El workflow solo respalda archivos.
7. Probar despliegue primero en un entorno aislado. Autorizar explícitamente producción después de las pruebas.

## Funcionamiento
El workflow `deploy-hostinger.yml` se ejecuta manualmente, verifica la frase de confirmación, instala dependencias, valida TypeScript, ejecuta Vitest, compila Vite, valida PHP y empaqueta exclusivamente el frontend y `api/index.php`. Luego espera la protección configurada en el environment, respalda archivos y usa rsync sin borrado remoto.

**Limitaciones:** sin Required reviewers configurados no hay aprobación obligatoria adicional; la comprobación HTTP no verifica login ni guardado; no existe rollback automático; no ejecuta migraciones de base de datos. El workflow no se debe ejecutar hasta completar la configuración, revisar sus rutas y probarlo en staging.
