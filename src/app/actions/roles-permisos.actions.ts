"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { optionalStringValue, stringValue } from "@/lib/form-utils";

export async function createRoleAction(formData: FormData) {
  const codigo = stringValue(formData, "codigo").toLowerCase();
  const nombre = stringValue(formData, "nombre");
  const descripcion = optionalStringValue(formData, "descripcion");

  if (!codigo || !nombre) redirect("/seguridad/roles?error=campos");

  const rol = await prisma.rol.create({ data: { codigo, nombre, descripcion } });

  await prisma.auditoria.create({
    data: {
      modulo: "seguridad",
      accion: "crear_rol",
      entidad: "Rol",
      entidadId: rol.id,
      datoNuevo: JSON.stringify({ codigo, nombre, descripcion }),
      motivo: "Creacion de rol"
    }
  });

  revalidatePath("/seguridad");
  revalidatePath("/seguridad/roles");
  revalidatePath("/seguridad/auditoria");
}

export async function updateRoleAction(id: string, formData: FormData) {
  const codigo = stringValue(formData, "codigo").toLowerCase();
  const nombre = stringValue(formData, "nombre");
  const descripcion = optionalStringValue(formData, "descripcion");

  if (!id || !codigo || !nombre) redirect("/seguridad/roles?error=campos");

  const before = await prisma.rol.findUnique({ where: { id } });
  if (!before) redirect("/seguridad/roles?error=no_existe");

  const after = await prisma.rol.update({ where: { id }, data: { codigo, nombre, descripcion } });

  await prisma.auditoria.create({
    data: {
      modulo: "seguridad",
      accion: "actualizar_rol",
      entidad: "Rol",
      entidadId: id,
      datoAnterior: JSON.stringify({ codigo: before.codigo, nombre: before.nombre, descripcion: before.descripcion }),
      datoNuevo: JSON.stringify({ codigo: after.codigo, nombre: after.nombre, descripcion: after.descripcion }),
      motivo: "Actualizacion de rol"
    }
  });

  revalidatePath("/seguridad/roles");
  revalidatePath("/seguridad/auditoria");
}

export async function savePermissionAction(formData: FormData) {
  const rolId = stringValue(formData, "rolId");
  const modulo = stringValue(formData, "modulo");
  const accion = stringValue(formData, "accion");
  const campo = optionalStringValue(formData, "campo");
  const permitido = stringValue(formData, "permitido") === "true";

  if (!rolId || !modulo || !accion) redirect("/seguridad/permisos?error=campos");

  const permiso = await prisma.permiso.upsert({
    where: { rolId_modulo_accion_campo: { rolId, modulo, accion, campo } },
    update: { permitido },
    create: { rolId, modulo, accion, campo, permitido }
  });

  await prisma.auditoria.create({
    data: {
      modulo: "seguridad",
      accion: "guardar_permiso",
      entidad: "Permiso",
      entidadId: permiso.id,
      datoNuevo: JSON.stringify({ rolId, modulo, accion, campo, permitido }),
      motivo: "Configuracion de permiso"
    }
  });

  revalidatePath("/seguridad");
  revalidatePath("/seguridad/permisos");
  revalidatePath("/seguridad/auditoria");
}
