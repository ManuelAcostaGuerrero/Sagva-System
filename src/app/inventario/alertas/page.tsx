import { AppShell } from "@/components/layout/app-shell";

export default function InventarioAlertasPage() {
  return (
    <AppShell>
      <h2 className="text-2xl font-semibold text-ink">Alertas de stock</h2>
      <p className="mt-2 text-sm text-slate-600">Base para stock crítico, sobrestock y compras sugeridas.</p>
    </AppShell>
  );
}
