import { AppShell } from "@/components/layout/app-shell";
import { prisma } from "@/lib/prisma";
import { VentasNuevaClient } from "./ventas-nueva-client";
import { getCurrentUser } from "@/lib/session";
import { puedeAutorizarDescuento } from "@/lib/venta-permisos";
import { diaOperativo } from "@/lib/dia-operativo";

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
          usuarioId: usuario?.id ?? "__sin_sesion__",
          estado: "abierta",
        },
        orderBy: { fechaApertura: "desc" },
      })
    : null;
  const cajaJornada = cajaActiva && diaOperativo(cajaActiva.fechaApertura) === diaOperativo(new Date())
    ? cajaActiva : null;

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
            cajaJornada
              ? {
                  id: cajaJornada.id,
                  nombre: `Caja ${cajaJornada.id.slice(0, 6)}`,
                  estado: cajaJornada.estado,
                }
              : null
          }
        />
      )}
    </AppShell>
  );
}
