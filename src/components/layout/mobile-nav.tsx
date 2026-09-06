"use client";

import Link from "next/link";
import { useState } from "react";
import {
  BarChart3,
  Boxes,
  CalendarDays,
  ClipboardList,
  CreditCard,
  FileText,
  Layers3,
  Menu,
  Package,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Truck,
  X
} from "lucide-react";

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

export function MobileNav() {
  const [abierto, setAbierto] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-[#d8dee8] bg-white text-slate-700 lg:hidden"
        aria-label="Abrir menú"
        aria-expanded={abierto}
      >
        <Menu className="h-5 w-5" aria-hidden="true" />
      </button>

      {abierto ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-slate-950/45"
            aria-label="Cerrar menú"
            onClick={() => setAbierto(false)}
          />

          <aside className="relative z-10 h-full w-[86%] max-w-[320px] overflow-y-auto bg-[#001a33] text-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-5">
              <Link href="/dashboard" onClick={() => setAbierto(false)} className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-md border border-white/40">
                  <Package className="h-6 w-6" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-xl font-bold tracking-wide">SAGVA</p>
                  <p className="text-[10px] font-semibold tracking-[0.35em] text-white/70">SYSTEM</p>
                </div>
              </Link>

              <button
                type="button"
                onClick={() => setAbierto(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-md text-white/90 hover:bg-white/10"
                aria-label="Cerrar menú"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <nav className="pb-8 pt-3 text-sm font-semibold">
              {navGroups.map((group) => (
                <div key={group.label} className="mb-3">
                  <p className="px-5 py-2 text-[11px] uppercase tracking-wide text-white/40">{group.label}</p>
                  <div>
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setAbierto(false)}
                          className="flex items-center gap-3 px-5 py-3.5 text-white/90 hover:bg-[#064ea4]"
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
        </div>
      ) : null}
    </>
  );
}
