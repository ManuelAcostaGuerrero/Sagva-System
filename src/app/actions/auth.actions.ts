"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createSession, destroySession } from "@/lib/session";
import { stringValue } from "@/lib/form-utils";

export async function loginAction(formData: FormData) {
  const correo = stringValue(formData, "correo").toLowerCase();
  const password = stringValue(formData, "password");

  const user = await prisma.usuario.findUnique({
    where: { correo }
  });

  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    redirect("/login?error=credenciales");
  }

  await createSession(user.id);
  redirect("/dashboard");
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}
