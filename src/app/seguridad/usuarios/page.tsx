import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { SecurityNav } from "@/components/security/security-nav";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function SeguridadUsuariosPage() {
  const usuarios = await prisma.usuario.findMany({ include: { rol: true }, orderBy: { createdAt: "desc" } });

  return (
    <AppShell title="Usuarios" subtitle="Administracion de cuentas, estados y roles asignados">
      <section className="space-y-6">
        <SecurityNav />
        <div className="sagva-panel p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-950">Gestion de usuarios</h2>
              <p className="mt-1 text-sm text-slate-500">Todo usuario debe operar con un rol asignado. Los cambios quedan auditados.</p>
            </div>
            <Link href="/seguridad/usuarios/nuevo" className="rounded-md bg-[#064ea4] px-4 py-2 text-sm font-bold text-white hover:bg-[#043d82]">Nuevo usuario</Link>
          </div>
          <div className="mt-4 grid gap-3">
            {usuarios.map((usuario) => (
              <div key={usuario.id} className="flex flex-col gap-3 rounded-md border border-[#d8dee8] bg-white p-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-bold text-slate-900">{usuario.nombre}</p>
                  <p className="text-sm text-slate-600">Correo: {usuario.correo}</p>
                  <p className="text-sm text-slate-600">Rol: {usuario.rol?.nombre ?? "Sin rol"}</p>
                  <p className="text-sm text-slate-600">Estado: {usuario.estado}</p>
                </div>
                <Link href={`/seguridad/usuarios/${usuario.id}/editar`} className="rounded-md border border-[#d8dee8] px-4 py-2 text-sm font-bold text-[#064ea4] hover:bg-blue-50">Editar usuario</Link>
              </div>
            ))}
          </div>
        </div>
      </section>
    </AppShell>
  );
}
