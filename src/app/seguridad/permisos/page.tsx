import { AppShell } from "@/components/layout/app-shell";
import { SecurityNav } from "@/components/security/security-nav";
import { PermissionForm } from "./permission-form";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function SeguridadPermisosPage() {
  const [roles, permisos] = await Promise.all([
    prisma.rol.findMany({ orderBy: { nombre: "asc" } }),
    prisma.permiso.findMany({ include: { rol: true }, orderBy: [{ modulo: "asc" }, { accion: "asc" }] })
  ]);

  return (
    <AppShell title="Permisos" subtitle="Control por modulo, accion y campo sensible real">
      <section className="space-y-6">
        <SecurityNav />

        <PermissionForm roles={roles.map((rol) => ({ id: rol.id, nombre: rol.nombre }))} />

        <div className="sagva-panel overflow-hidden">
          <div className="border-b border-[#d8dee8] p-5">
            <h2 className="text-lg font-bold text-slate-950">Matriz de permisos</h2>
            <p className="mt-1 text-sm text-slate-500">Permisos configurados para roles, modulos, acciones y campos sensibles.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr><th className="px-4 py-3">Rol</th><th className="px-4 py-3">Modulo</th><th className="px-4 py-3">Accion</th><th className="px-4 py-3">Campo</th><th className="px-4 py-3">Estado</th></tr>
              </thead>
              <tbody className="divide-y divide-[#edf1f7]">
                {permisos.map((permiso) => (
                  <tr key={permiso.id} className="bg-white">
                    <td className="px-4 py-3 font-semibold text-slate-900">{permiso.rol.nombre}</td>
                    <td className="px-4 py-3 text-slate-600">{permiso.modulo}</td>
                    <td className="px-4 py-3 text-slate-600">{permiso.accion}</td>
                    <td className="px-4 py-3 text-slate-600">{permiso.campo ?? "Todo el modulo"}</td>
                    <td className="px-4 py-3"><span className={permiso.permitido ? "rounded-full bg-green-50 px-2 py-1 text-xs font-bold text-green-700" : "rounded-full bg-red-50 px-2 py-1 text-xs font-bold text-red-700"}>{permiso.permitido ? "Permitido" : "Bloqueado"}</span></td>
                  </tr>
                ))}
                {permisos.length === 0 ? <tr><td colSpan={5} className="py-8 text-center text-slate-500">No hay permisos configurados.</td></tr> : null}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
