"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { optionalStringValue, stringValue } from "@/lib/form-utils";

export async function updateAccountRoleAction(id: string, formData: FormData) {
  const nombre = stringValue(formData, "nombre");
  const rolId = stringValue(formData, "rolId");
  const estado = stringValue(formData, "estado") || "activo";
  const motivo = optionalStringValue(formData, "motivo") ?? "Cambio administrativo";

  if (!id || !nombre || !rolId) redirect("/seguridad/usuarios");

  const before = await prisma.usuario.findUnique({ where: { id } });
  if (!before) redirect("/seguridad/usuarios");

  const after = await prisma.usuario.update({ where: { id }, data: { nombre, rolId, estado } });

  await prisma.auditoria.create({
    data: {
      modulo: "seguridad",
      accion: "actualizar_usuario",
      entidad: "Usuario",
      entidadId: id,
      datoAnterior: JSON.stringify({ nombre: before.nombre, rolId: before.rolId, estado: before.estado }),
      datoNuevo: JSON.stringify({ nombre: after.nombre, rolId: after.rolId, estado: after.estado }),
      motivo
    }
  });

  revalidatePath("/seguridad/usuarios");
  revalidatePath("/seguridad/auditoria");
  redirect("/seguridad/usuarios");
}
