# Validación de actualización local Windows — 15-11-2026

**Resultado: completada y sistema reiniciado.** Código instalado y validado: `fc352e5a3a5f238ebe28dd34f71c4da40f27f8ce`, rama main. Versión package.json 0.2.0.

## Fallo original confirmado

El log de npm registró EPERM/unlink de query_engine-windows.dll.node durante npm ci. Next seguía ejecutándose y mantenía el motor Prisma abierto. El código ya había avanzado a bea1b93, por lo que el actualizador antiguo podía devolver «ya actualizado» aunque dependencias/esquema no hubieran terminado.

## Corrección e instalación real

El propietario confirmó que había guardado formularios y autorizó continuar. Se preparó el código en worktree separado y SQLite sintética; luego se detuvieron exclusivamente los procesos Next de este proyecto, identificados por ruta y fecha. Nunca se detuvieron servicios por número de puerto de forma indiscriminada.

Durante la validación se corrigieron: consulta de permiso con campo nullable incompatible con upsert compuesto, módulo obligatorio de auditoría omitido y referencia opcional de pago ausente en Prisma aunque los servicios ya la utilizaban. El único cambio persistente de esquema nuevo fue la columna opcional referencia. No se ejecutó seed ni se aceptó pérdida de datos.

Dos intentos controlados quedaron registrados: preparación bajo el directorio principal hizo que Next resolviera ESLint desde el padre incompleto; se movió fuera del proyecto y el sistema no se detuvo en ese intento. Después ocurrió un proceso con CommandLine nulo durante el cierre, antes de respaldo/migración. Se añadió la guarda y cinco regresiones; se conservó el fallo, comprobó integridad y creó respaldo consistente antes de registrar recuperación y reintentar. No se borró la marca sin revisión ni se restauró a ciegas.

## Evidencias ejecutadas sobre el último código

| Control | Resultado |
|---|---|
| ACTUALIZAR_SAGVA.bat habitual | Completado; estado correcto, RecoveryRequired=false |
| npm ci en preparación y en instalación | Aprobado; DLL liberada al cerrar sólo Next propio |
| Prisma generate y db push sintético | Aprobados |
| npm run lint | Sin errores; permanecen cuatro avisos de dependencias useMemo |
| npm run typecheck | Aprobado |
| npm run build en ensayo y en instalación | Aprobado |
| Respaldo SQLite con WAL y verificación | Aprobado |
| Regresiones de datos | 3: WAL incluido, esquema aditivo preservado y alteración detectada |
| Regresiones de procesos | 5: desaparición, CommandLine nulo, PID reutilizado, ruta ajena y proceso propio |
| Comparación posterior de datos | Todas las tablas/columnas originales iguales al respaldo; integridad/FK correctas |
| Configuración .env | Idéntica al respaldo, sin revelar valores |
| Arranque | Next activo; API health identifica Sagva System y navegador muestra Iniciar sesión |
| Repetición de Actualizar | «Ya está actualizado», mismos procesos, sin reinstalar ni reiniciar |
| Otros proyectos/proxy | PID y puertos ajenos conservados |
| Git | main limpio, sincronizado con origin/main |

Acceso directo local verificado: **http://[::1]:3000/login**. Existe un proxy ajeno en IPv4 127.0.0.1:3000; se preservó. La dirección IPv6 evita confundir ese proxy con Sagva System. No se abrieron ni recargaron pestañas ajenas.

Logs completos, manifiesto de instalación y revisión de recuperación permanecen privados en .local; respaldo consistente y configuración en backups. No se publican bases, credenciales ni datos operativos. No se ingresaron cuentas reales para comprobar la página de acceso, ni se crearon ventas de prueba en la base existente.

## Protocolo vigente

Guardar formularios y ejecutar ACTUALIZAR_SAGVA.bat. El script prepara antes de detener, verifica origen/main y limpieza, registra la instalación completa y conserva recuperación ante fallo. Si estaba activo, vuelve a iniciar; si estaba detenido, lo conserva detenido. No ejecutar db:seed como parte de una actualización de una base con datos. No forzar Git, accept-data-loss ni restauraciones sin revisión.

Esta comprobación valida la actualización, compilación, preservación de datos y arranque. No constituye auditoría funcional integral de ventas, seguridad o dependencias. Permanecen avisos no bloqueantes de useMemo, next lint obsoleto y Browserslist antiguo; no se cambiaron dependencias mayores para ocultarlos.
