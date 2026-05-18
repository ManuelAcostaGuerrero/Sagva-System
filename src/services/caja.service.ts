import { prisma } from "@/lib/prisma";
import type { CajaAperturaInput, CajaCierreInput } from "@/types/caja.types";

export const CajaService = {
  async abrirCaja(datos: CajaAperturaInput) {
    const caja = await prisma.caja.create({
      data: {
        usuarioId: datos.usuarioId,
        sucursalId: datos.sucursalId,
        montoInicial: datos.montoInicial,
        observacion: datos.observacion
      }
    });

    await prisma.cajaApertura.create({
      data: {
        cajaId: caja.id,
        montoInicial: datos.montoInicial,
        observacion: datos.observacion
      }
    });

    return caja;
  },

  async cerrarCaja(datos: CajaCierreInput) {
    const cierre = await prisma.cajaCierre.create({
      data: {
        cajaId: datos.cajaId,
        efectivoContado: datos.efectivoContado,
        observacion: datos.observacion
      }
    });

    await prisma.caja.update({
      where: { id: datos.cajaId },
      data: {
        estado: "cerrada",
        fechaCierre: new Date(),
        efectivoContado: datos.efectivoContado
      }
    });

    return cierre;
  },

  obtenerCajaActiva(usuarioId: string) {
    return prisma.caja.findFirst({
      where: { usuarioId, estado: "abierta" },
      orderBy: { createdAt: "desc" }
    });
  },

  registrarIngreso(datos: { cajaId: string; monto: number; concepto: string; observacion?: string }) {
    return prisma.cajaMovimiento.create({
      data: { ...datos, tipo: "ingreso" }
    });
  },

  registrarRetiro(datos: { cajaId: string; monto: number; concepto: string; observacion?: string }) {
    return prisma.cajaMovimiento.create({
      data: { ...datos, tipo: "retiro" }
    });
  }
};
