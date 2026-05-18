import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";

type ModulePageProps = {
  title: string;
  description: string;
  status?: string;
  primaryAction?: {
    label: string;
    href: string;
  };
  screens: string[];
  service: string;
  pending: string[];
};

export function ModulePage({
  title,
  description,
  status = "Base lista",
  primaryAction,
  screens,
  service,
  pending
}: ModulePageProps) {
  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-brand-700">{status}</p>
          <h2 className="mt-1 text-3xl font-semibold text-ink">{title}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{description}</p>
        </div>
        {primaryAction ? (
          <Link
            href={primaryAction.href}
            className="inline-flex items-center gap-2 rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
          >
            {primaryAction.label}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        ) : null}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-md border border-line bg-white p-5 shadow-subtle">
          <h3 className="text-base font-semibold text-ink">Pantallas iniciales</h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {screens.map((screen) => (
              <div key={screen} className="flex items-center gap-2 rounded-md border border-line px-3 py-2">
                <CheckCircle2 className="h-4 w-4 text-brand-600" aria-hidden="true" />
                <span className="text-sm text-slate-700">{screen}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-md border border-line bg-white p-5 shadow-subtle">
          <h3 className="text-base font-semibold text-ink">Servicio conectado</h3>
          <p className="mt-3 rounded-md bg-panel px-3 py-2 font-mono text-sm text-slate-700">
            {service}
          </p>
          <h3 className="mt-5 text-base font-semibold text-ink">Siguientes definiciones</h3>
          <ul className="mt-3 space-y-2">
            {pending.map((item) => (
              <li key={item} className="text-sm leading-5 text-slate-600">
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
