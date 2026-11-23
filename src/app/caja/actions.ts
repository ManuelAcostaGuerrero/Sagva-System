"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { diaOperativo } from "@/lib/dia-operativo";

function numberFromForm(formData: FormData, key: string, fallback = 0) {
  const value = formData.get(key);
  const parsed = typeof value === "string" ? Number(value) : fallback;
  return Number.isFinite(parsed) ? parsed : fallback;
}

function stringFromForm(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

async function requireSucursal() {
  const sucursal = await prisma.sucursal.findFirst({
    orderBy: { createdAt: "asc" },
  });

  if (!sucursal) {
    throw new Error("No existe una sucursal configurada.");
  }

  return sucursal;
}

export async function abrirCajaAction(formData: FormData) {
  const user = await requireUser();
  const sucursal = await requireSucursal();
  const montoInicial = numberFromForm(formData, "montoInicial", 0);
  const observacion = stringFromForm(formData, "observacion");

  const cajaAbierta = await prisma.caja.findFirst({
    where: {
      sucursalId: sucursal.id,
      usuarioId: user.id,
      estado: "abierta",
    },
  });

  if (cajaAbierta) {
    redirect("/caja?error=caja_abierta");
  }

  await prisma.$transaction(async (tx) => {
    const existente = await tx.caja.findFirst({
      where: { sucursalId: sucursal.id, usuarioId: user.id, estado: "abierta" },
      select: { id: true }
    });
    if (existente) throw new Error("Ya tienes una caja abierta en esta sucursal.");
    const caja = await tx.caja.create({
      data: {
        sucursalId: sucursal.id,
        usuarioId: user.id,
        estado: "abierta",
        montoInicial,
        observacion: observacion || null,
      },
    });

    await tx.cajaApertura.create({
      data: {
        cajaId: caja.id,
        montoInicial,
        observacion: observacion || null,
      },
    });

    await tx.cajaMovimiento.create({
      data: {
        cajaId: caja.id,
        tipo: "apertura",
        monto: montoInicial,
        concepto: "APERTURA_CAJA",
        observacion: observacion || "Apertura de caja",
      },
    });

    // Al abrir, recuperar ventas cobradas previamente por este mismo usuario,
    // sucursal y día comercial; no tocar otros cajeros o jornadas anteriores.
    const diaActual = diaOperativo(new Date());
    const inicioBusqueda = new Date(Date.now() - 48 * 60 * 60 * 1000);
    const ventasSinCaja = await tx.venta.findMany({
      where: {
        cajaId: null,
        vendedorId: user.id,
        sucursalId: sucursal.id,
        estado: "cobrada",
        createdAt: { gte: inicioBusqueda }
      },
      select: {
        id: true, createdAt: true, folioDefinitivo: true,
        pagos: { select: { metodoPago: true, monto: true } }
      },
      orderBy: { createdAt: "asc" }
    });
    for (const venta of ventasSinCaja) {
      if (diaOperativo(venta.createdAt) !== diaActual) continue;
      const vinculada = await tx.venta.updateMany({
        where: { id: venta.id, cajaId: null, vendedorId: user.id,
          sucursalId: sucursal.id, estado: "cobrada" },
        data: { cajaId: caja.id }
      });
      if (vinculada.count !== 1) continue; // Idempotencia: sin movimientos duplicados.
      for (const pago of venta.pagos) {
        await tx.cajaMovimiento.create({
          data: {
            cajaId: caja.id,
            tipo: "venta",
            monto: pago.monto,
            concepto: "BOLETA:" + (venta.folioDefinitivo ?? venta.id),
            observacion: pago.metodoPago.toUpperCase() + " · Antes de apertura"
          }
        });
      }
    }
  });

  revalidatePath("/caja");
  revalidatePath("/venta/nueva");
  redirect("/caja?success=abierta");
}

export async function cerrarCajaAction(formData: FormData) {
  const user = await requireUser();
  const cajaId = stringFromForm(formData, "cajaId");
  const efectivoContado = numberFromForm(formData, "efectivoContado", 0);
  const observacion = stringFromForm(formData, "observacionCierre");

  if (!cajaId) {
    redirect("/caja?error=sin_caja");
  }

  await prisma.$transaction(async (tx) => {
    const caja = await tx.caja.findUnique({
      where: { id: cajaId },
      include: { movimientos: true },
    });

    if (!caja || caja.estado !== "abierta" || caja.usuarioId !== user.id) {
      throw new Error("Solo puedes cerrar tu caja abierta.");
    }

    // Cuadratura de efectivo: tarjeta y transferencia no son dinero en la gaveta.
    // También sirve para ventas vinculadas después de la apertura.
    const efectivoEsperado = caja.movimientos.reduce((sum, mov) => {
      if (mov.tipo === "venta" && !(mov.observacion ?? "").toUpperCase().startsWith("EFECTIVO")) {
        return sum;
      }
      return sum + Number(mov.monto);
    }, 0);
    const diferencia = efectivoContado - efectivoEsperado;

    await tx.cajaCierre.create({
      data: {
        cajaId: caja.id,
        efectivoContado,
        diferencia,
        observacion: observacion || null,
      },
    });

    await tx.caja.update({
      where: { id: caja.id },
      data: {
        estado: "cerrada",
        fechaCierre: new Date(),
        efectivoContado,
        observacion: observacion || caja.observacion,
      },
    });

    await tx.cajaMovimiento.create({
      data: {
        cajaId: caja.id,
        tipo: "cierre",
        monto: 0,
        concepto: "CIERRE_CAJA",
        observacion: observacion || "Cierre de caja",
      },
    });
  });

  revalidatePath("/caja");
  revalidatePath("/venta/nueva");
  redirect("/caja?success=cerrada");
}

export async function registrarMovimientoCajaAction(formData: FormData) {
  const user = await requireUser();
  const cajaId = stringFromForm(formData, "cajaId");
  const tipo = stringFromForm(formData, "tipo");
  const monto = numberFromForm(formData, "monto", 0);
  const concepto = stringFromForm(formData, "concepto") || tipo.toUpperCase();
  const observacion = stringFromForm(formData, "observacionMovimiento");

  if (!cajaId || !tipo || monto <= 0) {
    redirect("/caja?error=movimiento_invalido");
  }

  const signedAmount = tipo === "retiro" ? monto * -1 : monto;

  const caja = await prisma.caja.findUnique({
    where: { id: cajaId }, select: { usuarioId: true, estado: true }
  });
  if (!caja || caja.estado !== "abierta" || caja.usuarioId !== user.id) {
    throw new Error("Solo puedes registrar movimientos en tu caja abierta.");
  }

  await prisma.cajaMovimiento.create({
    data: {
      cajaId,
      tipo,
      monto: signedAmount,
      concepto,
      observacion: observacion || null,
    },
  });

  revalidatePath("/caja");
  redirect("/caja?success=movimiento");
}
