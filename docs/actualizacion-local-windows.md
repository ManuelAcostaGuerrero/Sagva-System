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


## Importación manual de artículos desde Excel de 22-11-2026

La actualización de GitHub **NO importa automáticamente** los productos en SQLite.

1. Descargar por separado el archivo privado `SAGVA_articulos_migracion_privada.json` de la conversación ChatGPT. Guardarlo en la carpeta local de `Sagva-System`. Este archivo está ignorado por Git.
2. Cerrar SAGVA y ejecutar `ACTUALIZAR_SAGVA.bat`. Verificar copia de respaldo y que las migraciones de estructura de `tipo_articulo` estén aplicadas.
3. Comprobar que la sucursal `principal` en SAGVA corresponde a **Casa Matriz**, porque el stock del Excel corresponde a esa ubicación. Si no corresponde, no utilizar el código por defecto.
4. Analizar SIN importar con: `npm run importar:articulos -- --archivo=SAGVA_articulos_migracion_privada.json --sucursal=principal`.
5. Revisar el reporte generado en `reportes-importacion/`. El importador compara los códigos con SQLite y no modifica artículos existentes.
6. Si los candidatos y la sucursal son correctos, ejecutar: `npm run importar:articulos -- --archivo=SAGVA_articulos_migracion_privada.json --sucursal=principal --aplicar`.
7. El importador crea su propio respaldo SQLite coherente con `VACUUM INTO` en `backups/migracion-articulos/` antes de grabar el primer registro. Si un artículo falla, queda reportado sin eliminar los ya cargados. Repetir la operación no duplica artículos importados previamente.

Los registros de Excel que no pasan validación quedan pendientes para revisión. Se importan **solo** PRODUCTO, ARTICULO y EXENTOS de las familias CIGARROS/TABAQUERIA; se omiten las promociones. Los identificadores son el ID original; las familias se crean si faltan; subfamilia y marca quedan sin asignar. Se mantiene el precio público original de forma literal. El costo es el costo neto y se deriva costo con IVA (19%) y recargo. Valores de costo/venta incoherentes requieren revisión.

**No** copiar el JSON a GitHub, ni activar la importación en el inicio del sistema, ni ejecutarla automáticamente en el actualizador. El tipo tributario `IVA_RETENIDO` identifica una clasificación para futuras operaciones; la emisión tributaria/ticket de venta se debe integrar y verificar por separado.
