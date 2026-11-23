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
