import { prisma } from "@/lib/prisma";
import type { VentaPagoInput, VentaProductoInput } from "@/types/venta.types";

export const VentaService = {
  crearVentaTemporal(datos: { vendedorId: string; sucursalId: string; cajaId?: string }) {
    return prisma.venta.create({
      data: {
        idTemporal: `TMP-${Date.now()}`,
        vendedorId: datos.vendedorId,
        sucursalId: datos.sucursalId,
        cajaId: datos.cajaId
      }
    });
  },

  agregarProducto(ventaId: string, producto: VentaProductoInput) {
    return prisma.ventaDetalle.create({
      data: {
        ventaId,
        articuloId: producto.articuloId,
        cantidad: producto.cantidad,
        precioUnitario: producto.precioUnitario,
        totalLinea: producto.cantidad * producto.precioUnitario
      }
    });
  },

  agregarPago(ventaId: string, pago: VentaPagoInput) {
    return prisma.ventaPago.create({
      data: {
        ventaId,
        metodoPago: pago.metodoPago,
        monto: pago.monto,
        referencia: pago.referencia
      }
    });
  },

  async calcularTotales(ventaId: string) {
    const [detalles, pagos] = await Promise.all([
      prisma.ventaDetalle.findMany({ where: { ventaId } }),
      prisma.ventaPago.findMany({ where: { ventaId } })
    ]);

    const total = detalles.reduce((sum, item) => sum + Number(item.totalLinea), 0);
    const totalPagado = pagos.reduce((sum, item) => sum + Number(item.monto), 0);

    return {
      total,
      totalPagado,
      saldoPendiente: Math.max(total - totalPagado, 0),
      vuelto: Math.max(totalPagado - total, 0)
    };
  },

  async finalizarVenta(ventaId: string) {
    const totales = await this.calcularTotales(ventaId);

    return prisma.venta.update({
      where: { id: ventaId },
      data: {
        ...totales,
        folioDefinitivo: `V-${Date.now()}`,
        estado: "finalizada",
        finalizedAt: new Date()
      }
    });
  },

  anularVenta(ventaId: string, motivo: string) {
    return prisma.ventaAnulacion.create({
      data: {
        ventaId,
        motivo
      }
    });
  }
};
