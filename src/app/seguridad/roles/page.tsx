import { AppShell } from "@/components/layout/app-shell";
import { SecurityNav } from "@/components/security/security-nav";
import { createRoleAction, updateRoleAction } from "@/app/actions/roles-permisos.actions";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function SeguridadRolesPage() {
  const roles = await prisma.rol.findMany({
    include: { usuarios: true, permisos: true },
    orderBy: { nombre: "asc" }
  });

  return (
    <AppShell title="Roles" subtitle="Perfiles de acceso para usuarios y operaciones del sistema">
      <section className="space-y-6">
        <SecurityNav />

        <form action={createRoleAction} className="sagva-panel p-5">
          <h2 className="text-lg font-bold text-slate-950">Crear nuevo rol</h2>
          <p className="mt-1 text-sm text-slate-500">Usa roles para agrupar permisos por responsabilidad operativa.</p>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <label className="text-sm font-semibold text-slate-700">Codigo<input name="codigo" required placeholder="supervisor_caja" className="mt-1 w-full rounded-md border border-[#d8dee8] px-3 py-2" /></label>
            <label className="text-sm font-semibold text-slate-700">Nombre<input name="nombre" required placeholder="Supervisor de caja" className="mt-1 w-full rounded-md border border-[#d8dee8] px-3 py-2" /></label>
            <label className="text-sm font-semibold text-slate-700">Descripcion<input name="descripcion" placeholder="Alcance del rol" className="mt-1 w-full rounded-md border border-[#d8dee8] px-3 py-2" /></label>
          </div>
          <button className="mt-5 rounded-md bg-[#064ea4] px-4 py-2 text-sm font-bold text-white hover:bg-[#043d82]" type="submit">Crear rol</button>
        </form>

        <div className="grid gap-4 xl:grid-cols-2">
          {roles.map((rol) => {
            const action = updateRoleAction.bind(null, rol.id);
            return (
              <form key={rol.id} action={action} className="sagva-panel p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-[#064ea4]">{rol.codigo}</p>
                    <h2 className="text-lg font-bold text-slate-950">{rol.nombre}</h2>
                    <p className="mt-1 text-sm text-slate-500">{rol.descripcion ?? "Sin descripcion"}</p>
                  </div>
                  <div className="text-right text-xs text-slate-500">
                    <p>{rol.usuarios.length} usuarios</p>
                    <p>{rol.permisos.length} permisos</p>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <label className="text-sm font-semibold text-slate-700">Codigo<input name="codigo" defaultValue={rol.codigo} required className="mt-1 w-full rounded-md border border-[#d8dee8] px-3 py-2" /></label>
                  <label className="text-sm font-semibold text-slate-700">Nombre<input name="nombre" defaultValue={rol.nombre} required className="mt-1 w-full rounded-md border border-[#d8dee8] px-3 py-2" /></label>
                  <label className="text-sm font-semibold text-slate-700 md:col-span-2">Descripcion<textarea name="descripcion" defaultValue={rol.descripcion ?? ""} className="mt-1 w-full rounded-md border border-[#d8dee8] px-3 py-2" rows={2} /></label>
                </div>
                <button className="mt-4 rounded-md border border-[#d8dee8] px-4 py-2 text-sm font-bold text-[#064ea4] hover:bg-blue-50" type="submit">Guardar rol</button>
              </form>
            );
          })}
        </div>
      </section>
    </AppShell>
  );
}
