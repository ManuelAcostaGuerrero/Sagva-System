import { AppShell } from "@/components/layout/app-shell";
import { ModulePage } from "@/components/modules/module-page";

export default function CalendarioPage() {
  return (
    <AppShell>
      <ModulePage
        title="Calendario"
        description="Fechas especiales, feriados, impacto comercial esperado y soporte para análisis comparativo."
        primaryAction={{ label: "Nueva fecha", href: "/calendario/nueva-fecha" }}
        screens={["Calendario", "Nueva fecha", "Feriados", "Impacto", "Historial"]}
        service="CalendarioService"
        pending={["Definir fuente de feriados", "Definir país/región inicial", "Cerrar reglas de impacto comercial"]}
      />
    </AppShell>
  );
}
