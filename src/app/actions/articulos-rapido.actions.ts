"use server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

type CambioRapido = {
  familiaId: string | null;
  subfamiliaId: string | null;
  marcaId: string | null;
  estado: "activo" | "inactivo";
};

async function autorizarEdicionArticulos() {
  const usuario = await getCurrentUser();
  if (!usuario || usuario.estado !== "activo") throw new Error("Inicia sesión para editar.");
  if (usuario.rol?.codigo === "admin" || usuario.rol?.codigo === "root") return;
  if (!usuario.rolId) throw new Error("No tienes permiso para editar artículos.");
  const permitido = await prisma.permiso.findFirst({
    where: { rolId: usuario.rolId, modulo: "articulos", accion: "editar",
      permitido: true, campo: null },
    select: { id: true }
  });
  if (!permitido) throw new Error("No tienes permiso para editar artículos.");
}

export async function guardarClasificacionRapidaAction(id: string, cambios: CambioRapido) {
  await autorizarEdicionArticulos();
  if (!id || !["activo", "inactivo"].includes(cambios.estado)) throw new Error("Datos inválidos.");
  if (cambios.familiaId) {
    const familia = await prisma.familia.findUnique({ where: { id: cambios.familiaId }, select: { id: true } });
    if (!familia) throw new Error("La familia no existe.");
  }
  if (cambios.subfamiliaId) {
    if (!cambios.familiaId) throw new Error("Selecciona una familia antes de la subfamilia.");
    const subfamilia = await prisma.subfamilia.findUnique({
      where: { id: cambios.subfamiliaId }, select: { familiaId: true }
    });
    if (subfamilia?.familiaId !== cambios.familiaId) throw new Error("La subfamilia no pertenece a la familia.");
  }
  if (cambios.marcaId) {
    const marca = await prisma.marca.findUnique({ where: { id: cambios.marcaId }, select: { id: true } });
    if (!marca) throw new Error("La marca no existe.");
  }
  await prisma.articulo.update({
    where: { id },
    data: { familiaId: cambios.familiaId || null, subfamiliaId: cambios.subfamiliaId || null,
      marcaId: cambios.marcaId || null, estado: cambios.estado }
  });
  return { ok: true };
}
