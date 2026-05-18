import { AppShell } from "@/components/layout/app-shell";
import { ModulePage } from "@/components/modules/module-page";

export default function ArticulosPage() {
  return (
    <AppShell>
      <ModulePage
        title="Artículos"
        description="Ficha maestra de productos: códigos, familias, marcas, impuestos, precios, márgenes y estados."
        primaryAction={{ label: "Nuevo artículo", href: "/articulos/nuevo" }}
        screens={["Listado", "Nuevo artículo", "Detalle", "Editar", "Precios"]}
        service="ArticuloService"
        pending={["Definir estados finales", "Cerrar fórmula de exento + impuesto adicional", "Definir redondeo automático"]}
      />
    </AppShell>
  );
}
