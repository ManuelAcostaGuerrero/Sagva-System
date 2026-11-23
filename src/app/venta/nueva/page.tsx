import { AppShell } from "@/components/layout/app-shell";
import { prisma } from "@/lib/prisma";
import { VentasNuevaClient } from "./ventas-nueva-client";
import { getCurrentUser } from "@/lib/session";
import { puedeAutorizarDescuento } from "@/lib/venta-permisos";

export const dynamic = "force-dynamic";

type NuevaVentaPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function NuevaVentaPage({ searchParams }: NuevaVentaPageProps) {
  const params = searchParams ? await searchParams : {};
  const resetKey = [
    params.success,
    params.pago,
    params.vuelto,
    params.error,
  ]
    .flat()
    .filter(Boolean)
    .join("-") || "nueva-venta";

  const usuario = await getCurrentUser();
  const puedeDescontar = await puedeAutorizarDescuento(usuario);
  const sucursal = await prisma.sucursal.findFirst({
    orderBy: { createdAt: "asc" },
  });

  const cajaActiva = sucursal
    ? await prisma.caja.findFirst({
        where: {
          sucursalId: sucursal.id,
          estado: "abierta",
        },
        orderBy: { fechaApertura: "desc" },
      })
    : null;

  return (
    <AppShell title="Nueva venta">
      {!sucursal ? (
        <div className="sagva-panel p-6 text-sm text-slate-600">
          No existe una sucursal configurada. Crea una sucursal antes de vender.
        </div>
      ) : (
        <VentasNuevaClient
          key={resetKey}
          productos={[]}
          puedeAutorizarDescuento={puedeDescontar}
          sucursalId={sucursal.id}
          sucursalNombre={sucursal.nombre}
          cajaActiva={
            cajaActiva
              ? {
                  id: cajaActiva.id,
                  nombre: `Caja ${cajaActiva.id.slice(0, 6)}`,
                  estado: cajaActiva.estado,
                }
              : null
          }
        />
      )}
    </AppShell>
  );
}
