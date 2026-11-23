import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { formatCurrency } from "@/utils/formatters/currency";

export const dynamic = "force-dynamic";

/** Historial solo del usuario autenticado. Lectura segura y sin modificar ventas. */
export default async function HistorialVentasPage() {
  const usuario = await getCurrentUser();
  if (!usuario) redirect("/login");

  const ventas = await prisma.venta.findMany({
    where: { vendedorId: usuario.id, estado: "cobrada" },
    select: {
      id: true,
      folioDefinitivo: true,
      total: true,
      cajaId: true,
      createdAt: true,
      finalizedAt: true
    },
    orderBy: [{ finalizedAt: "desc" }, { createdAt: "desc" }],
    take: 100
  });
  const pagos = ventas.length
    ? await prisma.ventaPago.findMany({
        where: { ventaId: { in: ventas.map(venta => venta.id) } },
        select: { ventaId: true, metodoPago: true, monto: true }
      })
    : [];
  const metodosPorVenta = new Map<string, string[]>();
  for (const pago of pagos) {
    const lista = metodosPorVenta.get(pago.ventaId) ?? [];
    lista.push(pago.metodoPago.toUpperCase() + " " + formatCurrency(Number(pago.monto)));
    metodosPorVenta.set(pago.ventaId, lista);
  }

  return (
    <AppShell title="Historial de cobros" subtitle="Últimas 100 ventas cobradas por tu usuario">
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate-600">
            Verifica el folio, importe y medio de pago antes de intentar cobrar nuevamente una venta.
          </p>
          <Link href="/venta/nueva" className="sagva-button-primary">Nueva venta</Link>
        </div>
        <div className="sagva-panel overflow-hidden">
          <div className="sagva-panel-title">Ventas registradas</div>
          <div className="overflow-x-auto">
            <table className="sagva-table">
              <thead>
                <tr>
                  <th>Fecha y hora</th>
                  <th>Folio</th>
                  <th>Total</th>
                  <th>Medio de pago</th>
                  <th>Caja</th>
                </tr>
              </thead>
              <tbody>
                {ventas.map(venta => (
                  <tr key={venta.id}>
                    <td>{(venta.finalizedAt ?? venta.createdAt).toLocaleString("es-CL", {
                      timeZone: "America/Santiago",
                      day: "2-digit", month: "2-digit", year: "numeric",
                      hour: "2-digit", minute: "2-digit", second: "2-digit"
                    })}</td>
                    <td className="font-semibold">{venta.folioDefinitivo ?? "Sin folio"}</td>
                    <td className="whitespace-nowrap font-semibold">{formatCurrency(Number(venta.total))}</td>
                    <td>{metodosPorVenta.get(venta.id)?.join(" + ") ?? "Sin pago registrado"}</td>
                    <td>{venta.cajaId ? "Asociada" : "Pendiente de apertura"}</td>
                  </tr>
                ))}
                {ventas.length === 0 ? (
                  <tr><td colSpan={5} className="py-6 text-center text-slate-500">
                    No hay ventas cobradas por tu usuario.
                  </td></tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
