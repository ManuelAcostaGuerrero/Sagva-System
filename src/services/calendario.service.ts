import { prisma } from "@/lib/prisma";

export const CalendarioService = {
  crearFechaEspecial(datos: {
    fecha: Date;
    nombre: string;
    tipo: string;
    impactoEsperado?: string;
    observacion?: string;
  }) {
    return prisma.calendarioFecha.create({ data: datos });
  },

  listarFechas() {
    return prisma.calendarioFecha.findMany({
      orderBy: { fecha: "asc" }
    });
  },

  obtenerImpactoFecha(fecha: Date) {
    return prisma.calendarioFecha.findFirst({
      where: { fecha }
    });
  },

  async validarSemanaComparable(fechaInicio: Date, fechaFin: Date) {
    const fechasEspeciales = await prisma.calendarioFecha.count({
      where: {
        fecha: {
          gte: fechaInicio,
          lte: fechaFin
        }
      }
    });

    return {
      comparable: fechasEspeciales === 0,
      fechasEspeciales
    };
  }
};
