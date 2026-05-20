import { AppShell } from "@/components/layout/app-shell";
import { SecurityNav } from "@/components/security/security-nav";
import { createRoleAction, deleteRoleAction, updateRoleAction } from "@/app/actions/roles-permisos.actions";
import { prisma } from "@/lib/prisma";

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

        <div className="sagva-panel overflow-hidden">
          <div className="border-b border-[#d8dee8] p-5">
            <h2 className="text-lg font-bold text-slate-950">Roles existentes</h2>
            <p className="mt-1 text-sm text-slate-500">Edita codigo y nombre en la fila. Solo se puede eliminar un rol sin usuarios asignados.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Codigo</th>
                  <th className="px-4 py-3">Nombre</th>
                  <th className="px-4 py-3">Usuarios</th>
                  <th className="px-4 py-3">Permisos</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#edf1f7]">
                {roles.map((rol) => {
                  const updateAction = updateRoleAction.bind(null, rol.id);
                  const deleteAction = deleteRoleAction.bind(null, rol.id);
                  const canDelete = rol.usuarios.length === 0;

                  return (
                    <tr key={rol.id} className="bg-white align-top">
                      <td className="px-4 py-3">
                        <form id={`update-role-${rol.id}`} action={updateAction} className="contents">
                          <input name="codigo" defaultValue={rol.codigo} required className="w-full rounded-md border border-[#d8dee8] px-3 py-2 font-semibold text-slate-900" />
                        </form>
                      </td>
                      <td className="px-4 py-3">
                        <input form={`update-role-${rol.id}`} name="nombre" defaultValue={rol.nombre} required className="w-full rounded-md border border-[#d8dee8] px-3 py-2 text-slate-700" />
                      </td>
                      <td className="px-4 py-3 text-slate-600">{rol.usuarios.length}</td>
                      <td className="px-4 py-3 text-slate-600">{rol.permisos.length}</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <button form={`update-role-${rol.id}`} className="rounded-md border border-[#d8dee8] px-3 py-2 text-xs font-bold text-[#064ea4] hover:bg-blue-50" type="submit">
                            Modificar
                          </button>
                          <form action={deleteAction}>
                            <button
                              disabled={!canDelete}
                              className="rounded-md border border-red-200 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-300 disabled:hover:bg-white"
                              type="submit"
                              title={canDelete ? "Eliminar rol" : "No se puede eliminar un rol con usuarios asignados"}
                            >
                              Eliminar
                            </button>
                          </form>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {roles.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500">No hay roles creados.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
