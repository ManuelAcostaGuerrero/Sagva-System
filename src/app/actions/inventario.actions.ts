"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { numberValue, optionalStringValue, stringValue } from "@/lib/form-utils";

async function ensureSucursalPrincipal() {
  return prisma.sucursal.upsert({
    where: { codigo: "principal" },
    update: { nombre: "Sucursal Principal", estado: "activo" },
    create: { codigo: "principal", nombre: "Sucursal Principal", estado: "activo" }
  });
}

export async function registrarMovimientoInventarioAction(formData: FormData) {
  const articuloId = stringValue(formData, "articuloId");
  const tipoMovimiento = stringValue(formData, "tipoMovimiento");
  const cantidad = numberValue(formData, "cantidad", 0);
  const observacion = optionalStringValue(formData, "observacion");

  if (!articuloId || !tipoMovimiento || cantidad <= 0) {
    return;
  }

  const sucursal = await ensureSucursalPrincipal();
  const factor = tipoMovimiento === "salida" ? -1 : 1;
  const cantidadAjuste = tipoMovimiento === "ajuste" ? cantidad : cantidad * factor;

  await prisma.$transaction(async (tx) => {
    const stock = await tx.inventarioStock.upsert({
      where: {
        articuloId_sucursalId: {
          articuloId,
          sucursalId: sucursal.id
        }
      },
      update: {},
      create: {
        articuloId,
        sucursalId: sucursal.id,
        stockActual: 0
      }
    });

    await tx.inventarioStock.update({
      where: { id: stock.id },
      data: {
        stockActual:
          tipoMovimiento === "ajuste"
            ? cantidad
            : Number(stock.stockActual) + cantidadAjuste
      }
    });

    await tx.inventarioMovimiento.create({
      data: {
        articuloId,
        sucursalId: sucursal.id,
        tipoMovimiento,
        cantidad,
        observacion
      }
    });
  });

  revalidatePath("/inventario");
  revalidatePath("/inventario/movimientos");
  revalidatePath("/inventario/ajustes");
}
