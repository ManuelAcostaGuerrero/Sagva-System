import { CheckCircle2, Info, Plus, Save, Search, Trash2 } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";

export default function NuevaFacturaPage() {
  const productos = [
    {
      codigo: "PRD001",
      producto: "Aceite Vegetal 1L",
      cantidad: 10,
      unidad: "UND",
      precioFactura: 1800,
      subtotal: 18000,
      costoInterno: 1500,
      cargoAdicional: 300
    },
    {
      codigo: "PRD002",
      producto: "Arroz Superior 5kg",
      cantidad: 20,
      unidad: "UND",
      precioFactura: 2500,
      subtotal: 50000,
      costoInterno: 2100,
      cargoAdicional: 400
    }
  ];

  const totalFactura = productos.reduce((sum, item) => sum + item.subtotal, 0);
  const totalCosto = productos.reduce((sum, item) => sum + item.costoInterno * item.cantidad, 0);
  const totalCargo = productos.reduce((sum, item) => sum + item.cargoAdicional * item.cantidad, 0);

  return (
    <AppShell title="Cargar Factura de Proveedor">
      <form className="space-y-4">
        <section className="sagva-panel">
          <div className="sagva-panel-title">Información del Proveedor</div>
          <div className="grid gap-4 p-4 md:grid-cols-4">
            <label>
              <span className="sagva-label">Proveedor *</span>
              <div className="relative">
                <input className="sagva-field pr-10" placeholder="Buscar por nombre o N° de proveedor" />
                <Search className="absolute right-3 top-2.5 h-5 w-5 text-slate-400" aria-hidden="true" />
              </div>
              <p className="mt-2 text-xs font-semibold text-green-700">
                Al seleccionar el proveedor, se cargarán automáticamente sus datos.
              </p>
            </label>
            <label>
              <span className="sagva-label">RUC</span>
              <input className="sagva-field" defaultValue="20123456789" />
            </label>
            <label>
              <span className="sagva-label">Razón Social</span>
              <input className="sagva-field" defaultValue="DISTRIBUIDORA LA UNIÓN SAC" />
            </label>
            <label>
              <span className="sagva-label">Dirección</span>
              <input className="sagva-field" defaultValue="Av. Los Próceres 1234, Lima" />
            </label>
            <label>
              <span className="sagva-label">Teléfono</span>
              <input className="sagva-field" defaultValue="987 654 321" />
            </label>
            <label className="md:col-span-2">
              <span className="sagva-label">Correo</span>
              <input className="sagva-field" defaultValue="ventas@launion.com" />
            </label>
            <label>
              <span className="sagva-label">Contacto</span>
              <input className="sagva-field" defaultValue="Juan Pérez" />
            </label>
          </div>
        </section>

        <section className="sagva-panel">
          <div className="sagva-panel-title">Información de la Factura</div>
          <div className="grid gap-4 p-4 md:grid-cols-[260px_220px_1fr]">
            <label>
              <span className="sagva-label">N° de Factura *</span>
              <input className="sagva-field" defaultValue="F001-0001234" />
            </label>
            <label>
              <span className="sagva-label">Fecha de Factura *</span>
              <input className="sagva-field" defaultValue="21/05/2024" />
            </label>
            <div className="flex items-start gap-3 rounded-md border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-900">
              <CheckCircle2 className="mt-0.5 h-5 w-5" aria-hidden="true" />
              <div>
                <p className="font-semibold">No se requiere plazo de entrega, ya que la factura está en su poder.</p>
                <p className="mt-1">Todos los datos se registrarán según la factura.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="sagva-panel overflow-hidden">
          <div className="sagva-panel-title">Detalle de Productos</div>
          <div className="overflow-x-auto">
            <table className="sagva-table min-w-[1100px]">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Código</th>
                  <th>Producto</th>
                  <th>Cantidad</th>
                  <th>Unidad</th>
                  <th>Precio según Factura<br /><span className="font-normal">(Costo real)</span></th>
                  <th>Subtotal según Factura</th>
                  <th>Costo Interno<br /><span className="font-normal">(Para cálculo de margen)</span></th>
                  <th>Cargo Adicional<br /><span className="font-normal">(Para completar factura)</span></th>
                  <th>Total</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {productos.map((item, index) => (
                  <tr key={item.codigo}>
                    <td>{index + 1}</td>
                    <td>{item.codigo}</td>
                    <td>{item.producto}</td>
                    <td>{item.cantidad}</td>
                    <td>{item.unidad}</td>
                    <td><input className="sagva-field text-right" defaultValue={item.precioFactura.toLocaleString("es-CL")} /></td>
                    <td className="text-right">{item.subtotal.toLocaleString("es-CL")}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <input className="sagva-field text-right" defaultValue={item.costoInterno.toLocaleString("es-CL")} />
                        <Info className="h-4 w-4 text-blue-600" aria-hidden="true" />
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <input className="sagva-field text-right" defaultValue={item.cargoAdicional.toLocaleString("es-CL")} />
                        <Info className="h-4 w-4 text-blue-600" aria-hidden="true" />
                      </div>
                    </td>
                    <td className="text-right">{item.subtotal.toLocaleString("es-CL")}</td>
                    <td><Trash2 className="h-4 w-4 text-red-500" aria-hidden="true" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t border-[#d8dee8] p-4">
            <button type="button" className="inline-flex items-center gap-2 sagva-button-primary">
              <Plus className="h-4 w-4" aria-hidden="true" />
              Agregar Producto
            </button>
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-4">
          <TotalCard label="Total según Factura" helper="Monto total de la factura del proveedor" value={`S/ ${totalFactura.toLocaleString("es-CL")}`} color="text-blue-700" />
          <TotalCard label="Total Costo Interno" helper="Costo real para cálculo de margen" value={`S/ ${totalCosto.toLocaleString("es-CL")}`} color="text-green-700" />
          <TotalCard label="Total Cargos Adicionales" helper="Diferencia para completar el monto de la factura" value={`S/ ${totalCargo.toLocaleString("es-CL")}`} color="text-orange-600" />
          <TotalCard label="Margen estimado de venta" helper="Calculado sobre el Costo Interno" value="20.00%" color="text-purple-700" />
        </section>

        <section className="grid gap-4 xl:grid-cols-[1fr_300px_260px]">
          <div className="rounded-md border border-orange-300 bg-orange-50 px-4 py-4 text-sm leading-7">
            <p>El sistema registrará el producto con el <strong>Costo Interno</strong> para el cálculo de margen.</p>
            <p>El Cargo Adicional se registrará como gasto aparte para completar el monto de la factura.</p>
            <p>Así se mantiene la base de datos real y el margen de ganancia no se ve afectado.</p>
          </div>
          <div className="sagva-panel p-4 text-center">
            <p className="text-sm font-bold">Total a Registrar</p>
            <p className="mt-2 text-2xl font-bold">S/ {totalFactura.toLocaleString("es-CL")}</p>
            <p className="mt-2 text-xs text-slate-500">Debe coincidir con el total de la factura</p>
          </div>
          <div className="rounded-md border border-orange-300 bg-orange-50 p-4 text-center">
            <p className="text-sm font-bold text-amber-900">Diferencia</p>
            <p className="mt-2 text-2xl font-bold text-amber-600">S/ 0.00</p>
            <p className="mt-2 text-xs font-bold text-green-700">Validación OK</p>
          </div>
        </section>

        <div className="flex justify-end gap-3">
          <button type="button" className="sagva-button-secondary">Cancelar</button>
          <button className="inline-flex items-center gap-2 sagva-button-primary">
            <Save className="h-4 w-4" aria-hidden="true" />
            Guardar Factura
          </button>
        </div>
      </form>
    </AppShell>
  );
}

function TotalCard({
  label,
  helper,
  value,
  color
}: {
  label: string;
  helper: string;
  value: string;
  color: string;
}) {
  return (
    <div className="sagva-panel p-4 text-center">
      <p className="text-sm font-bold">{label}</p>
      <p className="mt-1 text-xs text-slate-500">{helper}</p>
      <p className={`mt-3 text-2xl font-bold ${color}`}>{value}</p>
    </div>
  );
}
