# SAGVA Ventas: mejoras posteriores a la migración

**Fecha:** 22-11-2026. **Estado:** cambios en GitHub; requieren actualización y pruebas locales en Windows.

## Módulo 01 — Artículos
- Búsqueda por nombre, código interno y código de barras, con filtros de familia, tipo y estado.
- Listado paginado en cliente (50 por página). La página del servidor todavía carga el catálogo para permitir filtrado local sin recargar.
- Edición rápida de familia, subfamilia, marca y estado. Enter o Guardar confirman la edición de esa línea sin enviar toda la ficha. Los precios no se recalculan en una edición de clasificación.
- Las marcas se asignan individualmente desde la ficha o la edición rápida del artículo. No existe asignación de marcas por lote ni alta de nuevas marcas desde el listado. El catálogo y la relación `marcaId` se conservan por integridad de los artículos existentes.
- Ganancia estimada y porcentajes visibles en la ficha; en el listado, ganancia visible solo para administradores, root y contabilidad.
- Conservación de precio público importado al editar clasificación; selección explícita para recalcular el precio.
- Tratamiento IVA_RETENIDO conservado en editor y validado en el servidor.
- Enter en inputs de ficha confirma el campo sin enviar el formulario. El botón Guardar artículo sigue siendo obligatorio.
- La creación de PROMOCION permanece bloqueada hasta configurar componentes. Inventario y mayoristas de tipo PROMOCION se ocultan provisionalmente; PRODUCTO y ARTICULO comparten ficha hasta definir sus diferencias.

## Módulo 06 — Ventas
- Búsqueda asincrónica en SQLite por nombre, ID y código de barras; se eliminó la precarga completa de productos. El código exacto se prioriza incluso si coinciden muchos nombres.
- El lector de código de barras tipo teclado se usa en el buscador; Enter agrega el artículo localizado.
- Reglas mayoristas aplicadas al cambiar cantidad, tomando el tramo de mayor cantidad mínima aplicable. Se valida el precio otra vez en el servidor.
- No se cobra con stock insuficiente: se revisa dentro de la transacción y se decrementa condicionalmente para impedir sobreventa concurrente. Regularizar stock antes de vender.
- Descuentos: se retiró el PIN fijo del navegador. Autorización con rol admin/root o permiso explícito para descuentos de ventas; el servidor verifica cada línea.
- Cantidades, descuentos, subtotales y totales se recalculan en React sin recargar la página. Enter no envía una venta por accidente.
- Cobro rápido en efectivo: caja registra el total vendido (no el dinero entregado), mientras el vuelto conserva el dinero realmente recibido.
- Identificador de venta idempotente para evitar duplicados al reenviar; el servidor comprueba los medios de pago y la caja abierta.
- Los cambios de precio o estado entre búsqueda y cobro generan un error para volver a buscar el artículo.

## Validaciones obligatorias antes del uso operativo
1. Actualizar código y respaldo SQLite según el procedimiento SAGVA; no usar seed, reset ni acepta pérdida de datos.
2. Ejecutar `npm run prisma:generate`, `npm run typecheck`, `node tools/test-venta-mayorista.cjs`, `node tools/test-control-venta.cjs`, `node tools/test-proteccion-precios.cjs` y `npm run build`.
3. Probar en navegador: búsqueda de código al principio y final del catálogo, lectura con escáner real, venta con tramos mayoristas 1/6/12, edición de cantidad, descuentos con distintos roles, pagos mixtos y vuelto de efectivo.
4. Probar venta de dos unidades con stock=1 y dos cobros concurrentes sobre mismo stock. La venta debe rechazarse sin generar movimiento parcial.
5. Confirmar en caja diaria que efectivo registrado sea valor neto vendido; revisar también el cierre de caja.
6. Verificar que el tipo IVA_RETENIDO siga visible después de editar y guardar un cigarro.
7. Revisar rendimiento en el navegador con el total de artículos importados y con móvil.
8. La emisión tributaria de boletas/tickets para IVA retenido requiere una integración independiente y revisión normativa.

**No se han alterado datos de SQLite desde GitHub. No instalar en producción antes de aprobar estas pruebas.**

## Retiro de bloque de marcas por lote (22-11-2026)
- Eliminado el panel de «Asignación de marcas por lote», sus casillas de selección, «Marca para artículos seleccionados» y «Nueva marca (opcional)».
- Retiradas las funciones cliente y acciones de servidor de asignación masiva y creación rápida de marcas desde ese panel.
- No hay campos de base de datos nuevos asociados a esos controles; solo eran estados locales de React. La tabla `marcas` y la columna `articulos.marca_id` siguen siendo necesarias para la clasificación individual y **no se deben borrar**.
- Ningún cambio de esquema, limpieza de registros o actualización de SQLite.
