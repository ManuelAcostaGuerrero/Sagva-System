"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { numeroDecimalValidado, optionalStringValue, stringValue } from "@/lib/form-utils";
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
    familiaId: stringValue(formData, "familiaId") || null,
    subfamiliaId: stringValue(formData, "subfamiliaId") || null,
    marcaId: optionalStringValue(formData, "marcaId"),
    unidadMedida: stringValue(formData, "unidadMedida") || "UND",
    cantidadEspecifica: optionalStringValue(formData, "cantidadEspecifica"),
    tipoImpuesto: stringValue(formData, "tipoImpuesto") || "IVA",
    impuestoAdicional: numeroDecimalValidado(formData, "impuestoAdicional"),
    stockMinimo: numeroDecimalValidado(formData, "stockMinimo", 3),
    stockMaximo: numeroDecimalValidado(formData, "stockMaximo", 3),
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

async function validarFamiliaSubfamilia(familiaId: string | null, subfamiliaId: string | null) {
  if (!subfamiliaId) return;
  if (!familiaId) throw new Error("Selecciona una familia antes de elegir subfamilia.");
  const subfamilia = await prisma.subfamilia.findUnique({
    where: { id: subfamiliaId },
    select: { familiaId: true }
  });
  if (!subfamilia || subfamilia.familiaId !== familiaId) {
    throw new Error("La subfamilia seleccionada no pertenece a la familia indicada.");
  }
}

type ReglaMayorista = { cantidadMinima: number; precioUnitario: number };

function reglasMayoristasFromForm(formData: FormData): ReglaMayorista[] {
  const entrada = formData.get("reglasMayoristas");
  if (typeof entrada !== "string" || entrada.length > 12000) {
    throw new Error("La lista mayorista está ausente o supera el tamaño permitido.");
  }
  let parseado: unknown;
  try {
    parseado = JSON.parse(entrada);
  } catch {
    throw new Error("Formato inválido de reglas mayoristas.");
  }
  if (!Array.isArray(parseado) || parseado.length > 30) {
    throw new Error("La lista debe contener entre cero y treinta reglas.");
  }

  const vistos = new Set<number>();
  const validar = (valor: unknown, decimales: number): number => {
    if (typeof valor !== "string") throw new Error("Una regla contiene valores no numéricos.");
    const patron = new RegExp("^\\d{1,12}(?:[.,]\\d{1," + decimales + "})?$");
    if (!patron.test(valor)) throw new Error("Cantidad o precio mayorista con formato inválido.");
    const numero = Number(valor.replace(",", "."));
    if (!Number.isFinite(numero) || numero <= 0 || numero >= 1_000_000_000_000) {
      throw new Error("La cantidad y el precio mayorista deben ser mayores que cero.");
    }
    return numero;
  };

  return parseado.map((dato: unknown) => {
    if (!dato || typeof dato !== "object" || Array.isArray(dato)) {
      throw new Error("Una regla mayorista contiene datos inválidos.");
    }
    const registro = dato as Record<string, unknown>;
    const cantidadMinima = validar(registro.cantidadMinima, 3);
    const precioUnitario = validar(registro.precioUnitario, 2);
    if (vistos.has(cantidadMinima)) {
      throw new Error("No puede haber dos reglas mayoristas con la misma cantidad mínima.");
    }
    vistos.add(cantidadMinima);
    return { cantidadMinima, precioUnitario };
  }).sort((a, b) => a.cantidadMinima - b.cantidadMinima);
}

function generarCodigoInterno() {
  // No depende del número de artículos: no se repiten códigos al eliminar registros.
  return `ART-${randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase()}`;
}

function precioDataFromForm(formData: FormData) {
  const precioConIvaInput = numeroDecimalValidado(formData, "precioConIva");
  const precioSinIvaInput = numeroDecimalValidado(formData, "precioSinIva");
  const margen = numeroDecimalValidado(formData, "margen") / 100;
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
    // Se conservan columnas anteriores por compatibilidad pero las nuevas reglas van en tabla propia.
    precioMayorista: null,
    cantidadMinimaMayorista: null
  };
}

export async function crearArticuloAction(formData: FormData) {
  const articuloData = articuloDataFromForm(formData);
  const precioData = precioDataFromForm(formData);
  const stockInicial = numeroDecimalValidado(formData, "stockInicial", 3);
  const vinculacion = vinculacionProveedorFromForm(formData);
  const reglasMayoristas = reglasMayoristasFromForm(formData);
  await validarFamiliaSubfamilia(articuloData.familiaId, articuloData.subfamiliaId);

  if (!articuloData.nombre) {
    redirect("/articulos/nuevo?error=campos");
  }

  const sucursal = await ensureSucursalPrincipal();

  const articulo = await prisma.articulo.create({
    data: {
      ...articuloData,
      codigoProducto: generarCodigoInterno(),
      reglasMayoristas: reglasMayoristas.length
        ? { create: reglasMayoristas }
        : undefined,
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
  const reglasMayoristas = reglasMayoristasFromForm(formData);
  await validarFamiliaSubfamilia(articuloData.familiaId, articuloData.subfamiliaId);

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
    // Reemplazar las reglas en la misma transacción para que agregar, editar o eliminar
    // no deje el artículo con una lista parcial en caso de error.
    await tx.articuloReglaMayorista.deleteMany({ where: { articuloId: id } });
    if (reglasMayoristas.length > 0) {
      await tx.articuloReglaMayorista.createMany({
        data: reglasMayoristas.map((regla) => ({ articuloId: id, ...regla }))
      });
    }

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
