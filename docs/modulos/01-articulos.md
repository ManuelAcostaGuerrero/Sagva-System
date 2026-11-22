# Módulo 01 - Artículos

## Objetivo

Administrar la ficha maestra de productos y artículos del sistema.

## Responsabilidad principal

Definir los datos base de cada artículo: códigos, familia, subfamilia, marca, unidad, impuestos, precios, margen y precio público.

## Qué incluye

- Registro de artículos.
- Código interno de producto generado automáticamente por SAGVA, no editable.
- Código de barras ingresado manualmente o mediante escáner.
- Códigos de proveedor asociados a cada artículo y a su proveedor específico.
- Familia y subfamilia.
- Marca.
- Tipo de impuesto.
- Impuesto adicional ILA de bebidas seleccionable por categoría: 0%, 10%, 18%, 20,5% y 31,5%.
- Precios con/sin IVA calculados automáticamente en pantalla y precio público sugerido visible.
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
| articulo_id | Identificador técnico interno (Prisma/SQLite) |
| codigo_producto | Código comercial interno generado por SAGVA y no editable |
| codigo_barra | Código de barras capturado o ingresado |
| proveedor_productos_asociados | Asociación proveedor + código externo + artículo, varios por artículo |
| codigo_inventario | Campo anterior conservado en BD por compatibilidad; no se captura en el formulario |
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
3. El catálogo de bebidas aplica ILA del 10% a bebidas analcohólicas/energéticas, 18% cuando tienen más de 15 g de azúcar por 240 ml, 20,5% a vinos/cervezas/sidras, 31,5% a licores/destilados, y 0% cuando no aplica (SII, DL 825 art. 42).
4. IVA general: 19%. Exento: 0%. Mostrar el monto del IVA y del ILA estimado en compra, calculando el ILA sobre la base neta.
5. Cambiar cualquiera de los campos de costo con IVA/sin IVA recalcula el otro; la última edición es la fuente para el guardado en servidor.
6. El precio público sugerido se recalcula al cambiar costo, tipo de IVA, ILA o recargo de margen (recargo sobre costo, no margen sobre precio de venta).
7. Para ventas minoristas al consumidor final, el ILA soportado en compra forma parte del costo y no se recarga nuevamente en la boleta; para mayoristas hay reglas especiales que requieren su propia configuración.
8. Si el costo ingresado ya incluye el impuesto adicional, no aplicarlo una segunda vez; se requiere base de compra sin ILA.
9. Al crear un artículo, generar un código `ART-` único. Conservar los códigos existentes.
10. Mantener el código de barras independiente del código del proveedor.
11. El código externo se identifica por proveedor + código (no es único globalmente).
12. Permitir varios códigos externos asociados a un mismo artículo, sin duplicar el inventario.
13. No reasignar a otro artículo un código externo ya asociado dentro del mismo proveedor.

## Integraciones

- Inventario utiliza el `articuloId` y la sucursal, sin depender de un código de inventario adicional.
- Venta consulta artículo, precio y estado.
- Facturas asocia productos facturados con artículo interno.
- Proveedores asocia productos externos con artículos internos.
- Ensamblaje consulta artículos como componentes.

## Pendientes

- Completar la búsqueda y asociación de artículos por código del proveedor o código de barras desde el ingreso real de facturas.
- Validar las asociaciones en el equipo local con datos de prueba antes de actualizar la instalación productiva.

- Definir estados finales del artículo.
- Definir fórmula exacta para artículo exento + impuesto adicional.
- Definir si precio público permite redondeo automático.
- Validar las tasas y el tratamiento tributario de ventas mayoristas con contabilidad antes de automatizar facturas tributarias.
- Fuente tributaria: https://www.sii.cl/preguntas_frecuentes/impuestos_mensuales/001_130_1250.htm y https://www.sii.cl/preguntas_frecuentes/impuestos_mensuales/001_130_1899.htm
