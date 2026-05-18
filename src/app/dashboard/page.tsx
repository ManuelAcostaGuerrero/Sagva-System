import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { StatCard } from "@/components/dashboard/stat-card";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [articulos, proveedores, ventas, stocks] = await Promise.all([
    prisma.articulo.count(),
    prisma.proveedor.count(),
    prisma.venta.count(),
    prisma.inventarioStock.findMany({
      include: { articulo: true }
    })
  ]);

  const stockCritico = stocks.filter(
    (stock) =>
      Number(stock.stockMinimo ?? stock.articulo.stockMinimo ?? 0) > 0 &&
      Number(stock.stockActual) <= Number(stock.stockMinimo ?? stock.articulo.stockMinimo ?? 0)
  ).length;

  return (
    <AppShell title="Inicio" subtitle="Resumen operativo de Sagva System">
      <section className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Artículos" value={String(articulos)} helper="Productos registrados" />
          <StatCard label="Proveedores" value={String(proveedores)} helper="Contactos comerciales" />
          <StatCard label="Ventas" value={String(ventas)} helper="Operaciones registradas" />
          <StatCard label="Stock crítico" value={String(stockCritico)} helper="Productos bajo mínimo" />
        </div>

        <div className="sagva-panel p-5">
          <h2 className="text-lg font-bold text-slate-950">Accesos rápidos</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            {[
              ["Nuevo artículo", "/articulos/nuevo"],
              ["Entrada / salida", "/inventario/movimientos"],
              ["Nuevo proveedor", "/proveedores/nuevo"],
              ["Nueva compra", "/facturas/nueva"]
            ].map(([label, href]) => (
              <Link
                key={href}
                href={href}
                className="rounded-md border border-[#d8dee8] bg-white px-4 py-3 text-sm font-bold text-[#064ea4] hover:bg-blue-50"
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      </section>
    </AppShell>
  );
}
