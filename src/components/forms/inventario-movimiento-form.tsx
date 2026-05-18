import type { Articulo } from "@prisma/client";
import { Save } from "lucide-react";
import { registrarMovimientoInventarioAction } from "@/app/actions/inventario.actions";

type InventarioMovimientoFormProps = {
  articulos: Articulo[];
  tipoDefault?: "entrada" | "salida" | "ajuste";
};

export function InventarioMovimientoForm({
  articulos,
  tipoDefault = "entrada"
}: InventarioMovimientoFormProps) {
  return (
    <form action={registrarMovimientoInventarioAction} className="sagva-panel">
      <div className="sagva-panel-title">Registrar movimiento</div>
      <div className="grid gap-4 p-4 md:grid-cols-5">
        <label className="md:col-span-2">
          <span className="sagva-label">Artículo</span>
          <select name="articuloId" className="sagva-field" required>
            <option value="">Seleccionar artículo</option>
            {articulos.map((articulo) => (
              <option key={articulo.id} value={articulo.id}>
                {articulo.codigoProducto} - {articulo.nombre}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="sagva-label">Tipo</span>
          <select name="tipoMovimiento" className="sagva-field" defaultValue={tipoDefault}>
            <option value="entrada">Entrada</option>
            <option value="salida">Salida</option>
            <option value="ajuste">Ajuste</option>
          </select>
        </label>
        <label>
          <span className="sagva-label">Cantidad</span>
          <input name="cantidad" type="number" step="0.001" className="sagva-field" required />
        </label>
        <label>
          <span className="sagva-label">Observación</span>
          <input name="observacion" className="sagva-field" />
        </label>
      </div>
      <div className="flex justify-end border-t border-[#d8dee8] p-4">
        <button className="inline-flex items-center gap-2 sagva-button-primary">
          <Save className="h-4 w-4" aria-hidden="true" />
          Guardar movimiento
        </button>
      </div>
    </form>
  );
}
