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
