import { Save } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { crearProveedorAction } from "@/app/actions/proveedores.actions";

export default function NuevoProveedorPage() {
  return (
    <AppShell title="Nuevo Proveedor" subtitle="Datos fiscales, comerciales y de contacto">
      <form action={crearProveedorAction} className="space-y-5">
        <section className="sagva-panel">
          <div className="sagva-panel-title">Información del proveedor</div>
          <div className="grid gap-4 p-4 md:grid-cols-4">
            <label>
              <span className="sagva-label">Código *</span>
              <input name="codigo" className="sagva-field" required />
            </label>
            <label>
              <span className="sagva-label">RUT/RUC *</span>
              <input name="rutRuc" className="sagva-field" required />
            </label>
            <label className="md:col-span-2">
              <span className="sagva-label">Razón social *</span>
              <input name="razonSocial" className="sagva-field" required />
            </label>
            <label className="md:col-span-2">
              <span className="sagva-label">Nombre comercial</span>
              <input name="nombreComercial" className="sagva-field" />
            </label>
            <label className="md:col-span-2">
              <span className="sagva-label">Dirección</span>
              <input name="direccion" className="sagva-field" />
            </label>
            <label>
              <span className="sagva-label">Teléfono</span>
              <input name="telefono" className="sagva-field" />
            </label>
            <label>
              <span className="sagva-label">Correo</span>
              <input name="correo" type="email" className="sagva-field" />
            </label>
            <label className="md:col-span-2">
              <span className="sagva-label">Contacto</span>
              <input name="contacto" className="sagva-field" />
            </label>
            <label className="md:col-span-4">
              <span className="sagva-label">Condiciones comerciales</span>
              <textarea name="condicionesComerciales" className="sagva-field min-h-24" />
            </label>
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
