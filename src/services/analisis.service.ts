import { prisma } from "@/lib/prisma";

export const AnalisisService = {
  async obtenerDashboard() {
    const [articulos, proveedores, ventas, stockCritico] = await Promise.all([
      prisma.articulo.count(),
      prisma.proveedor.count(),
      prisma.venta.count(),
      prisma.inventarioStock.count({
        where: {
          stockMinimo: {
            not: null
          }
        }
      })
    ]);

    return {
      articulos,
      proveedores,
      ventas,
      stockCritico
    };
  },

  obtenerDatosPeriodo(fechaInicio: Date, fechaFin: Date, sucursalId?: string) {
    return prisma.venta.findMany({
      where: {
        sucursalId,
        createdAt: {
          gte: fechaInicio,
          lte: fechaFin
        }
      },
      include: { detalles: true, pagos: true }
    });
  }
};
