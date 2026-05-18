# Módulo 11 - Calendario / Fechas Especiales

## Objetivo

Clasificar fechas relevantes para análisis, ventas y operación futura.

## Responsabilidad principal

Mantener un calendario de fechas especiales que ayude a interpretar variaciones en ventas y decisiones administrativas.

## Qué incluye

- Feriado irrenunciable.
- Feriado laboral.
- Día conmemorativo.
- Impacto esperado en ventas.
- Referencia para análisis comparativo.
- Referencia futura para programación de personal.

## Qué no incluye

- No registra ventas.
- No administra personal todavía.
- No define pagos laborales.
- No define permisos.

## Pantallas

1. Calendario de fechas.
2. Nueva fecha especial.
3. Clasificación de fecha.
4. Impacto comercial esperado.
5. Historial de fechas.

## Tipos de fecha

| Tipo | Descripción |
|---|---|
| feriado_irrenunciable | Día no laborable |
| feriado_laboral | Día laborable especial |
| dia_conmemorativo | Fecha que puede afectar ventas |

## Reglas de negocio

1. Las ventas deben analizarse según el tipo de fecha.
2. Una semana con feriado no debe compararse ciegamente con una semana normal.
3. Se debe considerar comportamiento antes, durante y después de ciertos feriados.
4. En caso de futuro módulo de personal, feriado irrenunciable implica no programar trabajo.
5. En caso de futuro módulo de personal, feriado laboral puede implicar pago especial o compensación.

## Integraciones

- Análisis y Gestión consulta fechas para comparaciones.
- Venta puede entregar datos por fecha.
- Interfaz muestra calendario o alertas visuales.
- Futuro módulo de personal podría usar estas clasificaciones.

## Pendientes

- Definir fuente de feriados: manual, automática o mixta.
- Definir calendario inicial por país/región.
- Definir reglas exactas de impacto comercial.
