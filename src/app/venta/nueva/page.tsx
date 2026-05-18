import { AppShell } from "@/components/layout/app-shell";
import { ModulePage } from "@/components/modules/module-page";

export default function NuevaVentaPage() {
  return (
    <AppShell>
      <ModulePage
        title="Nueva venta"
        description="Base para ventas temporales, productos, pagos parciales, cobro final, anulaciones y préstamos retornables."
        primaryAction={{ label: "Ventas abiertas", href: "/venta/abiertas" }}
        screens={["Nueva venta", "Productos", "Pagos", "Cobro final", "Productos sugeridos"]}
        service="VentaService"
        pending={["Decidir venta con saldo pendiente", "Definir estados finales", "Cerrar reglas de préstamos"]}
      />
    </AppShell>
  );
}
