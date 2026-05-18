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
