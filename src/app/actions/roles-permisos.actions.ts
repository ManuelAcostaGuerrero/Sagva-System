"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { moduleSensitiveFields, permissionActions } from "@/config/permissions.config";
import { prisma } from "@/lib/prisma";
import { stringValue } from "@/lib/form-utils";

export async function createRoleAction(formData: FormData) {
  const codigo = stringValue(formData, "codigo").toLowerCase();
  const nombre = stringValue(formData, "nombre");

  if (!codigo || !nombre) redirect("/seguridad/roles?error=campos");

  const rol = await prisma.rol.create({ data: { codigo, nombre } });

  await prisma.auditoria.create({
    data: {
      modulo: "seguridad",
      accion: "crear_rol",
      entidad: "Rol",
      entidadId: rol.id,
      datoNuevo: JSON.stringify({ codigo, nombre }),
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

  if (!id || !codigo || !nombre) redirect("/seguridad/roles?error=campos");

  const before = await prisma.rol.findUnique({ where: { id } });
  if (!before) redirect("/seguridad/roles?error=no_existe");

  const after = await prisma.rol.update({ where: { id }, data: { codigo, nombre, descripcion: null } });

  await prisma.auditoria.create({
    data: {
      modulo: "seguridad",
      accion: "actualizar_rol",
      entidad: "Rol",
      entidadId: id,
      datoAnterior: JSON.stringify({ codigo: before.codigo, nombre: before.nombre }),
      datoNuevo: JSON.stringify({ codigo: after.codigo, nombre: after.nombre }),
      motivo: "Actualizacion de rol"
    }
  });

  revalidatePath("/seguridad/roles");
  revalidatePath("/seguridad/auditoria");
}

export async function deleteRoleAction(id: string) {
  if (!id) redirect("/seguridad/roles?error=rol");

  const rol = await prisma.rol.findUnique({
    where: { id },
    include: { usuarios: true, permisos: true }
  });

  if (!rol) redirect("/seguridad/roles?error=no_existe");
  if (rol.usuarios.length > 0) redirect("/seguridad/roles?error=rol_en_uso");

  await prisma.$transaction(async (tx) => {
    await tx.permiso.deleteMany({ where: { rolId: id } });
    await tx.rol.delete({ where: { id } });
    await tx.auditoria.create({
      data: {
        modulo: "seguridad",
        accion: "eliminar_rol",
        entidad: "Rol",
        entidadId: id,
        datoAnterior: JSON.stringify({ codigo: rol.codigo, nombre: rol.nombre, permisos: rol.permisos.length }),
        motivo: "Eliminacion de rol sin usuarios asignados"
      }
    });
  });

  revalidatePath("/seguridad");
  revalidatePath("/seguridad/roles");
  revalidatePath("/seguridad/permisos");
  revalidatePath("/seguridad/auditoria");
}

export async function savePermissionAction(formData: FormData) {
  const rolId = stringValue(formData, "rolId");
  const modulo = stringValue(formData, "modulo");
  const accion = stringValue(formData, "accion");
  const campoValue = stringValue(formData, "campo");
  const campo = campoValue.length > 0 ? campoValue : undefined;
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

export async function savePermissionMatrixAction(formData: FormData) {
  const rolId = stringValue(formData, "rolId");
  const modulo = stringValue(formData, "modulo") as keyof typeof moduleSensitiveFields;

  if (!rolId || !modulo || !(modulo in moduleSensitiveFields)) {
    redirect("/seguridad/permisos?error=campos");
  }

  const fields = ["__module__", ...moduleSensitiveFields[modulo]];
  const before = await prisma.permiso.findMany({ where: { rolId, modulo } });

  await prisma.$transaction(async (tx) => {
    for (const campoKey of fields) {
      const campo = campoKey === "__module__" ? null : campoKey;

      for (const accion of permissionActions) {
        const permitido = formData.get(`permiso:${campoKey}:${accion}`) === "on";

        await tx.permiso.upsert({
          where: { rolId_modulo_accion_campo: { rolId, modulo, accion, campo } },
          update: { permitido },
          create: { rolId, modulo, accion, campo, permitido }
        });
      }
    }

    await tx.auditoria.create({
      data: {
        modulo: "seguridad",
        accion: "guardar_matriz_permisos",
        entidad: "Permiso",
        entidadId: rolId,
        datoAnterior: JSON.stringify(before.map((item) => ({ accion: item.accion, campo: item.campo, permitido: item.permitido }))),
        datoNuevo: JSON.stringify({ rolId, modulo, campos: fields.length, acciones: permissionActions.length }),
        motivo: "Actualizacion matricial de permisos"
      }
    });
  });

  revalidatePath("/seguridad");
  revalidatePath("/seguridad/permisos");
  revalidatePath("/seguridad/auditoria");
  redirect(`/seguridad/permisos?rolId=${rolId}&modulo=${modulo}`);
}
