import type { Articulo, ArticuloPrecio, Familia, Marca, Proveedor, ProveedorProductoAsociado, Subfamilia } from "@prisma/client";
import { Save } from "lucide-react";
import { ArticuloPreciosImpuestos } from "@/components/forms/articulo-precios-impuestos";
import { crearArticuloAction, actualizarArticuloAction } from "@/app/actions/articulos.actions";

type ArticuloWithPrecio = Articulo & {
  precios: ArticuloPrecio[];
  proveedorProductos: Array<ProveedorProductoAsociado & { proveedor: Proveedor }>;
};

type ArticuloFormProps = {
  familias: Familia[];
  subfamilias: Subfamilia[];
  marcas: Marca[];
  proveedores: Proveedor[];
  articulo?: ArticuloWithPrecio;
};

export function ArticuloForm({ familias, subfamilias, marcas, proveedores, articulo }: ArticuloFormProps) {
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
            <span className="sagva-label">Código interno SAGVA</span>
            <input
              className="sagva-field bg-slate-100"
              value={articulo?.codigoProducto ?? "Automático al guardar"}
              readOnly
              aria-label="Código interno generado por SAGVA"
            />
          </label>
          <label>
            <span className="sagva-label">Código de barras</span>
            <input
              name="codigoBarra"
              className="sagva-field"
              defaultValue={articulo?.codigoBarra ?? ""}
              placeholder="Escanear o escribir"
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
        </div>
      </section>

      <section className="sagva-panel">
        <div className="sagva-panel-title">Códigos por proveedor</div>
        <div className="grid gap-4 p-4 md:grid-cols-2">
          {articulo?.proveedorProductos.map((asociacion) => (
            <label key={asociacion.id}>
              <span className="sagva-label">Código en {asociacion.proveedor.nombreComercial || asociacion.proveedor.razonSocial}</span>
              <input
                name={`codigoProveedorExistente_${asociacion.id}`}
                className="sagva-field"
                defaultValue={asociacion.productoProveedorCodigo}
                required
              />
            </label>
          ))}
          <label>
            <span className="sagva-label">Proveedor para nueva asociación</span>
            <select name="proveedorId" className="sagva-field" defaultValue="">
              <option value="">Sin nuevo proveedor</option>
              {proveedores.map((proveedor) => (
                <option key={proveedor.id} value={proveedor.id}>
                  {proveedor.nombreComercial || proveedor.razonSocial}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="sagva-label">Código del proveedor</span>
            <input
              name="codigoProveedor"
              className="sagva-field"
              placeholder="Código que figura en su factura"
            />
          </label>
          <p className="md:col-span-2 text-xs text-slate-500">
            El código pertenece al proveedor seleccionado, no al inventario. Un artículo puede tener códigos diferentes en varios proveedores.
          </p>
        </div>
      </section>

      <section className="sagva-panel">
        <div className="sagva-panel-title">Impuestos y precios</div>
        <ArticuloPreciosImpuestos
          tipoImpuestoInicial={articulo?.tipoImpuesto ?? "IVA"}
          impuestoAdicionalInicial={Number(articulo?.impuestoAdicional ?? 0)}
          precioConIvaInicial={Number(precio?.precioConIva ?? 0)}
          precioSinIvaInicial={Number(precio?.precioSinIva ?? 0)}
          margenInicial={Number(precio?.margen ?? 0.3) * 100}
        />
      </section>

      <section className="sagva-panel">
        <div className="sagva-panel-title">Inventario y precios mayoristas</div>
        <div className="grid gap-4 p-4 md:grid-cols-4">
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
