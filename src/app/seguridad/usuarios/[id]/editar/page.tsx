import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { SecurityNav } from "@/components/security/security-nav";
import { updateAccountRoleAction } from "@/app/actions/account-role.actions";
import { prisma } from "@/lib/prisma";

type PageProps = {
  params: Promise<{ id: string }>;
};

export const dynamic = "force-dynamic";

export default async function EditarUsuarioPage({ params }: PageProps) {
  const { id } = await params;
  const [usuario, roles] = await Promise.all([
    prisma.usuario.findUnique({ where: { id }, include: { rol: true } }),
    prisma.rol.findMany({ orderBy: { nombre: "asc" } })
  ]);

  if (!usuario) notFound();

  const action = updateAccountRoleAction.bind(null, usuario.id);

  return (
    <AppShell title="Editar usuario" subtitle="Cambio de rol, estado y datos basicos con auditoria">
      <section className="space-y-6">
        <SecurityNav />
        <form action={action} className="sagva-panel p-5">
          <h2 className="text-lg font-bold text-slate-950">Datos del usuario</h2>
          <p className="mt-1 text-sm text-slate-500">El cambio de rol afecta los permisos aplicados en ventas, caja, inventario, ensamblaje y reportes.</p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="text-sm font-semibold text-slate-700">Nombre completo<input name="nombre" defaultValue={usuario.nombre} required className="mt-1 w-full rounded-md border border-[#d8dee8] px-3 py-2" /></label>
            <label className="text-sm font-semibold text-slate-700">Correo<input value={usuario.correo} readOnly className="mt-1 w-full rounded-md border border-[#d8dee8] bg-slate-50 px-3 py-2" /></label>
            <label className="text-sm font-semibold text-slate-700">Rol<select name="rolId" defaultValue={usuario.rolId ?? ""} required className="mt-1 w-full rounded-md border border-[#d8dee8] px-3 py-2"><option value="">Seleccionar rol</option>{roles.map((rol) => <option key={rol.id} value={rol.id}>{rol.nombre}</option>)}</select></label>
            <label className="text-sm font-semibold text-slate-700">Estado<select name="estado" defaultValue={usuario.estado} className="mt-1 w-full rounded-md border border-[#d8dee8] px-3 py-2"><option value="activo">Activo</option><option value="inactivo">Inactivo</option><option value="bloqueado">Bloqueado</option></select></label>
            <label className="text-sm font-semibold text-slate-700 md:col-span-2">Motivo del cambio<textarea name="motivo" required defaultValue="Cambio administrativo de usuario" className="mt-1 w-full rounded-md border border-[#d8dee8] px-3 py-2" rows={3} /></label>
          </div>
          <div className="mt-5 flex gap-3">
            <button className="rounded-md bg-[#064ea4] px-4 py-2 text-sm font-bold text-white hover:bg-[#043d82]" type="submit">Guardar cambios</button>
            <a href="/seguridad/usuarios" className="rounded-md border border-[#d8dee8] px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50">Cancelar</a>
          </div>
        </form>
      </section>
    </AppShell>
  );
}
