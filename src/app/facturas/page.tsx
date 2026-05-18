import Link from "next/link";
import { Plus } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function FacturasPage() {
  const facturas = await prisma.factura.findMany({
    include: { proveedor: true, detalles: true },
    orderBy: { createdAt: "desc" }
  });

  return (
    <AppShell title="Lista de Compras" subtitle="Facturas de proveedores registradas">
      <section className="space-y-5">
        <div className="flex justify-end">
          <Link href="/facturas/nueva" className="inline-flex items-center gap-2 sagva-button-primary">
            <Plus className="h-4 w-4" aria-hidden="true" />
            Nueva compra
          </Link>
        </div>
        <div className="sagva-panel overflow-hidden">
          <div className="sagva-panel-title">Facturas</div>
          <table className="sagva-table">
            <thead>
              <tr>
                <th>N° Factura</th>
                <th>Proveedor</th>
                <th>Fecha emisión</th>
                <th>Productos</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {facturas.map((factura) => (
                <tr key={factura.id}>
                  <td className="font-semibold">{factura.numeroFactura}</td>
                  <td>{factura.proveedor.razonSocial}</td>
                  <td>{factura.fechaEmision.toLocaleDateString("es-CL")}</td>
                  <td>{factura.detalles.length}</td>
                  <td>{factura.estado}</td>
                </tr>
              ))}
              {facturas.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">
                    No hay facturas registradas todavía.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </AppShell>
  );
}
