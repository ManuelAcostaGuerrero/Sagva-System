import { AppShell } from "@/components/layout/app-shell";
import { SecurityNav } from "@/components/security/security-nav";
import { createRoleAction } from "@/app/actions/roles-permisos.actions";
import { prisma } from "@/lib/prisma";
import { RolesTable } from "./roles-table";

export const dynamic = "force-dynamic";

export default async function SeguridadRolesPage() {
  const roles = await prisma.rol.findMany({
    include: { usuarios: true, permisos: true },
    orderBy: { nombre: "asc" }
  });

  return (
    <AppShell title="Roles" subtitle="Crear, modificar o eliminar perfiles de acceso">
      <section className="space-y-6">
        <SecurityNav />

        <form action={createRoleAction} className="sagva-panel p-5">
          <h2 className="text-lg font-bold text-slate-950">Crear rol nuevo</h2>
          <p className="mt-1 text-sm text-slate-500">Crea perfiles para luego asignar permisos por modulo.</p>
          <div className="mt-4 grid gap-4 md:grid-cols-[1fr_1fr_auto]">
            <label className="text-sm font-semibold text-slate-700">
              Codigo
              <input name="codigo" required placeholder="supervisor_caja" className="mt-1 w-full rounded-md border border-[#d8dee8] px-3 py-2" />
            </label>
            <label className="text-sm font-semibold text-slate-700">
              Nombre
              <input name="nombre" required placeholder="Supervisor de caja" className="mt-1 w-full rounded-md border border-[#d8dee8] px-3 py-2" />
            </label>
            <div className="flex items-end">
              <button className="w-full rounded-md bg-[#064ea4] px-4 py-2 text-sm font-bold text-white hover:bg-[#043d82] md:w-auto" type="submit">
                Crear rol
              </button>
            </div>
          </div>
        </form>

        <RolesTable
          roles={roles.map((rol) => ({
            id: rol.id,
            codigo: rol.codigo,
            nombre: rol.nombre,
            usuarios: rol.usuarios.length,
            permisos: rol.permisos.length
          }))}
        />
      </section>
    </AppShell>
  );
}
