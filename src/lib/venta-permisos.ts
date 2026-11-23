import { prisma } from "@/lib/prisma";

/** Política conservadora: administradores o rol con autorización explícita en venta. */
export async function puedeAutorizarDescuento(
  user: { rolId: string | null; rol?: { codigo: string } | null } | null
): Promise<boolean> {
  if (!user) return false;
  if (user.rol?.codigo === "admin" || user.rol?.codigo === "root") return true;
  if (!user.rolId) return false;
  const permiso = await prisma.permiso.findFirst({
    where: { rolId: user.rolId, modulo: "venta", accion: "autorizar", permitido: true,
      OR: [{ campo: "autorizar_descuento" }, { campo: "descuento_especial" }] },
    select: { id: true }
  });
  return !!permiso;
}
