"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { numberValue, optionalStringValue, stringValue } from "@/lib/form-utils";
import {
  calcularPrecioConIVA,
  calcularPrecioPublico,
  calcularPrecioSinIVA
} from "@/utils/calculations/prices";

async function ensureSucursalPrincipal() {
  return prisma.sucursal.upsert({
    where: { codigo: "principal" },
    update: { nombre: "Sucursal Principal", estado: "activo" },
    create: { codigo: "principal", nombre: "Sucursal Principal", estado: "activo" }
  });
}

function articuloDataFromForm(formData: FormData) {
  return {
    codigoProducto: stringValue(formData, "codigoProducto"),
    codigoInventario: optionalStringValue(formData, "codigoInventario"),
    codigoBarra: optionalStringValue(formData, "codigoBarra"),
    nombre: stringValue(formData, "nombre"),
    familiaId: optionalStringValue(formData, "familiaId"),
    subfamiliaId: optionalStringValue(formData, "subfamiliaId"),
    marcaId: optionalStringValue(formData, "marcaId"),
    unidadMedida: stringValue(formData, "unidadMedida") || "UND",
    cantidadEspecifica: optionalStringValue(formData, "cantidadEspecifica"),
    tipoImpuesto: stringValue(formData, "tipoImpuesto") || "IVA",
    impuestoAdicional: numberValue(formData, "impuestoAdicional", 0),
    stockMinimo: numberValue(formData, "stockMinimo", 0),
    stockMaximo: numberValue(formData, "stockMaximo", 0),
    comentario: optionalStringValue(formData, "comentario"),
    estado: stringValue(formData, "estado") || "activo"
  };
}

function precioDataFromForm(formData: FormData) {
  const precioConIvaInput = numberValue(formData, "precioConIva", 0);
  const precioSinIvaInput = numberValue(formData, "precioSinIva", 0);
  const margen = numberValue(formData, "margen", 30) / 100;
  const precioSinIva =
    precioSinIvaInput > 0 ? precioSinIvaInput : calcularPrecioSinIVA(precioConIvaInput);
  const precioConIva =
    precioConIvaInput > 0 ? precioConIvaInput : calcularPrecioConIVA(precioSinIva);

  return {
    precioConIva,
    precioSinIva,
    margen,
    precioPublico: calcularPrecioPublico(precioConIva, margen),
    precioMayorista: numberValue(formData, "precioMayorista", 0),
    cantidadMinimaMayorista: numberValue(formData, "cantidadMinimaMayorista", 0)
  };
}

export async function crearArticuloAction(formData: FormData) {
  const articuloData = articuloDataFromForm(formData);
  const precioData = precioDataFromForm(formData);
  const stockInicial = numberValue(formData, "stockInicial", 0);

  if (!articuloData.codigoProducto || !articuloData.nombre) {
    redirect("/articulos/nuevo?error=campos");
  }

  const sucursal = await ensureSucursalPrincipal();

  const articulo = await prisma.articulo.create({
    data: {
      ...articuloData,
      precios: {
        create: precioData
      },
      stocks: {
        create: {
          sucursalId: sucursal.id,
          stockActual: stockInicial,
          stockMinimo: articuloData.stockMinimo,
          stockMaximo: articuloData.stockMaximo
        }
      }
    }
  });

  if (stockInicial !== 0) {
    await prisma.inventarioMovimiento.create({
      data: {
        articuloId: articulo.id,
        sucursalId: sucursal.id,
        tipoMovimiento: "entrada",
        cantidad: stockInicial,
        observacion: "Stock inicial"
      }
    });
  }

  revalidatePath("/articulos");
  revalidatePath("/inventario");
  redirect("/articulos");
}

export async function actualizarArticuloAction(id: string, formData: FormData) {
  const articuloData = articuloDataFromForm(formData);
  const precioData = precioDataFromForm(formData);

  await prisma.$transaction([
    prisma.articulo.update({
      where: { id },
      data: articuloData
    }),
    prisma.articuloPrecio.updateMany({
      where: { articuloId: id },
      data: { vigente: false }
    }),
    prisma.articuloPrecio.create({
      data: {
        articuloId: id,
        ...precioData
      }
    })
  ]);

  revalidatePath("/articulos");
  revalidatePath(`/articulos/${id}/editar`);
  redirect("/articulos");
}
