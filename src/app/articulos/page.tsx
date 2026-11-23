import { AppShell } from "@/components/layout/app-shell";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { ArticulosListadoClient } from "./articulos-listado-client";

export const dynamic = "force-dynamic";

export default async function ArticulosPage() {
  // Evitar relaciones anidadas de miles de artículos en una misma consulta.
  // Prisma/SQLite puede provocar un RustPanicError con lecturas relacionales
  // masivas y campos de ordenación que no forman parte de la proyección.
  const [articulos, familias, subfamilias, marcas, user, precios, stocks] = await Promise.all([
    prisma.articulo.findMany({
      select: {
        id: true, codigoProducto: true, codigoBarra: true, nombre: true,
        tipoArticulo: true, familiaId: true, subfamiliaId: true, marcaId: true, estado: true
      },
      orderBy: { nombre: "asc" }
    }),
    prisma.familia.findMany({ select: { id: true, nombre: true }, orderBy: { nombre: "asc" } }),
    prisma.subfamilia.findMany({ select: { id: true, familiaId: true, nombre: true }, orderBy: { nombre: "asc" } }),
    prisma.marca.findMany({ select: { id: true, nombre: true }, orderBy: { nombre: "asc" } }),
    getCurrentUser(),
    prisma.articuloPrecio.findMany({
      where: { vigente: true },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      select: { id: true, articuloId: true, precioPublico: true, precioConIva: true, createdAt: true }
    }),
    prisma.inventarioStock.findMany({
      select: { articuloId: true, stockActual: true }
    })
  ]);

  // Seleccionar el último precio vigente sin provocar consultas por artículo.
  const precioPorArticulo = new Map<string, { precioPublico: number; costoConIva: number }>();
  for (const precio of precios) {
    if (!precioPorArticulo.has(precio.articuloId)) {
      precioPorArticulo.set(precio.articuloId, {
        precioPublico: Number(precio.precioPublico),
        costoConIva: Number(precio.precioConIva)
      });
    }
  }

  const stockPorArticulo = new Map<string, number>();
  for (const stock of stocks) {
    stockPorArticulo.set(stock.articuloId,
      (stockPorArticulo.get(stock.articuloId) ?? 0) + Number(stock.stockActual));
  }

  const codigo = user?.rol?.codigo;
  const puedeEditar = codigo === "admin" || codigo === "root" ||
    !!(user?.rolId && await prisma.permiso.findFirst({
      where: { rolId: user.rolId, modulo: "articulos", accion: "editar", permitido: true,
        campo: null }, select: { id: true }
    }));
  const mostrarGanancia = codigo === "admin" || codigo === "root" || codigo === "contabilidad";

  return (
    <AppShell title="Artículos" subtitle="Catálogo, clasificación y precios">
      <ArticulosListadoClient
        articulos={articulos.map(a => ({
          id: a.id, codigoProducto: a.codigoProducto, codigoBarra: a.codigoBarra, nombre: a.nombre,
          tipoArticulo: a.tipoArticulo, familiaId: a.familiaId, subfamiliaId: a.subfamiliaId,
          marcaId: a.marcaId, estado: a.estado,
          precioPublico: precioPorArticulo.get(a.id)?.precioPublico ?? 0,
          costoConIva: precioPorArticulo.get(a.id)?.costoConIva ?? 0,
          stock: stockPorArticulo.get(a.id) ?? 0
        }))}
        familias={familias} subfamilias={subfamilias} marcas={marcas}
        puedeEditar={Boolean(puedeEditar)} mostrarGanancia={mostrarGanancia}
      />
    </AppShell>
  );
}
