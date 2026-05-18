export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-panel px-5 py-10">
      <section className="w-full max-w-md rounded-md border border-line bg-white p-6 shadow-subtle">
        <p className="text-sm font-medium text-brand-700">Sagva System</p>
        <h1 className="mt-2 text-2xl font-semibold text-ink">Acceso base</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Pantalla inicial preparada para conectar autenticación con usuarios, roles y permisos.
        </p>
        <form className="mt-6 space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Correo</span>
            <input
              type="email"
              defaultValue="admin@sagva.local"
              className="mt-1 w-full rounded-md border border-line px-3 py-2 text-sm outline-none focus:border-brand-600"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Contraseña</span>
            <input
              type="password"
              defaultValue="admin123"
              className="mt-1 w-full rounded-md border border-line px-3 py-2 text-sm outline-none focus:border-brand-600"
            />
          </label>
          <button
            type="button"
            className="w-full rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
          >
            Entrar
          </button>
        </form>
      </section>
    </main>
  );
}
