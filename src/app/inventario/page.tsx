import Link from "next/link";
import { ArrowDownUp, SlidersHorizontal } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function InventarioPage() {
  const stocks = await prisma.inventarioStock.findMany({
    include: {
      articulo: {
        include: {
          familia: true,
          marca: true
        }
      },
      sucursal: true
    },
    orderBy: { articulo: { nombre: "asc" } }
  });

  return (
    <AppShell title="Inventario" subtitle="Stock actual por artículo y sucursal">
      <section className="space-y-5">
        <div className="flex flex-wrap justify-end gap-3">
          <Link href="/inventario/movimientos" className="inline-flex items-center gap-2 sagva-button-primary">
            <ArrowDownUp className="h-4 w-4" aria-hidden="true" />
            Entradas / Salidas
          </Link>
          <Link href="/inventario/ajustes" className="inline-flex items-center gap-2 sagva-button-secondary">
            <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
            Ajustes
          </Link>
        </div>

        <div className="sagva-panel overflow-hidden">
          <div className="sagva-panel-title">Stock actual</div>
          <div className="overflow-x-auto">
            <table className="sagva-table">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Artículo</th>
                  <th>Familia</th>
                  <th>Marca</th>
                  <th>Sucursal</th>
                  <th>Stock</th>
                  <th>Mínimo</th>
                  <th>Máximo</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {stocks.map((stock) => {
                  const actual = Number(stock.stockActual);
                  const minimo = Number(stock.stockMinimo ?? stock.articulo.stockMinimo ?? 0);
                  const estado = minimo > 0 && actual <= minimo ? "Crítico" : "OK";
                  return (
                    <tr key={stock.id}>
                      <td className="font-semibold text-slate-900">{stock.articulo.codigoProducto}</td>
                      <td>{stock.articulo.nombre}</td>
                      <td>{stock.articulo.familia?.nombre ?? "-"}</td>
                      <td>{stock.articulo.marca?.nombre ?? "-"}</td>
                      <td>{stock.sucursal.nombre}</td>
                      <td className="font-bold">{actual}</td>
                      <td>{Number(stock.stockMinimo ?? stock.articulo.stockMinimo ?? 0)}</td>
                      <td>{Number(stock.stockMaximo ?? stock.articulo.stockMaximo ?? 0)}</td>
                      <td>
                        <span
                          className={
                            estado === "Crítico"
                              ? "rounded-full bg-red-50 px-2 py-1 text-xs font-bold text-red-700"
                              : "rounded-full bg-green-50 px-2 py-1 text-xs font-bold text-green-700"
                          }
                        >
                          {estado}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {stocks.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-500">
                      No hay stock registrado todavía.
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
