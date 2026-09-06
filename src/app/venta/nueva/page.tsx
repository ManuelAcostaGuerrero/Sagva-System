import { AppShell } from "@/components/layout/app-shell";
import { prisma } from "@/lib/prisma";
import { VentasNuevaClient } from "./ventas-nueva-client";

export const dynamic = "force-dynamic";

function toNumber(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value);
  if (value && typeof value === "object" && "toString" in value) {
    return Number(value.toString());
  }
  return 0;
}

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

  const productos = sucursal
    ? await prisma.articulo.findMany({
        where: {
          estado: "activo",
        },
        include: {
          precios: {
            where: { vigente: true },
            orderBy: { createdAt: "desc" },
            take: 1,
          },
          stocks: {
            where: { sucursalId: sucursal.id },
            take: 1,
          },
        },
        orderBy: { nombre: "asc" },
        take: 80,
      })
    : [];

  const productosVenta = productos.map((articulo) => {
    const precio = articulo.precios[0];
    const stock = articulo.stocks[0];

    return {
      articuloId: articulo.id,
      codigoProducto: articulo.codigoProducto,
      codigoBarra: articulo.codigoBarra,
      nombreArticulo: articulo.nombre,
      precioPublico: toNumber(precio?.precioPublico),
      stockDisponible: toNumber(stock?.stockActual),
      controlaStock: true,
    };
  });

  return (
    <AppShell title="Nueva venta">
      {!sucursal ? (
        <div className="sagva-panel p-6 text-sm text-slate-600">
          No existe una sucursal configurada. Crea una sucursal antes de vender.
        </div>
      ) : (
        <VentasNuevaClient
          key={resetKey}
          productos={productosVenta}
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
