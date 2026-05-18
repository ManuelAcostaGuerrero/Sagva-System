import { prisma } from "@/lib/prisma";
import type { ProveedorInput } from "@/types/proveedor.types";

export const ProveedorService = {
  crearProveedor(datos: ProveedorInput) {
    return prisma.proveedor.create({
      data: {
        codigo: datos.codigo,
        rutRuc: datos.rutRuc,
        razonSocial: datos.razonSocial,
        nombreComercial: datos.nombreComercial,
        direccion: datos.direccion,
        contacto: datos.contacto,
        telefono: datos.telefono,
        correo: datos.correo,
        condicionesComerciales: datos.condicionesComerciales,
        estado: datos.estado ?? "activo"
      }
    });
  },

  listarProveedores() {
    return prisma.proveedor.findMany({
      orderBy: { razonSocial: "asc" }
    });
  },

  obtenerProveedor(id: string) {
    return prisma.proveedor.findUnique({
      where: { id },
      include: { productosAsociados: true }
    });
  },

  asociarProducto(datos: {
    proveedorId: string;
    productoProveedorCodigo: string;
    productoProveedorNombre: string;
    articuloId: string;
  }) {
    return prisma.proveedorProductoAsociado.create({ data: datos });
  }
};
