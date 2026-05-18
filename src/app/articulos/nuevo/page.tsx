import { AppShell } from "@/components/layout/app-shell";
import { ArticuloForm } from "@/components/forms/articulo-form";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function NuevoArticuloPage() {
  const [familias, subfamilias, marcas] = await Promise.all([
    prisma.familia.findMany({ orderBy: { nombre: "asc" } }),
    prisma.subfamilia.findMany({ orderBy: { nombre: "asc" } }),
    prisma.marca.findMany({ orderBy: { nombre: "asc" } })
  ]);

  return (
    <AppShell title="Nuevo Artículo" subtitle="Crear ficha, precios y stock inicial">
      <ArticuloForm familias={familias} subfamilias={subfamilias} marcas={marcas} />
    </AppShell>
  );
}
