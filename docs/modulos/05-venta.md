# Módulo 05 - Venta

## Objetivo

Gestionar el proceso de venta desde la selección de productos hasta el cobro final y emisión del documento.

## Responsabilidad principal

Registrar ventas, productos, pagos parciales, cobros, boletas/tickets, anulaciones, préstamos y productos no stockeables cobrables.

## Qué incluye

- Nueva venta.
- Múltiples ventas abiertas por vendedor.
- Pagos parciales y mixtos.
- Métodos de pago.
- Cobro final.
- Boletas/tickets.
- Anulaciones.
- Préstamos o garantías retornables.
- Productos no stockeables cobrables.
- Productos sugeridos.

## Qué no incluye

- No administra caja completa.
- No define permisos.
- No administra ficha completa de artículos.
- No administra proveedores.

## Pantallas

1. Nueva venta.
2. Ventas abiertas.
3. Detalle de venta.
4. Pagos de venta.
5. Cobro final.
6. Anulaciones.
7. Préstamos / garantías retornables.
8. Productos sugeridos.

## Reglas de negocio

1. Un vendedor puede tener varias ventas abiertas al mismo tiempo.
2. Cada venta abierta tiene ID temporal independiente.
3. El ID definitivo de boleta/ticket se genera solo al finalizar/cobrar/guardar la venta.
4. Una venta puede tener múltiples pagos por distintos métodos.
5. Al seleccionar un método de pago, el monto a ingresar se carga con el saldo pendiente.
6. El usuario puede modificar el monto para permitir pagos parciales.
7. El botón de agregar pago solo se habilita con método y monto válido.
8. El botón de cobrar venta se habilita idealmente cuando el saldo pendiente es 0.
9. Si se permite venta con saldo pendiente/crédito, debe definirse una regla especial.
10. La anulación se imputa al cajero asignado a la venta original, no necesariamente al usuario que anula.
11. El documento préstamo permite ítems retornables con dinero en garantía.
12. La devolución de préstamo no debe afectar la caja ni las ventas del cajero en turno.
13. Los productos no stockeables pueden cobrarse sin descontar inventario, pero sí aparecen en venta, caja, comprobante y reportes.

## Datos principales

| Campo | Descripción |
|---|---|
| venta_id_temporal | ID interno mientras la venta está abierta |
| venta_id_definitivo | ID generado al finalizar |
| vendedor_id | Vendedor/cajero asignado |
| cliente_id | Cliente si aplica |
| productos | Líneas de venta |
| pagos | Pagos asociados |
| total | Total de venta |
| total_pagado | Monto acumulado |
| saldo_pendiente | Diferencia pendiente |
| vuelto | Vuelto si corresponde |
| estado | Estado de la venta |

## Integraciones

- Artículos entrega producto y precio.
- Inventario valida y descuenta stock.
- Caja recibe pagos y movimientos.
- Análisis recibe datos de venta.
- Seguridad define accesos y autorizaciones.

## Pendientes

- Definir si se permitirá venta con saldo pendiente/crédito.
- Definir estados finales de venta.
- Definir reglas completas de productos sugeridos.
- Definir comportamiento exacto de préstamos retornables.
