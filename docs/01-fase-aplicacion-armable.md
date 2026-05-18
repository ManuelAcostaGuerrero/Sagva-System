# Fase 01 - Aplicación Armable

## Objetivo de esta fase

Convertir los blueprints de **Sagva System** en una estructura inicial de aplicación modular.

Esta fase define:

1. Arquitectura inicial.
2. Carpetas del proyecto.
3. Módulos de la aplicación.
4. Pantallas base.
5. Servicios internos.
6. Modelos de datos.
7. Rutas.
8. Contratos entre módulos.
9. Base de datos inicial.
10. Orden de construcción.

## Resultado esperado

Al terminar esta fase, el proyecto debe tener:

- Proyecto creado.
- Login o acceso base.
- Menú principal.
- Layout general.
- Carpetas por módulo.
- Rutas por módulo.
- Pantallas vacías o semiarmadas.
- Servicios definidos.
- Modelos iniciales.
- Base de datos inicial.
- Documentación conectada al código.

## Stack recomendado inicial

### Frontend

- React.
- Next.js.
- TailwindCSS.

### Backend

- Node.js.
- Express o NestJS.

### Base de datos

- PostgreSQL.

### ORM

- Prisma.

### Autenticación

- JWT o sesión segura.

### Documentación

- Markdown dentro de `/docs`.

### Control de versiones

- GitHub.

## Recomendación práctica

Para iniciar de forma ordenada se recomienda:

```text
Next.js + Prisma + PostgreSQL
```

Esto permite manejar frontend, backend básico y rutas API en un solo proyecto. Más adelante, si el sistema crece, se puede separar.

## Estructura inicial del proyecto

```text
Sagva-System/
│
├── README.md
├── docs/
│   ├── 00-blueprint-maestro.md
│   ├── 01-fase-aplicacion-armable.md
│   └── modulos/
│       ├── 01-articulos.md
│       ├── 02-inventario.md
│       ├── 03-proveedores.md
│       ├── 04-facturas-integracion.md
│       ├── 05-venta.md
│       ├── 06-caja-cajero.md
│       ├── 07-ensamblaje.md
│       ├── 08-analisis-gestion.md
│       ├── 09-permisos-seguridad.md
│       ├── 10-interfaz-integracion.md
│       └── 11-calendario-fechas-especiales.md
│
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── dashboard/
│   │   ├── articulos/
│   │   ├── inventario/
│   │   ├── proveedores/
│   │   ├── facturas/
│   │   ├── venta/
│   │   ├── caja/
│   │   ├── ensamblaje/
│   │   ├── analisis/
│   │   ├── seguridad/
│   │   ├── calendario/
│   │   └── configuracion/
│   │
│   ├── modules/
│   │   ├── articulos/
│   │   ├── inventario/
│   │   ├── proveedores/
│   │   ├── facturas/
│   │   ├── venta/
│   │   ├── caja/
│   │   ├── ensamblaje/
│   │   ├── analisis/
│   │   ├── seguridad/
│   │   ├── interfaz/
│   │   └── calendario/
│   │
│   ├── components/
│   │   ├── layout/
│   │   ├── forms/
│   │   ├── tables/
│   │   ├── buttons/
│   │   ├── cards/
│   │   ├── modals/
│   │   └── feedback/
│   │
│   ├── services/
│   │   ├── articulo.service.ts
│   │   ├── inventario.service.ts
│   │   ├── proveedor.service.ts
│   │   ├── factura.service.ts
│   │   ├── venta.service.ts
│   │   ├── caja.service.ts
│   │   ├── ensamblaje.service.ts
│   │   ├── analisis.service.ts
│   │   ├── seguridad.service.ts
│   │   └── calendario.service.ts
│   │
│   ├── database/
│   │   ├── schema.prisma
│   │   ├── seed.ts
│   │   └── migrations/
│   │
│   ├── types/
│   │   ├── articulo.types.ts
│   │   ├── inventario.types.ts
│   │   ├── proveedor.types.ts
│   │   ├── factura.types.ts
│   │   ├── venta.types.ts
│   │   ├── caja.types.ts
│   │   ├── ensamblaje.types.ts
│   │   └── global.types.ts
│   │
│   ├── utils/
│   │   ├── calculations/
│   │   ├── validators/
│   │   ├── formatters/
│   │   └── constants/
│   │
│   └── config/
│       ├── menu.config.ts
│       ├── modules.config.ts
│       ├── permissions.config.ts
│       └── routes.config.ts
│
├── package.json
├── tsconfig.json
├── .env.example
└── .gitignore
```

## Módulos que deben existir en la aplicación

### 1. Artículos

Ruta base:

```text
/articulos
```

Pantallas iniciales:

```text
/articulos
/articulos/nuevo
/articulos/[id]
/articulos/[id]/editar
```

Servicio:

```text
ArticuloService
```

Funciones base:

```text
crearArticulo()
editarArticulo()
obtenerArticulo()
listarArticulos()
calcularPrecioConIVA()
calcularPrecioSinIVA()
calcularPrecioPublico()
generarCodigoBarraSecuencial()
```

### 2. Inventario

Ruta base:

```text
/inventario
```

Pantallas iniciales:

```text
/inventario
/inventario/movimientos
/inventario/ajustes
/inventario/alertas
```

Servicio:

```text
InventarioService
```

Funciones base:

```text
consultarStock()
registrarEntrada()
registrarSalida()
registrarAjuste()
validarDisponibilidad()
obtenerHistorialMovimientos()
generarAlertaStock()
```

### 3. Proveedores

Ruta base:

```text
/proveedores
```

Pantallas iniciales:

```text
/proveedores
/proveedores/nuevo
/proveedores/[id]
/proveedores/[id]/editar
/proveedores/[id]/listas-precios
/proveedores/[id]/asociaciones
```

Servicio:

```text
ProveedorService
```

Funciones base:

```text
crearProveedor()
editarProveedor()
listarProveedores()
obtenerProveedor()
cargarListaPrecios()
asociarProductoProveedor()
descargarPlantillaCarga()
```

### 4. Facturas e Integración

Ruta base:

```text
/facturas
```

Pantallas iniciales:

```text
/facturas
/facturas/nueva
/facturas/[id]
/facturas/[id]/productos
/facturas/[id]/diferencias
```

Servicio:

```text
FacturaService
```

Funciones base:

```text
crearFactura()
autocompletarProveedor()
agregarProductoFacturado()
asociarProductoInterno()
calcularDiferenciaPrecio()
registrarDiferenciaNotaCredito()
procesarFactura()
```

### 5. Venta

Ruta base:

```text
/venta
```

Pantallas iniciales:

```text
/venta/nueva
/venta/abiertas
/venta/[id]
/venta/anulaciones
/venta/prestamos
```

Servicio:

```text
VentaService
```

Funciones base:

```text
crearVentaTemporal()
agregarProducto()
eliminarProducto()
calcularTotal()
agregarPago()
calcularSaldo()
finalizarVenta()
generarIdDefinitivo()
anularVenta()
registrarPrestamo()
procesarDevolucionPrestamo()
```

### 6. Caja / Funciones de Cajero

Ruta base:

```text
/caja
```

Pantallas iniciales:

```text
/caja
/caja/activa
/caja/historial
/caja/correcciones
```

Servicio:

```text
CajaService
```

Funciones base:

```text
abrirCaja()
cerrarCaja()
registrarIngreso()
registrarRetiro()
calcularDiferencia()
obtenerCajaActiva()
solicitarCorreccion()
obtenerHistorialCierres()
```

### 7. Ensamblaje

Ruta base:

```text
/ensamblaje
```

Pantallas iniciales:

```text
/ensamblaje
/ensamblaje/nuevo
/ensamblaje/[id]
/ensamblaje/[id]/ejecutar
/ensamblaje/[id]/desarmar
/ensamblaje/historial
```

Servicio:

```text
EnsamblajeService
```

Funciones base:

```text
crearEnsamblaje()
editarEnsamblaje()
calcularCosto()
calcularDisponibilidad()
ejecutarEnsamblaje()
desarmarEnsamblaje()
obtenerHistorial()
```

### 8. Análisis y Gestión

Ruta base:

```text
/analisis
```

Pantallas iniciales:

```text
/analisis
/analisis/ventas
/analisis/inventario
/analisis/proveedores
/analisis/rentabilidad
/analisis/proyecciones
```

Servicio:

```text
AnalisisService
```

Funciones base:

```text
obtenerDashboard()
compararPeriodos()
analizarVentas()
analizarInventario()
analizarProveedores()
calcularRentabilidad()
generarAlertas()
generarProyeccion()
```

### 9. Permisos y Seguridad

Ruta base:

```text
/seguridad
```

Pantallas iniciales:

```text
/seguridad/usuarios
/seguridad/roles
/seguridad/permisos
/seguridad/auditoria
/seguridad/autorizaciones
```

Servicio:

```text
SeguridadService
```

Funciones base:

```text
crearUsuario()
crearRol()
asignarPermiso()
validarPermiso()
registrarAuditoria()
solicitarAutorizacion()
resolverAutorizacion()
```

### 10. Interfaz e Integración

Ruta base:

```text
/configuracion/interfaz
```

Pantallas iniciales:

```text
/configuracion/interfaz/menu
/configuracion/interfaz/variables
/configuracion/interfaz/integraciones
```

Servicio:

```text
InterfazIntegracionService
```

Funciones base:

```text
obtenerMenu()
obtenerRutas()
obtenerVariablesGlobales()
obtenerEstadosGlobales()
obtenerMatrizIntegracion()
```

### 11. Calendario / Fechas Especiales

Ruta base:

```text
/calendario
```

Pantallas iniciales:

```text
/calendario
/calendario/nueva-fecha
/calendario/feriados
/calendario/impacto
```

Servicio:

```text
CalendarioService
```

Funciones base:

```text
crearFechaEspecial()
clasificarFecha()
listarFechas()
obtenerImpactoFecha()
validarSemanaComparable()
```

## Menú inicial de la aplicación

```text
Sagva System
│
├── Dashboard
│
├── Operación
│   ├── Nueva venta
│   ├── Ventas abiertas
│   ├── Caja
│   └── Préstamos
│
├── Gestión de productos
│   ├── Artículos
│   ├── Inventario
│   └── Ensamblaje
│
├── Compras
│   ├── Proveedores
│   ├── Facturas
│   └── Listas de precios
│
├── Análisis
│   ├── Dashboard
│   ├── Ventas
│   ├── Inventario
│   ├── Proveedores
│   └── Rentabilidad
│
├── Administración
│   ├── Usuarios
│   ├── Roles
│   ├── Permisos
│   └── Auditoría
│
└── Configuración
    ├── Interfaz
    ├── Variables globales
    ├── Calendario
    └── Integraciones
```

## Pantallas mínimas para la primera versión armable

1. Login básico.
2. Layout principal.
3. Menú lateral.
4. Dashboard vacío.
5. Listado de artículos.
6. Nuevo artículo.
7. Stock actual.
8. Listado de proveedores.
9. Nueva factura.
10. Nueva venta.
11. Caja activa.
12. Listado de ensamblajes.
13. Seguridad básica.
14. Calendario básico.

## Base de datos inicial armable

Tablas mínimas:

```text
usuarios
roles
permisos
sucursales
familias
subfamilias
marcas
articulos
articulo_precios
inventario_stock
inventario_movimientos
proveedores
proveedor_productos_asociados
facturas
factura_detalles
factura_diferencias
ventas
venta_detalles
venta_pagos
cajas
caja_aperturas
caja_cierres
caja_movimientos
ensamblajes
ensamblaje_componentes
ensamblaje_movimientos
calendario_fechas
```

## Modelo de datos inicial resumido

### Artículo

```text
articulo
├── id
├── codigo_producto
├── codigo_inventario
├── codigo_barra
├── nombre
├── familia_id
├── subfamilia_id
├── marca_id
├── unidad_medida
├── cantidad_especifica
├── tipo_impuesto
├── impuesto_adicional
├── stock_minimo
├── stock_maximo
├── comentario
├── estado
├── created_at
└── updated_at
```

### Precio de artículo

```text
articulo_precio
├── id
├── articulo_id
├── precio_con_iva
├── precio_sin_iva
├── margen
├── precio_publico
├── precio_mayorista
├── cantidad_minima_mayorista
├── vigente
├── created_at
└── updated_at
```

### Inventario

```text
inventario_stock
├── id
├── articulo_id
├── sucursal_id
├── stock_actual
├── stock_minimo
├── stock_maximo
├── updated_at
```

### Movimiento de inventario

```text
inventario_movimiento
├── id
├── articulo_id
├── sucursal_id
├── tipo_movimiento
├── cantidad
├── documento_origen_tipo
├── documento_origen_id
├── observacion
├── created_at
└── usuario_id
```

### Proveedor

```text
proveedor
├── id
├── codigo
├── rut_ruc
├── razon_social
├── nombre_comercial
├── direccion
├── contacto
├── telefono
├── correo
├── condiciones_comerciales
├── estado
├── created_at
└── updated_at
```

### Factura

```text
factura
├── id
├── numero_factura
├── proveedor_id
├── fecha_emision
├── fecha_recepcion
├── estado
├── observacion
├── created_at
└── updated_at
```

### Venta

```text
venta
├── id
├── id_temporal
├── folio_definitivo
├── vendedor_id
├── cliente_id
├── sucursal_id
├── caja_id
├── total
├── total_pagado
├── saldo_pendiente
├── vuelto
├── estado
├── created_at
└── finalized_at
```

### Caja

```text
caja
├── id
├── sucursal_id
├── usuario_id
├── estado
├── fecha_apertura
├── fecha_cierre
├── monto_inicial
├── efectivo_contado
├── observacion
└── created_at
```

### Ensamblaje

```text
ensamblaje
├── id
├── producto_final_id
├── nombre
├── estado
├── costo_estimado
├── observacion
├── created_at
└── updated_at
```

## Contratos iniciales entre módulos

### Venta -> Inventario

```text
Solicitud:
validarDisponibilidad(articulo_id, sucursal_id, cantidad)

Respuesta:
{
  disponible: true | false,
  stock_actual: number,
  mensaje: string
}
```

### Facturas -> Proveedores

```text
Solicitud:
buscarProveedor(valor)

Respuesta:
{
  proveedor_id,
  rut_ruc,
  razon_social,
  direccion,
  contacto,
  condiciones_comerciales
}
```

### Facturas -> Artículos

```text
Solicitud:
buscarAsociacionProductoProveedor(proveedor_id, codigo_producto_proveedor)

Respuesta:
{
  asociado: true | false,
  articulo_id,
  nombre_articulo,
  estado
}
```

### Ensamblaje -> Inventario

```text
Solicitud:
calcularDisponibilidad(componentes, sucursal_id)

Respuesta:
{
  maximo_posible,
  componente_limitante,
  componentes: [
    {
      articulo_id,
      stock_actual,
      requerido,
      estado
    }
  ]
}
```

### Caja -> Venta

```text
Solicitud:
obtenerVentasTurno(caja_id)

Respuesta:
{
  ventas,
  total_visible_segun_permiso,
  pagos_por_metodo
}
```

### Análisis -> Todos

```text
Solicitud:
obtenerDatosPeriodo(fecha_inicio, fecha_fin, sucursal_id)

Respuesta:
{
  ventas,
  inventario,
  compras,
  caja,
  ensamblajes,
  calendario
}
```

## Servicios iniciales y funciones

### ArticuloService

```text
crearArticulo(datos)
actualizarArticulo(id, datos)
listarArticulos(filtros)
obtenerArticulo(id)
calcularPrecio(datos)
generarCodigoBarra()
```

### InventarioService

```text
consultarStock(articulo_id, sucursal_id)
registrarMovimiento(datos)
registrarEntrada(datos)
registrarSalida(datos)
validarDisponibilidad(datos)
```

### ProveedorService

```text
crearProveedor(datos)
actualizarProveedor(id, datos)
listarProveedores(filtros)
obtenerProveedor(id)
asociarProducto(datos)
```

### FacturaService

```text
crearFactura(datos)
agregarDetalle(factura_id, detalle)
calcularDiferencia(detalle)
procesarFactura(factura_id)
```

### VentaService

```text
crearVentaTemporal(datos)
agregarProducto(venta_id, producto)
agregarPago(venta_id, pago)
calcularTotales(venta_id)
finalizarVenta(venta_id)
anularVenta(venta_id, motivo)
```

### CajaService

```text
abrirCaja(datos)
cerrarCaja(datos)
obtenerCajaActiva(usuario_id)
registrarIngreso(datos)
registrarRetiro(datos)
```

### EnsamblajeService

```text
crearEnsamblaje(datos)
calcularDisponibilidad(id, cantidad)
ejecutarEnsamblaje(id, cantidad)
desarmarEnsamblaje(id, cantidad, motivo)
```

## Orden de implementación recomendado

### Fase A - Base técnica

1. Crear proyecto.
2. Configurar TypeScript.
3. Configurar Tailwind.
4. Configurar Prisma.
5. Configurar PostgreSQL.
6. Crear layout principal.
7. Crear menú lateral.
8. Crear rutas base.

### Fase B - Seguridad mínima

1. Crear tabla usuarios.
2. Crear tabla roles.
3. Crear tabla permisos.
4. Crear login básico.
5. Crear validación de sesión.
6. Crear middleware de permisos.

### Fase C - Datos maestros

1. Crear familias.
2. Crear subfamilias.
3. Crear marcas.
4. Crear artículos.
5. Crear precios de artículos.
6. Crear sucursales.

### Fase D - Inventario base

1. Crear stock por artículo.
2. Crear movimientos.
3. Crear entrada.
4. Crear salida.
5. Crear ajuste.
6. Crear alerta de stock bajo.

### Fase E - Proveedores y facturas

1. Crear proveedores.
2. Crear asociación producto proveedor.
3. Crear factura.
4. Crear detalle de factura.
5. Crear diferencia de factura.
6. Integrar factura con inventario.

### Fase F - Venta y caja

1. Crear venta temporal.
2. Agregar productos.
3. Agregar pagos.
4. Calcular saldo/vuelto.
5. Finalizar venta.
6. Integrar con caja.
7. Integrar con inventario.

### Fase G - Ensamblaje

1. Crear producto ensamblado.
2. Agregar componentes.
3. Calcular costo.
4. Calcular disponibilidad.
5. Ejecutar ensamblaje.
6. Desarmar ensamblaje.

### Fase H - Análisis

1. Dashboard base.
2. Ventas por período.
3. Inventario crítico.
4. Comparación proveedores.
5. Rentabilidad.
6. Comparación con calendario.

## Criterio para considerar lista esta fase

La fase Aplicación Armable está lista cuando el proyecto tenga:

1. Pantalla inicial.
2. Menú principal.
3. Módulos en rutas separadas.
4. Pantallas base por módulo.
5. Servicios creados.
6. Modelos iniciales.
7. Base de datos conectada.
8. Documentación dentro del repositorio.
9. Módulos sin lógica mezclada.
10. Contratos de integración definidos.

## Decisiones pendientes antes de programación fuerte

| Área | Decisión pendiente |
|---|---|
| Tecnología final | Next.js completo o frontend/backend separados |
| Base de datos | PostgreSQL local, nube o ambas |
| Seguridad | Roles iniciales |
| Venta | Permitir o no saldo pendiente |
| Caja | Tipos de ingresos/retiros |
| Facturas | Estados finales |
| Inventario | Tipos oficiales de movimiento |
| Ensamblaje | Automático en venta o solo manual |
| Análisis | KPIs principales |
| Calendario | Feriados manuales o automáticos |

## Definición corta

La fase **Aplicación Armable** convierte los blueprints de Sagva System en una estructura técnica inicial con rutas, carpetas, servicios, modelos, pantallas base, contratos de integración y base de datos mínima para comenzar el desarrollo modular.
