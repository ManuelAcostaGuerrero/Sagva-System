"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { optionalStringValue, stringValue } from "@/lib/form-utils";

export async function crearFamiliaAction(formData: FormData) {
  const nombre = stringValue(formData, "nombre");
  if (!nombre) return;

  await prisma.familia.create({ data: { nombre } });
  revalidatePath("/articulos/nuevo");
}

export async function crearMarcaAction(formData: FormData) {
  const nombre = stringValue(formData, "nombre");
  if (!nombre) return;

  await prisma.marca.create({ data: { nombre } });
  revalidatePath("/articulos/nuevo");
}

export async function crearSubfamiliaAction(formData: FormData) {
  const nombre = stringValue(formData, "nombre");
  const familiaId = optionalStringValue(formData, "familiaId");
  if (!nombre || !familiaId) return;

  await prisma.subfamilia.create({ data: { nombre, familiaId } });
  revalidatePath("/articulos/nuevo");
}


type ResultadoCatalogo =
  | { ok: true; id: string; nombre: string }
  | { ok: false; error: string };

function validarNombreCatalogo(entrada: string): { nombre: string; error: string | null } {
  if (typeof entrada !== "string" || entrada.length > 200) {
    return { nombre: "", error: "El nombre no es válido." };
  }
  const nombre = entrada.normalize("NFC").trim().replace(/\s+/g, " ");
  if (!nombre || nombre.length > 100) {
    return { nombre: "", error: "Escribe un nombre de hasta 100 caracteres." };
  }
  return { nombre, error: null };
}

function nombreComparable(nombre: string) {
  return nombre.normalize("NFC").trim().replace(/\s+/g, " ").toLocaleLowerCase("es");
}

// Creación directa desde la ficha: reutiliza las categorías ya existentes.
// Los botones de esta ficha no envían el formulario completo del artículo.
export async function crearFamiliaDesdeArticuloAction(entrada: string): Promise<ResultadoCatalogo> {
  const { nombre, error } = validarNombreCatalogo(entrada);
  if (error) return { ok: false, error };

  const existentes = await prisma.familia.findMany({ select: { id: true, nombre: true } });
  const encontrada = existentes.find((familia) => nombreComparable(familia.nombre) === nombreComparable(nombre));
  if (encontrada) return { ok: true, id: encontrada.id, nombre: encontrada.nombre };

  const creada = await prisma.familia.create({
    data: { nombre },
    select: { id: true, nombre: true }
  });
  revalidatePath("/articulos");
  revalidatePath("/articulos/nuevo");
  return { ok: true, id: creada.id, nombre: creada.nombre };
}

export async function crearSubfamiliaDesdeArticuloAction(familiaId: string, entrada: string): Promise<ResultadoCatalogo> {
  if (typeof familiaId !== "string" || !familiaId.trim()) {
    return { ok: false, error: "Selecciona una familia antes de crear una subfamilia." };
  }
  const familia = await prisma.familia.findUnique({ where: { id: familiaId }, select: { id: true } });
  if (!familia) return { ok: false, error: "La familia seleccionada no existe." };

  const { nombre, error } = validarNombreCatalogo(entrada);
  if (error) return { ok: false, error };

  const existentes = await prisma.subfamilia.findMany({
    where: { familiaId },
    select: { id: true, nombre: true }
  });
  const encontrada = existentes.find((subfamilia) => nombreComparable(subfamilia.nombre) === nombreComparable(nombre));
  if (encontrada) return { ok: true, id: encontrada.id, nombre: encontrada.nombre };

  const creada = await prisma.subfamilia.create({
    data: { nombre, familiaId },
    select: { id: true, nombre: true }
  });
  revalidatePath("/articulos");
  revalidatePath("/articulos/nuevo");
  return { ok: true, id: creada.id, nombre: creada.nombre };
}
