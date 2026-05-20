"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CreditCard, Plus, Trash2, X } from "lucide-react";
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

type TipoDescuento = "monto" | "porcentaje";

type LineaVenta = {
  articuloId: string;
  codigoProducto: string;
  nombreArticulo: string;
  cantidad: number;
  precioUnitario: number;
  descuentoTipo: TipoDescuento;
  descuentoValor: number;
  descuento: number;
  totalLinea: number;
  stockDisponible: number;
};

type PagoVenta = {
  id: string;
  metodo: string;
  monto: number;
};

type VentaTemporal = {
  id: string;
  numero: number;
  cliente: string;
  lineas: LineaVenta[];
  pagos: PagoVenta[];
  observacion: string;
  metodoPago: string;
  montoPago: string;
};

type DialogoDescuento = {
  articuloId: string;
  nombreArticulo: string;
};

type NuevaVentaClientProps = {
  productos: ProductoVenta[];
  cajaActiva: CajaActiva;
  sucursalId: string;
  sucursalNombre: string;
};

const metodosPago = ["EFECTIVO", "DEBITO", "CREDITO", "TRANSFERENCIA"];
const DESCUENTOS_REQUIEREN_AUTORIZACION = true;
const PIN_DESCUENTO_TEMPORAL = ["12", "34"].join("");
const MAX_DESCUENTO_PORCENTAJE_TEMPORAL = 100;

function money(value: number) {
  return formatCurrency(Number.isFinite(value) ? value : 0);
}

function crearVentaTemporal(numero: number): VentaTemporal {
  return {
    id: `venta-${Date.now()}-${numero}`,
    numero,
    cliente: "",
    lineas: [],
    pagos: [],
    observacion: "",
    metodoPago: "EFECTIVO",
    montoPago: "",
  };
}

function totalVenta(lineas: LineaVenta[]) {
  return lineas.reduce((sum, linea) => sum + linea.totalLinea, 0);
}

function totalPagadoVenta(pagos: PagoVenta[]) {
  return pagos.reduce((sum, pago) => sum + pago.monto, 0);
}

function calcularDescuento(linea: Pick<LineaVenta, "cantidad" | "precioUnitario" | "descuentoTipo" | "descuentoValor">) {
  const bruto = Math.max(linea.cantidad * linea.precioUnitario, 0);
  const valor = Math.max(Number(linea.descuentoValor) || 0, 0);
  const porcentaje = Math.min(valor, MAX_DESCUENTO_PORCENTAJE_TEMPORAL);
  const descuento = linea.descuentoTipo === "porcentaje" ? bruto * (porcentaje / 100) : valor;
  return Math.min(descuento, bruto);
}

function recalcularLinea(linea: LineaVenta): LineaVenta {
  const descuento = calcularDescuento(linea);
  return {
    ...linea,
    descuento,
    totalLinea: Math.max(linea.cantidad * linea.precioUnitario - descuento, 0),
  };
}

export function VentasNuevaClient({
  productos,
  cajaActiva,
  sucursalId,
  sucursalNombre,
}: NuevaVentaClientProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const efectivoInputRef = useRef<HTMLInputElement>(null);
  const pinDescuentoInputRef = useRef<HTMLInputElement>(null);
  const descuentoInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const primeraVentaRef = useRef(crearVentaTemporal(1));
  const [busqueda, setBusqueda] = useState("");
  const [ventas, setVentas] = useState<VentaTemporal[]>(() => [primeraVentaRef.current]);
  const [ventaActivaId, setVentaActivaId] = useState(() => primeraVentaRef.current.id);
  const [quickMetodo, setQuickMetodo] = useState("");
  const [efectivoRecibido, setEfectivoRecibido] = useState("");
  const [dialogoEfectivoAbierto, setDialogoEfectivoAbierto] = useState(false);
  const [dialogoDescuento, setDialogoDescuento] = useState<DialogoDescuento | null>(null);
  const [pinDescuento, setPinDescuento] = useState("");
  const [errorPinDescuento, setErrorPinDescuento] = useState("");
  const [descuentosAutorizados, setDescuentosAutorizados] = useState<Record<string, boolean>>({});
  const [bannerVuelto, setBannerVuelto] = useState<{ pago: number; vuelto: number } | null>(null);

  const ventaActiva = ventas.find((venta) => venta.id === ventaActivaId) ?? ventas[0];

  const lineas = ventaActiva?.lineas ?? [];
  const pagos = ventaActiva?.pagos ?? [];
  const cliente = ventaActiva?.cliente ?? "";
  const observacion = ventaActiva?.observacion ?? "";
  const metodoPago = ventaActiva?.metodoPago ?? "EFECTIVO";
  const montoPago = ventaActiva?.montoPago ?? "";

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

  const total = useMemo(() => totalVenta(lineas), [lineas]);
  const totalPagado = useMemo(() => totalPagadoVenta(pagos), [pagos]);
  const saldoPendiente = Math.max(total - totalPagado, 0);
  const vuelto = Math.max(totalPagado - total, 0);
  const puedeAgregarPago = lineas.length > 0 && total > 0 && saldoPendiente > 0;
  const puedeCobroRapido = lineas.length > 0 && total > 0 && !!cajaActiva && pagos.length === 0;

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
    })),
  );

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const pagoRaw = params.get("pago");
    const vueltoRaw = params.get("vuelto");

    if (!pagoRaw || !vueltoRaw) {
      setBannerVuelto(null);
      return;
    }

    const pago = Number(pagoRaw);
    const vueltoParam = Number(vueltoRaw);

    if (params.get("success") === "cobrada" && Number.isFinite(pago) && Number.isFinite(vueltoParam)) {
      setBannerVuelto({ pago, vuelto: vueltoParam });
      return;
    }

    setBannerVuelto(null);
  }, []);

  useEffect(() => {
    if (!dialogoEfectivoAbierto) return;
    setTimeout(() => efectivoInputRef.current?.focus(), 50);
  }, [dialogoEfectivoAbierto]);

  useEffect(() => {
    if (!dialogoDescuento) return;
    setTimeout(() => pinDescuentoInputRef.current?.focus(), 50);
  }, [dialogoDescuento]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.ctrlKey || event.altKey || event.metaKey) return;
      if (!["F2", "F6", "F8", "F10"].includes(event.key)) return;
      event.preventDefault();

      if (event.key === "F2") iniciarCobroRapido("efectivo");
      if (event.key === "F6") iniciarCobroRapido("debito");
      if (event.key === "F8") iniciarCobroRapido("credito");
      if (event.key === "F10") iniciarCobroRapido("transferencia");
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  function actualizarVentaActiva(updater: (venta: VentaTemporal) => VentaTemporal) {
    setVentas((current) =>
      current.map((venta) => (venta.id === ventaActivaId ? updater(venta) : venta)),
    );
  }

  function crearNuevaInstanciaVenta() {
    const nextNumero = Math.max(...ventas.map((venta) => venta.numero), 0) + 1;
    const nuevaVenta = crearVentaTemporal(nextNumero);
    setVentas((current) => [...current, nuevaVenta]);
    setVentaActivaId(nuevaVenta.id);
    setBusqueda("");
    setQuickMetodo("");
    setEfectivoRecibido("");
    setDialogoEfectivoAbierto(false);
    setDialogoDescuento(null);
  }

  function cerrarVentaTemporal(id: string) {
    if (ventas.length === 1) {
      limpiarVenta();
      return;
    }

    setVentas((current) => {
      const filtradas = current.filter((venta) => venta.id !== id);
      if (id === ventaActivaId) {
        setVentaActivaId(filtradas[0]?.id ?? crearVentaTemporal(1).id);
      }
      return filtradas.length ? filtradas : [crearVentaTemporal(1)];
    });
  }

  function agregarProducto(producto: ProductoVenta) {
    setBannerVuelto(null);
    actualizarVentaActiva((venta) => {
      const existente = venta.lineas.find((linea) => linea.articuloId === producto.articuloId);

      if (existente) {
        return {
          ...venta,
          lineas: venta.lineas.map((linea) => {
            if (linea.articuloId !== producto.articuloId) return linea;
            return recalcularLinea({ ...linea, cantidad: linea.cantidad + 1 });
          }),
        };
      }

      return {
        ...venta,
        lineas: [
          ...venta.lineas,
          {
            articuloId: producto.articuloId,
            codigoProducto: producto.codigoProducto,
            nombreArticulo: producto.nombreArticulo,
            cantidad: 1,
            precioUnitario: producto.precioPublico,
            descuentoTipo: "monto",
            descuentoValor: 0,
            descuento: 0,
            totalLinea: producto.precioPublico,
            stockDisponible: producto.stockDisponible,
          },
        ],
      };
    });
    setBusqueda("");
  }

  function cambiarCantidad(articuloId: string, cantidad: number) {
    actualizarVentaActiva((venta) => ({
      ...venta,
      lineas: venta.lineas.map((linea) => {
        if (linea.articuloId !== articuloId) return linea;
        return recalcularLinea({ ...linea, cantidad: Math.max(cantidad, 1) });
      }),
    }));
  }

  function descuentoEstaAutorizado(articuloId: string) {
    return !DESCUENTOS_REQUIEREN_AUTORIZACION || descuentosAutorizados[articuloId];
  }

  function solicitarAutorizacionDescuento(linea: LineaVenta) {
    if (descuentoEstaAutorizado(linea.articuloId)) return true;

    setDialogoDescuento({ articuloId: linea.articuloId, nombreArticulo: linea.nombreArticulo });
    setPinDescuento("");
    setErrorPinDescuento("");
    return false;
  }

  function confirmarAutorizacionDescuento() {
    if (!dialogoDescuento) return;

    if (pinDescuento !== PIN_DESCUENTO_TEMPORAL) {
      setErrorPinDescuento("PIN incorrecto.");
      return;
    }

    const articuloId = dialogoDescuento.articuloId;
    setDescuentosAutorizados((current) => ({ ...current, [articuloId]: true }));
    setDialogoDescuento(null);
    setPinDescuento("");
    setErrorPinDescuento("");
    setTimeout(() => {
      const input = descuentoInputRefs.current[articuloId];
      input?.focus();
      input?.select();
    }, 50);
  }

  function cambiarTipoDescuento(articuloId: string, descuentoTipo: TipoDescuento) {
    actualizarVentaActiva((venta) => ({
      ...venta,
      lineas: venta.lineas.map((linea) => {
        if (linea.articuloId !== articuloId) return linea;
        return recalcularLinea({ ...linea, descuentoTipo, descuentoValor: 0 });
      }),
    }));
  }

  function cambiarDescuento(articuloId: string, descuentoValor: number) {
    actualizarVentaActiva((venta) => ({
      ...venta,
      lineas: venta.lineas.map((linea) => {
        if (linea.articuloId !== articuloId) return linea;
        const valorLimitado = linea.descuentoTipo === "porcentaje"
          ? Math.min(Math.max(descuentoValor, 0), MAX_DESCUENTO_PORCENTAJE_TEMPORAL)
          : Math.max(descuentoValor, 0);
        return recalcularLinea({ ...linea, descuentoValor: valorLimitado });
      }),
    }));
  }

  function eliminarLinea(articuloId: string) {
    actualizarVentaActiva((venta) => ({
      ...venta,
      lineas: venta.lineas.filter((linea) => linea.articuloId !== articuloId),
    }));
    setDescuentosAutorizados((current) => {
      const next = { ...current };
      delete next[articuloId];
      return next;
    });
  }

  function limpiarVenta() {
    actualizarVentaActiva((venta) => ({
      ...venta,
      cliente: "",
      lineas: [],
      pagos: [],
      observacion: "",
      metodoPago: "EFECTIVO",
      montoPago: "",
    }));
    setBusqueda("");
    setQuickMetodo("");
    setEfectivoRecibido("");
    setDialogoEfectivoAbierto(false);
    setDialogoDescuento(null);
    setDescuentosAutorizados({});
    setBannerVuelto(null);
  }

  function agregarPago() {
    if (!puedeAgregarPago) return;

    const montoSolicitado = Number(montoPago || saldoPendiente);
    if (!metodoPago || !Number.isFinite(montoSolicitado) || montoSolicitado <= 0) return;

    const monto = Math.min(montoSolicitado, saldoPendiente);

    actualizarVentaActiva((venta) => ({
      ...venta,
      pagos: [
        ...venta.pagos,
        {
          id: `pago-${Date.now()}`,
          metodo: metodoPago,
          monto,
        },
      ],
      montoPago: "",
    }));
  }

  function eliminarPago(pagoId: string) {
    actualizarVentaActiva((venta) => ({
      ...venta,
      pagos: venta.pagos.filter((pago) => pago.id !== pagoId),
    }));
  }

  function seleccionarMetodoPago(metodo: string) {
    actualizarVentaActiva((venta) => ({
      ...venta,
      metodoPago: metodo,
      montoPago: saldoPendiente > 0 ? String(saldoPendiente) : "",
    }));
  }

  function iniciarCobroRapido(metodo: string) {
    if (!puedeCobroRapido) return;
    setBannerVuelto(null);

    if (metodo === "efectivo") {
      setQuickMetodo("efectivo");
      setEfectivoRecibido(String(total));
      setDialogoEfectivoAbierto(true);
      return;
    }

    setQuickMetodo(metodo);
    setEfectivoRecibido("");
    setTimeout(() => formRef.current?.requestSubmit(), 0);
  }

  function confirmarEfectivo() {
    const pago = Number(efectivoRecibido);
    if (!Number.isFinite(pago) || pago < total) return;
    setQuickMetodo("efectivo");
    setTimeout(() => formRef.current?.requestSubmit(), 0);
  }

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {ventas.length > 1
          ? ventas.map((venta) => {
              const ventaTotal = totalVenta(venta.lineas);
              const activa = venta.id === ventaActivaId;
              return (
                <button
                  key={venta.id}
                  type="button"
                  onClick={() => setVentaActivaId(venta.id)}
                  className={`flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-bold ${
                    activa
                      ? "border-[#064ea4] bg-blue-50 text-[#064ea4]"
                      : "border-[#d8dee8] bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <span>Venta {venta.numero}</span>
                  {venta.lineas.length > 0 ? (
                    <span className="text-xs font-semibold text-slate-500">{money(ventaTotal)}</span>
                  ) : null}
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(event) => {
                      event.stopPropagation();
                      cerrarVentaTemporal(venta.id);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        event.stopPropagation();
                        cerrarVentaTemporal(venta.id);
                      }
                    }}
                    className="rounded-full p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
                    title="Cerrar venta"
                  >
                    <X className="h-3.5 w-3.5" aria-hidden="true" />
                  </span>
                </button>
              );
            })
          : null}
        <button
          type="button"
          onClick={crearNuevaInstanciaVenta}
          className="inline-flex items-center gap-2 rounded-full border border-dashed border-[#064ea4] bg-white px-3 py-2 text-sm font-bold text-[#064ea4] hover:bg-blue-50"
          title="Nueva venta"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Nueva venta
        </button>
      </div>

      <form ref={formRef} action={guardarVentaAction} className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_370px]">
        <input type="hidden" name="sucursalId" value={sucursalId} />
        <input type="hidden" name="cajaId" value={cajaActiva?.id ?? ""} />
        <input type="hidden" name="cliente" value={cliente} />
        <input type="hidden" name="observacion" value={observacion} />
        <input type="hidden" name="lineas" value={lineasPayload} />
        <input type="hidden" name="pagos" value={pagosPayload} />
        <input type="hidden" name="quickMetodo" value={quickMetodo} />
        <input type="hidden" name="efectivoRecibido" value={efectivoRecibido} />

        <div className="space-y-5">
          <div className="sagva-panel p-5">
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label className="sagva-label">Cliente</label>
                <input
                  className="sagva-field"
                  value={cliente}
                  onChange={(event) =>
                    actualizarVentaActiva((venta) => ({ ...venta, cliente: event.target.value }))
                  }
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
            <div className="sagva-panel-title">Producto</div>
            <div className="p-4">
              <label className="sagva-label">Nombre o código del producto</label>
              <div className="relative">
                <input
                  className="sagva-field"
                  value={busqueda}
                  onChange={(event) => setBusqueda(event.target.value)}
                  placeholder="Escribe el producto"
                />

                {busqueda.trim() ? (
                  <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-30 max-h-80 overflow-y-auto rounded-lg border border-[#d8dee8] bg-white shadow-lg">
                    {productosFiltrados.map((producto) => {
                      const sinStock = producto.stockDisponible <= 0;
                      return (
                        <button
                          key={producto.articuloId}
                          type="button"
                          onClick={() => agregarProducto(producto)}
                          className={`flex w-full items-center justify-between gap-4 border-b px-4 py-3 text-left last:border-b-0 ${
                            sinStock
                              ? "border-amber-200 bg-amber-50 hover:bg-amber-100"
                              : "border-[#eef2f7] hover:bg-blue-50"
                          }`}
                        >
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-bold text-slate-950">{producto.nombreArticulo}</p>
                              {sinStock ? (
                                <span className="rounded-full bg-amber-200 px-2 py-0.5 text-[11px] font-bold text-amber-900">
                                  Sin stock
                                </span>
                              ) : null}
                            </div>
                            <p className="text-xs text-slate-500">
                              Código: {producto.codigoProducto}
                              {producto.codigoBarra ? ` · Barra: ${producto.codigoBarra}` : ""}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-[#064ea4]">{money(producto.precioPublico)}</p>
                            <p className={`text-xs font-semibold ${sinStock ? "text-amber-800" : "text-slate-500"}`}>
                              Stock {producto.stockDisponible}
                            </p>
                          </div>
                          <Plus className="h-4 w-4 shrink-0 text-[#064ea4]" aria-hidden="true" />
                        </button>
                      );
                    })}

                    {productosFiltrados.length === 0 ? (
                      <div className="px-4 py-5 text-sm text-slate-500">
                        No se encontraron productos para esa búsqueda.
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
              <p className="mt-2 text-xs text-slate-500">
                Los productos sin stock se muestran en amarillo. Se pueden vender, pero quedarán con stock negativo.
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
                  {lineas.map((linea) => {
                    const sinStock = linea.stockDisponible <= 0;
                    const descuentoAutorizado = descuentoEstaAutorizado(linea.articuloId);
                    return (
                      <tr key={linea.articuloId} className={sinStock ? "bg-amber-50" : undefined}>
                        <td>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-bold text-slate-950">{linea.nombreArticulo}</p>
                            {sinStock ? (
                              <span className="rounded-full bg-amber-200 px-2 py-0.5 text-[11px] font-bold text-amber-900">
                                Venta sin stock
                              </span>
                            ) : null}
                          </div>
                          <p className="text-xs text-slate-500">{linea.codigoProducto}</p>
                        </td>
                        <td>
                          <input
                            className="sagva-field w-20"
                            type="number"
                            min={1}
                            value={linea.cantidad}
                            onFocus={(event) => event.currentTarget.select()}
                            onClick={(event) => event.currentTarget.select()}
                            onChange={(event) =>
                              cambiarCantidad(linea.articuloId, Number(event.target.value))
                            }
                          />
                        </td>
                        <td>{money(linea.precioUnitario)}</td>
                        <td>
                          <div className="flex min-w-44 items-center gap-2">
                            <select
                              className="sagva-field w-24"
                              value={linea.descuentoTipo}
                              onMouseDown={(event) => {
                                if (!descuentoAutorizado) {
                                  event.preventDefault();
                                  solicitarAutorizacionDescuento(linea);
                                }
                              }}
                              onChange={(event) => {
                                if (!descuentoAutorizado) return;
                                cambiarTipoDescuento(linea.articuloId, event.target.value as TipoDescuento);
                              }}
                            >
                              <option value="monto">Monto</option>
                              <option value="porcentaje">%</option>
                            </select>
                            <input
                              ref={(node) => {
                                descuentoInputRefs.current[linea.articuloId] = node;
                              }}
                              className="sagva-field w-24"
                              type="number"
                              min={0}
                              max={linea.descuentoTipo === "porcentaje" ? MAX_DESCUENTO_PORCENTAJE_TEMPORAL : undefined}
                              value={linea.descuentoValor}
                              readOnly={!descuentoAutorizado}
                              onFocus={(event) => {
                                if (!descuentoAutorizado) {
                                  event.currentTarget.blur();
                                  solicitarAutorizacionDescuento(linea);
                                  return;
                                }
                                event.currentTarget.select();
                              }}
                              onClick={(event) => {
                                if (!descuentoAutorizado) {
                                  event.currentTarget.blur();
                                  solicitarAutorizacionDescuento(linea);
                                  return;
                                }
                                event.currentTarget.select();
                              }}
                              onChange={(event) => {
                                if (!descuentoAutorizado) return;
                                cambiarDescuento(linea.articuloId, Number(event.target.value));
                              }}
                            />
                          </div>
                          {!descuentoAutorizado ? (
                            <p className="mt-1 text-xs text-amber-700">Requiere autorización</p>
                          ) : null}
                          {linea.descuento > 0 ? (
                            <p className="mt-1 text-xs text-slate-500">-{money(linea.descuento)}</p>
                          ) : null}
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
                    );
                  })}
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

          <div className="sagva-panel p-5">
            <h2 className="text-lg font-bold text-slate-950">Observación</h2>
            <textarea
              className="sagva-field mt-3 min-h-20"
              value={observacion}
              onChange={(event) =>
                actualizarVentaActiva((venta) => ({ ...venta, observacion: event.target.value }))
              }
              placeholder="Observaciones internas de la venta"
            />
          </div>

          <div className="sagva-panel p-4">
            <div className="grid gap-3 md:grid-cols-4">
              <button
                type="button"
                onClick={() => iniciarCobroRapido("efectivo")}
                disabled={!puedeCobroRapido}
                className="rounded-md bg-[#064ea4] px-4 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                Efectivo F2
              </button>
              <button
                type="button"
                onClick={() => iniciarCobroRapido("debito")}
                disabled={!puedeCobroRapido}
                className="rounded-md border border-[#d8dee8] bg-white px-4 py-3 text-sm font-bold text-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Débito F6
              </button>
              <button
                type="button"
                onClick={() => iniciarCobroRapido("credito")}
                disabled={!puedeCobroRapido}
                className="rounded-md border border-[#d8dee8] bg-white px-4 py-3 text-sm font-bold text-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Crédito F8
              </button>
              <button
                type="button"
                onClick={() => iniciarCobroRapido("transferencia")}
                disabled={!puedeCobroRapido}
                className="rounded-md border border-[#d8dee8] bg-white px-4 py-3 text-sm font-bold text-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Transferencia F10
              </button>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              Cobro rápido: se usa cuando no hay pagos parciales registrados. Para pagos mixtos usa el panel avanzado.
            </p>
            {bannerVuelto ? (
              <div className="mt-3 rounded-lg bg-green-50 px-4 py-3 text-sm font-semibold text-green-800">
                Venta cobrada en efectivo. Pagó {money(bannerVuelto.pago)} · Vuelto {money(bannerVuelto.vuelto)}
              </div>
            ) : null}
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
                  disabled={!puedeAgregarPago}
                  className={`rounded-md border px-3 py-2 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-50 ${
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
                  min={0}
                  max={saldoPendiente}
                  value={montoPago}
                  onFocus={(event) => event.currentTarget.select()}
                  onClick={(event) => event.currentTarget.select()}
                  onChange={(event) => {
                    const value = Number(event.target.value);
                    if (!Number.isFinite(value)) {
                      actualizarVentaActiva((venta) => ({ ...venta, montoPago: "" }));
                      return;
                    }
                    actualizarVentaActiva((venta) => ({
                      ...venta,
                      montoPago: String(Math.min(Math.max(value, 0), saldoPendiente)),
                    }));
                  }}
                  placeholder={String(saldoPendiente || total || 0)}
                  disabled={!puedeAgregarPago}
                />
              </div>
              <button
                type="button"
                onClick={agregarPago}
                disabled={!puedeAgregarPago}
                className="w-full sagva-button-secondary disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saldoPendiente > 0 ? "Agregar pago" : "Pago completo"}
              </button>
              {lineas.length > 0 && saldoPendiente === 0 ? (
                <p className="rounded-md bg-green-50 px-3 py-2 text-xs font-semibold text-green-700">
                  El total ya está cubierto. Elimina un pago si necesitas cambiar el método o monto.
                </p>
              ) : null}
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
              onClick={() => cerrarVentaTemporal(ventaActiva.id)}
              className="rounded-md border border-red-200 bg-white px-4 py-3 text-sm font-bold text-red-700 hover:bg-red-50"
            >
              Anular pestaña
            </button>
          </div>
        </aside>
      </form>

      {dialogoEfectivoAbierto ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-2xl">
            <h2 className="text-lg font-bold text-slate-950">Pago en efectivo</h2>
            <p className="mt-1 text-sm text-slate-500">Total a pagar: {money(total)}</p>
            <label className="sagva-label mt-4">¿Con cuánto pagó?</label>
            <input
              ref={efectivoInputRef}
              className="sagva-field"
              type="number"
              min={total}
              value={efectivoRecibido}
              onFocus={(event) => event.currentTarget.select()}
              onClick={(event) => event.currentTarget.select()}
              onChange={(event) => setEfectivoRecibido(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  confirmarEfectivo();
                }
                if (event.key === "Escape") {
                  setDialogoEfectivoAbierto(false);
                  setQuickMetodo("");
                }
              }}
            />
            <div className="mt-3 rounded-md bg-slate-50 px-3 py-2 text-sm">
              Vuelto estimado: <strong>{money(Math.max(Number(efectivoRecibido || 0) - total, 0))}</strong>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setDialogoEfectivoAbierto(false);
                  setQuickMetodo("");
                }}
                className="sagva-button-secondary"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmarEfectivo}
                disabled={Number(efectivoRecibido || 0) < total}
                className="sagva-button-primary disabled:cursor-not-allowed disabled:opacity-50"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {dialogoDescuento ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-2xl">
            <h2 className="text-lg font-bold text-slate-950">Autorizar descuento</h2>
            <p className="mt-1 text-sm text-slate-500">
              Para aplicar descuento a {dialogoDescuento.nombreArticulo}, ingresa el PIN autorizado.
            </p>
            <label className="sagva-label mt-4">PIN</label>
            <input
              ref={pinDescuentoInputRef}
              className="sagva-field"
              type="tel"
              value={pinDescuento}
              onChange={(event) => {
                setPinDescuento(event.target.value);
                setErrorPinDescuento("");
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  confirmarAutorizacionDescuento();
                }
                if (event.key === "Escape") {
                  setDialogoDescuento(null);
                  setPinDescuento("");
                  setErrorPinDescuento("");
                }
              }}
            />
            {errorPinDescuento ? (
              <p className="mt-2 rounded-md bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
                {errorPinDescuento}
              </p>
            ) : null}
            <p className="mt-3 text-xs text-slate-500">
              Esta autorización es temporal. Luego debe venir desde el módulo de Seguridad.
            </p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setDialogoDescuento(null);
                  setPinDescuento("");
                  setErrorPinDescuento("");
                }}
                className="sagva-button-secondary"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmarAutorizacionDescuento}
                className="sagva-button-primary"
              >
                Autorizar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
