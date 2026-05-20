import { AppShell } from "@/components/layout/app-shell";
import { SecurityNav } from "@/components/security/security-nav";
import { savePermissionAction } from "@/app/actions/roles-permisos.actions";
import { permissionActions, protectedFields, securityModules } from "@/config/permissions.config";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function SeguridadPermisosPage() {
  const [roles, permisos] = await Promise.all([
    prisma.rol.findMany({ orderBy: { nombre: "asc" } }),
    prisma.permiso.findMany({ include: { rol: true }, orderBy: [{ modulo: "asc" }, { accion: "asc" }] })
  ]);

  return (
    <AppShell title="Permisos" subtitle="Control por modulo, accion y campo sensible">
      <section className="space-y-6">
        <SecurityNav />

        <form action={savePermissionAction} className="sagva-panel p-5">
          <h2 className="text-lg font-bold text-slate-950">Crear o actualizar permiso</h2>
          <p className="mt-1 text-sm text-slate-500">Si ya existe la misma combinacion de rol, modulo, accion y campo, se actualiza.</p>
          <div className="mt-4 grid gap-4 md:grid-cols-3 xl:grid-cols-6">
            <label className="text-sm font-semibold text-slate-700">Rol<select name="rolId" required className="mt-1 w-full rounded-md border border-[#d8dee8] px-3 py-2"><option value="">Seleccionar</option>{roles.map((rol) => <option key={rol.id} value={rol.id}>{rol.nombre}</option>)}</select></label>
            <label className="text-sm font-semibold text-slate-700">Modulo<select name="modulo" required className="mt-1 w-full rounded-md border border-[#d8dee8] px-3 py-2"><option value="">Seleccionar</option>{securityModules.map((modulo) => <option key={modulo} value={modulo}>{modulo}</option>)}</select></label>
            <label className="text-sm font-semibold text-slate-700">Accion<select name="accion" required className="mt-1 w-full rounded-md border border-[#d8dee8] px-3 py-2"><option value="">Seleccionar</option>{permissionActions.map((accion) => <option key={accion} value={accion}>{accion}</option>)}</select></label>
            <label className="text-sm font-semibold text-slate-700">Campo sensible<select name="campo" className="mt-1 w-full rounded-md border border-[#d8dee8] px-3 py-2"><option value="">Todo el modulo</option>{protectedFields.map((campo) => <option key={campo} value={campo}>{campo}</option>)}</select></label>
            <label className="text-sm font-semibold text-slate-700">Estado<select name="permitido" defaultValue="true" className="mt-1 w-full rounded-md border border-[#d8dee8] px-3 py-2"><option value="true">Permitido</option><option value="false">Bloqueado</option></select></label>
            <div className="flex items-end"><button className="w-full rounded-md bg-[#064ea4] px-4 py-2 text-sm font-bold text-white hover:bg-[#043d82]" type="submit">Guardar permiso</button></div>
          </div>
        </form>

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
