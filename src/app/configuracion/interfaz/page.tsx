import { AppShell } from "@/components/layout/app-shell";
import { ModulePage } from "@/components/modules/module-page";

export default function ConfiguracionInterfazPage() {
  return (
    <AppShell>
      <ModulePage
        title="Interfaz e integración"
        description="Menú principal, rutas, variables globales, componentes comunes y matriz de integración entre módulos."
        screens={["Menú", "Variables globales", "Integraciones", "Estados visuales"]}
        service="InterfazIntegracionService"
        pending={["Definir layout final", "Completar componentes UI", "Definir navegación definitiva"]}
      />
    </AppShell>
  );
}
