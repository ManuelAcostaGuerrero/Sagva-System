import Link from "next/link";
import { ClipboardCheck, History, KeyRound, ShieldCheck, UserCog, Users } from "lucide-react";

const securityLinks = [
  { label: "Resumen", href: "/seguridad", icon: ShieldCheck },
  { label: "Usuarios", href: "/seguridad/usuarios", icon: Users },
  { label: "Roles", href: "/seguridad/roles", icon: UserCog },
  { label: "Permisos", href: "/seguridad/permisos", icon: KeyRound },
  { label: "Auditoria", href: "/seguridad/auditoria", icon: History },
  { label: "Autorizaciones", href: "/seguridad/autorizaciones", icon: ClipboardCheck }
];

export function SecurityNav() {
  return (
    <div className="sagva-panel p-4">
      <div className="grid gap-2 md:grid-cols-3 xl:grid-cols-6">
        {securityLinks.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} className="flex items-center gap-2 rounded-md border border-[#d8dee8] bg-white px-3 py-2 text-sm font-bold text-[#064ea4] hover:bg-blue-50">
              <Icon className="h-4 w-4" aria-hidden="true" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
