export type EnsamblajeComponenteInput = {
  componenteId: string;
  cantidadRequerida: number;
  costoComponente?: number;
};

export type EnsamblajeInput = {
  productoFinalId: string;
  nombre: string;
  componentes: EnsamblajeComponenteInput[];
  observacion?: string;
};
