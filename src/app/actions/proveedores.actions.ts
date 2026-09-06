"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { optionalStringValue, stringValue } from "@/lib/form-utils";

export async function crearProveedorAction(formData: FormData) {
  const codigo = stringValue(formData, "codigo");
  const rut = stringValue(formData, "rut");
  const razonSocial = stringValue(formData, "razonSocial");

  if (!codigo || !rut || !razonSocial) {
    redirect("/proveedores/nuevo?error=campos");
  }

  await prisma.proveedor.create({
    data: {
      codigo,
      rut,
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
