import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { StatCard } from "@/components/dashboard/stat-card";
import { SecurityNav } from "@/components/security/security-nav";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const accessCards = [
  { title: "Usuarios", href: "/seguridad/usuarios", description: "Administracion de cuentas, estados y roles asignados." },
  { title: "Roles", href: "/seguridad/roles", description: "Perfiles como administrador, encargado, vendedor, bodega, produccion y contabilidad." },
  { title: "Permisos", href: "/seguridad/permisos", description: "Control por modulo, accion y campo sensible." },
  { title: "Auditoria", href: "/seguridad/auditoria", description: "Historial de cambios importantes del sistema." },
  { title: "Autorizaciones", href: "/seguridad/autorizaciones", description: "Solicitudes para acciones criticas como merma, anulacion, correccion o cambio de precio." }
];

export default async function SeguridadPage() {
  const [usuarios, roles, permisos, auditorias] = await Promise.all([
    prisma.usuario.count(),
    prisma.rol.count(),
    prisma.permiso.count(),
    prisma.auditoria.count()
  ]);

  return (
    <AppShell title="Seguridad" subtitle="Control de usuarios, roles, permisos, auditoria y autorizaciones">
      <section className="space-y-6">
        <SecurityNav />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Usuarios" value={String(usuarios)} helper="Cuentas registradas" />
          <StatCard label="Roles" value={String(roles)} helper="Perfiles disponibles" />
          <StatCard label="Permisos" value={String(permisos)} helper="Reglas configuradas" />
          <StatCard label="Auditoria" value={String(auditorias)} helper="Eventos registrados" />
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {accessCards.map((item) => (
            <Link key={item.href} href={item.href} className="sagva-panel p-5 hover:border-[#064ea4]">
              <h2 className="text-lg font-bold text-slate-950">{item.title}</h2>
              <p className="mt-2 text-sm text-slate-600">{item.description}</p>
              <p className="mt-4 text-sm font-bold text-[#064ea4]">Abrir seccion</p>
            </Link>
          ))}
        </div>

        <div className="sagva-panel p-5">
          <h2 className="text-lg font-bold text-slate-950">Reglas base de seguridad</h2>
          <ul className="mt-4 space-y-2 text-sm text-slate-700">
            <li>Todo usuario debe operar con un rol asignado.</li>
            <li>Los costos, margenes, utilidades y cierres de caja deben protegerse por permiso.</li>
            <li>Las acciones criticas deben registrar motivo y quedar auditadas.</li>
            <li>Las correcciones no deben editar datos historicos sin trazabilidad.</li>
            <li>Ensamblaje consume permisos desde seguridad, sin duplicar configuracion dentro del modulo.</li>
          </ul>
        </div>
      </section>
    </AppShell>
  );
}
