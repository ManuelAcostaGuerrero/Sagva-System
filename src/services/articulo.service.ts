import { prisma } from "@/lib/prisma";
import type { ArticuloInput, PrecioArticuloInput } from "@/types/articulo.types";
import {
  calcularPrecioConIVA,
  calcularPrecioPublico,
  calcularPrecioSinIVA
} from "@/utils/calculations/prices";

export const ArticuloService = {
  crearArticulo(datos: ArticuloInput) {
    return prisma.articulo.create({
      data: {
        codigoProducto: datos.codigoProducto,
        codigoInventario: datos.codigoInventario,
        codigoBarra: datos.codigoBarra,
        nombre: datos.nombre,
        familiaId: datos.familiaId,
        subfamiliaId: datos.subfamiliaId,
        marcaId: datos.marcaId,
        unidadMedida: datos.unidadMedida,
        cantidadEspecifica: datos.cantidadEspecifica,
        tipoImpuesto: datos.tipoImpuesto,
        impuestoAdicional: datos.impuestoAdicional,
        stockMinimo: datos.stockMinimo,
        stockMaximo: datos.stockMaximo,
        comentario: datos.comentario,
        estado: datos.estado ?? "activo"
      }
    });
  },

  actualizarArticulo(id: string, datos: Partial<ArticuloInput>) {
    return prisma.articulo.update({
      where: { id },
      data: {
        ...datos,
        codigoProducto: datos.codigoProducto
      }
    });
  },

  listarArticulos() {
    return prisma.articulo.findMany({
      include: {
        familia: true,
        marca: true,
        precios: {
          where: { vigente: true },
          take: 1,
          orderBy: { createdAt: "desc" }
        }
      },
      orderBy: { nombre: "asc" }
    });
  },

  obtenerArticulo(id: string) {
    return prisma.articulo.findUnique({
      where: { id },
      include: { precios: true, stocks: true }
    });
  },

  calcularPrecio(datos: PrecioArticuloInput) {
    const margen = datos.margen ?? 0.3;
    const precioSinIva =
      datos.precioSinIva ?? calcularPrecioSinIVA(datos.precioConIva ?? 0);
    const precioConIva =
      datos.precioConIva ?? calcularPrecioConIVA(precioSinIva);

    return {
      precioSinIva,
      precioConIva,
      margen,
      precioPublico: datos.precioPublico ?? calcularPrecioPublico(precioConIva, margen)
    };
  },

  async generarCodigoBarra() {
    const count = await prisma.articulo.count();
    return `SAGVA${String(count + 1).padStart(8, "0")}`;
  }
};
