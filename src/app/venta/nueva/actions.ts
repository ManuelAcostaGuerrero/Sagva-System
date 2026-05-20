"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

type LineaVentaInput = {
  articuloId: string;
  cantidad: number;
  precioUnitario: number;
  descuento: number;
};

type PagoVentaInput = {
  metodo: string;
  monto: number;
  referencia?: string | null;
};

function jsonValue<T>(formData: FormData, key: string, fallback: T): T {
  const raw = formData.get(key);
  if (typeof raw !== "string" || !raw.trim()) return fallback;

  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function stringValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function toMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

async function obtenerSiguienteFolio(sucursalId: string) {
  const ventas = await prisma.venta.findMany({
    where: {
      sucursalId,
      folioDefinitivo: {
        startsWith: "B-",
      },
    },
    select: {
      folioDefinitivo: true,
    },
  });

  const max = ventas.reduce((current, venta) => {
    const value = Number(venta.folioDefinitivo?.replace(/\D/g, "") ?? 0);
    return Number.isFinite(value) && value > current ? value : current;
  }, 0);

  return `B-${String(max + 1).padStart(8, "0")}`;
}

export async function guardarVentaAction(formData: FormData) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const accion = stringValue(formData, "accion") || "pendiente";
  const sucursalId = stringValue(formData, "sucursalId");
  const cajaId = stringValue(formData, "cajaId");
  const clienteNombre = stringValue(formData, "cliente");
  const observacion = stringValue(formData, "observacion");
  const lineas = jsonValue<LineaVentaInput[]>(formData, "lineas", []);
  const pagos = jsonValue<PagoVentaInput[]>(formData, "pagos", []);

  if (!sucursalId) {
    redirect("/venta/nueva?error=sucursal");
  }

  if (!lineas.length) {
    redirect("/venta/nueva?error=sin_productos");
  }

  if (accion === "cobrar" && !cajaId) {
    redirect("/venta/nueva?error=sin_caja");
  }

  const lineasValidas = lineas.map((linea) => {
    const cantidad = Number(linea.cantidad);
    const precioUnitario = Number(linea.precioUnitario);
    const descuento = Number(linea.descuento ?? 0);

    if (!linea.articuloId || cantidad <= 0 || precioUnitario < 0 || descuento < 0) {
      throw new Error("La venta contiene una línea inválida.");
    }

    const totalLinea = toMoney(Math.max(cantidad * precioUnitario - descuento, 0));

    return {
      articuloId: linea.articuloId,
      cantidad,
      precioUnitario,
      descuento,
      totalLinea,
    };
  });

  const pagosValidos = pagos
    .map((pago) => ({
      metodo: String(pago.metodo || "EFECTIVO").toLowerCase(),
      monto: Number(pago.monto),
      referencia: pago.referencia?.trim() || null,
    }))
    .filter((pago) => Number.isFinite(pago.monto) && pago.monto > 0);

  const total = toMoney(lineasValidas.reduce((sum, linea) => sum + linea.totalLinea, 0));
  const totalPagado = toMoney(pagosValidos.reduce((sum, pago) => sum + pago.monto, 0));
  const saldoPendiente = toMoney(Math.max(total - totalPagado, 0));
  const vuelto = toMoney(Math.max(totalPagado - total, 0));

  if (accion === "cobrar" && saldoPendiente > 0) {
    redirect("/venta/nueva?error=saldo_pendiente");
  }

  await prisma.$transaction(async (tx) => {
    const folioDefinitivo = accion === "cobrar" ? await obtenerSiguienteFolio(sucursalId) : null;

    const venta = await tx.venta.create({
      data: {
        idTemporal: `VT-${user.id}-${Date.now()}`,
        folioDefinitivo,
        vendedorId: user.id,
        clienteId: null,
        sucursalId,
        cajaId: cajaId || null,
        total,
        totalPagado,
        saldoPendiente,
        vuelto,
        estado: accion === "cobrar" ? "cobrada" : "pendiente",
        finalizedAt: accion === "cobrar" ? new Date() : null,
      },
    });

    for (const linea of lineasValidas) {
      await tx.ventaDetalle.create({
        data: {
          ventaId: venta.id,
          articuloId: linea.articuloId,
          cantidad: linea.cantidad,
          precioUnitario: linea.precioUnitario,
          totalLinea: linea.totalLinea,
        },
      });

      if (accion === "cobrar") {
        const stock = await tx.inventarioStock.findUnique({
          where: {
            articuloId_sucursalId: {
              articuloId: linea.articuloId,
              sucursalId,
            },
          },
        });

        const stockAntes = stock ? Number(stock.stockActual) : 0;
        const stockDespues = stockAntes - linea.cantidad;

        if (stock) {
          await tx.inventarioStock.update({
            where: { id: stock.id },
            data: {
              stockActual: stockDespues,
            },
          });
        } else {
          await tx.inventarioStock.create({
            data: {
              articuloId: linea.articuloId,
              sucursalId,
              stockActual: stockDespues,
            },
          });
        }

        await tx.inventarioMovimiento.create({
          data: {
            articuloId: linea.articuloId,
            sucursalId,
            tipoMovimiento: stockAntes <= 0 ? "salida_venta_sin_stock" : "salida_venta",
            cantidad: linea.cantidad,
            documentoOrigenTipo: "BOLETA",
            documentoOrigenId: venta.id,
            usuarioId: user.id,
            observacion:
              stockDespues < 0
                ? `Salida por venta ${folioDefinitivo}. Stock quedó negativo (${stockDespues}).`
                : `Salida por venta ${folioDefinitivo}`,
          },
        });
      }
    }

    for (const pago of pagosValidos) {
      await tx.ventaPago.create({
        data: {
          ventaId: venta.id,
          metodoPago: pago.metodo,
          monto: pago.monto,
          referencia: pago.referencia,
        },
      });

      if (accion === "cobrar" && cajaId) {
        await tx.cajaMovimiento.create({
          data: {
            cajaId,
            tipo: "venta",
            monto: pago.monto,
            concepto: `BOLETA:${folioDefinitivo ?? venta.id}`,
            observacion: pago.referencia
              ? `${pago.metodo.toUpperCase()} - ${pago.referencia}`
              : pago.metodo.toUpperCase(),
          },
        });
      }
    }

    if (observacion || clienteNombre) {
      await tx.auditoria.create({
        data: {
          usuarioId: user.id,
          accion: accion === "cobrar" ? "VENTA_COBRADA" : "VENTA_PENDIENTE",
          entidad: "Venta",
          entidadId: venta.id,
          datoNuevo: JSON.stringify({ clienteNombre, observacion }),
          motivo: observacion || clienteNombre || null,
        },
      });
    }
  });

  revalidatePath("/dashboard");
  revalidatePath("/venta/nueva");
  revalidatePath("/venta/abiertas");
  revalidatePath("/inventario");
  revalidatePath("/caja");

  if (accion === "cobrar") {
    const pagoEfectivo = pagosValidos.length === 1 && pagosValidos[0]?.metodo === "efectivo";
    if (pagoEfectivo) {
      redirect(`/venta/nueva?success=cobrada&pago=${totalPagado}&vuelto=${vuelto}`);
    }
    redirect("/venta/nueva?success=cobrada");
  }

  redirect("/venta/abiertas?success=pendiente");
}
