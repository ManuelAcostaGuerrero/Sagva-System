import Link from "next/link";
import { ArrowDownUp, SlidersHorizontal } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { InventarioListadoClient } from "@/components/inventario/inventario-listado-client";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function InventarioPage() {
  const stocks = await prisma.inventarioStock.findMany({
    include: {
      articulo: { include: { familia: true, marca: true } },
      sucursal: true
    },
    orderBy: { articulo: { nombre: "asc" } }
  });

  const filas = stocks.map(stock => {
    const actual = Number(stock.stockActual);
    const minimo = Number(stock.stockMinimo ?? stock.articulo.stockMinimo ?? 0);
    return {
      id: stock.id,
      codigoBarra: stock.articulo.codigoBarra,
      codigoInterno: stock.articulo.codigoProducto,
      nombre: stock.articulo.nombre,
      familia: stock.articulo.familia?.nombre ?? "-",
      marca: stock.articulo.marca?.nombre ?? "-",
      sucursal: stock.sucursal.nombre,
      stock: actual,
      minimo,
      maximo: Number(stock.stockMaximo ?? stock.articulo.stockMaximo ?? 0),
      estado: minimo > 0 && actual <= minimo ? "Crítico" : "OK"
    };
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
        <InventarioListadoClient filas={filas} />
      </section>
    </AppShell>
  );
}
