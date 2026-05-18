import { prisma } from "@/lib/prisma";
import type {
  DisponibilidadResult,
  MovimientoInventarioInput
} from "@/types/inventario.types";

export const InventarioService = {
  consultarStock(articuloId: string, sucursalId: string) {
    return prisma.inventarioStock.findUnique({
      where: {
        articuloId_sucursalId: {
          articuloId,
          sucursalId
        }
      }
    });
  },

  async validarDisponibilidad(
    articuloId: string,
    sucursalId: string,
    cantidad: number
  ): Promise<DisponibilidadResult> {
    const stock = await this.consultarStock(articuloId, sucursalId);
    const stockActual = Number(stock?.stockActual ?? 0);

    return {
      disponible: stockActual >= cantidad,
      stockActual,
      mensaje:
        stockActual >= cantidad
          ? "Stock disponible"
          : "Stock insuficiente para la operación"
    };
  },

  registrarMovimiento(datos: MovimientoInventarioInput) {
    return prisma.inventarioMovimiento.create({
      data: {
        articuloId: datos.articuloId,
        sucursalId: datos.sucursalId,
        tipoMovimiento: datos.tipoMovimiento,
        cantidad: datos.cantidad,
        documentoOrigenTipo: datos.documentoOrigenTipo,
        documentoOrigenId: datos.documentoOrigenId,
        observacion: datos.observacion,
        usuarioId: datos.usuarioId
      }
    });
  },

  registrarEntrada(datos: MovimientoInventarioInput) {
    return this.registrarMovimiento({ ...datos, tipoMovimiento: "entrada" });
  },

  registrarSalida(datos: MovimientoInventarioInput) {
    return this.registrarMovimiento({ ...datos, tipoMovimiento: "salida" });
  },

  obtenerHistorialMovimientos(articuloId: string) {
    return prisma.inventarioMovimiento.findMany({
      where: { articuloId },
      orderBy: { createdAt: "desc" }
    });
  }
};
