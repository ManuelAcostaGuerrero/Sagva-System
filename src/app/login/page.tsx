import { LockKeyhole, Package } from "lucide-react";
import { loginAction } from "@/app/actions/auth.actions";

export default async function LoginPage({
  searchParams
}: {
  searchParams?: Promise<{ error?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const hasError = resolvedSearchParams?.error === "credenciales";

  return (
    <main className="grid min-h-screen bg-[#f5f7fb] lg:grid-cols-[460px_1fr]">
      <section className="flex min-h-screen flex-col justify-between bg-[#001a33] px-10 py-8 text-white">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-md border border-white/40">
            <Package className="h-7 w-7" aria-hidden="true" />
          </div>
          <div>
            <p className="text-3xl font-bold tracking-wide">SAGVA</p>
            <p className="text-xs font-semibold tracking-[0.35em] text-white/80">SYSTEM</p>
          </div>
        </div>
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-200">
            Gestión comercial
          </p>
          <h1 className="mt-3 text-4xl font-bold leading-tight">
            Ventas, inventario y análisis en un solo entorno.
          </h1>
          <p className="mt-4 text-sm leading-6 text-white/70">
            Accede al panel para administrar artículos, proveedores, compras,
            stock, caja y reportes operativos.
          </p>
        </div>
        <p className="text-xs text-white/45">Sagva System - entorno local</p>
      </section>

      <section className="flex items-center justify-center px-6 py-10">
        <form action={loginAction} className="w-full max-w-md sagva-panel p-7">
          <div className="flex h-12 w-12 items-center justify-center rounded-md bg-blue-50 text-[#064ea4]">
            <LockKeyhole className="h-6 w-6" aria-hidden="true" />
          </div>
          <h2 className="mt-5 text-2xl font-bold text-slate-950">Iniciar sesión</h2>
          <p className="mt-2 text-sm text-slate-600">
            Usa el usuario inicial creado por el seed o cualquier usuario registrado.
          </p>

          {hasError ? (
            <div className="mt-5 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
              Correo o contraseña incorrectos.
            </div>
          ) : null}

          <div className="mt-6 space-y-4">
            <label className="block">
              <span className="sagva-label">Correo</span>
              <input
                name="correo"
                type="email"
                defaultValue="admin@sagva.local"
                className="sagva-field"
                required
              />
            </label>
            <label className="block">
              <span className="sagva-label">Contraseña</span>
              <input
                name="password"
                type="password"
                defaultValue="admin123"
                className="sagva-field"
                required
              />
            </label>
          </div>

          <button className="mt-6 w-full sagva-button-primary">Entrar</button>
        </form>
      </section>
    </main>
  );
}
