import { AppShell } from "@/components/layout/app-shell";
import { ModulePage } from "@/components/modules/module-page";

export default function FacturasPage() {
  return (
    <AppShell>
      <ModulePage
        title="Facturas e integración"
        description="Registro de facturas de compra, asociación de productos, diferencias de precio y conexión con inventario."
        primaryAction={{ label: "Nueva factura", href: "/facturas/nueva" }}
        screens={["Listado", "Nueva factura", "Detalle", "Productos", "Diferencias"]}
        service="FacturaService"
        pending={["Definir estados de factura", "Cerrar flujo de nota de crédito", "Definir validaciones fiscales"]}
      />
    </AppShell>
  );
}
