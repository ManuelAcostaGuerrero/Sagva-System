"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { optionalStringValue, stringValue } from "@/lib/form-utils";

export async function crearProveedorAction(formData: FormData) {
  const codigo = stringValue(formData, "codigo");
  const rutRuc = stringValue(formData, "rutRuc");
  const razonSocial = stringValue(formData, "razonSocial");

  if (!codigo || !rutRuc || !razonSocial) {
    redirect("/proveedores/nuevo?error=campos");
  }

  await prisma.proveedor.create({
    data: {
      codigo,
      rutRuc,
      razonSocial,
      nombreComercial: optionalStringValue(formData, "nombreComercial"),
      direccion: optionalStringValue(formData, "direccion"),
      contacto: optionalStringValue(formData, "contacto"),
      telefono: optionalStringValue(formData, "telefono"),
      correo: optionalStringValue(formData, "correo"),
      condicionesComerciales: optionalStringValue(formData, "condicionesComerciales"),
      estado: "activo"
    }
  });

  revalidatePath("/proveedores");
  redirect("/proveedores");
}
