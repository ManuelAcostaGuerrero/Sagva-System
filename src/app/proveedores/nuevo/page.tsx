import { Save } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { crearProveedorAction } from "@/app/actions/proveedores.actions";
import { ProveedorAutocompleteFields } from "@/components/forms/proveedor-autocomplete-fields";

export default function NuevoProveedorPage() {
  return (
    <AppShell title="Nuevo Proveedor" subtitle="Datos fiscales, comerciales y de contacto">
      <form action={crearProveedorAction} className="space-y-5">
        <section className="sagva-panel">
          <div className="sagva-panel-title">Información del proveedor</div>
          <div className="grid gap-4 p-4 md:grid-cols-4">
            <ProveedorAutocompleteFields />
          </div>
        </section>

        <div className="flex justify-end gap-3">
          <a href="/proveedores" className="sagva-button-secondary">
            Cancelar
          </a>
          <button className="inline-flex items-center gap-2 sagva-button-primary">
            <Save className="h-4 w-4" aria-hidden="true" />
            Guardar proveedor
          </button>
        </div>
      </form>
    </AppShell>
  );
}
