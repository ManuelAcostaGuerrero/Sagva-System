"use client";

import { useMemo, useState } from "react";
import { CreditCard, Plus, Search, Trash2 } from "lucide-react";
import { formatCurrency } from "@/utils/formatters/currency";
import { guardarVentaAction } from "./actions";

type ProductoVenta = {
  articuloId: string;
  codigoProducto: string;
  codigoBarra: string | null;
  nombreArticulo: string;
  precioPublico: number;
  stockDisponible: number;
  controlaStock: boolean;
};

type CajaActiva = {
  id: string;
  nombre: string;
  estado: string;
} | null;

type LineaVenta = {
  articuloId: string;
  codigoProducto: string;
  nombreArticulo: string;
  cantidad: number;
  precioUnitario: number;
  descuento: number;
  totalLinea: number;
  stockDisponible: number;
};

type PagoVenta = {
  id: string;
  metodo: string;
  monto: number;
  referencia: string;
};

type NuevaVentaClientProps = {
  productos: ProductoVenta[];
  cajaActiva: CajaActiva;
  sucursalId: string;
  sucursalNombre: string;
};

const metodosPago = ["EFECTIVO", "DEBITO", "CREDITO", "TRANSFERENCIA"];

function money(value: number) {
  return formatCurrency(Number.isFinite(value) ? value : 0);
}

export function VentasNuevaClient({
  productos,
  cajaActiva,
  sucursalId,
  sucursalNombre,
}: NuevaVentaClientProps) {
  const [busqueda, setBusqueda] = useState("");
  const [lineas, setLineas] = useState<LineaVenta[]>([]);
  const [pagos, setPagos] = useState<PagoVenta[]>([]);
  const [metodoPago, setMetodoPago] = useState("EFECTIVO");
  const [montoPago, setMontoPago] = useState("");
  const [referenciaPago, setReferenciaPago] = useState("");
  const [cliente, setCliente] = useState("");
  const [observacion, setObservacion] = useState("");

  const productosFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return [];

    return productos
      .filter((producto) => {
        return [
          producto.codigoProducto,
          producto.codigoBarra ?? "",
          producto.nombreArticulo,
        ]
          .join(" ")
          .toLowerCase()
          .includes(q);
      })
      .slice(0, 8);
  }, [busqueda, productos]);

  const subtotal = useMemo(
    () => lineas.reduce((sum, linea) => sum + linea.cantidad * linea.precioUnitario, 0),
    [lineas],
  );

  const descuentoTotal = useMemo(
    () => lineas.reduce((sum, linea) => sum + linea.descuento, 0),
    [lineas],
  );

  const total = useMemo(
    () => lineas.reduce((sum, linea) => sum + linea.totalLinea, 0),
    [lineas],
  );

  const totalPagado = useMemo(
    () => pagos.reduce((sum, pago) => sum + pago.monto, 0),
    [pagos],
  );

  const saldoPendiente = Math.max(total - totalPagado, 0);
  const vuelto = Math.max(totalPagado - total, 0);
  const lineasPayload = JSON.stringify(
    lineas.map((linea) => ({
      articuloId: linea.articuloId,
      cantidad: linea.cantidad,
      precioUnitario: linea.precioUnitario,
      descuento: linea.descuento,
    })),
  );
  const pagosPayload = JSON.stringify(
    pagos.map((pago) => ({
      metodo: pago.metodo,
      monto: pago.monto,
      referencia: pago.referencia,
    })),
  );

  function agregarProducto(producto: ProductoVenta) {
    setLineas((current) => {
      const existente = current.find((linea) => linea.articuloId === producto.articuloId);

      if (existente) {
        return current.map((linea) => {
          if (linea.articuloId !== producto.articuloId) return linea;
          const nuevaCantidad = linea.cantidad + 1;
          return {
            ...linea,
            cantidad: nuevaCantidad,
            totalLinea: Math.max(nuevaCantidad * linea.precioUnitario - linea.descuento, 0),
          };
        });
      }

      return [
        ...current,
        {
          articuloId: producto.articuloId,
          codigoProducto: producto.codigoProducto,
          nombreArticulo: producto.nombreArticulo,
          cantidad: 1,
          precioUnitario: producto.precioPublico,
          descuento: 0,
          totalLinea: producto.precioPublico,
          stockDisponible: producto.stockDisponible,
        },
      ];
    });
    setBusqueda("");
  }

  function cambiarCantidad(articuloId: string, cantidad: number) {
    setLineas((current) =>
      current.map((linea) => {
        if (linea.articuloId !== articuloId) return linea;
        const nextCantidad = Math.max(cantidad, 1);
        return {
          ...linea,
          cantidad: nextCantidad,
          totalLinea: Math.max(nextCantidad * linea.precioUnitario - linea.descuento, 0),
        };
      }),
    );
  }

  function cambiarDescuento(articuloId: string, descuento: number) {
    setLineas((current) =>
      current.map((linea) => {
        if (linea.articuloId !== articuloId) return linea;
        const nextDescuento = Math.max(descuento, 0);
        return {
          ...linea,
          descuento: nextDescuento,
          totalLinea: Math.max(linea.cantidad * linea.precioUnitario - nextDescuento, 0),
        };
      }),
    );
  }

  function eliminarLinea(articuloId: string) {
    setLineas((current) => current.filter((linea) => linea.articuloId !== articuloId));
  }

  function limpiarVenta() {
    setLineas([]);
    setPagos([]);
    setMontoPago("");
    setReferenciaPago("");
    setCliente("");
    setObservacion("");
    setBusqueda("");
  }

  function agregarPago() {
    const monto = Number(montoPago || saldoPendiente);
    if (!metodoPago || !Number.isFinite(monto) || monto <= 0) return;

    setPagos((current) => [
      ...current,
      {
        id: `pago-${Date.now()}`,
        metodo: metodoPago,
        monto,
        referencia: referenciaPago,
      },
    ]);
    setMontoPago("");
    setReferenciaPago("");
  }

  function eliminarPago(pagoId: string) {
    setPagos((current) => current.filter((pago) => pago.id !== pagoId));
  }

  function seleccionarMetodoPago(metodo: string) {
    setMetodoPago(metodo);
    setMontoPago(String(saldoPendiente || total || 0));
  }

  return (
    <form action={guardarVentaAction} className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_370px]">
      <input type="hidden" name="sucursalId" value={sucursalId} />
      <input type="hidden" name="cajaId" value={cajaActiva?.id ?? ""} />
      <input type="hidden" name="cliente" value={cliente} />
      <input type="hidden" name="observacion" value={observacion} />
      <input type="hidden" name="lineas" value={lineasPayload} />
      <input type="hidden" name="pagos" value={pagosPayload} />

      <div className="space-y-5">
        <div className="sagva-panel p-5">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="sagva-label">Cliente</label>
              <input
                className="sagva-field"
                value={cliente}
                onChange={(event) => setCliente(event.target.value)}
                placeholder="Cliente general o RUT/RUC"
              />
            </div>
            <div>
              <label className="sagva-label">Sucursal</label>
              <input className="sagva-field" value={sucursalNombre} readOnly />
            </div>
            <div>
              <label className="sagva-label">Caja activa</label>
              <input
                className="sagva-field"
                value={cajaActiva ? `${cajaActiva.nombre} - ${cajaActiva.estado}` : "Sin caja abierta"}
                readOnly
              />
            </div>
          </div>
        </div>

        <div className="sagva-panel overflow-visible">
          <div className="sagva-panel-title flex items-center justify-between gap-3">
            <span>Producto</span>
            <span className="text-xs font-semibold text-slate-500">
              Busca por nombre, código interno o código de barra
            </span>
          </div>
          <div className="p-4">
            <label className="sagva-label">Nombre o código del producto</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                className="sagva-field pl-9"
                value={busqueda}
                onChange={(event) => setBusqueda(event.target.value)}
                placeholder="Escribe para desplegar productos..."
              />

              {busqueda.trim() ? (
                <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-30 max-h-80 overflow-y-auto rounded-lg border border-[#d8dee8] bg-white shadow-lg">
                  {productosFiltrados.map((producto) => (
                    <button
                      key={producto.articuloId}
                      type="button"
                      onClick={() => agregarProducto(producto)}
                      className="flex w-full items-center justify-between gap-4 border-b border-[#eef2f7] px-4 py-3 text-left last:border-b-0 hover:bg-blue-50"
                    >
                      <div>
                        <p className="font-bold text-slate-950">{producto.nombreArticulo}</p>
                        <p className="text-xs text-slate-500">
                          Código: {producto.codigoProducto}
                          {producto.codigoBarra ? ` · Barra: ${producto.codigoBarra}` : ""}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-[#064ea4]">{money(producto.precioPublico)}</p>
                        <p className="text-xs font-semibold text-slate-500">Stock {producto.stockDisponible}</p>
                      </div>
                      <Plus className="h-4 w-4 shrink-0 text-[#064ea4]" aria-hidden="true" />
                    </button>
                  ))}

                  {productosFiltrados.length === 0 ? (
                    <div className="px-4 py-5 text-sm text-slate-500">
                      No se encontraron productos para esa búsqueda.
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
            <p className="mt-2 text-xs text-slate-500">
              Los productos solo aparecen cuando escribes. Al seleccionar uno, se agrega al detalle de venta.
            </p>
          </div>
        </div>

        <div className="sagva-panel overflow-hidden">
          <div className="sagva-panel-title">Detalle de venta</div>
          <div className="overflow-x-auto">
            <table className="sagva-table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Cant.</th>
                  <th>Precio</th>
                  <th>Desc.</th>
                  <th>Total</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {lineas.map((linea) => (
                  <tr key={linea.articuloId}>
                    <td>
                      <p className="font-bold text-slate-950">{linea.nombreArticulo}</p>
                      <p className="text-xs text-slate-500">{linea.codigoProducto}</p>
                    </td>
                    <td>
                      <input
                        className="sagva-field w-20"
                        type="number"
                        min={1}
                        value={linea.cantidad}
                        onChange={(event) =>
                          cambiarCantidad(linea.articuloId, Number(event.target.value))
                        }
                      />
                    </td>
                    <td>{money(linea.precioUnitario)}</td>
                    <td>
                      <input
                        className="sagva-field w-28"
                        type="number"
                        min={0}
                        value={linea.descuento}
                        onChange={(event) =>
                          cambiarDescuento(linea.articuloId, Number(event.target.value))
                        }
                      />
                    </td>
                    <td className="font-bold text-slate-950">{money(linea.totalLinea)}</td>
                    <td>
                      <button
                        type="button"
                        onClick={() => eliminarLinea(linea.articuloId)}
                        className="rounded-md p-2 text-red-600 hover:bg-red-50"
                        title="Eliminar producto"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </td>
                  </tr>
                ))}
                {lineas.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500">
                      Todavía no hay productos agregados a esta venta.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <aside className="space-y-5">
        <div className="sagva-panel p-5">
          <h2 className="text-lg font-bold text-slate-950">Resumen</h2>
          <div className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Subtotal</span>
              <span className="font-bold">{money(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Descuento</span>
              <span className="font-bold">{money(descuentoTotal)}</span>
            </div>
            <div className="flex justify-between border-t border-[#d8dee8] pt-3 text-base">
              <span className="font-bold text-slate-950">Total</span>
              <span className="font-bold text-[#064ea4]">{money(total)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Total pagado</span>
              <span className="font-bold">{money(totalPagado)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Saldo pendiente</span>
              <span className="font-bold text-red-700">{money(saldoPendiente)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Vuelto</span>
              <span className="font-bold text-green-700">{money(vuelto)}</span>
            </div>
          </div>
        </div>

        <div className="sagva-panel p-5">
          <h2 className="flex items-center gap-2 text-lg font-bold text-slate-950">
            <CreditCard className="h-5 w-5" aria-hidden="true" />
            Pagos
          </h2>

          <div className="mt-4 grid grid-cols-2 gap-2">
            {metodosPago.map((metodo) => (
              <button
                key={metodo}
                type="button"
                onClick={() => seleccionarMetodoPago(metodo)}
                className={`rounded-md border px-3 py-2 text-sm font-bold ${
                  metodoPago === metodo
                    ? "border-[#064ea4] bg-blue-50 text-[#064ea4]"
                    : "border-[#d8dee8] bg-white text-slate-700"
                }`}
              >
                {metodo}
              </button>
            ))}
          </div>

          <div className="mt-4 space-y-3">
            <div>
              <label className="sagva-label">Monto a ingresar</label>
              <input
                className="sagva-field"
                type="number"
                value={montoPago}
                onChange={(event) => setMontoPago(event.target.value)}
                placeholder={String(saldoPendiente || total || 0)}
              />
            </div>
            <div>
              <label className="sagva-label">Referencia</label>
              <input
                className="sagva-field"
                value={referenciaPago}
                onChange={(event) => setReferenciaPago(event.target.value)}
                placeholder="Código operación, voucher, nota"
              />
            </div>
            <button
              type="button"
              onClick={agregarPago}
              disabled={!lineas.length || total <= 0}
              className="w-full sagva-button-secondary disabled:cursor-not-allowed disabled:opacity-50"
            >
              Agregar pago
            </button>
          </div>

          <div className="mt-4 space-y-2">
            {pagos.map((pago) => (
              <div
                key={pago.id}
                className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2 text-sm"
              >
                <span className="font-bold">{pago.metodo}</span>
                <div className="flex items-center gap-2">
                  <span>{money(pago.monto)}</span>
                  <button
                    type="button"
                    onClick={() => eliminarPago(pago.id)}
                    className="rounded p-1 text-red-600 hover:bg-red-50"
                    title="Eliminar pago"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </div>
              </div>
            ))}
            {pagos.length === 0 ? (
              <p className="rounded-md bg-slate-50 px-3 py-3 text-sm text-slate-500">
                No hay pagos registrados.
              </p>
            ) : null}
          </div>
        </div>

        <div className="sagva-panel p-5">
          <h2 className="text-lg font-bold text-slate-950">Observación</h2>
          <textarea
            className="sagva-field mt-3 min-h-24"
            value={observacion}
            onChange={(event) => setObservacion(event.target.value)}
            placeholder="Observaciones internas de la venta"
          />
        </div>

        <div className="grid gap-3">
          <button
            type="submit"
            name="accion"
            value="cobrar"
            disabled={!lineas.length || saldoPendiente > 0 || !cajaActiva}
            className="sagva-button-primary disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cobrar venta
          </button>
          <button
            type="submit"
            name="accion"
            value="pendiente"
            disabled={!lineas.length}
            className="sagva-button-secondary disabled:cursor-not-allowed disabled:opacity-50"
          >
            Guardar pendiente
          </button>
          <button
            type="button"
            onClick={limpiarVenta}
            className="rounded-md border border-red-200 bg-white px-4 py-3 text-sm font-bold text-red-700 hover:bg-red-50"
          >
            Anular pestaña
          </button>
        </div>
      </aside>
    </form>
  );
}
