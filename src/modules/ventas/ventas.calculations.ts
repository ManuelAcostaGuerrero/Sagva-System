import type { PagoVenta, VentaDetalle } from "./ventas.types";

export function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function assertPositiveAmount(value: number, fieldName: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${fieldName} debe ser mayor a 0.`);
  }
}

export function calcularLinea(params: {
  cantidad: number;
  precioUnitario: number;
  descuentoLinea: number;
  impuestoPorcentaje: number;
}) {
  assertPositiveAmount(params.cantidad, "cantidad");
  assertPositiveAmount(params.precioUnitario, "precioUnitario");

  if (params.descuentoLinea < 0) {
    throw new Error("El descuento de línea no puede ser negativo.");
  }

  if (params.impuestoPorcentaje < 0) {
    throw new Error("El impuesto no puede ser negativo.");
  }

  const subtotalBruto = params.cantidad * params.precioUnitario;
  const subtotalConDescuento = subtotalBruto - params.descuentoLinea;

  if (subtotalConDescuento < 0) {
    throw new Error("El descuento de línea no puede ser mayor al subtotal de la línea.");
  }

  const impuestoMonto = subtotalConDescuento * (params.impuestoPorcentaje / 100);
  const totalLinea = subtotalConDescuento + impuestoMonto;

  return {
    subtotalLinea: roundMoney(subtotalConDescuento),
    impuestoMonto: roundMoney(impuestoMonto),
    totalLinea: roundMoney(totalLinea),
  };
}

export function calcularTotales(detalles: VentaDetalle[], pagos: PagoVenta[]) {
  const subtotal = roundMoney(detalles.reduce((sum, item) => sum + item.subtotalLinea, 0));
  const descuentoTotal = roundMoney(detalles.reduce((sum, item) => sum + item.descuentoLinea, 0));
  const impuestoTotal = roundMoney(detalles.reduce((sum, item) => sum + item.impuestoMonto, 0));
  const total = roundMoney(detalles.reduce((sum, item) => sum + item.totalLinea, 0));

  const totalPagado = roundMoney(
    pagos
      .filter((pago) => pago.estado === "REGISTRADO")
      .reduce((sum, pago) => sum + pago.monto, 0),
  );

  const saldoPendiente = roundMoney(Math.max(total - totalPagado, 0));
  const vuelto = roundMoney(Math.max(totalPagado - total, 0));

  return {
    subtotal,
    descuentoTotal,
    impuestoTotal,
    total,
    totalPagado,
    saldoPendiente,
    vuelto,
  };
}
