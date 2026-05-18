import { AppShell } from "@/components/layout/app-shell";

export default function NuevaFacturaPage() {
  return (
    <AppShell>
      <section className="max-w-4xl rounded-md border border-line bg-white p-5 shadow-subtle">
        <h2 className="text-2xl font-semibold text-ink">Nueva factura</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {["Número factura", "Proveedor", "Fecha emisión", "Fecha recepción"].map((label) => (
            <label key={label} className="block">
              <span className="text-sm font-medium text-slate-700">{label}</span>
              <input className="mt-1 w-full rounded-md border border-line px-3 py-2 text-sm outline-none focus:border-brand-600" />
            </label>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
