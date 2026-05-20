export type ID = string;
export type ISODateString = string;

export type EstadoVenta =
  | "ABIERTA"
  | "PENDIENTE"
  | "COBRADA"
  | "ANULADA"
  | "CANCELADA";

export type EstadoPago = "REGISTRADO" | "ANULADO" | "REEMBOLSADO";

export type MetodoPago =
  | "EFECTIVO"
  | "DEBITO"
  | "CREDITO"
  | "TRANSFERENCIA"
  | "MIXTO"
  | "OTRO";

export type TipoDocumentoVenta =
  | "TICKET"
  | "BOLETA"
  | "FACTURA"
  | "PRESTAMO"
  | "NOTA_CREDITO";

export type TipoMovimientoCajaVenta =
  | "VENTA"
  | "ANULACION"
  | "PRESTAMO_GARANTIA"
  | "PRESTAMO_DEVOLUCION";

export type TipoMovimientoStockVenta = "SALIDA_VENTA" | "ENTRADA_ANULACION";

export interface AuditoriaBase {
  creadoPor: ID;
  fechaCreacion: ISODateString;
  actualizadoPor?: ID | null;
  fechaActualizacion?: ISODateString | null;
}

export interface Venta extends AuditoriaBase {
  id: ID;
  ventaTemporalId: string;
  numeroDocumento?: number | null;
  tipoDocumento: TipoDocumentoVenta;
  clienteId?: ID | null;
  usuarioVendedorId: ID;
  cajeroId: ID;
  sucursalId: ID;
  cajaId: ID;
  cajaTurnoId: ID;
  fechaInicio: ISODateString;
  fechaFinalizacion?: ISODateString | null;
  estado: EstadoVenta;
  subtotal: number;
  descuentoTotal: number;
  impuestoTotal: number;
  total: number;
  totalPagado: number;
  saldoPendiente: number;
  vuelto: number;
  observacion?: string | null;
}

export interface VentaDetalle {
  id: ID;
  ventaId: ID;
  articuloId: ID;
  codigoProducto: string;
  nombreArticulo: string;
  cantidad: number;
  precioUnitario: number;
  descuentoLinea: number;
  impuestoPorcentaje: number;
  impuestoMonto: number;
  subtotalLinea: number;
  totalLinea: number;
  controlaStock: boolean;
  unidadMedidaId?: ID | null;
  creadoPor: ID;
  fechaCreacion: ISODateString;
}

export interface PagoVenta {
  id: ID;
  ventaId: ID;
  metodoPago: MetodoPago;
  monto: number;
  referencia?: string | null;
  estado: EstadoPago;
  usuarioRegistra: ID;
  fechaPago: ISODateString;
}

export interface ArticuloVentaSnapshot {
  articuloId: ID;
  codigoProducto: string;
  nombreArticulo: string;
  precioPublico: number;
  impuestoPorcentaje: number;
  controlaStock: boolean;
  stockDisponible?: number | null;
  unidadMedidaId?: ID | null;
}

export interface MovimientoCajaVenta {
  id: ID;
  cajaId: ID;
  cajaTurnoId: ID;
  sucursalId: ID;
  usuarioId: ID;
  tipoMovimiento: TipoMovimientoCajaVenta;
  documentoOrigenId: ID;
  tipoDocumentoOrigen: TipoDocumentoVenta;
  monto: number;
  fecha: ISODateString;
  observacion?: string | null;
  estado: "ACTIVO" | "ANULADO";
}

export interface MovimientoStockVenta {
  id: ID;
  articuloId: ID;
  sucursalId: ID;
  tipoMovimiento: TipoMovimientoStockVenta;
  documentoOrigenId: ID;
  tipoDocumentoOrigen: TipoDocumentoVenta;
  cantidad: number;
  fecha: ISODateString;
  usuarioId: ID;
  observacion?: string | null;
}

export interface CrearVentaInput {
  clienteId?: ID | null;
  usuarioVendedorId: ID;
  cajeroId: ID;
  sucursalId: ID;
  cajaId: ID;
  cajaTurnoId: ID;
  observacion?: string | null;
}

export interface AgregarArticuloInput {
  ventaId: ID;
  articulo: ArticuloVentaSnapshot;
  cantidad: number;
  descuentoLinea?: number;
  usuarioId: ID;
}

export interface AgregarPagoInput {
  ventaId: ID;
  metodoPago: MetodoPago;
  monto: number;
  referencia?: string | null;
  usuarioId: ID;
}

export interface FinalizarVentaInput {
  ventaId: ID;
  usuarioId: ID;
  permiteVentaConSaldo: boolean;
}

export interface AnularVentaInput {
  ventaId: ID;
  usuarioAnulaId: ID;
  usuarioAutorizaId?: ID | null;
  motivo: string;
}

export interface VentasRepository {
  crearVenta(data: Venta): Promise<Venta>;
  obtenerVenta(ventaId: ID): Promise<Venta | null>;
  actualizarVenta(ventaId: ID, data: Partial<Venta>): Promise<Venta>;
  agregarDetalle(data: VentaDetalle): Promise<VentaDetalle>;
  obtenerDetalles(ventaId: ID): Promise<VentaDetalle[]>;
  eliminarDetalle(ventaDetalleId: ID): Promise<void>;
  agregarPago(data: PagoVenta): Promise<PagoVenta>;
  obtenerPagos(ventaId: ID): Promise<PagoVenta[]>;
  anularPago(pagoId: ID, usuarioId: ID): Promise<void>;
  obtenerSiguienteNumeroDocumento(tipoDocumento: TipoDocumentoVenta, sucursalId: ID): Promise<number>;
  registrarMovimientoCaja(data: MovimientoCajaVenta): Promise<MovimientoCajaVenta>;
  registrarMovimientoStock(data: MovimientoStockVenta): Promise<MovimientoStockVenta>;
  descontarStock(articuloId: ID, sucursalId: ID, cantidad: number): Promise<void>;
  devolverStock(articuloId: ID, sucursalId: ID, cantidad: number): Promise<void>;
}
