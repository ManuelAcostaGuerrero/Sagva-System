import { AppShell } from "@/components/layout/app-shell";
import { ModulePage } from "@/components/modules/module-page";

export default function SeguridadUsuariosPage() {
  return (
    <AppShell>
      <ModulePage
        title="Seguridad"
        description="Usuarios, roles, permisos por módulo, permisos por acción, restricciones, autorizaciones y auditoría."
        primaryAction={{ label: "Roles", href: "/seguridad/roles" }}
        screens={["Usuarios", "Roles", "Permisos", "Auditoría", "Autorizaciones"]}
        service="SeguridadService"
        pending={["Definir matriz base de roles", "Definir acciones críticas", "Definir auditoría obligatoria"]}
      />
    </AppShell>
  );
}
