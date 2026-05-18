import { prisma } from "@/lib/prisma";
import type { EnsamblajeInput } from "@/types/ensamblaje.types";

export const EnsamblajeService = {
  crearEnsamblaje(datos: EnsamblajeInput) {
    return prisma.ensamblaje.create({
      data: {
        productoFinalId: datos.productoFinalId,
        nombre: datos.nombre,
        observacion: datos.observacion,
        componentes: {
          create: datos.componentes.map((component) => ({
            componenteId: component.componenteId,
            cantidadRequerida: component.cantidadRequerida,
            costoComponente: component.costoComponente
          }))
        }
      }
    });
  },

  calcularDisponibilidad(id: string) {
    return prisma.ensamblaje.findUnique({
      where: { id },
      include: {
        componentes: {
          include: {
            componente: {
              include: { stocks: true }
            }
          }
        }
      }
    });
  },

  ejecutarEnsamblaje(id: string, cantidad: number) {
    return prisma.ensamblajeMovimiento.create({
      data: {
        ensamblajeId: id,
        tipo: "ensamblaje",
        cantidad
      }
    });
  },

  desarmarEnsamblaje(id: string, cantidad: number, motivo: string) {
    return prisma.ensamblajeMovimiento.create({
      data: {
        ensamblajeId: id,
        tipo: "desarme",
        cantidad,
        motivo
      }
    });
  }
};
