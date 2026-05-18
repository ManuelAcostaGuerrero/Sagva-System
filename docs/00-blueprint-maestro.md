# Blueprint Maestro - Sagva System

## Objetivo

Definir Sagva System como un software modular. Cada módulo debe tener responsabilidad propia, entradas, procesos, salidas, reglas, pantallas e integraciones controladas.

## Lista oficial de módulos

1. Artículos
2. Inventario
3. Proveedores
4. Facturas e Integración
5. Venta
6. Caja / Funciones de Cajero
7. Ensamblaje
8. Análisis y Gestión
9. Permisos y Seguridad
10. Interfaz e Integración
11. Calendario / Fechas Especiales

## Regla central de modularidad

Cada módulo debe funcionar como una caja independiente:

```text
Módulo
├── recibe datos
├── procesa datos
├── guarda datos propios
├── expone resultados
├── se comunica por contratos claros
└── no invade responsabilidades ajenas
```

## Estructura mínima por módulo

Cada blueprint individual debe contener:

1. Nombre del módulo
2. Objetivo
3. Responsabilidad principal
4. Qué incluye
5. Qué no incluye
6. Pantallas
7. Campos principales
8. Reglas de negocio
9. Estados
10. Flujo principal
11. Datos que crea
12. Datos que modifica
13. Datos que consulta
14. Integraciones
15. Historial / trazabilidad
16. Casos especiales
17. Pendientes

## Servicios sugeridos

```text
ArticuloService
InventarioService
ProveedorService
FacturaService
VentaService
CajaService
EnsamblajeService
AnalisisService
SeguridadService
CalendarioService
InterfazIntegracionService
```

## Base de datos recomendada

Para la primera etapa se recomienda una base centralizada, idealmente PostgreSQL, separando tablas por área funcional.

## Tablas iniciales sugeridas

```text
articulos
articulo_precios
familias
subfamilias
marcas
inventario_stock
inventario_movimientos
proveedores
proveedor_listas_precios
proveedor_productos_asociados
facturas
factura_detalles
factura_diferencias
ventas
venta_detalles
venta_pagos
venta_anulaciones
cajas
caja_aperturas
caja_cierres
caja_movimientos
ensamblajes
ensamblaje_componentes
ensamblaje_movimientos
usuarios
roles
permisos
calendario_fechas
reportes_configuracion
```

## Matriz general de integración

| Origen | Destino | Uso |
|---|---|---|
| Venta | Artículos | Consultar producto, precio y estado |
| Venta | Inventario | Validar y descontar stock |
| Venta | Caja | Registrar pagos |
| Venta | Análisis | Entregar datos de venta |
| Facturas | Proveedores | Autocompletar datos del proveedor |
| Facturas | Artículos | Asociar productos facturados |
| Facturas | Inventario | Ingresar stock si corresponde |
| Proveedores | Artículos | Asociar producto proveedor con artículo interno |
| Ensamblaje | Artículos | Consultar componentes y producto final |
| Ensamblaje | Inventario | Descontar componentes y aumentar producto final |
| Caja | Venta | Consultar ventas del turno según reglas visibles |
| Análisis | Todos | Leer datos para reportes e indicadores |
| Seguridad | Todos | Validar acceso, permisos y restricciones |
| Calendario | Análisis | Ajustar comparaciones por fechas especiales |
| Interfaz | Todos | Normalizar navegación, layout y componentes |

## Variables globales reutilizables

- IDs: articulo_id, proveedor_id, factura_id, venta_id, caja_id, sucursal_id, usuario_id, ensamblaje_id.
- Estados generales: activo, inactivo, pendiente, anulado, cerrado.
- Tipos de impuesto: IVA, exento, impuesto adicional.
- Métodos de pago: efectivo, débito, crédito, transferencia, mixto.
- Tipos de fecha: feriado irrenunciable, feriado laboral, día conmemorativo.

## Orden recomendado de desarrollo

1. Interfaz base
2. Seguridad base
3. Artículos
4. Inventario
5. Proveedores
6. Facturas e Integración
7. Venta
8. Caja / Funciones de Cajero
9. Ensamblaje
10. Análisis y Gestión
11. Calendario avanzado
