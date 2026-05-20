import { prisma } from "@/lib/prisma";
import { VentasService } from "./ventas.service";
import { ventasPrismaRepository } from "./ventas.prisma-repository";
import type { ID, MetodoPago, TipoDocumentoVenta } from "./ventas.types";

const ventasService = new VentasService(ventasPrismaRepository);

function toNumber(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value);
  if (value && typeof value === "object" && "toString" in value) {
    return Number(value.toString());
  }
  return 0;
}

function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function parseDate(value?: string | Date | null): Date {
  if (!value) return new Date();
  return value instanceof Date ? value : new Date(value);
}

export interface CrearVentaParams {
  clienteId?: ID | null;
  usuarioVendedorId: ID;
  cajeroId?: ID | null;
  sucursalId: ID;
  cajaId: ID;
  cajaTurnoId?: ID | null;
  observacion?: string | null;
}

export async function crearVenta(params: CrearVentaParams) {
  return ventasService.crearVenta({
    clienteId: params.clienteId ?? null,
    usuarioVendedorId: params.usuarioVendedorId,
    cajeroId: params.cajeroId ?? params.usuarioVendedorId,
    sucursalId: params.sucursalId,
    cajaId: params.cajaId,
    cajaTurnoId: params.cajaTurnoId ?? params.cajaId,
    observacion: params.observacion ?? null,
  });
}

export interface BuscarProductosParams {
  query?: string;
  sucursalId: ID;
  limite?: number;
}

export async function buscarProductos(params: BuscarProductosParams) {
  const query = params.query?.trim();

  const articulos = await prisma.articulo.findMany({
    where: {
      estado: "activo",
      ...(query
        ? {
            OR: [
              { nombre: { contains: query } },
              { codigoProducto: { contains: query } },
              { codigoBarra: { contains: query } },
              { codigoInventario: { contains: query } },
            ],
          }
        : {}),
    },
    include: {
      precios: {
        where: { vigente: true },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
      stocks: {
        where: { sucursalId: params.sucursalId },
        take: 1,
      },
    },
    orderBy: { nombre: "asc" },
    take: params.limite ?? 20,
  });

  return articulos.map((articulo) => {
    const precio = articulo.precios[0];
    const stock = articulo.stocks[0];
    const tipoImpuesto = articulo.tipoImpuesto?.toUpperCase() ?? "IVA";

    return {
      articuloId: articulo.id,
      codigoProducto: articulo.codigoProducto,
      codigoInventario: articulo.codigoInventario,
      codigoBarra: articulo.codigoBarra,
      nombreArticulo: articulo.nombre,
      unidadMedida: articulo.unidadMedida,
      tipoImpuesto,
      precioPublico: precio ? toNumber(precio.precioPublico) : 0,
      precioConIva: precio ? toNumber(precio.precioConIva) : 0,
      precioSinIva: precio ? toNumber(precio.precioSinIva) : 0,
      margen: precio ? toNumber(precio.margen) : 0,
      impuestoPorcentaje: tipoImpuesto === "EXENTO" ? 0 : 19,
      stockDisponible: stock ? toNumber(stock.stockActual) : 0,
      controlaStock: true,
    };
  });
}

export interface DescontarStockParams {
  articuloId: ID;
  sucursalId: ID;
  cantidad: number;
  usuarioId: ID;
  documentoOrigenId: ID;
  tipoDocumentoOrigen?: TipoDocumentoVenta;
  observacion?: string | null;
}

export async function descontarStock(params: DescontarStockParams) {
  await ventasPrismaRepository.descontarStock(
    params.articuloId,
    params.sucursalId,
    params.cantidad,
  );

  return ventasPrismaRepository.registrarMovimientoStock({
    id: `stock_mov_${Date.now()}`,
    articuloId: params.articuloId,
    sucursalId: params.sucursalId,
    tipoMovimiento: "SALIDA_VENTA",
    documentoOrigenId: params.documentoOrigenId,
    tipoDocumentoOrigen: params.tipoDocumentoOrigen ?? "BOLETA",
    cantidad: params.cantidad,
    fecha: new Date().toISOString(),
    usuarioId: params.usuarioId,
    observacion: params.observacion ?? "Salida manual desde operación de venta",
  });
}

export interface RegistrarPagoParams {
  ventaId: ID;
  metodoPago: MetodoPago;
  monto: number;
  referencia?: string | null;
  usuarioId: ID;
}

export async function registrarPago(params: RegistrarPagoParams) {
  return ventasService.agregarPago({
    ventaId: params.ventaId,
    metodoPago: params.metodoPago,
    monto: params.monto,
    referencia: params.referencia ?? null,
    usuarioId: params.usuarioId,
  });
}

export interface ActualizarCajaParams {
  cajaId: ID;
  cajaTurnoId?: ID | null;
  sucursalId: ID;
  usuarioId: ID;
  documentoOrigenId: ID;
  tipoDocumentoOrigen?: TipoDocumentoVenta;
  monto: number;
  tipoMovimiento?: "VENTA" | "ANULACION" | "PRESTAMO_GARANTIA" | "PRESTAMO_DEVOLUCION";
  observacion?: string | null;
}

export async function actualizarCaja(params: ActualizarCajaParams) {
  return ventasPrismaRepository.registrarMovimientoCaja({
    id: `caja_mov_${Date.now()}`,
    cajaId: params.cajaId,
    cajaTurnoId: params.cajaTurnoId ?? params.cajaId,
    sucursalId: params.sucursalId,
    usuarioId: params.usuarioId,
    tipoMovimiento: params.tipoMovimiento ?? "VENTA",
    documentoOrigenId: params.documentoOrigenId,
    tipoDocumentoOrigen: params.tipoDocumentoOrigen ?? "BOLETA",
    monto: params.monto,
    fecha: new Date().toISOString(),
    observacion: params.observacion ?? null,
    estado: "ACTIVO",
  });
}

export interface GuardarFacturaDetalleParams {
  productoFacturado: string;
  codigoProductoProveedor?: string | null;
  articuloId?: ID | null;
  cantidad: number;
  precioAcordado?: number | null;
  precioFacturado: number;
  impuesto?: string | null;
}

export interface GuardarFacturaParams {
  numeroFactura: string;
  proveedorId: ID;
  fechaEmision: string | Date;
  fechaRecepcion?: string | Date | null;
  sucursalId: ID;
  usuarioId?: ID | null;
  observacion?: string | null;
  actualizarStock?: boolean;
  detalles: GuardarFacturaDetalleParams[];
}

export async function guardarFactura(params: GuardarFacturaParams) {
  if (!params.detalles.length) {
    throw new Error("La factura debe tener al menos un detalle.");
  }

  return prisma.$transaction(async (tx) => {
    const factura = await tx.factura.create({
      data: {
        numeroFactura: params.numeroFactura,
        proveedorId: params.proveedorId,
        fechaEmision: parseDate(params.fechaEmision),
        fechaRecepcion: parseDate(params.fechaRecepcion),
        estado: "registrada",
        observacion: params.observacion ?? null,
      },
    });

    const detallesGuardados = [];

    for (const detalle of params.detalles) {
      if (detalle.cantidad <= 0) {
        throw new Error("La cantidad de cada producto facturado debe ser mayor a 0.");
      }

      if (detalle.precioFacturado <= 0) {
        throw new Error("El precio facturado debe ser mayor a 0.");
      }

      const totalLinea = roundMoney(detalle.cantidad * detalle.precioFacturado);
      const detalleGuardado = await tx.facturaDetalle.create({
        data: {
          facturaId: factura.id,
          productoFacturado: detalle.productoFacturado,
          codigoProductoProveedor: detalle.codigoProductoProveedor ?? null,
          articuloId: detalle.articuloId ?? null,
          cantidad: detalle.cantidad,
          precioAcordado: detalle.precioAcordado ?? null,
          precioFacturado: detalle.precioFacturado,
          impuesto: detalle.impuesto ?? "IVA",
          totalLinea,
        },
      });

      detallesGuardados.push(detalleGuardado);

      if (detalle.precioAcordado != null && detalle.precioAcordado !== detalle.precioFacturado) {
        await tx.facturaDiferencia.create({
          data: {
            facturaId: factura.id,
            detalleId: detalleGuardado.id,
            montoDiferencia: roundMoney((detalle.precioFacturado - detalle.precioAcordado) * detalle.cantidad),
            estado: "pendiente",
            observacion: "Diferencia entre precio acordado y precio facturado. Pendiente de nota de crédito o regularización.",
          },
        });
      }

      if (params.actualizarStock !== false && detalle.articuloId) {
        await tx.inventarioStock.upsert({
          where: {
            articuloId_sucursalId: {
              articuloId: detalle.articuloId,
              sucursalId: params.sucursalId,
            },
          },
          update: {
            stockActual: {
              increment: detalle.cantidad,
            },
          },
          create: {
            articuloId: detalle.articuloId,
            sucursalId: params.sucursalId,
            stockActual: detalle.cantidad,
          },
        });

        await tx.inventarioMovimiento.create({
          data: {
            articuloId: detalle.articuloId,
            sucursalId: params.sucursalId,
            tipoMovimiento: "entrada_factura",
            cantidad: detalle.cantidad,
            documentoOrigenTipo: "FACTURA",
            documentoOrigenId: factura.id,
            usuarioId: params.usuarioId ?? null,
            observacion: `Entrada por factura ${params.numeroFactura}`,
          },
        });
      }
    }

    return {
      factura,
      detalles: detallesGuardados,
    };
  });
}

export interface ConsultarReportesParams {
  sucursalId?: ID | null;
  fechaDesde?: string | Date | null;
  fechaHasta?: string | Date | null;
}

export async function consultarReportes(params: ConsultarReportesParams = {}) {
  const fechaDesde = params.fechaDesde ? parseDate(params.fechaDesde) : undefined;
  const fechaHasta = params.fechaHasta ? parseDate(params.fechaHasta) : undefined;

  const ventaWhere = {
    ...(params.sucursalId ? { sucursalId: params.sucursalId } : {}),
    ...(fechaDesde || fechaHasta
      ? {
          createdAt: {
            ...(fechaDesde ? { gte: fechaDesde } : {}),
            ...(fechaHasta ? { lte: fechaHasta } : {}),
          },
        }
      : {}),
  };

  const [ventasResumen, pagosPorMetodo, productosVendidos, movimientosCaja, facturasResumen] =
    await Promise.all([
      prisma.venta.aggregate({
        where: ventaWhere,
        _count: { id: true },
        _sum: {
          total: true,
          totalPagado: true,
          saldoPendiente: true,
        },
      }),
      prisma.ventaPago.groupBy({
        by: ["metodoPago"],
        where: {
          venta: ventaWhere,
        },
        _sum: { monto: true },
        _count: { id: true },
      }),
      prisma.ventaDetalle.groupBy({
        by: ["articuloId"],
        where: {
          venta: ventaWhere,
        },
        _sum: {
          cantidad: true,
          totalLinea: true,
        },
        _count: { id: true },
        orderBy: {
          _sum: {
            totalLinea: "desc",
          },
        },
        take: 10,
      }),
      prisma.cajaMovimiento.aggregate({
        where: {
          ...(fechaDesde || fechaHasta
            ? {
                createdAt: {
                  ...(fechaDesde ? { gte: fechaDesde } : {}),
                  ...(fechaHasta ? { lte: fechaHasta } : {}),
                },
              }
            : {}),
        },
        _count: { id: true },
        _sum: { monto: true },
      }),
      prisma.factura.aggregate({
        where: {
          ...(fechaDesde || fechaHasta
            ? {
                createdAt: {
                  ...(fechaDesde ? { gte: fechaDesde } : {}),
                  ...(fechaHasta ? { lte: fechaHasta } : {}),
                },
              }
            : {}),
        },
        _count: { id: true },
      }),
    ]);

  const articulosIds = productosVendidos.map((item) => item.articuloId);
  const articulos = articulosIds.length
    ? await prisma.articulo.findMany({
        where: { id: { in: articulosIds } },
        select: {
          id: true,
          codigoProducto: true,
          nombre: true,
        },
      })
    : [];

  const articuloPorId = new Map(articulos.map((articulo) => [articulo.id, articulo]));

  return {
    ventas: {
      cantidad: ventasResumen._count.id,
      total: toNumber(ventasResumen._sum.total),
      totalPagado: toNumber(ventasResumen._sum.totalPagado),
      saldoPendiente: toNumber(ventasResumen._sum.saldoPendiente),
    },
    pagosPorMetodo: pagosPorMetodo.map((item) => ({
      metodoPago: item.metodoPago,
      cantidad: item._count.id,
      total: toNumber(item._sum.monto),
    })),
    productosMasVendidos: productosVendidos.map((item) => {
      const articulo = articuloPorId.get(item.articuloId);
      return {
        articuloId: item.articuloId,
        codigoProducto: articulo?.codigoProducto ?? null,
        nombre: articulo?.nombre ?? "Artículo no encontrado",
        cantidadVendida: toNumber(item._sum.cantidad),
        totalVendido: toNumber(item._sum.totalLinea),
        lineasVendidas: item._count.id,
      };
    }),
    caja: {
      movimientos: movimientosCaja._count.id,
      totalMovimientos: toNumber(movimientosCaja._sum.monto),
    },
    facturas: {
      cantidad: facturasResumen._count.id,
    },
  };
}

export async function finalizarVenta(ventaId: ID, usuarioId: ID, permiteVentaConSaldo = false) {
  return ventasService.finalizarVenta({
    ventaId,
    usuarioId,
    permiteVentaConSaldo,
  });
}
