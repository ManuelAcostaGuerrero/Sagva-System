# Módulo 02 - Inventario

## Objetivo

Controlar existencias físicas, movimientos de stock, mínimos, máximos y alertas de inventario.

## Responsabilidad principal

Administrar cantidades disponibles por artículo, sucursal o bodega.

## Qué incluye

- Stock actual.
- Stock mínimo y máximo.
- Entradas y salidas.
- Ajustes de inventario.
- Movimientos históricos.
- Productos inventariables y no inventariables.

## Qué no incluye

- No define la ficha completa del artículo.
- No registra ventas completas.
- No administra proveedores.
- No define permisos.

## Pantallas

1. Stock actual.
2. Movimientos de inventario.
3. Ajustes de inventario.
4. Alertas de stock mínimo/máximo.
5. Historial de movimientos.

## Entradas

- articulo_id.
- sucursal_id.
- tipo_movimiento.
- cantidad.
- motivo.
- documento_origen.
- fecha.
- observación.

## Procesos

1. Consultar stock.
2. Registrar entrada.
3. Registrar salida.
4. Validar disponibilidad.
5. Registrar ajuste.
6. Generar alerta de stock bajo.

## Salidas

- Stock actualizado.
- Movimiento registrado.
- Historial consultable.
- Alerta de stock bajo o sobrestock.

## Reglas de negocio

1. Una venta puede descontar stock.
2. Una factura puede ingresar stock.
3. Un ensamblaje puede descontar componentes y aumentar producto final.
4. Un producto no inventariable no descuenta stock.
5. Stock mínimo genera alerta.
6. Stock máximo ayuda a evitar sobrecompra.

## Integraciones

- Artículos entrega datos base.
- Venta solicita disponibilidad y descuenta stock.
- Facturas generan entradas.
- Ensamblaje genera entradas y salidas.
- Análisis consulta movimientos y rotación.

## Pendientes

- Definir tipos oficiales de movimientos.
- Definir reglas por sucursal/bodega.
- Definir manejo de ajustes autorizados.

## Mejoras de búsqueda y merma (23-11-2026)

- **Entradas/Salidas y Ajustes:** el campo Artículo deja de ser un desplegable extenso. Ahora se puede buscar por nombre, código de barras o código interno y seleccionar un resultado; también admite lector de códigos con Enter cuando el código es único.
- Si hay coincidencias ambiguas, se debe elegir expresamente el artículo. El formulario no permite registrar movimientos sin un artículo seleccionado.
- **Tipo Merma:** registra `tipoMovimiento = "merma"` y descuenta la cantidad indicada del stock de la sucursal. Es distinto de Ajuste, que fija el stock físico final. La cantidad de la merma se guarda positiva para trazabilidad.
- Entrada suma y Salida descuenta; los cambios se calculan dentro de la operación de SQLite mediante incremento atómico. Mermas pueden dejar stock negativo para no ocultar diferencias.
- El stock de la sucursal Principal no cambia el nombre o estado de sucursales existentes al registrar movimientos.
- **Inventario:** búsqueda dinámica por nombre, código de barras, código interno, familia, marca o sucursal; visualiza el **código de barras** y no el código interno. Se paginan los resultados en grupos de 50, sin recargar la página.
- **Artículos:** botón «+ Nuevo artículo» alineado con los filtros; lupa al extremo derecho del campo de búsqueda para que no se superponga al cursor o texto.
- No se agregaron columnas ni se importaron/modificaron registros de SQLite con estos cambios de código. Ejecutar `node tools/test-inventario-merma.cjs` y `node tools/test-articulos-listado.cjs` antes de desplegar.
