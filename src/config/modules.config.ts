import {
  BarChart3,
  Boxes,
  CalendarDays,
  ClipboardList,
  CreditCard,
  FileText,
  Layers3,
  Package,
  Settings,
  ScanLine,
  ShieldCheck,
  ShoppingCart,
  Truck
} from "lucide-react";

export type SagvaModuleKey =
  | "dashboard"
  | "venta"
  | "caja"
  | "articulos"
  | "inventario"
  | "ensamblaje"
  | "proveedores"
  | "facturas"
  | "laboratorio_dte"
  | "analisis"
  | "seguridad"
  | "calendario"
  | "configuracion";

export const modulesConfig = [
  {
    key: "dashboard",
    label: "Dashboard",
    href: "/dashboard",
    icon: BarChart3,
    area: "Inicio"
  },
  {
    key: "venta",
    label: "Venta",
    href: "/venta/nueva",
    icon: ShoppingCart,
    area: "Operación"
  },
  {
    key: "caja",
    label: "Caja",
    href: "/caja",
    icon: CreditCard,
    area: "Operación"
  },
  {
    key: "articulos",
    label: "Artículos",
    href: "/articulos",
    icon: Package,
    area: "Productos"
  },
  {
    key: "inventario",
    label: "Inventario",
    href: "/inventario",
    icon: Boxes,
    area: "Productos"
  },
  {
    key: "ensamblaje",
    label: "Ensamblaje",
    href: "/ensamblaje",
    icon: Layers3,
    area: "Productos"
  },
  {
    key: "proveedores",
    label: "Proveedores",
    href: "/proveedores",
    icon: Truck,
    area: "Compras"
  },
  {
    key: "facturas",
    label: "Facturas",
    href: "/facturas",
    icon: FileText,
    area: "Compras"
  },
  {
    key: "laboratorio_dte",
    label: "Laboratorio DTE (pruebas)",
    href: "/laboratorio-dte",
    icon: ScanLine,
    area: "Compras"
  },
  {
    key: "analisis",
    label: "Análisis",
    href: "/analisis",
    icon: ClipboardList,
    area: "Gestión"
  },
  {
    key: "seguridad",
    label: "Seguridad",
    href: "/seguridad/usuarios",
    icon: ShieldCheck,
    area: "Administración"
  },
  {
    key: "calendario",
    label: "Calendario",
    href: "/calendario",
    icon: CalendarDays,
    area: "Configuración"
  },
  {
    key: "configuracion",
    label: "Configuración",
    href: "/configuracion/interfaz",
    icon: Settings,
    area: "Configuración"
  }
] as const;

export const moduleAreas = Array.from(
  new Set(modulesConfig.map((moduleItem) => moduleItem.area))
);
