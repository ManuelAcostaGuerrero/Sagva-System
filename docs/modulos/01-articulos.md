# Módulo 01 - Artículos

## Objetivo

Administrar la ficha maestra de productos y artículos del sistema.

## Responsabilidad principal

Definir los datos base de cada artículo: códigos, familia, subfamilia, marca, unidad, impuestos, precios, margen y precio público.

## Qué incluye

- Registro de artículos.
- Código de producto e inventario.
- Código de barra manual o automático.
- Familia y subfamilia.
- Marca.
- Tipo de impuesto.
- Impuesto adicional.
- Stock mínimo y máximo como referencia para inventario.
- Unidad de medida y cantidad específica.
- Comentario interno.
- Precio con IVA y sin IVA.
- Margen editable.
- Precio público.
- Precio por mayor y cantidad mínima.

## Qué no incluye

- No controla movimientos de stock.
- No registra compras.
- No registra ventas.
- No define permisos.

## Pantallas

1. Listado de artículos.
2. Nuevo artículo.
3. Editar artículo.
4. Detalle de artículo.
5. Parámetros y cálculo de precios.
6. Precio por mayor.

## Campos principales

| Campo | Descripción |
|---|---|
| articulo_id | Código principal del artículo |
| codigo_inventario | Código usado por inventario |
| codigo_barra | Código de barra manual o automático |
| familia_id | Familia del artículo |
| subfamilia_id | Subfamilia dependiente |
| marca_id | Marca del producto |
| tipo_impuesto | IVA, exento u otro |
| impuesto_adicional | Impuesto extra si aplica |
| stock_minimo | Referencia de alerta |
| stock_maximo | Referencia de sobrestock |
| unidad_medida | Litros, gramos, unidades, etc. |
| cantidad_especifica | Ejemplo: 1 litro, 500 gramos |
| comentario | Máximo 150 caracteres |
| precio_con_iva | Precio con impuesto |
| precio_sin_iva | Precio neto |
| margen | Porcentaje de ganancia, por defecto 30% |
| precio_publico | Precio final cliente |
| precio_mayorista | Precio por mayor opcional |
| cantidad_minima_mayorista | Mínimo para aplicar precio por mayor |

## Reglas de negocio

1. Si se ingresa precio con IVA, calcular precio sin IVA.
2. Si se ingresa precio sin IVA, calcular precio con IVA.
3. Si se activa impuesto adicional, recalcular precios.
4. Si cambia el margen, recalcular precio público.
5. Si no existe código de barra, generar uno secuencial disponible.
6. No permitir códigos duplicados.

## Integraciones

- Inventario consulta artículo y códigos.
- Venta consulta artículo, precio y estado.
- Facturas asocia productos facturados con artículo interno.
- Proveedores asocia productos externos con artículos internos.
- Ensamblaje consulta artículos como componentes.

## Pendientes

- Definir estados finales del artículo.
- Definir fórmula exacta para artículo exento + impuesto adicional.
- Definir si precio público permite redondeo automático.
