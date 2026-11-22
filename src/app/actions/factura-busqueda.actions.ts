"use server";

import { prisma } from "@/lib/prisma";

function normalizarRut(valor: string) {
  return valor.replace(/[^0-9kK]/g, "").toUpperCase();
}

export async function buscarProveedoresFactura(texto: string) {
  const consulta = texto.trim().toLocaleLowerCase("es-CL");
  if (!consulta || consulta.length > 100) return [];
  const proveedores = await prisma.proveedor.findMany({
    where: { estado: "activo" },
    select: { id: true, rut: true, razonSocial: true, nombreComercial: true },
    orderBy: { razonSocial: "asc" }
  });
  const rut = normalizarRut(consulta);
  return proveedores.filter((proveedor) =>
    proveedor.razonSocial.toLocaleLowerCase("es-CL").includes(consulta) ||
    (proveedor.nombreComercial ?? "").toLocaleLowerCase("es-CL").includes(consulta) ||
    (rut.length >= 2 && normalizarRut(proveedor.rut).includes(rut))
  ).slice(0, 20);
}

export async function buscarArticulosFactura(proveedorId: string, texto: string) {
  const consulta = texto.trim();
  if (!proveedorId || !consulta || consulta.length > 100) return [];
  const proveedor = await prisma.proveedor.findFirst({ where: { id: proveedorId, estado: "activo" }, select: { id: true } });
  if (!proveedor) return [];
  return prisma.articulo.findMany({
    where: {
      estado: "activo",
      OR: [
        { nombre: { contains: consulta } },
        { codigoBarra: { contains: consulta } },
        { proveedorProductos: { some: { proveedorId, productoProveedorCodigo: { contains: consulta } } } }
      ]
    },
    select: {
      id: true, nombre: true, codigoBarra: true, unidadMedida: true,
      proveedorProductos: { where: { proveedorId }, select: { productoProveedorCodigo: true } }
    },
    orderBy: { nombre: "asc" }, take: 20
  });
}

export async function vincularCodigoFactura(proveedorId: string, articuloId: string, codigoInput: string) {
  const codigo = codigoInput.trim();
  if (!proveedorId || !articuloId || !codigo || codigo.length > 100) return { error: "Selecciona proveedor, artículo y código válido." };
  try {
    return await prisma.$transaction(async (tx) => {
      const proveedor = await tx.proveedor.findFirst({ where: { id: proveedorId, estado: "activo" }, select: { id: true } });
      const articulo = await tx.articulo.findFirst({ where: { id: articuloId, estado: "activo" }, select: { id: true, nombre: true } });
      if (!proveedor || !articulo) return { error: "El proveedor o artículo no está disponible." };
      const existente = await tx.proveedorProductoAsociado.findUnique({ where: { proveedorId_productoProveedorCodigo: { proveedorId, productoProveedorCodigo: codigo } } });
      if (existente) return existente.articuloId === articuloId ? { ok: true } : { error: "Este código ya pertenece a otro artículo de este proveedor." };
      await tx.proveedorProductoAsociado.create({ data: { proveedorId, articuloId, productoProveedorCodigo: codigo, productoProveedorNombre: articulo.nombre } });
      return { ok: true };
    });
  } catch {
    return { error: "No se pudo guardar la asociación. Comprueba si el código ya está registrado." };
  }
}
