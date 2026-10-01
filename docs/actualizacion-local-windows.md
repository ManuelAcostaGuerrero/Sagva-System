# Actualizacion local de Sagva System en Windows

Sagva System utiliza un flujo de actualizacion manual y controlado.

## Regla de trabajo

1. Los cambios se desarrollan y se suben al repositorio de GitHub.
2. Los computadores instalados no se actualizan automaticamente en segundo plano.
3. Cuando se quiera aplicar una nueva version, se ejecuta `ACTUALIZAR_SAGVA.bat` desde la carpeta local del proyecto.
4. El actualizador protege la configuracion y la base local antes de descargar cambios.

## Archivos

- `ACTUALIZAR_SAGVA.bat`: lanzador para Windows.
- `actualizar_sagva.ps1`: logica de actualizacion segura.
- `INICIAR_SAGVA.bat`: inicia la aplicacion local con `npm run dev`.
- `backups/`: respaldos locales creados antes de cada actualizacion disponible. Esta carpeta no se sube a GitHub.

## Que hace el actualizador

El actualizador:

1. Verifica que Git, Node.js y npm esten disponibles.
2. Verifica que la copia local este en la rama `main`.
3. Cancela la actualizacion si existen cambios locales sin confirmar para no sobrescribir trabajo.
4. Consulta `origin/main` en GitHub.
5. Si no hay cambios, informa que Sagva ya esta actualizado y termina.
6. Si hay una nueva version, crea un respaldo preventivo de `.env` y de las bases SQLite ubicadas en `prisma/`.
7. Ejecuta `git pull --ff-only origin main`.
8. Ejecuta `npm ci` cuando existe `package-lock.json`.
9. Ejecuta `npm run prisma:generate`.
10. Ejecuta `npm run db:push` sin aceptar perdida de datos automaticamente.
11. Muestra el commit anterior, el nuevo commit y la version indicada en `package.json`.

## Proteccion de datos

El actualizador no ejecuta `db:seed` automaticamente. Esto evita volver a cargar datos iniciales sobre una instalacion que ya contiene informacion real.

Tampoco utiliza `--accept-data-loss` con Prisma. Si un cambio de esquema requiere una operacion potencialmente destructiva, Prisma debe detenerse para que el cambio sea revisado manualmente antes de continuar.

El archivo `.env`, las bases SQLite y la carpeta `backups/` permanecen fuera del control de versiones.

## Uso normal

En cada computador instalado:

1. Cerrar Sagva System si esta ejecutandose.
2. Abrir la carpeta local de `Sagva-System`.
3. Ejecutar `ACTUALIZAR_SAGVA.bat`.
4. Verificar que aparezca `ACTUALIZACION COMPLETADA CORRECTAMENTE`.
5. Ejecutar `INICIAR_SAGVA.bat` para abrir nuevamente el sistema.

## Si aparece "cambios locales"

No se debe forzar la actualizacion. Primero hay que revisar los archivos indicados por el actualizador y decidir si esos cambios deben guardarse en Git, descartarse o respaldarse por separado.

Este comportamiento es intencional para evitar perdida accidental de codigo o configuracion no ignorada.
