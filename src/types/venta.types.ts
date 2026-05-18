import type { MetodoPago } from "./global.types";

export type VentaProductoInput = {
  articuloId: string;
  cantidad: number;
  precioUnitario: number;
};

export type VentaPagoInput = {
  metodoPago: MetodoPago;
  monto: number;
  referencia?: string;
};
