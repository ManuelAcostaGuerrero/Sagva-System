import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { StatCard } from "@/components/dashboard/stat-card";

export default function DashboardPage() {
  return (
    <AppShell>
      <section className="space-y-6">
        <div>
          <h2 className="text-3xl font-semibold text-ink">Dashboard</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Primer tablero para conectar ventas, inventario, caja, proveedores y calendario cuando existan datos reales.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Módulos" value="11" helper="Rutas base creadas" />
          <StatCard label="Servicios" value="10" helper="Capa inicial de dominio" />
          <StatCard label="Base de datos" value="29" helper="Modelos Prisma iniciales" />
          <StatCard label="Estado" value="MVP" helper="Aplicación armable" />
        </div>
        <div className="rounded-md border border-line bg-white p-5 shadow-subtle">
          <h3 className="text-base font-semibold text-ink">Orden sugerido</h3>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {[
              ["1", "Seguridad base", "/seguridad/usuarios"],
              ["2", "Artículos", "/articulos"],
              ["3", "Inventario", "/inventario"]
            ].map(([step, label, href]) => (
              <Link
                key={step}
                href={href}
                className="rounded-md border border-line px-4 py-3 hover:bg-panel"
              >
                <p className="text-xs font-semibold text-brand-700">Paso {step}</p>
                <p className="mt-1 text-sm font-medium text-ink">{label}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </AppShell>
  );
}
