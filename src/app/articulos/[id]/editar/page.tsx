import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { ArticuloForm } from "@/components/forms/articulo-form";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function EditarArticuloPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const [articulo, familias, subfamilias, marcas] = await Promise.all([
    prisma.articulo.findUnique({
      where: { id: resolvedParams.id },
      include: {
        precios: {
          where: { vigente: true },
          orderBy: { createdAt: "desc" },
          take: 1
        }
      }
    }),
    prisma.familia.findMany({ orderBy: { nombre: "asc" } }),
    prisma.subfamilia.findMany({ orderBy: { nombre: "asc" } }),
    prisma.marca.findMany({ orderBy: { nombre: "asc" } })
  ]);

  if (!articulo) {
    notFound();
  }

  return (
    <AppShell title="Editar Artículo" subtitle={articulo.nombre}>
      <ArticuloForm
        articulo={articulo}
        familias={familias}
        subfamilias={subfamilias}
        marcas={marcas}
      />
    </AppShell>
  );
}
