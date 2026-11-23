# Módulo 06 - Caja / Funciones de Cajero

## Objetivo

Gestionar apertura, operación y cierre de caja.

## Responsabilidad principal

Controlar el flujo de caja por turno y mantener registros definitivos de apertura y cierre.

## Qué incluye

- Caja activa.
- Apertura de caja.
- Cierre de caja.
- Ingresos y retiros.
- Arqueo.
- Diferencias.
- Historial de cierres.
- Solicitudes de corrección.

## Qué no incluye

- No define permisos.
- No registra ventas completas.
- No administra productos.

## Pantallas

1. Caja activa.
2. Apertura / cierre en pantalla única con selector.
3. Cierre desplegable desde caja activa.
4. Historial de cierres.
5. Solicitud de corrección.

## Reglas de negocio

1. Apertura y cierre deben simplificarse en una sola pantalla principal.
2. La pantalla tiene selector de acción: apertura de caja o cierre de caja.
3. Para apertura se habilita monto inicial y observación.
4. Para cierre se habilitan campos de cierre según corresponda.
5. Por defecto, cajeros no ven totales de ventas, efectivo esperado, diferencias calculadas ni cierre completo.
6. La visibilidad de esos datos depende del módulo de seguridad.
7. Apertura y cierre no se modifican libremente después de guardados.
8. Las correcciones se hacen mediante solicitud o ajuste autorizado.
9. Todo ajuste debe registrar dato anterior, dato nuevo, motivo, fecha/hora, solicitante y autorizador.

## Campos principales

| Campo | Descripción |
|---|---|
| caja_id | Caja asociada |
| turno_id | Turno activo |
| usuario_id | Cajero |
| sucursal_id | Local |
| monto_inicial | Monto de apertura |
| efectivo_contado | Efectivo informado en cierre |
| ingresos | Movimientos adicionales |
| retiros | Retiros de caja |
| diferencia | Diferencia calculada según reglas visibles |
| observacion | Comentario |
| estado | Estado de caja |

## Integraciones

- Venta entrega pagos y ventas del turno.
- Análisis consulta cierres y diferencias.
- Seguridad define qué datos puede ver cada usuario.

## Pendientes

- Definir conceptos permitidos para ingresos/retiros.
- Definir estados finales de caja.
- Definir formato exacto de solicitud de corrección.

## Ventas antes de abrir caja (23-11-2026)
- Se puede atender y **cobrar** con o sin caja abierta. La venta conserva `vendedorId`, `sucursalId`, pagos, folio y su fecha real. Si todavía no existe caja activa del usuario, se guarda `cajaId=null`.
- Al abrir caja en la misma sucursal, el sistema vincula las ventas cobradas sin caja del **mismo usuario** y **mismo día comercial**, sin mezclar otras sesiones ni otras jornadas. Crea movimientos de pagos con nota «Antes de apertura».
- La reconciliación se hace dentro de una transacción y solo actualiza ventas con `cajaId=null`, para no duplicar movimientos.
- Se identifica la jornada por la zona `America/Santiago` y la variable `SAGVA_HORA_CORTE_DIA="HH:MM"` (hora del inicio de una jornada / corte de la anterior).
- La hora de corte **no existía guardada en el esquema**. Si no se configura la variable, se utiliza temporalmente `00:00`. En negocios que cierran después de medianoche es obligatorio definir su hora real de corte antes de utilizar esta clasificación de jornadas.
- No se reatribuyen ventas de otro usuario al abrir caja. La caja activa se consulta por usuario y sucursal.
- La apertura no borra ventas ni altera el stock. No requiere nuevas columnas ni migración de SQLite.
- En el arqueo, los movimientos de venta por tarjeta, crédito y transferencia se registran para trazabilidad, pero no suman al **efectivo esperado**. Solo las ventas con método EFECTIVO, la apertura y los ingresos/retiros afectan ese cálculo.

## Corrección de cobro rápido F10/F2 (23-11-2026)
- Un aviso de `P2002` no confirma por sí mismo una venta duplicada. Antes de cobrar se consulta `idTemporal`; si existe, se presenta su estado, folio y método de pago, bloqueando el segundo cobro con esa misma operación.
- Un choque de `folioDefinitivo` se reintenta hasta tres veces **en transacciones completas**; nunca se repiten movimientos de un intento revertido.
- F10/Transferencia y F2/Efectivo utilizan un mismo identificador por pestaña de venta. Reintentar con otro medio solo procede si el primero no quedó registrado.
- La UI ignora autorepeticiones de teclas, previene envíos concurrentes con una referencia sincrónica y cierra el modal de efectivo después de un error; no pierde el carrito.
- Ante un error incierto, revisar historial de ventas antes de reintentar el cobro.
- Ejecutar `node tools/test-cobro-rapido-duplicados.cjs` y las pruebas anteriores antes de desplegar.

## Ventas consecutivas del mismo producto y medio de pago (23-11-2026)
- **No existe deduplicación por producto, precio, importe, cliente o medio de pago.** Dos compras idénticas son dos operaciones reales y necesitan dos folios.
- El ID idempotente pertenece solo al intento de cobro de una venta. Una vez confirmada, SAGVA muestra el folio, libera el carrito y genera otro ID para la siguiente venta, sin refrescar la página.
- Se permiten operaciones repetidas, incluso F10→F10 o F2→F2 sobre el mismo artículo. La protección contra dobles clics y reenvíos idénticos mantiene el mismo ID solo durante el intento original.
- Si la operación ya está confirmada en SQLite y llega una petición con el ID anterior, no se cobra otra vez: se notifica y se crea una venta nueva, en vez de bloquear la caja.
- Al limpiar o cancelar una pestaña se reemplaza también su identificador, no solo sus productos.
- Ejecutar `node tools/test-cobro-rapido-duplicados.cjs` antes de actualizar un punto de venta.

## Escaneo continuo y foco de búsqueda (23-11-2026)
- En Nueva venta, al abrir la pantalla y al finalizar cada cobro confirmado, el cursor vuelve automáticamente al campo de búsqueda para escanear el siguiente artículo, sin recargar ni desplazar la página.
- Tras agregar un artículo desde los resultados, se limpia la búsqueda y recupera el foco de inmediato, facilitando el escaneo de varios artículos seguidos en un mismo carrito.
- Mientras el diálogo de efectivo está abierto, el foco permanece en el importe recibido y no cambia al buscador.
- En el listado de Artículos, el buscador se enfoca al abrir la pantalla, mantiene el foco al presionar Enter, selecciona el código anterior para reemplazarlo en el próximo escaneo y vuelve al buscador al guardar una clasificación rápida.
- No modifica la venta, el folio, la base de datos ni el funcionamiento de los lectores HID que envían caracteres y Enter.
