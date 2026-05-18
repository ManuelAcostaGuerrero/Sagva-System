import { AppShell } from "@/components/layout/app-shell";
import { InventarioMovimientoForm } from "@/components/forms/inventario-movimiento-form";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function InventarioAjustesPage() {
  const articulos = await prisma.articulo.findMany({ orderBy: { nombre: "asc" } });

  return (
    <AppShell title="Ajustes de Inventario" subtitle="Definir stock físico final con trazabilidad">
      <InventarioMovimientoForm articulos={articulos} tipoDefault="ajuste" />
    </AppShell>
  );
}
