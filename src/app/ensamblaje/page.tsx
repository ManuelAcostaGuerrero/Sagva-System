import { AppShell } from "@/components/layout/app-shell";
import { ModulePage } from "@/components/modules/module-page";

export default function EnsamblajePage() {
  return (
    <AppShell>
      <ModulePage
        title="Ensamblaje"
        description="Productos formados por componentes, disponibilidad para armar, ejecución, desarme y trazabilidad."
        primaryAction={{ label: "Nuevo ensamblaje", href: "/ensamblaje/nuevo" }}
        screens={["Listado", "Nuevo ensamblaje", "Disponibilidad", "Ejecutar", "Desarmar", "Historial"]}
        service="EnsamblajeService"
        pending={["Definir producto final previo", "Decidir ensamblaje automático", "Definir reglas de merma"]}
      />
    </AppShell>
  );
}
