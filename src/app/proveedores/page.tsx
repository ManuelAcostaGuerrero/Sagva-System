import { AppShell } from "@/components/layout/app-shell";
import { ModulePage } from "@/components/modules/module-page";

export default function ProveedoresPage() {
  return (
    <AppShell>
      <ModulePage
        title="Proveedores"
        description="Gestión de datos comerciales, listas de precios y asociaciones entre productos externos y artículos internos."
        primaryAction={{ label: "Nuevo proveedor", href: "/proveedores/nuevo" }}
        screens={["Listado", "Nuevo proveedor", "Detalle", "Listas de precios", "Asociaciones"]}
        service="ProveedorService"
        pending={["Definir campos finales", "Cerrar condiciones comerciales", "Definir plantilla de carga"]}
      />
    </AppShell>
  );
}
