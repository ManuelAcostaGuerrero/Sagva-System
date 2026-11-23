import { AppShell } from "@/components/layout/app-shell";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { ArticulosListadoClient } from "./articulos-listado-client";

export const dynamic = "force-dynamic";

export default async function ArticulosPage() {
  const [articulos, familias, subfamilias, marcas, user] = await Promise.all([
    prisma.articulo.findMany({
      select: {
        id: true, codigoProducto: true, codigoBarra: true, nombre: true,
        tipoArticulo: true, familiaId: true, subfamiliaId: true, marcaId: true, estado: true,
        precios: { where: { vigente: true }, orderBy: { createdAt: "desc" }, take: 1,
          select: { precioPublico: true, precioConIva: true } },
        stocks: { select: { stockActual: true } }
      },
      orderBy: { nombre: "asc" }
    }),
    prisma.familia.findMany({ select: { id: true, nombre: true }, orderBy: { nombre: "asc" } }),
    prisma.subfamilia.findMany({ select: { id: true, familiaId: true, nombre: true }, orderBy: { nombre: "asc" } }),
    prisma.marca.findMany({ select: { id: true, nombre: true }, orderBy: { nombre: "asc" } }),
    getCurrentUser()
  ]);
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
          id:a.id, codigoProducto:a.codigoProducto, codigoBarra:a.codigoBarra, nombre:a.nombre,
          tipoArticulo:a.tipoArticulo, familiaId:a.familiaId, subfamiliaId:a.subfamiliaId,
          marcaId:a.marcaId, estado:a.estado,
          precioPublico:Number(a.precios[0]?.precioPublico ?? 0),
          costoConIva:Number(a.precios[0]?.precioConIva ?? 0),
          stock:a.stocks.reduce((sum,s)=>sum+Number(s.stockActual),0)
        }))}
        familias={familias} subfamilias={subfamilias} marcas={marcas}
        puedeEditar={Boolean(puedeEditar)} mostrarGanancia={mostrarGanancia}
      />
    </AppShell>
  );
}
