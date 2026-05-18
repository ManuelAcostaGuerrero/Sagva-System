export type CajaAperturaInput = {
  usuarioId: string;
  sucursalId: string;
  montoInicial: number;
  observacion?: string;
};

export type CajaCierreInput = {
  cajaId: string;
  efectivoContado: number;
  observacion?: string;
};
