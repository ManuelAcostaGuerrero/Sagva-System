import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { getCurrentUser } from "@/lib/session";
import { LaboratorioDTEClient } from "./laboratorio-dte-client";

export const dynamic = "force-dynamic";

export default async function LaboratorioDTEPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return (
    <AppShell title="Laboratorio DTE" subtitle="Escáner PDF417 y XML · Pruebas aisladas, sin afectar SAGVA">
      <LaboratorioDTEClient />
    </AppShell>
  );
}
