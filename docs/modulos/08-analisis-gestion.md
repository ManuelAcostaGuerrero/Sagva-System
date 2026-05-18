# Módulo 08 - Análisis y Gestión

## Objetivo

Convertir los datos operativos del sistema en información útil para tomar decisiones administrativas.

## Responsabilidad principal

Mostrar dashboard, indicadores, comparaciones, alertas, reportes y proyecciones.

## Qué incluye

- Dashboard general.
- Comparación de hasta tres períodos.
- Indicadores de venta.
- Indicadores de inventario.
- Comparación de proveedores.
- Rentabilidad.
- Alertas.
- Proyecciones.
- Análisis por fechas especiales.

## Qué no incluye

- No registra ventas.
- No modifica stock.
- No registra facturas.
- No define permisos.

## Pantallas

1. Dashboard general.
2. Comparación de períodos.
3. Ventas.
4. Inventario.
5. Proveedores.
6. Rentabilidad.
7. Alertas.
8. Proyecciones.

## Reglas de negocio

1. El dashboard debe permitir comparar tres períodos.
2. Las comparaciones deben considerar si hay feriados o fechas especiales.
3. Una semana con feriado no debe compararse ciegamente contra una semana normal.
4. El análisis debe considerar ventas previas a feriados.
5. El sistema debe considerar las dos sucursales para análisis y compras consolidadas.
6. Debe mostrar oportunidades de ahorro por proveedor.
7. Debe detectar stock crítico.
8. Debe detectar productos con margen bajo.

## Entradas

- Ventas.
- Inventario.
- Facturas.
- Proveedores.
- Caja.
- Ensamblajes.
- Calendario.

## Salidas

- Indicadores.
- Gráficos.
- Alertas.
- Comparaciones.
- Reportes.
- Proyecciones.

## Integraciones

- Venta entrega datos de ventas.
- Inventario entrega stock y movimientos.
- Facturas entrega compras y costos.
- Proveedores entrega comparativas y condiciones.
- Caja entrega cierres y movimientos.
- Calendario entrega clasificación de fechas.

## Pendientes

- Definir KPIs principales.
- Definir diseño final del dashboard.
- Definir reglas de alertas.
- Definir fórmulas de proyección.
