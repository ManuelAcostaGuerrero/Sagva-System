"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { numberValue, optionalStringValue, stringValue } from "@/lib/form-utils";

async function ensureSucursalPrincipal() {
  return prisma.sucursal.upsert({
    where: { codigo: "principal" },
    update: {}, // No sobrescribir el nombre ni el estado de la sucursal.
    create: { codigo: "principal", nombre: "Sucursal Principal", estado: "activo" }
  });
}

export async function registrarMovimientoInventarioAction(formData: FormData) {
  const articuloId = stringValue(formData, "articuloId");
  const tipoMovimiento = stringValue(formData, "tipoMovimiento");
  const cantidad = numberValue(formData, "cantidad", 0);
  const observacion = optionalStringValue(formData, "observacion");

  if (!articuloId || !["entrada", "salida", "merma", "ajuste"].includes(tipoMovimiento) ||
      !Number.isFinite(cantidad) || cantidad <= 0) {
    return;
  }

  const sucursal = await ensureSucursalPrincipal();
  // Entrada suma, salida/merma descuentan, ajuste fija el stock físico final.
  const variacion = tipoMovimiento === "entrada" ? cantidad : -cantidad;

  await prisma.$transaction(async tx => {
    await tx.inventarioStock.upsert({
      where: { articuloId_sucursalId: { articuloId, sucursalId: sucursal.id } },
      create: {
        articuloId, sucursalId: sucursal.id,
        stockActual: tipoMovimiento === "ajuste" ? cantidad : variacion
      },
      update: {
        stockActual: tipoMovimiento === "ajuste"
          ? cantidad
          : { increment: variacion }
      }
    });
    await tx.inventarioMovimiento.create({
      data: { articuloId, sucursalId: sucursal.id, tipoMovimiento, cantidad, observacion }
    });
  });

  revalidatePath("/inventario");
  revalidatePath("/inventario/movimientos");
  revalidatePath("/inventario/ajustes");
}
