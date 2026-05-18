import type { EstadoGeneral } from "./global.types";

export type ProveedorInput = {
  codigo: string;
  rutRuc: string;
  razonSocial: string;
  nombreComercial?: string;
  direccion?: string;
  contacto?: string;
  telefono?: string;
  correo?: string;
  condicionesComerciales?: string;
  estado?: EstadoGeneral;
};
