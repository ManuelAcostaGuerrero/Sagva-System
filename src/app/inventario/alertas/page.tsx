import { AppShell } from "@/components/layout/app-shell";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function InventarioAlertasPage() {
  const stocks = await prisma.inventarioStock.findMany({
    include: { articulo: true, sucursal: true }
  });
  const alertas = stocks.filter(
    (stock) =>
      Number(stock.stockMinimo ?? stock.articulo.stockMinimo ?? 0) > 0 &&
      Number(stock.stockActual) <= Number(stock.stockMinimo ?? stock.articulo.stockMinimo ?? 0)
  );

  return (
    <AppShell title="Alertas de Stock" subtitle="Productos bajo mínimo definido">
      <div className="sagva-panel overflow-hidden">
        <div className="sagva-panel-title">Stock crítico</div>
        <table className="sagva-table">
          <thead>
            <tr>
              <th>Artículo</th>
              <th>Sucursal</th>
              <th>Stock</th>
              <th>Mínimo</th>
            </tr>
          </thead>
          <tbody>
            {alertas.map((stock) => (
              <tr key={stock.id}>
                <td>{stock.articulo.nombre}</td>
                <td>{stock.sucursal.nombre}</td>
                <td>{Number(stock.stockActual)}</td>
                <td>{Number(stock.stockMinimo ?? stock.articulo.stockMinimo ?? 0)}</td>
              </tr>
            ))}
            {alertas.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-8 text-center text-green-700">
                  Sin alertas críticas por ahora.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
