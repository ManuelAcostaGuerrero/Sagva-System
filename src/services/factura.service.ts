import { prisma } from "@/lib/prisma";
import type { FacturaDetalleInput, FacturaInput } from "@/types/factura.types";

export const FacturaService = {
  crearFactura(datos: FacturaInput) {
    return prisma.factura.create({
      data: {
        numeroFactura: datos.numeroFactura,
        proveedorId: datos.proveedorId,
        fechaEmision: datos.fechaEmision,
        fechaRecepcion: datos.fechaRecepcion,
        observacion: datos.observacion
      }
    });
  },

  agregarDetalle(facturaId: string, detalle: FacturaDetalleInput) {
    const totalLinea = detalle.cantidad * detalle.precioFacturado;

    return prisma.facturaDetalle.create({
      data: {
        facturaId,
        productoFacturado: detalle.productoFacturado,
        codigoProductoProveedor: detalle.codigoProductoProveedor,
        articuloId: detalle.articuloId,
        cantidad: detalle.cantidad,
        precioAcordado: detalle.precioAcordado,
        precioFacturado: detalle.precioFacturado,
        impuesto: detalle.impuesto,
        totalLinea
      }
    });
  },

  calcularDiferencia(detalle: FacturaDetalleInput) {
    return (detalle.precioFacturado - (detalle.precioAcordado ?? detalle.precioFacturado)) * detalle.cantidad;
  },

  procesarFactura(facturaId: string) {
    return prisma.factura.update({
      where: { id: facturaId },
      data: { estado: "procesada" }
    });
  }
};
