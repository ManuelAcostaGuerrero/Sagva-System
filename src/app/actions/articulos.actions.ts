"use server";

import { randomUUID } from "node:crypto";
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

function vinculacionProveedorFromForm(formData: FormData) {
  const proveedorId = stringValue(formData, "proveedorId");
  const codigo = stringValue(formData, "codigoProveedor");
  if (Boolean(proveedorId) !== Boolean(codigo)) {
    throw new Error("Para guardar un código externo debes seleccionar proveedor y completar su código.");
  }
  return proveedorId && codigo ? { proveedorId, codigo } : null;
}

function generarCodigoInterno() {
  // No depende del número de artículos: no se repiten códigos al eliminar registros.
  return `ART-${randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase()}`;
}

function precioDataFromForm(formData: FormData) {
  const precioConIvaInput = numberValue(formData, "precioConIva", 0);
  const precioSinIvaInput = numberValue(formData, "precioSinIva", 0);
  const margen = Math.max(0, numberValue(formData, "margen", 30)) / 100;
  const tipoImpuesto = stringValue(formData, "tipoImpuesto") || "IVA";
  const ultimoEditado = stringValue(formData, "ultimoPrecioEditado");

  // La edición más reciente manda: no ignorar un precio con IVA modificado.
  const precioSinIva = tipoImpuesto === "exento"
    ? (ultimoEditado === "sin" ? precioSinIvaInput : precioConIvaInput)
    : ultimoEditado === "sin"
      ? precioSinIvaInput
      : calcularPrecioSinIVA(precioConIvaInput);
  const precioConIva = tipoImpuesto === "exento"
    ? precioSinIva
    : ultimoEditado === "sin"
      ? calcularPrecioConIVA(precioSinIva)
      : precioConIvaInput;

  return {
    precioConIva,
    precioSinIva,
    margen,
    // ILA se guarda en el artículo como referencia tributaria; no altera el precio comercial.
    precioPublico: calcularPrecioPublico(precioConIva, margen),
    precioMayorista: numberValue(formData, "precioMayorista", 0),
    cantidadMinimaMayorista: numberValue(formData, "cantidadMinimaMayorista", 0)
  };
}

export async function crearArticuloAction(formData: FormData) {
  const articuloData = articuloDataFromForm(formData);
  const precioData = precioDataFromForm(formData);
  const stockInicial = numberValue(formData, "stockInicial", 0);
  const vinculacion = vinculacionProveedorFromForm(formData);

  if (!articuloData.nombre) {
    redirect("/articulos/nuevo?error=campos");
  }

  const sucursal = await ensureSucursalPrincipal();

  const articulo = await prisma.articulo.create({
    data: {
      ...articuloData,
      codigoProducto: generarCodigoInterno(),
      proveedorProductos: vinculacion
        ? {
            create: {
              proveedorId: vinculacion.proveedorId,
              productoProveedorCodigo: vinculacion.codigo,
              productoProveedorNombre: articuloData.nombre
            }
          }
        : undefined,
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
  const vinculacion = vinculacionProveedorFromForm(formData);

  await prisma.$transaction(async (tx) => {
    // Consultar desde BD evita que el formulario modifique códigos de otros artículos.
    const asociaciones = await tx.proveedorProductoAsociado.findMany({
      where: { articuloId: id },
      select: { id: true, productoProveedorCodigo: true }
    });

    await tx.articulo.update({
      where: { id },
      data: articuloData
    });
    await tx.articuloPrecio.updateMany({
      where: { articuloId: id },
      data: { vigente: false }
    });
    await tx.articuloPrecio.create({
      data: { articuloId: id, ...precioData }
    });

    for (const asociacion of asociaciones) {
      const codigoNuevo = stringValue(formData, `codigoProveedorExistente_${asociacion.id}`);
      if (!codigoNuevo) {
        throw new Error("Los códigos existentes de proveedor no pueden quedar vacíos.");
      }
      if (codigoNuevo !== asociacion.productoProveedorCodigo) {
        await tx.proveedorProductoAsociado.update({
          where: { id: asociacion.id },
          data: { productoProveedorCodigo: codigoNuevo }
        });
      }
    }

    if (vinculacion) {
      const existente = await tx.proveedorProductoAsociado.findUnique({
        where: {
          proveedorId_productoProveedorCodigo: {
            proveedorId: vinculacion.proveedorId,
            productoProveedorCodigo: vinculacion.codigo
          }
        }
      });
      if (existente && existente.articuloId !== id) {
        throw new Error("Este código del proveedor ya corresponde a otro artículo.");
      }
      if (!existente) {
        await tx.proveedorProductoAsociado.create({
          data: {
            articuloId: id,
            proveedorId: vinculacion.proveedorId,
            productoProveedorCodigo: vinculacion.codigo,
            productoProveedorNombre: articuloData.nombre
          }
        });
      }
    }
  });

  revalidatePath("/articulos");
  revalidatePath(`/articulos/${id}/editar`);
  redirect("/articulos");
}
