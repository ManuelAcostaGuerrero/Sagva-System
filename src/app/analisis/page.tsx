import { AppShell } from "@/components/layout/app-shell";
import { ModulePage } from "@/components/modules/module-page";

export default function AnalisisPage() {
  return (
    <AppShell>
      <ModulePage
        title="Análisis y gestión"
        description="Dashboard, KPIs, comparaciones por período, alertas, proyecciones y lectura de fechas especiales."
        primaryAction={{ label: "Ventas", href: "/analisis/ventas" }}
        screens={["Dashboard", "Ventas", "Inventario", "Proveedores", "Rentabilidad", "Proyecciones"]}
        service="AnalisisService"
        pending={["Definir KPIs principales", "Diseñar dashboard final", "Cerrar fórmulas de proyección"]}
      />
    </AppShell>
  );
}
