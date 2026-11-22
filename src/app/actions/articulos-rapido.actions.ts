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

export async function asignarMarcaMasivaAction(ids: string[], marcaId: string | null) {
  await autorizarEdicionArticulos();
  if (!Array.isArray(ids) || !ids.length || ids.length > 100 ||
      ids.some(id => typeof id !== "string" || !id)) throw new Error("Selecciona entre 1 y 100 artículos.");
  if (marcaId) {
    const marca = await prisma.marca.findUnique({ where: { id: marcaId }, select: { id: true } });
    if (!marca) throw new Error("La marca no existe.");
  }
  const resultado = await prisma.articulo.updateMany({
    where: { id: { in: [...new Set(ids)] } }, data: { marcaId: marcaId || null }
  });
  return { ok: true, actualizados: resultado.count };
}

export async function crearMarcaRapidaAction(entrada: string) {
  await autorizarEdicionArticulos();
  if (typeof entrada !== "string" || entrada.length > 100) throw new Error("Nombre de marca inválido.");
  const nombre = entrada.normalize("NFC").trim().replace(/\s+/g," ");
  if (!nombre) throw new Error("Escribe el nombre de la marca.");
  const existentes = await prisma.marca.findMany({ select: { id: true, nombre: true } });
  const comparable = (value: string) => value.normalize("NFC").trim().toLocaleLowerCase("es");
  const encontrada = existentes.find(m => comparable(m.nombre) === comparable(nombre));
  const marca = encontrada ?? await prisma.marca.create({
    data: { nombre }, select: { id: true, nombre: true }
  });
  return { id: marca.id, nombre: marca.nombre };
}
