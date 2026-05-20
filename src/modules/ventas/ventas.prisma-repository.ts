import { prisma } from "@/lib/prisma";
import type {
  EstadoVenta,
  ID,
  MovimientoCajaVenta,
  MovimientoStockVenta,
  PagoVenta,
  TipoDocumentoVenta,
  Venta,
  VentaDetalle,
  VentasRepository,
} from "./ventas.types";

function toNumber(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value);
  if (value && typeof value === "object" && "toString" in value) {
    return Number(value.toString());
  }
  return 0;
}

function toDateString(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  return value instanceof Date ? value.toISOString() : value;
}

function estadoVentaToDb(estado: EstadoVenta): string {
  const map: Record<EstadoVenta, string> = {
    ABIERTA: "abierta",
    PENDIENTE: "pendiente",
    COBRADA: "cobrada",
    ANULADA: "anulada",
    CANCELADA: "cancelada",
  };

  return map[estado];
}

function estadoVentaFromDb(estado: string): EstadoVenta {
  const normalized = estado.toLowerCase();

  const map: Record<string, EstadoVenta> = {
    abierta: "ABIERTA",
    pendiente: "PENDIENTE",
    cobrada: "COBRADA",
    anulada: "ANULADA",
    cancelada: "CANCELADA",
  };

  return map[normalized] ?? "ABIERTA";
}

function tipoDocumentoToFolioPrefix(tipoDocumento: TipoDocumentoVenta): string {
  const map: Record<TipoDocumentoVenta, string> = {
    TICKET: "T",
    BOLETA: "B",
    FACTURA: "F",
    PRESTAMO: "P",
    NOTA_CREDITO: "NC",
  };

  return map[tipoDocumento];
}

type PrismaVentaWithRelations = Awaited<ReturnType<typeof prisma.venta.findFirst>> & {
  detalles?: Array<{
    id: string;
    ventaId: string;
    articuloId: string;
    cantidad: unknown;
    precioUnitario: unknown;
    totalLinea: unknown;
    createdAt: Date;
    articulo?: {
      codigoProducto: string;
      nombre: string;
      unidadMedida: string;
      tipoImpuesto: string;
    } | null;
  }>;
  pagos?: Array<{
    id: string;
    ventaId: string;
    metodoPago: string;
    monto: unknown;
    referencia: string | null;
    createdAt: Date;
  }>;
};

function mapVentaFromDb(row: NonNullable<PrismaVentaWithRelations>): Venta {
  return {
    id: row.id,
    ventaTemporalId: row.idTemporal,
    numeroDocumento: row.folioDefinitivo ? Number(row.folioDefinitivo.replace(/\D/g, "")) : null,
    tipoDocumento: "BOLETA",
    clienteId: row.clienteId,
    usuarioVendedorId: row.vendedorId,
    cajeroId: row.vendedorId,
    sucursalId: row.sucursalId,
    cajaId: row.cajaId ?? "",
    cajaTurnoId: row.cajaId ?? "",
    fechaInicio: row.createdAt.toISOString(),
    fechaFinalizacion: toDateString(row.finalizedAt),
    estado: estadoVentaFromDb(row.estado),
    subtotal: toNumber(row.total),
    descuentoTotal: 0,
    impuestoTotal: 0,
    total: toNumber(row.total),
    totalPagado: toNumber(row.totalPagado),
    saldoPendiente: toNumber(row.saldoPendiente),
    vuelto: toNumber(row.vuelto),
    observacion: null,
    creadoPor: row.vendedorId,
    fechaCreacion: row.createdAt.toISOString(),
    actualizadoPor: null,
    fechaActualizacion: null,
  };
}

function mapDetalleFromDb(row: {
  id: string;
  ventaId: string;
  articuloId: string;
  cantidad: unknown;
  precioUnitario: unknown;
  totalLinea: unknown;
  createdAt: Date;
  articulo?: {
    codigoProducto: string;
    nombre: string;
    unidadMedida: string;
    tipoImpuesto: string;
  } | null;
}): VentaDetalle {
  const totalLinea = toNumber(row.totalLinea);

  return {
    id: row.id,
    ventaId: row.ventaId,
    articuloId: row.articuloId,
    codigoProducto: row.articulo?.codigoProducto ?? row.articuloId,
    nombreArticulo: row.articulo?.nombre ?? "Artículo",
    cantidad: toNumber(row.cantidad),
    precioUnitario: toNumber(row.precioUnitario),
    descuentoLinea: 0,
    impuestoPorcentaje: row.articulo?.tipoImpuesto === "EXENTO" ? 0 : 19,
    impuestoMonto: 0,
    subtotalLinea: totalLinea,
    totalLinea,
    controlaStock: true,
    unidadMedidaId: null,
    creadoPor: "sistema",
    fechaCreacion: row.createdAt.toISOString(),
  };
}

function mapPagoFromDb(row: {
  id: string;
  ventaId: string;
  metodoPago: string;
  monto: unknown;
  referencia: string | null;
  createdAt: Date;
}): PagoVenta {
  return {
    id: row.id,
    ventaId: row.ventaId,
    metodoPago: row.metodoPago.toUpperCase() as PagoVenta["metodoPago"],
    monto: toNumber(row.monto),
    referencia: row.referencia,
    estado: "REGISTRADO",
    usuarioRegistra: "sistema",
    fechaPago: row.createdAt.toISOString(),
  };
}

export class VentasPrismaRepository implements VentasRepository {
  async crearVenta(data: Venta): Promise<Venta> {
    const created = await prisma.venta.create({
      data: {
        id: data.id,
        idTemporal: data.ventaTemporalId,
        folioDefinitivo: data.numeroDocumento ? String(data.numeroDocumento) : null,
        vendedorId: data.usuarioVendedorId,
        clienteId: data.clienteId ?? null,
        sucursalId: data.sucursalId,
        cajaId: data.cajaId || null,
        total: data.total,
        totalPagado: data.totalPagado,
        saldoPendiente: data.saldoPendiente,
        vuelto: data.vuelto,
        estado: estadoVentaToDb(data.estado),
        finalizedAt: data.fechaFinalizacion ? new Date(data.fechaFinalizacion) : null,
      },
    });

    return mapVentaFromDb(created);
  }

  async obtenerVenta(ventaId: ID): Promise<Venta | null> {
    const venta = await prisma.venta.findUnique({
      where: { id: ventaId },
    });

    return venta ? mapVentaFromDb(venta) : null;
  }

  async actualizarVenta(ventaId: ID, data: Partial<Venta>): Promise<Venta> {
    const updated = await prisma.venta.update({
      where: { id: ventaId },
      data: {
        ...(data.numeroDocumento !== undefined
          ? { folioDefinitivo: data.numeroDocumento == null ? null : String(data.numeroDocumento) }
          : {}),
        ...(data.estado ? { estado: estadoVentaToDb(data.estado) } : {}),
        ...(data.total !== undefined ? { total: data.total } : {}),
        ...(data.totalPagado !== undefined ? { totalPagado: data.totalPagado } : {}),
        ...(data.saldoPendiente !== undefined ? { saldoPendiente: data.saldoPendiente } : {}),
        ...(data.vuelto !== undefined ? { vuelto: data.vuelto } : {}),
        ...(data.fechaFinalizacion !== undefined
          ? { finalizedAt: data.fechaFinalizacion ? new Date(data.fechaFinalizacion) : null }
          : {}),
      },
    });

    return mapVentaFromDb(updated);
  }

  async agregarDetalle(data: VentaDetalle): Promise<VentaDetalle> {
    const created = await prisma.ventaDetalle.create({
      data: {
        id: data.id,
        ventaId: data.ventaId,
        articuloId: data.articuloId,
        cantidad: data.cantidad,
        precioUnitario: data.precioUnitario,
        totalLinea: data.totalLinea,
      },
      include: {
        articulo: true,
      },
    });

    return mapDetalleFromDb(created);
  }

  async obtenerDetalles(ventaId: ID): Promise<VentaDetalle[]> {
    const detalles = await prisma.ventaDetalle.findMany({
      where: { ventaId },
      include: {
        articulo: true,
      },
      orderBy: { createdAt: "asc" },
    });

    return detalles.map(mapDetalleFromDb);
  }

  async eliminarDetalle(ventaDetalleId: ID): Promise<void> {
    await prisma.ventaDetalle.delete({
      where: { id: ventaDetalleId },
    });
  }

  async agregarPago(data: PagoVenta): Promise<PagoVenta> {
    const created = await prisma.ventaPago.create({
      data: {
        id: data.id,
        ventaId: data.ventaId,
        metodoPago: data.metodoPago.toLowerCase(),
        monto: data.monto,
        referencia: data.referencia ?? null,
      },
    });

    return mapPagoFromDb(created);
  }

  async obtenerPagos(ventaId: ID): Promise<PagoVenta[]> {
    const pagos = await prisma.ventaPago.findMany({
      where: { ventaId },
      orderBy: { createdAt: "asc" },
    });

    return pagos.map(mapPagoFromDb);
  }

  async anularPago(pagoId: ID): Promise<void> {
    await prisma.ventaPago.delete({
      where: { id: pagoId },
    });
  }

  async obtenerSiguienteNumeroDocumento(
    tipoDocumento: TipoDocumentoVenta,
    sucursalId: ID,
  ): Promise<number> {
    const prefix = tipoDocumentoToFolioPrefix(tipoDocumento);
    const ventas = await prisma.venta.findMany({
      where: {
        sucursalId,
        folioDefinitivo: {
          startsWith: prefix,
        },
      },
      select: {
        folioDefinitivo: true,
      },
    });

    const max = ventas.reduce((currentMax, venta) => {
      const value = venta.folioDefinitivo ? Number(venta.folioDefinitivo.replace(/\D/g, "")) : 0;
      return Number.isFinite(value) && value > currentMax ? value : currentMax;
    }, 0);

    return max + 1;
  }

  async registrarMovimientoCaja(data: MovimientoCajaVenta): Promise<MovimientoCajaVenta> {
    const created = await prisma.cajaMovimiento.create({
      data: {
        id: data.id,
        cajaId: data.cajaId,
        tipo: data.tipoMovimiento.toLowerCase(),
        monto: data.monto,
        concepto: `${data.tipoDocumentoOrigen}:${data.documentoOrigenId}`,
        observacion: data.observacion ?? null,
      },
    });

    return {
      ...data,
      id: created.id,
      fecha: created.createdAt.toISOString(),
    };
  }

  async registrarMovimientoStock(data: MovimientoStockVenta): Promise<MovimientoStockVenta> {
    const created = await prisma.inventarioMovimiento.create({
      data: {
        id: data.id,
        articuloId: data.articuloId,
        sucursalId: data.sucursalId,
        tipoMovimiento: data.tipoMovimiento.toLowerCase(),
        cantidad: data.cantidad,
        documentoOrigenTipo: data.tipoDocumentoOrigen,
        documentoOrigenId: data.documentoOrigenId,
        usuarioId: data.usuarioId,
        observacion: data.observacion ?? null,
      },
    });

    return {
      ...data,
      id: created.id,
      fecha: created.createdAt.toISOString(),
    };
  }

  async descontarStock(articuloId: ID, sucursalId: ID, cantidad: number): Promise<void> {
    const stock = await prisma.inventarioStock.findUnique({
      where: {
        articuloId_sucursalId: {
          articuloId,
          sucursalId,
        },
      },
    });

    if (!stock) {
      throw new Error("No existe stock para este artículo en la sucursal indicada.");
    }

    const stockActual = toNumber(stock.stockActual);
    if (stockActual < cantidad) {
      throw new Error("Stock insuficiente para finalizar la venta.");
    }

    await prisma.inventarioStock.update({
      where: { id: stock.id },
      data: {
        stockActual: stockActual - cantidad,
      },
    });
  }

  async devolverStock(articuloId: ID, sucursalId: ID, cantidad: number): Promise<void> {
    await prisma.inventarioStock.upsert({
      where: {
        articuloId_sucursalId: {
          articuloId,
          sucursalId,
        },
      },
      update: {
        stockActual: {
          increment: cantidad,
        },
      },
      create: {
        articuloId,
        sucursalId,
        stockActual: cantidad,
      },
    });
  }
}

export const ventasPrismaRepository = new VentasPrismaRepository();
