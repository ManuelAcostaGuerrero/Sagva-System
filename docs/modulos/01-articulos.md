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
- Precios con/sin IVA calculados automáticamente en pantalla y precio público sugerido visible, **sin incluir ILA en el cálculo comercial**.
- Simulación tributaria visual (IVA + ILA) que no modifica precios guardados ni márgenes.
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
5. Cambiar cualquiera de los campos de costo con IVA/sin IVA recalcula el otro y el precio público sugerido de inmediato, según el porcentaje comercial; la última edición es la fuente para el guardado en servidor.
   - Los campos de costo y recargo porcentual son de escritura numérica directa (sin flechas para aumentar/disminuir); aceptan punto o coma decimal, no letras, signos, valores negativos ni exponentes.
   - Cuando el campo vale cero, al hacer clic se limpia temporalmente para escribir; si vale más de cero, conserva el valor para editar normalmente. Los vacíos al salir vuelven a cero.
   - La validación también se ejecuta en servidor antes de guardar; los importes admiten hasta dos decimales y las cantidades de stock hasta tres.
6. El precio público sugerido se recalcula al cambiar el costo con IVA, el tipo de IVA o el recargo comercial; **el ILA jamás altera automáticamente ese precio**. El porcentaje es un recargo sobre costo, no un margen sobre precio de venta.
7. La tasa ILA asignada se guarda en la ficha de artículo para referencia de compras y facturas. Una simulación visual separada presenta IVA, ILA, costo combinado y precio hipotético con ambos impuestos, sin modificar ni guardar un segundo precio.
8. En ventas minoristas a consumidores finales, el ILA soportado en compras puede constituir costo real de venta; la simulación advierte que ignorarlo en el precio comercial puede reducir la rentabilidad. No se recarga otra vez en la boleta del consumidor final.
9. En facturas se deben utilizar los impuestos que realmente correspondan al documento, validando el tratamiento fiscal de cada operación. La tasa del artículo es un dato referencial, no una autorización para emitir documentos tributarios incorrectos.
10. Al crear un artículo, generar un código `ART-` único. Conservar los códigos existentes.
11. Mantener el código de barras independiente del código del proveedor.
12. El código externo se identifica por proveedor + código (no es único globalmente).
13. Permitir varios códigos externos asociados a un mismo artículo, sin duplicar el inventario.
14. No reasignar a otro artículo un código externo ya asociado dentro del mismo proveedor.

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
