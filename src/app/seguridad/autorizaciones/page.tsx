import { AppShell } from "@/components/layout/app-shell";

export default function SeguridadAutorizacionesPage() {
  return (
    <AppShell>
      <h2 className="text-2xl font-semibold text-ink">Autorizaciones</h2>
      <p className="mt-2 text-sm text-slate-600">Base para acciones que requieren aprobación de un usuario autorizado.</p>
    </AppShell>
  );
}
