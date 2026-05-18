export const routesConfig = {
  auth: {
    login: "/login"
  },
  dashboard: "/dashboard",
  articulos: {
    index: "/articulos",
    nuevo: "/articulos/nuevo"
  },
  inventario: {
    index: "/inventario",
    movimientos: "/inventario/movimientos",
    ajustes: "/inventario/ajustes",
    alertas: "/inventario/alertas"
  },
  proveedores: {
    index: "/proveedores",
    nuevo: "/proveedores/nuevo"
  },
  facturas: {
    index: "/facturas",
    nueva: "/facturas/nueva"
  },
  venta: {
    nueva: "/venta/nueva",
    abiertas: "/venta/abiertas",
    anulaciones: "/venta/anulaciones",
    prestamos: "/venta/prestamos"
  },
  caja: {
    index: "/caja",
    activa: "/caja/activa",
    historial: "/caja/historial",
    correcciones: "/caja/correcciones"
  },
  ensamblaje: {
    index: "/ensamblaje",
    nuevo: "/ensamblaje/nuevo",
    historial: "/ensamblaje/historial"
  },
  analisis: {
    index: "/analisis",
    ventas: "/analisis/ventas",
    inventario: "/analisis/inventario",
    proveedores: "/analisis/proveedores",
    rentabilidad: "/analisis/rentabilidad",
    proyecciones: "/analisis/proyecciones"
  },
  seguridad: {
    usuarios: "/seguridad/usuarios",
    roles: "/seguridad/roles",
    permisos: "/seguridad/permisos",
    auditoria: "/seguridad/auditoria",
    autorizaciones: "/seguridad/autorizaciones"
  },
  calendario: {
    index: "/calendario",
    nuevaFecha: "/calendario/nueva-fecha",
    feriados: "/calendario/feriados",
    impacto: "/calendario/impacto"
  },
  configuracion: {
    interfaz: "/configuracion/interfaz"
  }
} as const;
