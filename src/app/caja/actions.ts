"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

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
      estado: "abierta",
    },
  });

  if (cajaAbierta) {
    redirect("/caja?error=caja_abierta");
  }

  await prisma.$transaction(async (tx) => {
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
  });

  revalidatePath("/caja");
  revalidatePath("/venta/nueva");
  redirect("/caja?success=abierta");
}

export async function cerrarCajaAction(formData: FormData) {
  await requireUser();
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

    if (!caja || caja.estado !== "abierta") {
      throw new Error("No existe una caja abierta para cerrar.");
    }

    const efectivoEsperado = caja.movimientos.reduce(
      (sum, mov) => sum + Number(mov.monto),
      0,
    );
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
  await requireUser();
  const cajaId = stringFromForm(formData, "cajaId");
  const tipo = stringFromForm(formData, "tipo");
  const monto = numberFromForm(formData, "monto", 0);
  const concepto = stringFromForm(formData, "concepto") || tipo.toUpperCase();
  const observacion = stringFromForm(formData, "observacionMovimiento");

  if (!cajaId || !tipo || monto <= 0) {
    redirect("/caja?error=movimiento_invalido");
  }

  const signedAmount = tipo === "retiro" ? monto * -1 : monto;

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
