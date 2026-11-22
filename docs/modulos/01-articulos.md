# Módulo 01 - Artículos

## Objetivo

Administrar la ficha maestra de productos y artículos del sistema.

## Responsabilidad principal

Definir los datos base de cada artículo: códigos, familia, subfamilia, marca, unidad, impuestos, precios, margen y precio público.

## Qué incluye

- Registro de artículos.
- Campo **Tipo de artículo**: PRODUCTO, ARTICULO o PROMOCION, independiente de impuestos y con valor inicial PRODUCTO para artículos existentes.
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
- Lista de reglas mayoristas por artículo, con cantidad mínima y precio por unidad; permite agregar, editar y eliminar tramos.

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
| tipo_articulo | PRODUCTO, ARTICULO o PROMOCION; no define impuestos ni genera combos automáticamente |
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
| articulo_reglas_mayoristas | Lista por artículo: cantidad mínima y precio por unidad |
| precio_mayorista / cantidad_minima_mayorista | Columnas anteriores conservadas para compatibilidad y lectura de reglas heredadas |

## Reglas de negocio

1. Si se ingresa precio con IVA, calcular precio sin IVA.
2. Si se ingresa precio sin IVA, calcular precio con IVA.
3. El catálogo de bebidas aplica ILA del 10% a bebidas analcohólicas/energéticas, 18% cuando tienen más de 15 g de azúcar por 240 ml, 20,5% a vinos/cervezas/sidras, 31,5% a licores/destilados, y 0% cuando no aplica (SII, DL 825 art. 42).
4. IVA general: 19%. Exento: 0%. Mostrar el monto del IVA y del ILA estimado en compra, calculando el ILA sobre la base neta.
5. Cambiar un costo recalcula el otro. En una ficha existente se conserva el precio público, salvo que se elija explícitamente modificar el recargo y recalcularlo; la última edición del costo es la fuente para el guardado.
   - Los campos de costo y recargo porcentual son de escritura numérica directa (sin flechas para aumentar/disminuir); aceptan punto o coma decimal, no letras, signos, valores negativos ni exponentes.
   - Cuando el campo vale cero, al hacer clic se limpia temporalmente para escribir; si vale más de cero, conserva el valor para editar normalmente. Los vacíos al salir vuelven a cero.
   - La validación también se ejecuta en servidor antes de guardar; el costo neto admite hasta cinco decimales, otros importes hasta dos y las cantidades de stock hasta tres.
6. El precio público de una ficha existente se conserva al editar otros campos. El recálculo requiere la acción explícita para modificar el recargo. **El ILA jamás altera automáticamente ese precio**. El porcentaje es un recargo sobre costo, no un margen sobre precio de venta.
7. La tasa ILA asignada se guarda en la ficha de artículo para referencia de compras y facturas. Una simulación visual separada presenta IVA, ILA, costo combinado y precio hipotético con ambos impuestos, sin modificar ni guardar un segundo precio.
8. En ventas minoristas a consumidores finales, el ILA soportado en compras puede constituir costo real de venta; la simulación advierte que ignorarlo en el precio comercial puede reducir la rentabilidad. No se recarga otra vez en la boleta del consumidor final.
9. En facturas se deben utilizar los impuestos que realmente correspondan al documento, validando el tratamiento fiscal de cada operación. La tasa del artículo es un dato referencial, no una autorización para emitir documentos tributarios incorrectos.
10. Al crear un artículo, generar un código `ART-` único. Conservar los códigos existentes.
11. Mantener el código de barras independiente del código del proveedor.
12. El código externo se identifica por proveedor + código (no es único globalmente).
13. Permitir varios códigos externos asociados a un mismo artículo, sin duplicar el inventario.
14. No reasignar a otro artículo un código externo ya asociado dentro del mismo proveedor.
15. La subfamilia depende de la familia: al cambiar la familia, limpiar la subfamilia seleccionada y listar solamente las que pertenecen a la nueva familia. Validarlo también en servidor.
16. Cada artículo puede tener una lista de reglas mayoristas, con cantidad mínima positiva y precio por unidad positivo. Las cantidades admiten hasta tres decimales y los precios hasta dos.
17. No permitir dos reglas mayoristas con la misma cantidad mínima por artículo; se pueden agregar, editar y eliminar desde la ficha.
18. Para una cantidad de compra/venta determinada, corresponde la regla con la mayor cantidad mínima alcanzada. Sin reglas aplicables, se usa el precio público normal.
19. Al editar artículos antiguos, mostrar el precio mayorista y cantidad mínima legados como regla inicial mientras no existan reglas nuevas; al guardar, convertirlos a la nueva tabla sin modificar ventas históricas.
20. Las reglas no modifican el precio público normal ni el ILA. Su utilización automática en la pantalla de ventas requiere una etapa propia de integración y pruebas.

## Integraciones

- El tipo de artículo se conserva al crear o editar y aparece en el listado general.
- PROMOCION es, por ahora, una clasificación. No genera componentes, precios promocionales ni descuenta inventario hasta implementar el flujo de promociones.
- El tipo de artículo no altera los cálculos de IVA, ILA ni el precio público.

- Inventario utiliza el `articuloId` y la sucursal, sin depender de un código de inventario adicional.
- Venta consulta artículo, precio y estado.
- Facturas asocia productos facturados con artículo interno.
- Proveedores asocia productos externos con artículos internos.
- Ensamblaje consulta artículos como componentes.

## Pendientes

- Definir después la diferencia funcional entre PRODUCTO y ARTICULO.
- Diseñar la construcción manual de promociones con artículos previamente migrados; no importar promociones del sistema anterior.
- Completar la búsqueda y asociación de artículos por código del proveedor o código de barras desde el ingreso real de facturas.
- Validar las asociaciones en el equipo local con datos de prueba antes de actualizar la instalación productiva.
- Validar la creación de tabla mayorista adicional en una copia de SQLite, sin ejecutar migraciones sobre datos reales.
- Integrar y verificar la aplicación de tramos mayoristas durante las ventas antes de habilitar descuentos automáticos en caja.

- Definir estados finales del artículo.
- Definir fórmula exacta para artículo exento + impuesto adicional.
- Definir si precio público permite redondeo automático.
- Validar las tasas y el tratamiento tributario de ventas mayoristas con contabilidad antes de automatizar facturas tributarias.
- Fuente tributaria: https://www.sii.cl/preguntas_frecuentes/impuestos_mensuales/001_130_1250.htm y https://www.sii.cl/preguntas_frecuentes/impuestos_mensuales/001_130_1899.htm


## Altas desde la ficha y criterio de migración

- El selector **Familia** tiene botón `+` para crear una familia sin abandonar la ficha. Si ya existe un nombre equivalente (ignorando mayúsculas y espacios repetidos), se reutiliza y se selecciona.
- **Subfamilia** tiene botón `+`, disponible solo cuando hay una familia seleccionada. La nueva subfamilia siempre queda ligada a dicha familia y se evita repetir nombres dentro de una misma familia.
- **Marca** es independiente de familia/subfamilia y no se asigna automáticamente.
- **Importación planificada desde Excel:** importar únicamente FAMILIA; crearla si no existe o reutilizarla si existe. No importar SUBFAMILIA por ahora; dejarla sin asignar para clasificación posterior. Las PROMOCIONES tampoco se importan, se construirán manualmente luego.
- Esta decisión documenta el alcance de la futura importación; todavía no ejecuta la importación de artículos ni modifica SQLite.


## Importación del catálogo antiguo

- Conservar `ID` de origen exactamente como `codigoProducto` visible, manteniendo `Articulo.id` técnico independiente. Solo tomar `CODIGO BARRA` como código comercial; no tomar `CODIGO`.
- Importar PRODUCTO y ARTICULO. No importar PROMOCION: se crearán desde SAGVA posteriormente.
- Los EXENTOS de familias CIGARROS y TABAQUERIA se transforman en tipo PRODUCTO con `tipoImpuesto="IVA_RETENIDO"`. Los demás EXENTOS quedan pendientes de revisión.
- Importar solo FAMILIA y reutilizarla si ya existe; crearla si falta. Dejar SUBFAMILIA y MARCA realmente vacías, sin valor predeterminado. Se asignarán después.
- Mantener NOMBRE exactamente, incluidos los espacios de origen, y ACTIVO SI/NO. Forzar unidad `UNIDAD`. Llevar solamente stock positivo de Casa Matriz a la sucursal verificada; negativos se convierten en cero con advertencia.
- Guardar `PRECIO` exactamente como precio público (no recalcularlo con MARGEN). Guardar `COSTO` como costo sin IVA, calcular costo con IVA al 19% y derivar recargo sobre dicho costo. No importar `MARGEN` ni `VENTA_NETO` del Excel.
- El importador es una utilidad manual con análisis previo, controles de colisiones e informe de casos pendientes. Los nombres repetidos o marcados como duplicado, eliminar o prueba quedan pendientes de revisión. Si un artículo ya existe, compara también sus precios, costos, stock, tipo, impuestos y clasificación; cualquier diferencia queda pendiente sin sobrescribir. No se importa durante `git pull`, actualización ni apertura de SAGVA.

