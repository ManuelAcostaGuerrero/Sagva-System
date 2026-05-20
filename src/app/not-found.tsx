import Link from "next/link";

export default function NotFoundPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f5f7fb] px-5">
      <section className="w-full max-w-xl rounded-xl border border-[#d8dee8] bg-white p-8 text-center shadow-sm">
        <p className="text-sm font-bold uppercase tracking-wide text-[#064ea4]">Error 404</p>
        <h1 className="mt-3 text-3xl font-bold text-slate-950">Pagina no encontrada</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          La ruta que intentaste abrir no existe o todavia no tiene una pantalla creada en Sagva System.
          Revisa la direccion o vuelve al panel principal.
        </p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/dashboard" className="rounded-md bg-[#064ea4] px-4 py-2 text-sm font-bold text-white hover:bg-[#043d82]">
            Ir al inicio
          </Link>
          <Link href="/seguridad" className="rounded-md border border-[#d8dee8] px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50">
            Ir a seguridad
          </Link>
        </div>
      </section>
    </main>
  );
}
