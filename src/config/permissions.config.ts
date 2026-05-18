export const initialRoles = [
  {
    code: "admin",
    name: "Administrador",
    description: "Acceso completo para configuración, operación y auditoría."
  },
  {
    code: "supervisor",
    name: "Supervisor",
    description: "Gestiona operación diaria y revisa cierres, ventas e inventario."
  },
  {
    code: "cajero",
    name: "Cajero",
    description: "Opera ventas, pagos y caja según permisos visibles."
  }
] as const;

export const criticalActions = [
  "venta.anular",
  "caja.cerrar",
  "caja.corregir",
  "inventario.ajustar",
  "articulos.editar_precio",
  "facturas.procesar",
  "seguridad.asignar_permiso"
] as const;
