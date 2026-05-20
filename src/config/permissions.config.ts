export const initialRoles = [
  { code: "admin", name: "Administrador", description: "Acceso completo para configuracion, operacion, auditoria y seguridad." },
  { code: "encargado", name: "Encargado", description: "Gestiona operacion diaria, ventas, caja, inventario y autorizaciones limitadas." },
  { code: "vendedor", name: "Vendedor", description: "Opera ventas, consulta productos y registra pagos segun permisos." },
  { code: "bodega", name: "Bodega", description: "Gestiona inventario, movimientos de stock y apoyo operativo." },
  { code: "produccion", name: "Produccion", description: "Opera ensamblaje, recetas, consumos y solicitudes internas." },
  { code: "contabilidad", name: "Contabilidad", description: "Consulta facturas, impuestos, reportes y documentos comerciales." }
] as const;

export const securityModules = [
  "dashboard",
  "articulos",
  "inventario",
  "proveedores",
  "facturas",
  "venta",
  "caja",
  "ensamblaje",
  "analisis",
  "seguridad",
  "calendario",
  "configuracion"
] as const;

export const permissionActions = ["ver", "crear", "editar", "eliminar", "anular", "exportar", "autorizar"] as const;

export const protectedFields = [
  "precio_costo",
  "margen_ganancia",
  "utilidad",
  "cierre_caja",
  "efectivo_esperado",
  "diferencia_caja",
  "ventas_turno",
  "total_movimientos_caja",
  "costo_ensamblaje"
] as const;

export const criticalActions = [
  "articulos.precio_costo",
  "articulos.margen_ganancia",
  "inventario.ajuste_manual",
  "venta.anulacion",
  "venta.descuento_especial",
  "facturas.anulacion",
  "caja.diferencia",
  "caja.correccion",
  "caja.ver_totales_turno",
  "ensamblaje.merma",
  "ensamblaje.receta_base",
  "seguridad.permisos"
] as const;

export const basePermissions = [
  { role: "admin", modulo: "seguridad", accion: "autorizar", campo: null, permitido: true },
  { role: "admin", modulo: "seguridad", accion: "editar", campo: null, permitido: true },
  { role: "encargado", modulo: "dashboard", accion: "ver", campo: null, permitido: true },
  { role: "encargado", modulo: "venta", accion: "ver", campo: null, permitido: true },
  { role: "encargado", modulo: "caja", accion: "autorizar", campo: "diferencia_caja", permitido: true },
  { role: "encargado", modulo: "caja", accion: "ver", campo: "ventas_turno", permitido: true },
  { role: "vendedor", modulo: "venta", accion: "crear", campo: null, permitido: true },
  { role: "vendedor", modulo: "articulos", accion: "ver", campo: "precio_publico", permitido: true },
  { role: "vendedor", modulo: "articulos", accion: "ver", campo: "precio_costo", permitido: false },
  { role: "vendedor", modulo: "caja", accion: "ver", campo: "efectivo_esperado", permitido: false },
  { role: "vendedor", modulo: "caja", accion: "ver", campo: "diferencia_caja", permitido: false },
  { role: "bodega", modulo: "inventario", accion: "crear", campo: null, permitido: true },
  { role: "produccion", modulo: "ensamblaje", accion: "crear", campo: null, permitido: true },
  { role: "produccion", modulo: "ensamblaje", accion: "autorizar", campo: "merma", permitido: false },
  { role: "contabilidad", modulo: "facturas", accion: "ver", campo: null, permitido: true },
  { role: "contabilidad", modulo: "analisis", accion: "exportar", campo: null, permitido: true }
] as const;
