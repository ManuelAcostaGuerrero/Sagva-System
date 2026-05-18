export type EstadoGeneral = "activo" | "inactivo" | "pendiente" | "anulado" | "cerrado";

export type MetodoPago = "efectivo" | "debito" | "credito" | "transferencia" | "mixto";

export type TipoImpuesto = "IVA" | "exento" | "impuesto_adicional";

export type BaseEntity = {
  id: string;
  createdAt: Date;
  updatedAt?: Date;
};
