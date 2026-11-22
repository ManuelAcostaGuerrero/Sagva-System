import type { Articulo, ArticuloPrecio, ArticuloReglaMayorista, Familia, Marca, Proveedor, ProveedorProductoAsociado, Subfamilia } from "@prisma/client";
import { Save } from "lucide-react";
import { ArticuloPreciosImpuestos } from "@/components/forms/articulo-precios-impuestos";
import { CampoNumerico } from "@/components/forms/campo-numerico";
import { ArticuloClasificacion } from "@/components/forms/articulo-clasificacion";
import { ArticuloReglasMayoristas } from "@/components/forms/articulo-reglas-mayoristas";
import { crearArticuloAction, actualizarArticuloAction } from "@/app/actions/articulos.actions";

type ArticuloWithPrecio = Articulo & {
  precios: ArticuloPrecio[];
  reglasMayoristas: ArticuloReglaMayorista[];
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
        <div className="sagva-panel-title flex flex-wrap items-center justify-between gap-2">
          <span>Información del artículo</span>
          <span className="text-xs font-normal">Código interno SAGVA: {articulo?.codigoProducto ?? "Automático al guardar"}</span>
        </div>
        <div className="grid gap-4 p-4 md:grid-cols-4">
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
          <label>
            <span className="sagva-label">Tipo de artículo</span>
            <select name="tipoArticulo" className="sagva-field" defaultValue={articulo?.tipoArticulo ?? "PRODUCTO"} required>
              <option value="PRODUCTO">Producto</option>
              <option value="ARTICULO">Artículo</option>
              <option value="PROMOCION">Promoción</option>
            </select>
            <span className="mt-1 block text-xs text-slate-500">Solo clasificación; las promociones se configurarán en una etapa posterior.</span>
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
          <ArticuloClasificacion
            familias={familias}
            subfamilias={subfamilias}
            familiaInicial={articulo?.familiaId ?? ""}
            subfamiliaInicial={articulo?.subfamiliaId ?? ""}
          />
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
        <div className="grid max-w-3xl gap-3 p-4 md:grid-cols-2">
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
        <div className="sagva-panel-title">Inventario</div>
        <div className="grid gap-4 p-4 md:grid-cols-4">
          <label>
            <span className="sagva-label">Stock mínimo</span>
            <CampoNumerico name="stockMinimo" defaultValue={Number(articulo?.stockMinimo ?? 0)} decimales={3} />
          </label>
          <label>
            <span className="sagva-label">Stock máximo</span>
            <CampoNumerico name="stockMaximo" defaultValue={Number(articulo?.stockMaximo ?? 0)} decimales={3} />
          </label>
        </div>
      </section>

      <section className="sagva-panel">
        <div className="sagva-panel-title">Reglas de precios mayoristas</div>
        <ArticuloReglasMayoristas
          iniciales={
            articulo?.reglasMayoristas.length
              ? articulo.reglasMayoristas.map((regla) => ({
                  id: regla.id,
                  cantidadMinima: Number(regla.cantidadMinima),
                  precioUnitario: Number(regla.precioUnitario)
                }))
              : precio && Number(precio.cantidadMinimaMayorista ?? 0) > 0 &&
                Number(precio.precioMayorista ?? 0) > 0
                ? [{
                    id: "regla-legada",
                    cantidadMinima: Number(precio.cantidadMinimaMayorista),
                    precioUnitario: Number(precio.precioMayorista)
                  }]
                : []
          }
        />
      </section>

      <section className="sagva-panel">
        <div className="sagva-panel-title">Comentario</div>
          <label className="block p-4">
            <span className="sagva-label">Comentario</span>
            <textarea
              name="comentario"
              className="sagva-field min-h-20"
              defaultValue={articulo?.comentario ?? ""}
            />
          </label>
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
