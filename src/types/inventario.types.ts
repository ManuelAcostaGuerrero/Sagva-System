export type MovimientoInventarioInput = {
  articuloId: string;
  sucursalId: string;
  tipoMovimiento: string;
  cantidad: number;
  documentoOrigenTipo?: string;
  documentoOrigenId?: string;
  observacion?: string;
  usuarioId?: string;
};

export type DisponibilidadResult = {
  disponible: boolean;
  stockActual: number;
  mensaje: string;
};
