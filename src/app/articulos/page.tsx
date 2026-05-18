import Link from "next/link";
import { Edit, Plus } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/utils/formatters/currency";

export const dynamic = "force-dynamic";

export default async function ArticulosPage() {
  const articulos = await prisma.articulo.findMany({
    include: {
      familia: true,
      marca: true,
      precios: {
        where: { vigente: true },
        take: 1,
        orderBy: { createdAt: "desc" }
      },
      stocks: true
    },
    orderBy: { nombre: "asc" }
  });

  return (
    <AppShell title="Artículos" subtitle="Listado, precios, stock y edición de productos">
      <section className="space-y-5">
        <div className="flex justify-end">
          <Link href="/articulos/nuevo" className="inline-flex items-center gap-2 sagva-button-primary">
            <Plus className="h-4 w-4" aria-hidden="true" />
            Nuevo artículo
          </Link>
        </div>

        <div className="sagva-panel overflow-hidden">
          <div className="sagva-panel-title">Listado de artículos</div>
          <div className="overflow-x-auto">
            <table className="sagva-table">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Artículo</th>
                  <th>Familia</th>
                  <th>Marca</th>
                  <th>Precio público</th>
                  <th>Stock</th>
                  <th>Estado</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {articulos.map((articulo) => {
                  const precio = articulo.precios[0];
                  const stock = articulo.stocks.reduce(
                    (sum, item) => sum + Number(item.stockActual),
                    0
                  );
                  return (
                    <tr key={articulo.id}>
                      <td className="font-semibold text-slate-900">{articulo.codigoProducto}</td>
                      <td>{articulo.nombre}</td>
                      <td>{articulo.familia?.nombre ?? "-"}</td>
                      <td>{articulo.marca?.nombre ?? "-"}</td>
                      <td>{formatCurrency(Number(precio?.precioPublico ?? 0))}</td>
                      <td>{stock}</td>
                      <td>
                        <span className="rounded-full bg-green-50 px-2 py-1 text-xs font-bold text-green-700">
                          {articulo.estado}
                        </span>
                      </td>
                      <td>
                        <Link
                          href={`/articulos/${articulo.id}/editar`}
                          className="inline-flex items-center gap-1 text-sm font-bold text-[#064ea4]"
                        >
                          <Edit className="h-4 w-4" aria-hidden="true" />
                          Editar
                        </Link>
                      </td>
                    </tr>
                  );
                })}
                {articulos.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-500">
                      No hay artículos registrados todavía.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
