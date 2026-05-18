import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function createSession(userId: string) {
  const cookieStore = await cookies();
  cookieStore.set("sagva_user_id", userId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8
  });
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete("sagva_user_id");
}

export async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("sagva_user_id")?.value;

    if (!userId) {
      return null;
    }

    return prisma.usuario.findUnique({
      where: { id: userId },
      include: { rol: true }
    });
  } catch {
    return null;
  }
}
