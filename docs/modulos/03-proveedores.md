# Módulo 03 - Proveedores

## Objetivo

Gestionar proveedores, condiciones comerciales, listas de precios y asociación de productos del proveedor con artículos internos.

## Responsabilidad principal

Centralizar la información comercial del proveedor y permitir actualizar costos usando listas importables.

## Qué incluye

- Registro de proveedores.
- Datos fiscales y comerciales.
- Condiciones comerciales.
- Listas de precios PDF como respaldo formal.
- Listas Excel, CSV o Google Sheets para carga automática.
- Plantilla descargable de carga.
- Mapeo producto proveedor con artículo interno.

## Qué no incluye

- No registra facturas completas.
- No modifica stock directamente.
- No define permisos.

## Pantallas

1. Listado de proveedores.
2. Nuevo proveedor.
3. Detalle proveedor.
4. Condiciones comerciales.
5. Listas de precios.
6. Carga/importación de lista.
7. Asociación producto proveedor con artículo interno.

## Campos principales

| Campo | Descripción |
|---|---|
| proveedor_id | Identificador interno |
| rut_ruc | Identificación fiscal |
| razon_social | Nombre legal |
| nombre_comercial | Nombre conocido |
| direccion | Dirección |
| contacto | Persona o contacto principal |
| telefono | Teléfono |
| correo | Correo |
| condiciones_comerciales | Acuerdos y observaciones |
| lista_precio_pdf | Documento formal |
| lista_precio_importable | Excel, CSV o Sheets |
| producto_proveedor_codigo | Código externo |
| producto_proveedor_nombre | Nombre externo |
| articulo_id | Artículo interno vinculado |

## Reglas de negocio

1. PDF se usa como respaldo formal.
2. Excel, CSV o Sheets se usan para actualización automática de costos.
3. La pantalla de carga debe mostrar instrucciones claras.
4. Debe existir una plantilla descargable.
5. Los productos del proveedor deben poder asociarse con artículos internos.
6. El sistema debe evitar duplicados cuando el producto ya está asociado.

## Integraciones

- Artículos recibe asociaciones de productos.
- Facturas consulta datos del proveedor y asociaciones.
- Análisis revisa compras, proveedores y oportunidades.

## Pendientes

- Definir campos finales del proveedor.
- Definir estructura exacta de condiciones comerciales.
- Definir plantilla final de carga de listas.
