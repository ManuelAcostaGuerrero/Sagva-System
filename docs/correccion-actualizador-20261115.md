# Corrección del actualizador Windows — 15-11-2026

Causa observada: npm ci falló EPERM al intentar eliminar query_engine-windows.dll.node mientras Next seguía ejecutándose. Git ya se había adelantado, de modo que el script anterior devolvía falsamente «ya actualizado» al reintentarlo.

El actualizador revisado prepara y compila en worktree aislado con SQLite ficticia antes de detener procesos. Identifica exclusivamente Node/Next por ruta del proyecto y fecha de creación; no cierra navegadores ni servicios ajenos. Copia SQLite mediante su API de respaldo y verifica integridad/FK. Registra etapas, errores y recuperación; usa un manifiesto de instalación completa en vez de sólo Git. Sin seed, sin pérdida de datos aceptada ni comandos Git destructivos.

Si estaba iniciado, vuelve a iniciarlo en su dirección IPv6 y puerto 3000; si estaba detenido, lo conserva detenido. Preserva el proxy IPv4 ajeno que usa también el puerto 3000. Acceso directo comprobable: http://[::1]:3000 . Conserva la pestaña existente; el script no abre ni recarga navegadores para evitar perder formularios.

Correcciones necesarias de código descargado: campo opcional referencia en VentaPago (aditivo, ya utilizado por los servicios), modulo de auditoría de ventas y consulta de permisos con campo nulo usando identificación por ID en transacción. Tipos y build deben pasar antes de instalar.

Logs/estado/manifiesto: .local. Respaldos privados: backups. No publicar .env, bases ni exportaciones. Una recuperación pendiente requiere revisión del respaldo y registro; no borrar la marca para forzar el inicio.

Preparación: npm ci, Prisma generate, base SQLite sintética creada explícitamente (Prisma 5 devolvía error genérico ante archivo inexistente), db push sin accept-data-loss, lint, typecheck y build. Prueba de respaldo: WAL incluido, cambios aditivos conservan contenidos y alteración detectada. La instalación compara todas las columnas originales de las tablas previas tras sincronizar el esquema.
