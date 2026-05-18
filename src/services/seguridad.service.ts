import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const SeguridadService = {
  async crearUsuario(datos: {
    nombre: string;
    correo: string;
    password: string;
    rolId?: string;
  }) {
    return prisma.usuario.create({
      data: {
        nombre: datos.nombre,
        correo: datos.correo,
        passwordHash: await bcrypt.hash(datos.password, 10),
        rolId: datos.rolId
      }
    });
  },

  crearRol(datos: { codigo: string; nombre: string; descripcion?: string }) {
    return prisma.rol.create({ data: datos });
  },

  asignarPermiso(datos: {
    rolId: string;
    modulo: string;
    accion: string;
    campo?: string;
    permitido?: boolean;
  }) {
    return prisma.permiso.create({
      data: {
        ...datos,
        permitido: datos.permitido ?? true
      }
    });
  },

  async validarPermiso(rolId: string, modulo: string, accion: string, campo?: string) {
    const permiso = await prisma.permiso.findFirst({
      where: {
        rolId,
        modulo,
        accion,
        campo
      }
    });

    return permiso?.permitido ?? false;
  },

  registrarAuditoria(datos: {
    usuarioId?: string;
    modulo: string;
    accion: string;
    entidad?: string;
    entidadId?: string;
    datoAnterior?: unknown;
    datoNuevo?: unknown;
    motivo?: string;
  }) {
    return prisma.auditoria.create({
      data: {
        usuarioId: datos.usuarioId,
        modulo: datos.modulo,
        accion: datos.accion,
        entidad: datos.entidad,
        entidadId: datos.entidadId,
        datoAnterior: datos.datoAnterior ?? undefined,
        datoNuevo: datos.datoNuevo ?? undefined,
        motivo: datos.motivo
      }
    });
  }
};
