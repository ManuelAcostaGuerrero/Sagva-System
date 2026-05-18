import { AppShell } from "@/components/layout/app-shell";

export default function InventarioMovimientosPage() {
  return (
    <AppShell>
      <h2 className="text-2xl font-semibold text-ink">Movimientos de inventario</h2>
      <p className="mt-2 text-sm text-slate-600">Base para entradas, salidas, ajustes, ventas, facturas y ensamblajes.</p>
    </AppShell>
  );
}
