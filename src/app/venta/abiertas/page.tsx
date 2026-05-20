import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/utils/formatters/currency";

export const dynamic = "force-dynamic";

function toNumber(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value);
  if (value && typeof value === "object" && "toString" in value) {
    return Number(value.toString());
  }
  return 0;
}

export default async function VentasAbiertasPage() {
  const ventas = await prisma.venta.findMany({
    where: {
      estado: {
        in: ["abierta", "pendiente"],
      },
    },
    include: {
      vendedor: true,
      sucursal: true,
      detalles: true,
      pagos: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <AppShell title="Ventas abiertas" subtitle="Ventas temporales y pendientes por finalizar">
      <section className="space-y-5">
        <div className="flex justify-end">
          <Link href="/venta/nueva" className="sagva-button-primary">
            Nueva venta
          </Link>
        </div>

        <div className="sagva-panel overflow-hidden">
          <div className="sagva-panel-title">Listado de ventas abiertas</div>
          <div className="overflow-x-auto">
            <table className="sagva-table">
              <thead>
                <tr>
                  <th>Venta temporal</th>
                  <th>Vendedor</th>
                  <th>Sucursal</th>
                  <th>Productos</th>
                  <th>Total</th>
                  <th>Pagado</th>
                  <th>Saldo</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {ventas.map((venta) => (
                  <tr key={venta.id}>
                    <td className="font-bold text-slate-950">{venta.idTemporal}</td>
                    <td>{venta.vendedor.nombre}</td>
                    <td>{venta.sucursal.nombre}</td>
                    <td>{venta.detalles.length}</td>
                    <td>{formatCurrency(toNumber(venta.total))}</td>
                    <td>{formatCurrency(toNumber(venta.totalPagado))}</td>
                    <td>{formatCurrency(toNumber(venta.saldoPendiente))}</td>
                    <td>
                      <span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-bold text-blue-700">
                        {venta.estado}
                      </span>
                    </td>
                  </tr>
                ))}
                {ventas.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-500">
                      No hay ventas abiertas o pendientes.
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
