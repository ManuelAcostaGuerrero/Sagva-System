export type FacturaInput = {
  numeroFactura: string;
  proveedorId: string;
  fechaEmision: Date;
  fechaRecepcion: Date;
  observacion?: string;
};

export type FacturaDetalleInput = {
  productoFacturado: string;
  codigoProductoProveedor?: string;
  articuloId?: string;
  cantidad: number;
  precioAcordado?: number;
  precioFacturado: number;
  impuesto?: string;
};
