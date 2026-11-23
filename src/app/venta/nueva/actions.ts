"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import type { Prisma } from "@prisma/client";
import { puedeAutorizarDescuento } from "@/lib/venta-permisos";
import { precioPorCantidad, type TramoMayorista } from "@/lib/venta-precios";
import { diaOperativo } from "@/lib/dia-operativo";

type LineaVentaInput = {
  articuloId: string;
  cantidad: number;
  precioUnitario: number;
  descuento: number;
};

type PagoVentaInput = {
  metodo: string;
  monto: number;
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

async function obtenerSiguienteFolio(sucursalId: string, tx: Prisma.TransactionClient) {
  const ventas = await tx.venta.findMany({
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

  const quickMetodo = stringValue(formData, "quickMetodo").toLowerCase();
  const accion = quickMetodo ? "cobrar" : stringValue(formData, "accion") || "pendiente";
  const sucursalId = stringValue(formData, "sucursalId");
  const clienteNombre = stringValue(formData, "cliente");
  const observacion = stringValue(formData, "observacion");
  const efectivoRecibido = Number(stringValue(formData, "efectivoRecibido") || 0);
  const lineas = jsonValue<LineaVentaInput[]>(formData, "lineas", []);
  const pagos = jsonValue<PagoVentaInput[]>(formData, "pagos", []);
  const idempotencyKey = stringValue(formData, "idempotencyKey");

  if (!/^[a-zA-Z0-9_-]{12,100}$/.test(idempotencyKey)) {
    return { error: "Identificador de venta inválido. Recarga la caja y vuelve a intentar." };
  }
  if (!Array.isArray(lineas) || !Array.isArray(pagos) || lineas.length > 100 || pagos.length > 20) {
    return { error: "La venta supera los límites de líneas o pagos." };
  }
  if (quickMetodo && !["efectivo", "debito", "credito", "transferencia"].includes(quickMetodo)) {
    return { error: "Medio de pago no admitido." };
  }
  if (!["cobrar", "pendiente"].includes(accion)) {
    return { error: "Acción de venta inválida." };
  }

  if (!sucursalId) {
    redirect("/venta/nueva?error=sucursal");
  }

  if (!lineas.length) {
    redirect("/venta/nueva?error=sin_productos");
  }

  const lineasValidas = lineas.map((linea) => {
    const cantidad = Number(linea.cantidad);
    const precioUnitario = Number(linea.precioUnitario);
    const descuento = Number(linea.descuento ?? 0);

    const subtotalBruto = cantidad * precioUnitario;
    if (!linea.articuloId || !Number.isFinite(cantidad) || cantidad <= 0 || cantidad > 99999 ||
        !Number.isFinite(precioUnitario) || precioUnitario < 0 || !Number.isFinite(subtotalBruto) ||
        !Number.isFinite(descuento) || descuento < 0 || descuento > toMoney(subtotalBruto)) {
      throw new Error("La venta contiene una línea inválida.");
    }

    const totalLinea = toMoney(subtotalBruto - descuento);

    return {
      articuloId: linea.articuloId,
      cantidad,
      precioUnitario,
      descuento,
      totalLinea,
    };
  });

  const total = toMoney(lineasValidas.reduce((sum, linea) => sum + linea.totalLinea, 0));

  let pagosValidos = pagos
    .map((pago) => ({
      metodo: String(pago.metodo || "EFECTIVO").toLowerCase(),
      monto: Number(pago.monto),
    }))
    .filter((pago) => Number.isFinite(pago.monto) && pago.monto > 0);
  if (pagos.some(p => !p || !Number.isFinite(Number(p.monto)) || Number(p.monto) <= 0 ||
      !["efectivo","debito","credito","transferencia"].includes(String(p.metodo).toLowerCase()))) {
    return { error: "Hay un pago inválido o un medio de pago desconocido." };
  }

  if (accion === "cobrar" && quickMetodo) {
    if (quickMetodo === "efectivo") {
      if (!Number.isFinite(efectivoRecibido) || efectivoRecibido < total) {
        redirect("/venta/nueva?error=efectivo_insuficiente");
      }

      pagosValidos = [
        {
          metodo: "efectivo",
          monto: total, // En caja se registra el valor vendido, no todo el efectivo recibido.
        },
      ];
    } else {
      pagosValidos = [
        {
          metodo: quickMetodo,
          monto: total,
        },
      ];
    }
  }

  const totalPagado = toMoney(pagosValidos.reduce((sum, pago) => sum + pago.monto, 0));
  const saldoPendiente = toMoney(Math.max(total - totalPagado, 0));
  const vuelto = quickMetodo === "efectivo"
    ? toMoney(Math.max(efectivoRecibido - total, 0))
    : toMoney(Math.max(totalPagado - total, 0));
  if (totalPagado > total) return { error: "Los pagos registrados superan el total de la venta." };

  if (accion === "cobrar" && saldoPendiente > 0) {
    redirect("/venta/nueva?error=saldo_pendiente");
  }

  const autorizadoDescuento = await puedeAutorizarDescuento(user);
  if (lineasValidas.some(linea => linea.descuento > 0) && !autorizadoDescuento) {
    return { error: "Descuento no autorizado. Solicita a un administrador con permisos." };
  }
  try {
    await prisma.$transaction(async (tx) => {
      // Asociar la venta únicamente a la caja de este usuario y jornada.
      // Si aún no existe, la venta se cobra dejando cajaId = null.
      const momentoVenta = new Date();
      const cajaUsuario = accion === "cobrar"
        ? await tx.caja.findFirst({
            where: { sucursalId, usuarioId: user.id, estado: "abierta" },
            orderBy: { fechaApertura: "desc" },
            select: { id: true, fechaApertura: true }
          })
        : null;
      const cajaIdAsociada = cajaUsuario &&
        diaOperativo(cajaUsuario.fechaApertura) === diaOperativo(momentoVenta)
        ? cajaUsuario.id : null;
      // Verificar en la misma transacción que ningún precio/estado cambió desde que se armó la venta.
      const ids = [...new Set(lineasValidas.map((linea) => linea.articuloId))];
      const [articulos, precios, reglas] = await Promise.all([
        tx.articulo.findMany({ where: { id: { in: ids }, estado: "activo", tipoArticulo: { not: "PROMOCION" } }, select: { id: true } }),
        tx.articuloPrecio.findMany({ where: { articuloId: { in: ids }, vigente: true },
          orderBy: { createdAt: "desc" }, select: { articuloId: true, precioPublico: true, precioMayorista: true, cantidadMinimaMayorista: true } }),
        tx.articuloReglaMayorista.findMany({ where: { articuloId: { in: ids } },
          select: { articuloId: true, cantidadMinima: true, precioUnitario: true } }),
      ]);
      const activos = new Set(articulos.map((articulo) => articulo.id));
      const preciosVigentes = new Map<string, { publico: number; legacy: TramoMayorista | null }>();
      const tramosPorArticulo = new Map<string, TramoMayorista[]>();
      for (const regla of reglas) {
        const tramos = tramosPorArticulo.get(regla.articuloId) ?? [];
        tramos.push({ cantidadMinima: Number(regla.cantidadMinima), precioUnitario: Number(regla.precioUnitario) });
        tramosPorArticulo.set(regla.articuloId, tramos);
      }
      for (const precio of precios) {
        if (!preciosVigentes.has(precio.articuloId)) preciosVigentes.set(precio.articuloId, {
          publico: Number(precio.precioPublico),
          legacy: precio.precioMayorista && precio.cantidadMinimaMayorista
            ? { cantidadMinima: Number(precio.cantidadMinimaMayorista), precioUnitario: Number(precio.precioMayorista) }
            : null
        });
      }
      for (const linea of lineasValidas) {
        const vigente = preciosVigentes.get(linea.articuloId);
        const tramos = tramosPorArticulo.get(linea.articuloId) ?? [];
        const aplicables = tramos.length ? tramos : vigente?.legacy ? [vigente.legacy] : [];
        const esperado = vigente ? precioPorCantidad(vigente.publico, linea.cantidad, aplicables) : null;
        if (!activos.has(linea.articuloId) || esperado === null ||
            Math.abs(esperado - linea.precioUnitario) > 0.005) {
          throw new Error("SAGVA_PRECIO_O_ESTADO_CAMBIO");
        }
      }
      const folioDefinitivo = accion === "cobrar" ? await obtenerSiguienteFolio(sucursalId, tx) : null;

      const venta = await tx.venta.create({
        data: {
          idTemporal: `VT-${user.id}-${idempotencyKey}`,
          folioDefinitivo,
          vendedorId: user.id,
          clienteId: null,
          sucursalId,
          cajaId: cajaIdAsociada,
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
          // Se permite cobrar sin existencias: el saldo pasa a negativo y se deja trazabilidad.
          // Upsert es atómico por (articuloId, sucursalId): evita perder salidas simultáneas.
          const actualizado = await tx.inventarioStock.upsert({
            where: {
              articuloId_sucursalId: {
                articuloId: linea.articuloId,
                sucursalId
              }
            },
            create: {
              articuloId: linea.articuloId,
              sucursalId,
              stockActual: -linea.cantidad
            },
            update: { stockActual: { decrement: linea.cantidad } },
            select: { stockActual: true }
          });
          const stockDespues = Number(actualizado.stockActual);

          await tx.inventarioMovimiento.create({
            data: {
              articuloId: linea.articuloId,
              sucursalId,
              tipoMovimiento: stockDespues < 0 ? "salida_venta_sin_stock" : "salida_venta",
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
          },
        });

        if (accion === "cobrar" && cajaIdAsociada) {
          await tx.cajaMovimiento.create({
            data: {
              cajaId: cajaIdAsociada,
              tipo: "venta",
              monto: pago.monto,
              concepto: `BOLETA:${folioDefinitivo ?? venta.id}`,
              observacion: pago.metodo.toUpperCase(),
            },
          });
        }
      }

      if (observacion || clienteNombre || lineasValidas.some(l => l.descuento > 0)) {
        await tx.auditoria.create({
          data: {
            usuarioId: user.id,
            accion: accion === "cobrar" ? "VENTA_COBRADA" : "VENTA_PENDIENTE",
            modulo: "ventas",
            entidad: "Venta",
            entidadId: venta.id,
            datoNuevo: JSON.stringify({ clienteNombre, observacion,
              descuentos: lineasValidas.filter(l => l.descuento > 0).map(l => ({ articuloId: l.articuloId, cantidad: l.cantidad, descuento: l.descuento })) }),
            motivo: observacion || clienteNombre || null,
          },
        });
      }
    });
  } catch (error) {
    if (error instanceof Error && error.message === "SAGVA_PRECIO_O_ESTADO_CAMBIO") {
      return { error: "El precio o estado cambió. Vuelve a buscar y agregar el artículo." };
    }
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
      const detalle = "meta" in error ? JSON.stringify(error.meta) : "";
      return { error: detalle.includes("folio")
        ? "Otro cobro tomó el folio disponible. Revisa el historial y vuelve a intentar."
        : "Esta venta puede estar ya registrada. Revisa el historial antes de cobrar de nuevo." };
    }
    throw error;
  }

  revalidatePath("/dashboard");
  revalidatePath("/venta/nueva");
  revalidatePath("/venta/abiertas");
  revalidatePath("/inventario");
  revalidatePath("/caja");

  if (accion === "cobrar") {
    if (pagosValidos.length === 1 && pagosValidos[0]?.metodo === "efectivo") {
      redirect(`/venta/nueva?success=cobrada&pago=${totalPagado}&vuelto=${vuelto}`);
    }
    redirect("/venta/nueva?success=cobrada");
  }

  redirect("/venta/abiertas?success=pendiente");
}
