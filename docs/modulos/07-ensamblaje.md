# Módulo 07 - Ensamblaje

## Objetivo

Crear y gestionar productos formados por otros artículos.

## Responsabilidad principal

Definir componentes, cantidades requeridas, disponibilidad, ejecución de armado y desarme.

## Qué incluye

- Productos ensamblados.
- Componentes.
- Cantidades requeridas.
- Costo del producto ensamblado.
- Disponibilidad para armar.
- Ejecución de ensamblaje.
- Desarme de ensamblaje.
- Historial de movimientos.

## Qué no incluye

- No define permisos ni seguridad.
- No administra usuarios.
- No controla caja.
- No genera reportes generales.
- No administra proveedores.

## Pantallas

1. Listado de ensamblajes.
2. Nuevo ensamblaje.
3. Detalle de ensamblaje.
4. Disponibilidad para armar.
5. Ejecutar ensamblaje.
6. Desarmar ensamblaje.
7. Historial.

## Reglas de negocio

1. Un ensamblaje siempre debe tener componentes.
2. El costo sale de la suma de los componentes y ajustes definidos.
3. La cantidad máxima a armar depende del componente limitante.
4. Al ensamblar, bajan los componentes y sube el producto final.
5. Al desarmar, baja el producto final y suben los componentes.
6. El desarme debe pedir motivo.
7. Este módulo solo respeta reglas definidas por seguridad, pero no las desarrolla.

## Campos principales

| Campo | Descripción |
|---|---|
| ensamblaje_id | Identificador interno |
| producto_final_id | Artículo final ensamblado |
| componente_id | Artículo componente |
| cantidad_requerida | Cantidad necesaria por unidad |
| costo_componente | Costo del componente |
| costo_final | Costo total del producto armado |
| merma_ajuste | Merma o ajuste si aplica |
| cantidad_ensamblar | Cantidad a producir |
| cantidad_desarmar | Cantidad a revertir |
| motivo_desarme | Motivo del desarme |
| sucursal_id | Sucursal/bodega |

## Integraciones

- Artículos entrega producto final y componentes.
- Inventario valida stock, descuenta componentes y aumenta producto final.
- Venta puede vender productos ensamblados.
- Análisis puede consultar rentabilidad y consumo de componentes.

## Pendientes

- Definir si el producto final debe existir antes como artículo.
- Definir si habrá ensamblaje automático al vender.
- Definir reglas de merma.
