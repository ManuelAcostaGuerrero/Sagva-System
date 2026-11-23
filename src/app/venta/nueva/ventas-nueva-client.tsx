"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { CreditCard, Plus, Trash2, X } from "lucide-react";
import { formatCurrency } from "@/utils/formatters/currency";
import { guardarVentaAction } from "./actions";
import { buscarProductosParaCajaAction, type ProductoBusquedaVenta } from "./buscar-productos";
import { precioPorCantidad } from "@/lib/venta-precios";

type ProductoVenta = ProductoBusquedaVenta;

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
  precioPublico: number;
  reglasMayoristas: ProductoVenta["reglasMayoristas"];
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

type NuevaVentaClientProps = {
  productos: ProductoVenta[];
  puedeAutorizarDescuento: boolean;
  cajaActiva: CajaActiva;
  sucursalId: string;
  sucursalNombre: string;
};

const metodosPago = ["EFECTIVO", "DEBITO", "CREDITO", "TRANSFERENCIA"];
const MAX_DESCUENTO_PORCENTAJE_TEMPORAL = 100;

function money(value: number) {
  return formatCurrency(Number.isFinite(value) ? value : 0);
}

function crearVentaTemporal(numero: number): VentaTemporal {
  const identificador = typeof globalThis.crypto?.randomUUID === "function"
    ? globalThis.crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
  return {
    id: `venta-${identificador}`,
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

function calcularDescuento(
  linea: Pick<LineaVenta, "cantidad" | "precioUnitario" | "descuentoTipo" | "descuentoValor">,
) {
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
  puedeAutorizarDescuento,
  cajaActiva,
  sucursalId,
  sucursalNombre,
}: NuevaVentaClientProps) {
  const [errorVenta, setErrorVenta] = useState("");
  const [errorBusqueda, setErrorBusqueda] = useState<"sesion" | "consulta" | null>(null);
  const [resultadosBusqueda, setResultadosBusqueda] = useState<ProductoVenta[]>(productos);
  const [buscando, setBuscando] = useState(false);
  const [enviandoVenta, setEnviandoVenta] = useState(false);
  const enviandoRef = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);
  const quickMetodoInputRef = useRef<HTMLInputElement>(null);
  const efectivoRecibidoInputRef = useRef<HTMLInputElement>(null);
  const efectivoInputRef = useRef<HTMLInputElement>(null);
  const descuentoInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const primeraVentaRef = useRef(crearVentaTemporal(1));

  const [busqueda, setBusqueda] = useState("");
  const [ventas, setVentas] = useState<VentaTemporal[]>(() => [primeraVentaRef.current]);
  const [ventaActivaId, setVentaActivaId] = useState(() => primeraVentaRef.current.id);
  const [efectivoRecibido, setEfectivoRecibido] = useState("");
  const [dialogoEfectivoAbierto, setDialogoEfectivoAbierto] = useState(false);
  const [bannerVuelto, setBannerVuelto] = useState<{ pago: number; vuelto: number } | null>(null);
  const [avisoCobro, setAvisoCobro] = useState("");

  const ventaActiva = ventas.find((venta) => venta.id === ventaActivaId) ?? ventas[0];
  const lineas = ventaActiva?.lineas ?? [];
  const pagos = ventaActiva?.pagos ?? [];
  const cliente = ventaActiva?.cliente ?? "";
  const observacion = ventaActiva?.observacion ?? "";
  const metodoPago = ventaActiva?.metodoPago ?? "EFECTIVO";
  const montoPago = ventaActiva?.montoPago ?? "";

  // Consultar SQLite mientras se escribe, sin precargar miles de productos ni recargar la página.
  useEffect(() => {
    const q = busqueda.trim();
    if (!q) {
      setResultadosBusqueda([]);
      setErrorBusqueda(null);
      setBuscando(false);
      return;
    }
    let cancelado = false;
    setBuscando(true);
    setErrorBusqueda(null);
    const timeout = setTimeout(async () => {
      try {
        const resultado = await buscarProductosParaCajaAction(q, sucursalId);
        if (!cancelado) {
          setResultadosBusqueda(resultado.ok ? resultado.productos : []);
          setErrorBusqueda(resultado.ok ? null : resultado.motivo);
        }
      } catch {
        if (!cancelado) {
          setResultadosBusqueda([]);
          setErrorBusqueda("consulta");
        }
      } finally {
        if (!cancelado) setBuscando(false);
      }
    }, 180);
    return () => { cancelado = true; clearTimeout(timeout); };
  }, [busqueda, sucursalId]);

  const productosFiltrados = resultadosBusqueda;

  async function confirmarBusquedaConEnter() {
    const q = busqueda.trim();
    if (!q) return;
    try {
      const resultado = await buscarProductosParaCajaAction(q, sucursalId);
      if (!resultado.ok) {
        setResultadosBusqueda([]);
        setErrorBusqueda(resultado.motivo);
        return;
      }
      setErrorBusqueda(null);
      const encontrados = resultado.productos;
      setResultadosBusqueda(encontrados);
      const exacto = encontrados.find(p => p.codigoBarra === q || p.codigoProducto === q);
      const elegido = exacto ?? encontrados[0];
      if (elegido) agregarProducto(elegido);
      else setErrorVenta("No existe un artículo activo con ese código o nombre.");
    } catch {
      setErrorBusqueda("consulta");
    }
  }

  const subtotal = useMemo(
    () => lineas.reduce((sum, linea) => sum + linea.cantidad * linea.precioUnitario, 0),
    [lineas],
  );
  const descuentoTotal = useMemo(() => lineas.reduce((sum, linea) => sum + linea.descuento, 0), [lineas]);
  const total = useMemo(() => totalVenta(lineas), [lineas]);
  const totalPagado = useMemo(() => totalPagadoVenta(pagos), [pagos]);
  const saldoPendiente = Math.max(total - totalPagado, 0);
  const vuelto = Math.max(totalPagado - total, 0);
  const puedeAgregarPago = lineas.length > 0 && total > 0 && saldoPendiente > 0;
  const puedeCobroRapido = lineas.length > 0 && total > 0 && pagos.length === 0;

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
    function handleKeyDown(event: KeyboardEvent) {
      if (event.ctrlKey || event.altKey || event.metaKey || event.repeat) return;
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

  // Cada cobro confirmado finaliza esta transacción. La siguiente empieza con
  // un identificador NUEVO, incluso para los mismos productos y método de pago.
  function finalizarVentaConfirmada(id: string) {
    const restantes = ventas.filter(venta => venta.id !== id);
    if (restantes.length) {
      setVentas(restantes);
      setVentaActivaId(restantes[0].id);
    } else {
      const nueva = crearVentaTemporal(1);
      setVentas([nueva]);
      setVentaActivaId(nueva.id);
    }
    setBusqueda("");
    setEfectivoRecibido("");
    setDialogoEfectivoAbierto(false);
    setBannerVuelto(null);
    setErrorVenta("");
    limpiarCobroRapido();
  }

  async function enviarVenta(formData: FormData) {
    if (enviandoRef.current) return;
    enviandoRef.current = true;
    setEnviandoVenta(true);
    setErrorVenta("");
    try {
      const resultado = await guardarVentaAction(formData);
      if (resultado && "ok" in resultado && resultado.ok) {
        const medios = resultado.medios.join(" + ");
        const cobro = resultado.vuelto > 0
          ? ` · Vuelto: ${money(resultado.vuelto)}` : "";
        const mensaje = `Venta ${resultado.folio ?? "sin folio"} cobrada por ${medios} · ${money(resultado.total)}${cobro}. Lista para la siguiente venta.`;
        finalizarVentaConfirmada(ventaActiva.id);
        setAvisoCobro(mensaje);
      } else if (resultado && "error" in resultado && resultado.error) {
        setDialogoEfectivoAbierto(false);
        if ("codigo" in resultado && resultado.codigo === "VENTA_YA_REGISTRADA") {
          // El servidor comprobó que esta operación YA está registrada.
          // Se evita repetir el cargo y se libera la caja para una nueva venta.
          finalizarVentaConfirmada(ventaActiva.id);
          setAvisoCobro(`${resultado.error} Se inició una venta nueva; no se repitió el cobro.`);
        } else {
          setErrorVenta(resultado.error);
        }
      }
    } catch {
      setDialogoEfectivoAbierto(false);
      setErrorVenta("No se pudo confirmar el registro. Comprueba el historial antes de volver a cobrar.");
    } finally {
      limpiarCobroRapido();
      enviandoRef.current = false;
      setEnviandoVenta(false);
    }
  }

  function actualizarVentaActiva(updater: (venta: VentaTemporal) => VentaTemporal) {
    setVentas((current) => current.map((venta) => (venta.id === ventaActivaId ? updater(venta) : venta)));
  }

  function prepararCobroRapido(metodo: string, efectivo = "") {
    if (quickMetodoInputRef.current) quickMetodoInputRef.current.value = metodo;
    if (efectivoRecibidoInputRef.current) efectivoRecibidoInputRef.current.value = efectivo;
  }

  function limpiarCobroRapido() {
    prepararCobroRapido("", "");
  }

  function crearNuevaInstanciaVenta() {
    const nextNumero = Math.max(...ventas.map((venta) => venta.numero), 0) + 1;
    const nuevaVenta = crearVentaTemporal(nextNumero);
    setVentas((current) => [...current, nuevaVenta]);
    setVentaActivaId(nuevaVenta.id);
    setBusqueda("");
    setEfectivoRecibido("");
    setDialogoEfectivoAbierto(false);
    setErrorVenta("");
    setAvisoCobro("");
    limpiarCobroRapido();
  }

  function cerrarVentaTemporal(id: string) {
    if (ventas.length === 1) {
      limpiarVenta();
      return;
    }

    setVentas((current) => {
      const filtradas = current.filter((venta) => venta.id !== id);
      if (id === ventaActivaId) setVentaActivaId(filtradas[0]?.id ?? crearVentaTemporal(1).id);
      return filtradas.length ? filtradas : [crearVentaTemporal(1)];
    });
  }

  function agregarProducto(producto: ProductoVenta) {
    setErrorVenta("");
    setBannerVuelto(null);
    limpiarCobroRapido();
    actualizarVentaActiva((venta) => {
      const existente = venta.lineas.find((linea) => linea.articuloId === producto.articuloId);

      if (existente) {
        return {
          ...venta,
          lineas: venta.lineas.map((linea) =>
            linea.articuloId === producto.articuloId ? recalcularLinea({
              ...linea, cantidad: linea.cantidad + 1,
              precioUnitario: precioPorCantidad(linea.precioPublico, linea.cantidad + 1, linea.reglasMayoristas)
            }) : linea,
          ),
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
            precioUnitario: precioPorCantidad(producto.precioPublico, 1, producto.reglasMayoristas),
            precioPublico: producto.precioPublico,
            reglasMayoristas: producto.reglasMayoristas,
            descuentoTipo: "monto",
            descuentoValor: 0,
            descuento: 0,
            totalLinea: precioPorCantidad(producto.precioPublico, 1, producto.reglasMayoristas),
            stockDisponible: producto.stockDisponible,
          },
        ],
      };
    });
    setBusqueda("");
  }

  function cambiarCantidad(articuloId: string, cantidad: number) {
    // La cantidad no depende del stock; la venta sin existencias queda advertida y auditada.
    const cantidadValida = Math.min(Math.max(Number.isFinite(cantidad) ? cantidad : 1, 1), 99999);
    actualizarVentaActiva((venta) => ({
      ...venta,
      lineas: venta.lineas.map((linea) =>
        linea.articuloId === articuloId ? recalcularLinea({
          ...linea,
          cantidad: cantidadValida,
          precioUnitario: precioPorCantidad(linea.precioPublico, cantidadValida, linea.reglasMayoristas)
        }) : linea,
      ),
    }));
  }

  function descuentoEstaAutorizado(_articuloId: string) {
    return puedeAutorizarDescuento;
  }

  function solicitarAutorizacionDescuento(_linea: LineaVenta) {
    setErrorVenta("Solo un administrador o usuario autorizado puede aplicar descuentos.");
    return false;
  }

  function cambiarTipoDescuento(articuloId: string, descuentoTipo: TipoDescuento) {
    actualizarVentaActiva((venta) => ({
      ...venta,
      lineas: venta.lineas.map((linea) =>
        linea.articuloId === articuloId ? recalcularLinea({ ...linea, descuentoTipo, descuentoValor: 0 }) : linea,
      ),
    }));
  }

  function cambiarDescuento(articuloId: string, descuentoValor: number) {
    actualizarVentaActiva((venta) => ({
      ...venta,
      lineas: venta.lineas.map((linea) => {
        if (linea.articuloId !== articuloId) return linea;
        const valorLimitado =
          linea.descuentoTipo === "porcentaje"
            ? Math.min(Math.max(descuentoValor, 0), MAX_DESCUENTO_PORCENTAJE_TEMPORAL)
            : Math.max(descuentoValor, 0);
        return recalcularLinea({ ...linea, descuentoValor: valorLimitado });
      }),
    }));
  }

  function eliminarLinea(articuloId: string) {
    setErrorVenta("");
    actualizarVentaActiva((venta) => ({
      ...venta,
      lineas: venta.lineas.filter((linea) => linea.articuloId !== articuloId),
    }));

  }

  function limpiarVenta() {
    const nuevoId = crearVentaTemporal(ventaActiva.numero).id;
    actualizarVentaActiva((venta) => ({
      ...venta,
      id: nuevoId,
      cliente: "",
      lineas: [],
      pagos: [],
      observacion: "",
      metodoPago: "EFECTIVO",
      montoPago: "",
    }));
    setVentaActivaId(nuevoId);
    setBusqueda("");
    setEfectivoRecibido("");
    setDialogoEfectivoAbierto(false);
    setBannerVuelto(null);
    setErrorVenta("");
    setAvisoCobro("");
    limpiarCobroRapido();
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
    limpiarCobroRapido();
  }

  function seleccionarMetodoPago(metodo: string) {
    actualizarVentaActiva((venta) => ({
      ...venta,
      metodoPago: metodo,
      montoPago: saldoPendiente > 0 ? String(saldoPendiente) : "",
    }));
    limpiarCobroRapido();
  }

  function iniciarCobroRapido(metodo: string) {
    if (!puedeCobroRapido || enviandoRef.current) return;
    setBannerVuelto(null);

    if (metodo === "efectivo") {
      setEfectivoRecibido(String(total));
      prepararCobroRapido("efectivo", String(total));
      setDialogoEfectivoAbierto(true);
      return;
    }

    prepararCobroRapido(metodo, "");
    formRef.current?.requestSubmit();
  }

  function confirmarEfectivo() {
    if (enviandoRef.current) return;
    const pago = Number(efectivoRecibido);
    if (!Number.isFinite(pago) || pago < total) return;
    prepararCobroRapido("efectivo", String(pago));
    formRef.current?.requestSubmit();
  }

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
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
        <Link href="/caja" className="inline-flex items-center gap-2 sagva-button-secondary">
          <CreditCard className="h-4 w-4" aria-hidden="true" />
          Ir a caja
        </Link>
      </div>

      <form ref={formRef} action={enviarVenta}
        onKeyDown={(event) => {
          // Enter confirma el control activo, pero jamás cobra una venta por accidente.
          if (event.key === "Enter" && event.target instanceof HTMLInputElement) event.preventDefault();
        }}
        className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_370px]">
        {avisoCobro ? (
          <div role="status" className="rounded-md border border-green-300 bg-green-50 p-3 text-sm font-semibold text-green-900 xl:col-span-2">
            {avisoCobro}
          </div>
        ) : null}
        {errorVenta ? (
          <div role="alert" className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-800 xl:col-span-2">
            {errorVenta}
            <div className="mt-3 flex flex-wrap gap-3">
              <Link href="/venta/historial" className="font-semibold text-blue-800 underline">
                Revisar ventas cobradas
              </Link>
              <button type="button" className="font-semibold text-blue-800 underline"
                onClick={crearNuevaInstanciaVenta}>Comenzar otra venta</button>
            </div>
          </div>
        ) : null}
        <input type="hidden" name="sucursalId" value={sucursalId} />
        <input type="hidden" name="idempotencyKey" value={ventaActiva.id} />
        <input type="hidden" name="cajaId" value={cajaActiva?.id ?? ""} />
        <input type="hidden" name="cliente" value={cliente} />
        <input type="hidden" name="observacion" value={observacion} />
        <input type="hidden" name="lineas" value={lineasPayload} />
        <input type="hidden" name="pagos" value={pagosPayload} />
        <input ref={quickMetodoInputRef} type="hidden" name="quickMetodo" defaultValue="" />
        <input ref={efectivoRecibidoInputRef} type="hidden" name="efectivoRecibido" defaultValue="" />

        <div className="space-y-5">
          <div className="sagva-panel p-5">
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label className="sagva-label">Cliente</label>
                <input
                  className="sagva-field"
                  value={cliente}
                  onChange={(event) => actualizarVentaActiva((venta) => ({ ...venta, cliente: event.target.value }))}
                  placeholder="Cliente general o RUT"
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
                  value={cajaActiva ? `${cajaActiva.nombre} - ${cajaActiva.estado}` : "Sin caja abierta · venta permitida"}
                  readOnly
                />
              </div>
            </div>
            {!cajaActiva ? (
              <p role="status" className="mt-3 rounded-md bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-900">
                Puedes cobrar ahora. La venta se registrará con tu usuario y se asociará a tu caja al abrirla en esta jornada.
              </p>
            ) : null}
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
                  placeholder="Buscar por nombre, código interno o código de barras"
                  autoComplete="off"
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      void confirmarBusquedaConEnter();
                    }
                  }}
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
                          className={`grid w-full grid-cols-[minmax(0,1fr)_6rem_1.25rem] items-center gap-2 border-b px-3 py-3 text-left last:border-b-0 sm:grid-cols-[minmax(0,1fr)_7rem_1.5rem] sm:gap-4 sm:px-4 ${
                            sinStock ? "border-amber-200 bg-amber-50 hover:bg-amber-100" : "border-[#eef2f7] hover:bg-blue-50"
                          }`}
                        >
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                              <p className="break-words font-bold text-slate-950">{producto.nombreArticulo}</p>
                              {sinStock ? (
                                <span className="rounded-full bg-amber-200 px-2 py-0.5 text-[11px] font-bold text-amber-900">
                                  Sin stock
                                </span>
                              ) : null}
                            </div>
                            <p className="break-words text-xs text-slate-500">
                              Código: {producto.codigoProducto}
                              {producto.codigoBarra ? ` · Barra: ${producto.codigoBarra}` : ""}
                            </p>
                          </div>
                          <div className="min-w-0 text-right tabular-nums">
                            <p className="whitespace-nowrap font-bold text-[#064ea4]">{money(producto.precioPublico)}</p>
                            <p className={`whitespace-nowrap text-xs font-semibold ${sinStock ? "text-amber-800" : "text-slate-500"}`}>
                              Stock {producto.stockDisponible}
                            </p>
                          </div>
                          <Plus className="h-4 w-4 justify-self-end text-[#064ea4]" aria-hidden="true" />
                        </button>
                      );
                    })}

                    {productosFiltrados.length === 0 ? (
                      <div className="px-4 py-5 text-sm text-slate-500">
                        {buscando ? "Buscando en el catálogo..." : errorBusqueda === "sesion" ? (
                          <span role="alert">Inicia sesión para buscar productos. <Link href="/login" className="font-semibold text-blue-700 underline">Iniciar sesión</Link></span>
                        ) : errorBusqueda === "consulta" ? (
                          <span role="alert">No se pudo consultar el catálogo. Vuelve a intentarlo.</span>
                        ) : "No se encontraron productos para esa búsqueda."}
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
              <p className="mt-2 text-xs text-slate-500">
                Escanea el código y pulsa Enter para agregarlo. Los productos habilitados aparecen aunque no tengan stock; se indican en amarillo y pueden venderse, dejando el inventario negativo cuando corresponda.
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
                    const sinStock = linea.stockDisponible < linea.cantidad;
                    const descuentoAutorizado = descuentoEstaAutorizado(linea.articuloId);
                    return (
                      <tr key={linea.articuloId} className={sinStock ? "bg-amber-50" : undefined}>
                        <td>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-bold text-slate-950">{linea.nombreArticulo}</p>
                            {sinStock ? (
                              <span className="rounded-full bg-amber-200 px-2 py-0.5 text-[11px] font-bold text-amber-900">
                                Stock insuficiente
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
                            max={99999}
                            onChange={(event) => cambiarCantidad(linea.articuloId, Number(event.target.value))}
                            onKeyDown={(event) => {
                              if (event.key === "Enter") {
                                event.preventDefault();
                                event.currentTarget.blur();
                              }
                            }}
                          />
                        </td>
                        <td>
                          {money(linea.precioUnitario)}
                          {linea.precioUnitario !== linea.precioPublico ? (
                            <p className="text-xs text-green-700">Mayorista desde {linea.cantidad} unid.</p>
                          ) : null}
                        </td>
                        <td>
                          <div className="flex min-w-48 items-center gap-2">
                            <div className="flex rounded-md border border-[#d8dee8] bg-white p-1">
                              <button
                                type="button"
                                onClick={() => {
                                  if (!descuentoAutorizado) return void solicitarAutorizacionDescuento(linea);
                                  cambiarTipoDescuento(linea.articuloId, "monto");
                                }}
                                className={`rounded px-2 py-1 text-xs font-bold ${
                                  linea.descuentoTipo === "monto" ? "bg-blue-50 text-[#064ea4]" : "text-slate-500"
                                }`}
                              >
                                $
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (!descuentoAutorizado) return void solicitarAutorizacionDescuento(linea);
                                  cambiarTipoDescuento(linea.articuloId, "porcentaje");
                                }}
                                className={`rounded px-2 py-1 text-xs font-bold ${
                                  linea.descuentoTipo === "porcentaje" ? "bg-blue-50 text-[#064ea4]" : "text-slate-500"
                                }`}
                              >
                                %
                              </button>
                            </div>
                            <input
                              ref={(node) => {
                                descuentoInputRefs.current[linea.articuloId] = node;
                              }}
                              className="sagva-field w-24"
                              type="number"
                              min={0}
                              max={linea.descuentoTipo === "porcentaje" ? MAX_DESCUENTO_PORCENTAJE_TEMPORAL : undefined}
                              value={linea.descuentoValor}
                              placeholder={linea.descuentoTipo === "porcentaje" ? "%" : "$"}
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
                          {!descuentoAutorizado ? <p className="mt-1 text-xs text-amber-700">Requiere autorización</p> : null}
                          {linea.descuento > 0 ? <p className="mt-1 text-xs text-slate-500">-{money(linea.descuento)}</p> : null}
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
              onChange={(event) => actualizarVentaActiva((venta) => ({ ...venta, observacion: event.target.value }))}
              placeholder="Observaciones internas de la venta"
            />
          </div>

          <div className="sagva-panel p-4">
            <div className="grid gap-3 md:grid-cols-4">
              <button
                type="button"
                onClick={() => iniciarCobroRapido("efectivo")}
                disabled={!puedeCobroRapido || enviandoVenta}
                className="rounded-md bg-[#064ea4] px-4 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                Efectivo F2
              </button>
              <button
                type="button"
                onClick={() => iniciarCobroRapido("debito")}
                disabled={!puedeCobroRapido || enviandoVenta}
                className="rounded-md border border-[#d8dee8] bg-white px-4 py-3 text-sm font-bold text-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Débito F6
              </button>
              <button
                type="button"
                onClick={() => iniciarCobroRapido("credito")}
                disabled={!puedeCobroRapido || enviandoVenta}
                className="rounded-md border border-[#d8dee8] bg-white px-4 py-3 text-sm font-bold text-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Crédito F8
              </button>
              <button
                type="button"
                onClick={() => iniciarCobroRapido("transferencia")}
                disabled={!puedeCobroRapido || enviandoVenta}
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
                    metodoPago === metodo ? "border-[#064ea4] bg-blue-50 text-[#064ea4]" : "border-[#d8dee8] bg-white text-slate-700"
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
                <div key={pago.id} className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2 text-sm">
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
                <p className="rounded-md bg-slate-50 px-3 py-3 text-sm text-slate-500">No hay pagos registrados.</p>
              ) : null}
            </div>
          </div>

          <div className="grid gap-3">
            <button
              type="submit"
              name="accion"
              value="cobrar"
              disabled={!lineas.length || saldoPendiente > 0 || enviandoVenta}
              onClick={limpiarCobroRapido}
              className="sagva-button-primary disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cobrar venta
            </button>
            <button
              type="submit"
              name="accion"
              value="pendiente"
              disabled={!lineas.length || enviandoVenta}
              onClick={limpiarCobroRapido}
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
                  limpiarCobroRapido();
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
                  limpiarCobroRapido();
                }}
                className="sagva-button-secondary"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmarEfectivo}
                disabled={Number(efectivoRecibido || 0) < total || enviandoVenta}
                className="sagva-button-primary disabled:cursor-not-allowed disabled:opacity-50"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      ) : null}


    </>
  );
}
