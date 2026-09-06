import Link from "next/link";
import {
  BarChart3,
  Boxes,
  CalendarDays,
  ChevronDown,
  CircleHelp,
  ClipboardList,
  CreditCard,
  FileText,
  Layers3,
  LogOut,
  Package,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Truck,
  UserCircle
} from "lucide-react";
import { logoutAction } from "@/app/actions/auth.actions";
import { getCurrentUser } from "@/lib/session";

type AppShellProps = {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
};

const navGroups = [
  {
    label: "Principal",
    items: [{ label: "Inicio", href: "/dashboard", icon: BarChart3 }]
  },
  {
    label: "Compras",
    items: [
      { label: "Proveedores", href: "/proveedores", icon: Truck },
      { label: "Nueva Compra", href: "/facturas/nueva", icon: ShoppingCart },
      { label: "Lista de Compras", href: "/facturas", icon: FileText }
    ]
  },
  {
    label: "Productos",
    items: [
      { label: "Artículos", href: "/articulos", icon: Package },
      { label: "Inventario", href: "/inventario", icon: Boxes },
      { label: "Ensamblaje", href: "/ensamblaje", icon: Layers3 }
    ]
  },
  {
    label: "Operación",
    items: [
      { label: "Ventas", href: "/venta/nueva", icon: CreditCard },
      { label: "Caja", href: "/caja", icon: ClipboardList }
    ]
  },
  {
    label: "Gestión",
    items: [
      { label: "Reportes", href: "/analisis", icon: BarChart3 },
      { label: "Seguridad", href: "/seguridad/usuarios", icon: ShieldCheck },
      { label: "Calendario", href: "/calendario", icon: CalendarDays },
      { label: "Configuración", href: "/configuracion/interfaz", icon: Settings }
    ]
  }
];

export async function AppShell({
  children,
  title = "Sagva System",
  subtitle
}: AppShellProps) {
  const user = await getCurrentUser();

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[250px_1fr]">
      <aside className="bg-[#001a33] text-white lg:min-h-screen">
        <div className="px-6 py-6">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md border border-white/40">
              <Package className="h-6 w-6" aria-hidden="true" />
            </div>
            <div>
              <p className="text-2xl font-bold tracking-wide">SAGVA</p>
              <p className="text-xs font-semibold tracking-[0.35em] text-white/80">
                SYSTEM
              </p>
            </div>
          </Link>
        </div>

        <nav className="pb-8 text-sm font-semibold">
          {navGroups.map((group) => (
            <div key={group.label} className="mb-3">
              <p className="px-6 py-2 text-[11px] uppercase tracking-wide text-white/45">
                {group.label}
              </p>
              <div>
                {group.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="flex items-center gap-3 px-6 py-3 text-white/90 hover:bg-[#064ea4]"
                    >
                      <Icon className="h-5 w-5" aria-hidden="true" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </aside>

      <main className="min-w-0 bg-[#f5f7fb]">
        <header className="border-b border-[#d8dee8] bg-white px-5 py-5 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-950">{title}</h1>
              {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
            </div>
            <div className="flex items-center gap-4">
              <CircleHelp className="h-5 w-5 text-slate-500" aria-hidden="true" />
              <div className="flex items-center gap-2">
                <UserCircle className="h-8 w-8 text-slate-700" aria-hidden="true" />
                <div className="hidden text-right sm:block">
                  <p className="text-sm font-semibold text-slate-900">
                    {user?.nombre ?? "Usuario"}
                  </p>
                  <p className="text-xs text-slate-500">{user?.rol?.nombre ?? "Sin sesión"}</p>
                </div>
                <ChevronDown className="h-4 w-4 text-slate-500" aria-hidden="true" />
              </div>
              {user ? (
                <form action={logoutAction}>
                  <button
                    className="rounded-md border border-[#d8dee8] p-2 text-slate-600 hover:bg-slate-50"
                    title="Cerrar sesión"
                  >
                    <LogOut className="h-4 w-4" aria-hidden="true" />
                  </button>
                </form>
              ) : (
                <Link
                  href="/login"
                  className="rounded-md border border-[#d8dee8] px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Login
                </Link>
              )}
            </div>
          </div>
        </header>
        <div className="px-5 py-6 lg:px-8">{children}</div>
      </main>
    </div>
  );
}
