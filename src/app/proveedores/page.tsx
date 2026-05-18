import Link from "next/link";
import { Plus } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function ProveedoresPage() {
  const proveedores = await prisma.proveedor.findMany({
    orderBy: { razonSocial: "asc" },
    include: {
      productosAsociados: true,
      facturas: true
    }
  });

  return (
    <AppShell title="Proveedores" subtitle="Registro comercial y datos de contacto">
      <section className="space-y-5">
        <div className="flex justify-end">
          <Link href="/proveedores/nuevo" className="inline-flex items-center gap-2 sagva-button-primary">
            <Plus className="h-4 w-4" aria-hidden="true" />
            Nuevo proveedor
          </Link>
        </div>

        <div className="sagva-panel overflow-hidden">
          <div className="sagva-panel-title">Listado de proveedores</div>
          <div className="overflow-x-auto">
            <table className="sagva-table">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Razón social</th>
                  <th>RUT/RUC</th>
                  <th>Teléfono</th>
                  <th>Correo</th>
                  <th>Contacto</th>
                  <th>Productos</th>
                  <th>Facturas</th>
                </tr>
              </thead>
              <tbody>
                {proveedores.map((proveedor) => (
                  <tr key={proveedor.id}>
                    <td className="font-semibold text-slate-900">{proveedor.codigo}</td>
                    <td>{proveedor.razonSocial}</td>
                    <td>{proveedor.rutRuc}</td>
                    <td>{proveedor.telefono ?? "-"}</td>
                    <td>{proveedor.correo ?? "-"}</td>
                    <td>{proveedor.contacto ?? "-"}</td>
                    <td>{proveedor.productosAsociados.length}</td>
                    <td>{proveedor.facturas.length}</td>
                  </tr>
                ))}
                {proveedores.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-500">
                      No hay proveedores registrados todavía.
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
