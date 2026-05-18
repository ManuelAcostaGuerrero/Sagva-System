import { AppShell } from "@/components/layout/app-shell";
import { ModulePage } from "@/components/modules/module-page";

export default function CajaPage() {
  return (
    <AppShell>
      <ModulePage
        title="Caja"
        description="Apertura, operación, cierre, ingresos, retiros, arqueo, diferencias y solicitudes de corrección."
        primaryAction={{ label: "Caja activa", href: "/caja/activa" }}
        screens={["Caja activa", "Apertura", "Cierre", "Historial", "Correcciones"]}
        service="CajaService"
        pending={["Definir conceptos de ingresos/retiros", "Definir estados de caja", "Cerrar formato de corrección"]}
      />
    </AppShell>
  );
}
