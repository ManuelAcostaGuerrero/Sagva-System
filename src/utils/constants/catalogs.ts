export const estadosGenerales = ["activo", "inactivo", "pendiente", "anulado", "cerrado"] as const;

export const tiposImpuesto = ["IVA", "exento", "impuesto_adicional"] as const;

export const metodosPago = ["efectivo", "debito", "credito", "transferencia", "mixto"] as const;

export const tiposFecha = ["feriado_irrenunciable", "feriado_laboral", "dia_conmemorativo"] as const;

export const tiposMovimientoInventario = [
  "entrada",
  "salida",
  "ajuste",
  "venta",
  "factura",
  "ensamblaje",
  "desarme"
] as const;
