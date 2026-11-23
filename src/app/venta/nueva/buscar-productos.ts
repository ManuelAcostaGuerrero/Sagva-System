"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

export type ProductoBusquedaVenta = {
  articuloId: string;
  codigoProducto: string;
  codigoBarra: string | null;
  nombreArticulo: string;
  precioPublico: number;
  stockDisponible: number;
  controlaStock: boolean;
  reglasMayoristas: Array<{ cantidadMinima: number; precioUnitario: number }>;
};

export type ResultadoBusquedaVenta =
  | { ok: true; productos: ProductoBusquedaVenta[] }
  | { ok: false; motivo: "sesion" };

/** Consulta paginada y limitada en SQLite, no precarga todo el catálogo al navegador. */
export async function buscarProductosParaCajaAction(query: string, sucursalId: string): Promise<ResultadoBusquedaVenta> {
  const usuario = await getCurrentUser();
  if (!usuario || usuario.estado !== "activo") return { ok: false, motivo: "sesion" };
  const q = typeof query === "string" ? query.trim().slice(0, 100) : "";
  if (!q || typeof sucursalId !== "string" || !sucursalId) return { ok: true, productos: [] };
  const exacto = await prisma.articulo.findFirst({
    where: { estado: "activo", OR: [{ codigoBarra: q }, { codigoProducto: q }] },
    select: { id: true }
  });
  const articulos = await prisma.articulo.findMany({
    where: {
      estado: "activo",
      OR: [
        { nombre: { contains: q } },
        { codigoProducto: { contains: q } },
        { codigoBarra: { contains: q } }
      ]
    },
    include: {
      precios: { where: { vigente: true }, orderBy: { createdAt: "desc" }, take: 1 },
      stocks: { where: { sucursalId }, take: 1 },
      reglasMayoristas: { orderBy: { cantidadMinima: "asc" } }
    },
    orderBy: { nombre: "asc" },
    take: 20
  });
  // Garantizar que un código escaneado aparece aunque existan muchos nombres similares.
  const exactoCompleto = exacto && !articulos.some(a => a.id === exacto.id)
    ? await prisma.articulo.findUnique({
        where: { id: exacto.id },
        include: {
          precios: { where: { vigente: true }, orderBy: { createdAt: "desc" }, take: 1 },
          stocks: { where: { sucursalId }, take: 1 },
          reglasMayoristas: { orderBy: { cantidadMinima: "asc" } }
        }
      })
    : null;
  const encontrados = exactoCompleto ? [exactoCompleto, ...articulos] : articulos;
  encontrados.sort((a,b) => (a.id === exacto?.id ? -1 : b.id === exacto?.id ? 1 : 0));
  const productos = encontrados.filter(a => a.precios.length > 0 && a.tipoArticulo !== "PROMOCION").slice(0,20).map(a => {
    const precio = a.precios[0];
    const reglas = a.reglasMayoristas.map(r => ({
      cantidadMinima: Number(r.cantidadMinima), precioUnitario: Number(r.precioUnitario)
    }));
    if (!reglas.length && precio?.cantidadMinimaMayorista && precio.precioMayorista) {
      reglas.push({ cantidadMinima: Number(precio.cantidadMinimaMayorista),
        precioUnitario: Number(precio.precioMayorista) });
    }
    return {
      articuloId: a.id,
      codigoProducto: a.codigoProducto,
      codigoBarra: a.codigoBarra,
      nombreArticulo: a.nombre,
      precioPublico: Number(precio?.precioPublico ?? 0),
      stockDisponible: Number(a.stocks[0]?.stockActual ?? 0),
      controlaStock: true,
      reglasMayoristas: reglas
    };
  });
  return { ok: true, productos };
}
