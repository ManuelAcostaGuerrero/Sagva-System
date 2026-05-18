import type { Articulo, ArticuloPrecio, Familia, Marca, Subfamilia } from "@prisma/client";
import { Save } from "lucide-react";
import { crearArticuloAction, actualizarArticuloAction } from "@/app/actions/articulos.actions";

type ArticuloWithPrecio = Articulo & {
  precios: ArticuloPrecio[];
};

type ArticuloFormProps = {
  familias: Familia[];
  subfamilias: Subfamilia[];
  marcas: Marca[];
  articulo?: ArticuloWithPrecio;
};

export function ArticuloForm({ familias, subfamilias, marcas, articulo }: ArticuloFormProps) {
  const precio = articulo?.precios?.[0];
  const action = articulo
    ? actualizarArticuloAction.bind(null, articulo.id)
    : crearArticuloAction;

  return (
    <form action={action} className="space-y-5">
      <section className="sagva-panel">
        <div className="sagva-panel-title">Información del artículo</div>
        <div className="grid gap-4 p-4 md:grid-cols-4">
          <label>
            <span className="sagva-label">Código producto *</span>
            <input
              name="codigoProducto"
              className="sagva-field"
              defaultValue={articulo?.codigoProducto ?? ""}
              required
            />
          </label>
          <label>
            <span className="sagva-label">Código inventario</span>
            <input
              name="codigoInventario"
              className="sagva-field"
              defaultValue={articulo?.codigoInventario ?? ""}
            />
          </label>
          <label>
            <span className="sagva-label">Código barra</span>
            <input
              name="codigoBarra"
              className="sagva-field"
              defaultValue={articulo?.codigoBarra ?? ""}
            />
          </label>
          <label>
            <span className="sagva-label">Estado</span>
            <select name="estado" className="sagva-field" defaultValue={articulo?.estado ?? "activo"}>
              <option value="activo">Activo</option>
              <option value="inactivo">Inactivo</option>
            </select>
          </label>
          <label className="md:col-span-2">
            <span className="sagva-label">Nombre *</span>
            <input
              name="nombre"
              className="sagva-field"
              defaultValue={articulo?.nombre ?? ""}
              required
            />
          </label>
          <label>
            <span className="sagva-label">Familia</span>
            <select name="familiaId" className="sagva-field" defaultValue={articulo?.familiaId ?? ""}>
              <option value="">Sin familia</option>
              {familias.map((familia) => (
                <option key={familia.id} value={familia.id}>
                  {familia.nombre}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="sagva-label">Subfamilia</span>
            <select
              name="subfamiliaId"
              className="sagva-field"
              defaultValue={articulo?.subfamiliaId ?? ""}
            >
              <option value="">Sin subfamilia</option>
              {subfamilias.map((subfamilia) => (
                <option key={subfamilia.id} value={subfamilia.id}>
                  {subfamilia.nombre}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="sagva-label">Marca</span>
            <select name="marcaId" className="sagva-field" defaultValue={articulo?.marcaId ?? ""}>
              <option value="">Sin marca</option>
              {marcas.map((marca) => (
                <option key={marca.id} value={marca.id}>
                  {marca.nombre}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="sagva-label">Unidad</span>
            <input name="unidadMedida" className="sagva-field" defaultValue={articulo?.unidadMedida ?? "UND"} />
          </label>
          <label>
            <span className="sagva-label">Cantidad específica</span>
            <input
              name="cantidadEspecifica"
              className="sagva-field"
              defaultValue={articulo?.cantidadEspecifica ?? ""}
            />
          </label>
          <label>
            <span className="sagva-label">Tipo impuesto</span>
            <select
              name="tipoImpuesto"
              className="sagva-field"
              defaultValue={articulo?.tipoImpuesto ?? "IVA"}
            >
              <option value="IVA">IVA</option>
              <option value="exento">Exento</option>
              <option value="impuesto_adicional">Impuesto adicional</option>
            </select>
          </label>
          <label>
            <span className="sagva-label">Impuesto adicional</span>
            <input
              name="impuestoAdicional"
              type="number"
              step="0.01"
              className="sagva-field"
              defaultValue={Number(articulo?.impuestoAdicional ?? 0)}
            />
          </label>
        </div>
      </section>

      <section className="sagva-panel">
        <div className="sagva-panel-title">Precios e inventario</div>
        <div className="grid gap-4 p-4 md:grid-cols-4">
          <label>
            <span className="sagva-label">Precio con IVA</span>
            <input
              name="precioConIva"
              type="number"
              step="0.01"
              className="sagva-field"
              defaultValue={Number(precio?.precioConIva ?? 0)}
            />
          </label>
          <label>
            <span className="sagva-label">Precio sin IVA</span>
            <input
              name="precioSinIva"
              type="number"
              step="0.01"
              className="sagva-field"
              defaultValue={Number(precio?.precioSinIva ?? 0)}
            />
          </label>
          <label>
            <span className="sagva-label">Margen %</span>
            <input
              name="margen"
              type="number"
              step="0.01"
              className="sagva-field"
              defaultValue={Number(precio?.margen ?? 0.3) * 100}
            />
          </label>
          <label>
            <span className="sagva-label">Precio mayorista</span>
            <input
              name="precioMayorista"
              type="number"
              step="0.01"
              className="sagva-field"
              defaultValue={Number(precio?.precioMayorista ?? 0)}
            />
          </label>
          <label>
            <span className="sagva-label">Stock inicial</span>
            <input name="stockInicial" type="number" step="0.001" className="sagva-field" defaultValue="0" />
          </label>
          <label>
            <span className="sagva-label">Stock mínimo</span>
            <input
              name="stockMinimo"
              type="number"
              step="0.001"
              className="sagva-field"
              defaultValue={Number(articulo?.stockMinimo ?? 0)}
            />
          </label>
          <label>
            <span className="sagva-label">Stock máximo</span>
            <input
              name="stockMaximo"
              type="number"
              step="0.001"
              className="sagva-field"
              defaultValue={Number(articulo?.stockMaximo ?? 0)}
            />
          </label>
          <label>
            <span className="sagva-label">Mínimo mayorista</span>
            <input
              name="cantidadMinimaMayorista"
              type="number"
              step="0.001"
              className="sagva-field"
              defaultValue={Number(precio?.cantidadMinimaMayorista ?? 0)}
            />
          </label>
          <label className="md:col-span-4">
            <span className="sagva-label">Comentario</span>
            <textarea
              name="comentario"
              className="sagva-field min-h-20"
              defaultValue={articulo?.comentario ?? ""}
            />
          </label>
        </div>
      </section>

      <div className="flex justify-end gap-3">
        <a href="/articulos" className="sagva-button-secondary">
          Cancelar
        </a>
        <button className="inline-flex items-center gap-2 sagva-button-primary">
          <Save className="h-4 w-4" aria-hidden="true" />
          Guardar artículo
        </button>
      </div>
    </form>
  );
}
