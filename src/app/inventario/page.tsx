import { AppShell } from "@/components/layout/app-shell";
import { ModulePage } from "@/components/modules/module-page";

export default function InventarioPage() {
  return (
    <AppShell>
      <ModulePage
        title="Inventario"
        description="Control de stock por artículo, sucursal, movimientos, ajustes y alertas de mínimos o máximos."
        primaryAction={{ label: "Ver movimientos", href: "/inventario/movimientos" }}
        screens={["Stock actual", "Movimientos", "Ajustes", "Alertas", "Historial"]}
        service="InventarioService"
        pending={["Definir tipos oficiales de movimientos", "Definir reglas por bodega", "Definir ajustes autorizados"]}
      />
    </AppShell>
  );
}
