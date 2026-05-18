import type { EstadoGeneral, TipoImpuesto } from "./global.types";

export type ArticuloInput = {
  codigoProducto: string;
  codigoInventario?: string;
  codigoBarra?: string;
  nombre: string;
  familiaId?: string;
  subfamiliaId?: string;
  marcaId?: string;
  unidadMedida: string;
  cantidadEspecifica?: string;
  tipoImpuesto: TipoImpuesto;
  impuestoAdicional?: number;
  stockMinimo?: number;
  stockMaximo?: number;
  comentario?: string;
  estado?: EstadoGeneral;
};

export type PrecioArticuloInput = {
  articuloId: string;
  precioConIva?: number;
  precioSinIva?: number;
  margen?: number;
  precioPublico?: number;
  precioMayorista?: number;
  cantidadMinimaMayorista?: number;
};
