# Laboratorio DTE experimental (solo lectura)

Ruta: `/laboratorio-dte` (desde el menú de Compras).

**Aislamiento:** no modifica inventario, facturas, proveedores, usuarios, saldos, ni esquema Prisma. No utiliza acciones de servidor ni APIs de escritura. Los archivos XML e imágenes se procesan en el navegador. Solo guarda datos si el usuario descarga los resultados manualmente.

## Funcionalidades
- Importar foto de un timbre PDF417/QR o capturar desde cámara en vivo (HTTPS o localhost).
- Leer los campos del TED chileno: RUT emisor/receptor, tipo, folio, fecha, total y primer producto.
- Importar uno o varios DTE desde XML y mostrar líneas: descripción, código, unidad, cantidad, precio y monto informados por el emisor.
- Comparar seis campos del TED y el XML; marcar coincidencias o diferencias.
- Exportar JSON y CSV, sin afectar bases de datos.

## Dependencias y limitaciones
- La decodificación se hace con `zxing-wasm@3.1.6` cargado desde jsDelivr; requiere acceso a internet o navegador con BarcodeDetector compatible.
- No hay OCR de facturas impresas, verificación de firma criptográfica, consulta al SII ni lectura automatizada de correo.
- Solo el XML DTE completo contiene el detalle de productos; PDF417 no lo trae.
- El lector de cámara requiere permisos y HTTPS/localhost, y no se considera validado hasta comprobarlo en un teléfono real.
- Los datos son privados: no subir documentos reales al repositorio público. Utilizar archivos locales y almacenar respaldos siguiendo las políticas de la empresa.

## Pruebas de aceptación antes de integración
1. Acceso desde menú escritorio y móvil; redirección a login para visitantes sin sesión.
2. PDF417 real: lectura de TED con fecha, RUT, folio y total correctos.
3. Imagen borrosa: informar que no se leyó, sin inventar campos.
4. XML real con varios productos: concordancia de cantidad, unidad, neto, IVA y total.
5. XML con varios DTE: selección de documento.
6. XML corrupto: error y estado sin datos falsos.
7. PDF417 y XML distintos: detectar campos divergentes.
8. PDF417 y XML del mismo documento: comparaciones concordantes.
9. Exportaciones JSON/CSV: comprobar datos y caracteres acentuados.
10. Android: cámara real con HTTPS y captura fotográfica como alternativa.

Antes de conectar a inventario/contabilidad exigir 10 facturas reales de distintos proveedores y revisión de unidades, cantidades, precios, impuestos y duplicidad. Se mantiene como módulo experimental hasta cumplir criterios.
