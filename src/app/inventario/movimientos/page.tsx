import { AppShell } from "@/components/layout/app-shell";
import { InventarioMovimientoForm } from "@/components/forms/inventario-movimiento-form";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function InventarioMovimientosPage() {
  const [articulos, movimientos] = await Promise.all([
    prisma.articulo.findMany({ orderBy: { nombre: "asc" } }),
    prisma.inventarioMovimiento.findMany({
      include: { articulo: true, sucursal: true },
      orderBy: { createdAt: "desc" },
      take: 50
    })
  ]);

  return (
    <AppShell title="Entradas / Salidas" subtitle="Registrar movimientos y revisar historial">
      <section className="space-y-5">
        <InventarioMovimientoForm articulos={articulos} />

        <div className="sagva-panel overflow-hidden">
          <div className="sagva-panel-title">Últimos movimientos</div>
          <table className="sagva-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Artículo</th>
                <th>Tipo</th>
                <th>Cantidad</th>
                <th>Sucursal</th>
                <th>Observación</th>
              </tr>
            </thead>
            <tbody>
              {movimientos.map((movimiento) => (
                <tr key={movimiento.id}>
                  <td>{movimiento.createdAt.toLocaleDateString("es-CL")}</td>
                  <td>{movimiento.articulo.nombre}</td>
                  <td>{movimiento.tipoMovimiento}</td>
                  <td>{Number(movimiento.cantidad)}</td>
                  <td>{movimiento.sucursal.nombre}</td>
                  <td>{movimiento.observacion ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </AppShell>
  );
}
