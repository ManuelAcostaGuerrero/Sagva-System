import Link from "next/link";
import { moduleAreas, modulesConfig } from "@/config/modules.config";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[280px_1fr]">
      <aside className="border-b border-line bg-white lg:min-h-screen lg:border-b-0 lg:border-r">
        <div className="border-b border-line px-6 py-5">
          <Link href="/dashboard" className="block">
            <p className="text-lg font-semibold text-ink">Sagva System</p>
            <p className="mt-1 text-xs text-slate-500">Ventas, inventario y análisis</p>
          </Link>
        </div>
        <nav className="space-y-5 px-4 py-5">
          {moduleAreas.map((area) => (
            <div key={area}>
              <p className="px-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                {area}
              </p>
              <div className="mt-2 space-y-1">
                {modulesConfig
                  .filter((moduleItem) => moduleItem.area === area)
                  .map((moduleItem) => {
                    const Icon = moduleItem.icon;
                    return (
                      <Link
                        key={moduleItem.key}
                        href={moduleItem.href}
                        className="flex items-center gap-3 rounded-md px-2 py-2 text-sm text-slate-700 hover:bg-panel hover:text-ink"
                      >
                        <Icon className="h-4 w-4" aria-hidden="true" />
                        <span>{moduleItem.label}</span>
                      </Link>
                    );
                  })}
              </div>
            </div>
          ))}
        </nav>
      </aside>
      <main className="min-w-0">
        <header className="border-b border-line bg-white px-5 py-4 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm text-slate-500">Aplicación armable</p>
              <h1 className="text-xl font-semibold text-ink">Base modular inicial</h1>
            </div>
            <Link
              href="/login"
              className="rounded-md border border-line px-3 py-2 text-sm font-medium text-slate-700 hover:bg-panel"
            >
              Login
            </Link>
          </div>
        </header>
        <div className="px-5 py-6 lg:px-8">{children}</div>
      </main>
    </div>
  );
}
