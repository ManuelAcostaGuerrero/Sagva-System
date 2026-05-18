# Módulo 04 - Facturas e Integración

## Objetivo

Registrar facturas de compra e integrar sus datos con proveedores, artículos, inventario y análisis.

## Responsabilidad principal

Procesar facturas recibidas, controlar productos facturados, precios acordados, precios facturados y diferencias asociadas a futuras notas de crédito.

## Qué incluye

- Listado de facturas.
- Nueva factura.
- Detalle de factura.
- Productos facturados.
- Asociación con artículos internos.
- Diferencias entre precio acordado y precio facturado.
- Registro de diferencias como cargo temporal asociado a futura nota de crédito.

## Qué no incluye

- No administra proveedores.
- No define la ficha completa del artículo.
- No define permisos.
- No debe incluir campo de moneda.
- No debe incluir plazo de entrega.
- No debe incluir lista de precios del proveedor en la pantalla de nueva factura.

## Pantallas

1. Listado de facturas.
2. Nueva factura.
3. Detalle de factura.
4. Productos facturados.
5. Asociación de productos.
6. Diferencias / notas de crédito.
7. Historial de facturas.

## Campos principales

| Campo | Descripción |
|---|---|
| factura_id | Identificador interno |
| numero_factura | Folio/documento |
| fecha_emision | Fecha del documento |
| fecha_recepcion | Fecha recibida |
| proveedor_id | Proveedor asociado |
| codigo_proveedor | Para búsqueda/autocompletado |
| nombre_proveedor | Para búsqueda/autocompletado |
| rut_ruc | Autocompletado desde proveedor |
| razon_social | Autocompletado desde proveedor |
| direccion | Autocompletado desde proveedor |
| producto_facturado | Nombre como viene en factura |
| codigo_producto_proveedor | Código externo |
| articulo_id | Artículo interno |
| cantidad | Cantidad comprada |
| precio_acordado | Precio esperado |
| precio_facturado | Precio de factura |
| diferencia | Precio facturado menos precio acordado |
| impuesto | IVA/adicional/exento |
| total_linea | Total por producto |

## Reglas de negocio

1. Al ingresar código o nombre de proveedor, autocompletar datos esenciales.
2. Si el producto del proveedor ya está asociado, cargar artículo interno.
3. Si no está asociado, marcar pendiente de asociación.
4. Si precio facturado difiere del precio acordado, registrar diferencia aparte.
5. La diferencia no debe distorsionar costo, margen ni precio público.
6. La diferencia queda asociada a futura nota de crédito.

## Integraciones

- Proveedores entrega datos del proveedor y asociaciones.
- Artículos entrega datos internos del producto.
- Inventario recibe entradas si corresponde.
- Análisis consulta compras, costos y diferencias.

## Pendientes

- Definir estados definitivos de factura.
- Definir flujo exacto de nota de crédito.
- Definir si la factura puede quedar en borrador.
- Definir validaciones fiscales finales.
