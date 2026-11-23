"use client";

import { useState } from "react";
import {
  decimalAValor,
  decimalEnEdicionValido,
  normalizarDecimalAlSalir
} from "@/lib/validacion-decimal";
import {
  calcularPrecioConIVA,
  calcularPrecioPublico,
  calcularPrecioSinIVA,
  calcularCostoConImpuestoAdicional,
  roundMoney
} from "@/utils/calculations/prices";

const TASAS_BEBIDAS = [
  { value: "0", label: "Sin impuesto adicional (0%)" },
  { value: "10", label: "Bebidas analcohólicas gravadas, energizantes y saborizadas (10%)" },
  { value: "18", label: "Bebidas con alto contenido de azúcar, más de 15 g/240 ml (18%)" },
  { value: "20.5", label: "Cervezas, vinos, espumantes y sidras (20,5%)" },
  { value: "31.5", label: "Pisco, whisky, ron, vodka y demás destilados (31,5%)" }
] as const;

type PreciosImpuestosProps = {
  tipoImpuestoInicial: string;
  impuestoAdicionalInicial: number;
  precioConIvaInicial: number;
  precioSinIvaInicial: number;
  precioPublicoInicial: number;
  margenInicial: number;
  precioExistente: boolean;
};

function valorNumerico(value: string) {
  return decimalAValor(value);
}

function toField(value: number) {
  return String(roundMoney(value));
}

function margenEnEdicionValido(value: string) {
  if (!/^-?\d{0,12}(?:[.,]\d{0,2})?$/.test(value)) return false;
  const numero = Number(value.replace(",", "."));
  return !Number.isFinite(numero) || numero >= -100;
}

function valorMargen(value: string) {
  const numero = Number(value.replace(",", "."));
  return Number.isFinite(numero) ? numero : 0;
}

function moneda(value: number) {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 2
  }).format(value);
}

export function ArticuloPreciosImpuestos({
  tipoImpuestoInicial,
  impuestoAdicionalInicial,
  precioConIvaInicial,
  precioSinIvaInicial,
  precioPublicoInicial,
  margenInicial,
  precioExistente
}: PreciosImpuestosProps) {
  const [tipoImpuesto, setTipoImpuesto] = useState(tipoImpuestoInicial);
  const [tasaAdicional, setTasaAdicional] = useState(String(impuestoAdicionalInicial));
  const [precioConIva, setPrecioConIva] = useState(String(precioConIvaInicial));
  const [precioSinIva, setPrecioSinIva] = useState(String(precioSinIvaInicial));
  const [margen, setMargen] = useState(String(margenInicial));
  const [precioIngresado, setPrecioIngresado] = useState(String(precioPublicoInicial));
  const [calcularDesdeMargen, setCalcularDesdeMargen] = useState(!precioExistente);
  // Conservar el precio de venta exacto al editar solo datos de clasificación, marca o stock.
  const [conservarPrecioPublico, setConservarPrecioPublico] = useState(precioExistente);
  const [precioModificado, setPrecioModificado] = useState(false);
  const [ultimoEditado, setUltimoEditado] = useState<"con" | "sin" | "ninguno">(
    precioExistente ? "ninguno" : precioSinIvaInicial > 0 ? "sin" : "con"
  );

  const exento = tipoImpuesto === "exento";
  const tasa = exento ? 0 : valorNumerico(tasaAdicional);
  const neto = valorNumerico(precioSinIva);
  const bruto = valorNumerico(precioConIva);
  const ilaCompra = roundMoney(neto * tasa / 100);
  const costoTotal = calcularCostoConImpuestoAdicional(bruto, neto, tasa);
  // El ILA se conserva para simulación/compra, pero no fija el precio comercial.
  const precioPublico = calcularDesdeMargen
    ? calcularPrecioPublico(bruto, valorMargen(margen) / 100)
    : valorNumerico(precioIngresado);
  const recargo = bruto > 0 ? (precioPublico / bruto - 1) * 100 : 0;
  const precioSimuladoConIla = calcularPrecioPublico(costoTotal, recargo / 100);
  const tasaDesconocida = !TASAS_BEBIDAS.some((item) => item.value === tasaAdicional);

  // Cambiar el costo de un artículo existente no debe alterar el precio elegido.
  function fijarPrecioAntesDeCambiarCosto() {
    if (precioExistente && calcularDesdeMargen) {
      setPrecioIngresado(toField(precioPublico));
      setCalcularDesdeMargen(false);
    }
  }

  function editarConIva(value: string) {
    if (!decimalEnEdicionValido(value)) return;
    fijarPrecioAntesDeCambiarCosto();
    setUltimoEditado("con");
    setPrecioModificado(true);
    setPrecioConIva(value);
    setPrecioSinIva(value === "" ? "" : toField(exento ? valorNumerico(value) : calcularPrecioSinIVA(valorNumerico(value))));
  }

  function editarSinIva(value: string) {
    if (!decimalEnEdicionValido(value, 5)) return;
    fijarPrecioAntesDeCambiarCosto();
    setUltimoEditado("sin");
    setPrecioModificado(true);
    setPrecioSinIva(value);
    setPrecioConIva(value === "" ? "" : toField(exento ? valorNumerico(value) : calcularPrecioConIVA(valorNumerico(value))));
  }

  function editarMargen(value: string) {
    if (margenEnEdicionValido(value)) {
      setPrecioModificado(true);
      setMargen(value);
      setCalcularDesdeMargen(true);
      setConservarPrecioPublico(false);
    }
  }

  function editarPrecioPublico(value: string) {
    if (!decimalEnEdicionValido(value)) return;
    setPrecioIngresado(value);
    setCalcularDesdeMargen(false);
    setConservarPrecioPublico(false);
    setPrecioModificado(true);
  }

  function cambiarTipo(value: string) {
    fijarPrecioAntesDeCambiarCosto();
    setPrecioModificado(true);
    setTipoImpuesto(value);
    if (value === "exento") setTasaAdicional("0");
    const isExento = value === "exento";
    const base = ultimoEditado === "ninguno" ? (neto > 0 ? "sin" : "con") : ultimoEditado;
    setUltimoEditado(base);
    if (base === "sin") {
      setPrecioConIva(precioSinIva === "" ? "" : toField(isExento ? valorNumerico(precioSinIva) : calcularPrecioConIVA(valorNumerico(precioSinIva))));
    } else {
      setPrecioSinIva(precioConIva === "" ? "" : toField(isExento ? valorNumerico(precioConIva) : calcularPrecioSinIVA(valorNumerico(precioConIva))));
    }
  }

  return (
    <div className="grid gap-4 p-4 md:grid-cols-4">
      <label>
        <span className="sagva-label">Tipo de IVA</span>
        <select name="tipoImpuesto" className="sagva-field" value={tipoImpuesto} onChange={(event) => cambiarTipo(event.target.value)}>
          <option value="IVA">Afecto a IVA (19%)</option>
          <option value="exento">Exento de IVA (0%)</option>
          <option value="IVA_RETENIDO">IVA retenido por cambio de sujeto (compra con IVA)</option>
          {tipoImpuesto === "impuesto_adicional" ? (
            <option value="impuesto_adicional">IVA + adicional (registro anterior)</option>
          ) : null}
        </select>
      </label>
      <label className="md:col-span-3">
        <span className="sagva-label">Impuesto adicional (ILA)</span>
        <select
          name="impuestoAdicional"
          className="sagva-field"
          value={exento ? "0" : tasaAdicional}
          disabled={exento}
          onChange={(event) => setTasaAdicional(event.target.value)}
        >
          {TASAS_BEBIDAS.map((impuesto) => (
            <option key={impuesto.value} value={impuesto.value}>{impuesto.label}</option>
          ))}
          {tasaDesconocida ? (
            <option value={tasaAdicional}>Tasa anterior registrada: {tasaAdicional}% (revisar)</option>
          ) : null}
        </select>
        {exento ? <input type="hidden" name="impuestoAdicional" value="0" /> : null}
      </label>
      <p className="md:col-span-4 text-xs text-slate-600">
        IVA general: 19%. La tasa ILA identifica el tributo del producto para compras y facturas; no cambia automáticamente el precio público.
      </p>
      <label>
        <span className="sagva-label">Costo sin IVA (base) $</span>
        <input
          name="precioSinIva"
          type="text"
          inputMode="decimal"
          autoComplete="off"
          className="sagva-field"
          value={precioSinIva}
          onFocus={() => {
            if (precioSinIva !== "" && valorNumerico(precioSinIva) === 0) setPrecioSinIva("");
          }}
          onChange={(event) => editarSinIva(event.target.value)}
          onBlur={() => setPrecioSinIva((actual) => normalizarDecimalAlSalir(actual))}
        />
      </label>
      <label>
        <span className="sagva-label">Costo con IVA (sin ILA) $</span>
        <input
          name="precioConIva"
          type="text"
          inputMode="decimal"
          autoComplete="off"
          className="sagva-field"
          value={precioConIva}
          onFocus={() => {
            if (precioConIva !== "" && valorNumerico(precioConIva) === 0) setPrecioConIva("");
          }}
          onChange={(event) => editarConIva(event.target.value)}
          onBlur={() => setPrecioConIva((actual) => normalizarDecimalAlSalir(actual))}
        />
      </label>
      <label>
        <span className="sagva-label">Margen / recargo sobre costo %</span>
        <input
          name="margen"
          type="text"
          inputMode="decimal"
          autoComplete="off"
          className="sagva-field"
          value={calcularDesdeMargen ? margen : toField(recargo)}
          disabled={bruto <= 0}
          onFocus={() => {
            if (calcularDesdeMargen && margen !== "" && valorMargen(margen) === 0) setMargen("");
          }}
          onChange={(event) => editarMargen(event.target.value)}
          onBlur={() => setMargen((actual) => ["-", "-.", "-,"].includes(actual) ? "0" : normalizarDecimalAlSalir(actual))}
        />
        {bruto <= 0 ? <span className="text-xs text-slate-500">Ingresa un costo mayor a cero para calcular el recargo.</span> : null}
      </label>
      <label>
        <span className="sagva-label">Precio público $</span>
        <input
          name="precioPublico"
          type="text"
          inputMode="decimal"
          autoComplete="off"
          className="sagva-field font-semibold"
          value={calcularDesdeMargen ? toField(precioPublico) : precioIngresado}
          onFocus={() => {
            if (!calcularDesdeMargen && valorNumerico(precioIngresado) === 0) setPrecioIngresado("");
          }}
          onChange={(event) => editarPrecioPublico(event.target.value)}
          onBlur={() => setPrecioIngresado((actual) => normalizarDecimalAlSalir(actual))}
        />
      </label>
      <p className="md:col-span-4 text-xs text-slate-600">
        Cambia el precio o el recargo para actualizar la ganancia o pérdida. Al cambiar el costo de un artículo guardado se conserva su precio de venta.
      </p>
      <div className="md:col-span-4 grid gap-2 rounded-md border border-slate-200 p-3 text-sm md:grid-cols-3" aria-live="polite">
        <span><strong>{precioPublico < bruto ? "Pérdida estimada:" : "Ganancia estimada:"}</strong> {moneda(precioPublico - bruto)}</span>
        <span><strong>Recargo sobre costo:</strong> {bruto > 0 ? `${recargo.toFixed(2)}%` : "No calculable sin costo"}</span>
        <span><strong>Margen sobre venta:</strong> {precioPublico > 0 ? ((precioPublico - bruto) / precioPublico * 100).toFixed(2) : "0"}%</span>
        <p className="text-xs text-slate-500 md:col-span-3">Estimación comercial sin incluir impuestos adicionales y otros costos. No altera el precio público.</p>
      </div>
      <input name="ultimoPrecioEditado" type="hidden" value={ultimoEditado} />
      <input name="conservarPrecioPublico" type="hidden" value={conservarPrecioPublico ? "si" : "no"} />
      <input name="actualizarPrecio" type="hidden" value={precioModificado ? "si" : "no"} />
      <div className="md:col-span-4 rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600" aria-live="polite">
        <p className="font-semibold text-slate-700">Simulación tributaria de compra (solo informativa)</p>
        <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1">
          <span>IVA sobre base neta: {moneda(Math.max(0, bruto - neto))}</span>
          <span>ILA estimado ({tasa}%): {moneda(ilaCompra)}</span>
          <span>Costo estimado con IVA e ILA: <strong>{moneda(costoTotal)}</strong></span>
          <span>Precio hipotético con recargo sobre ambos: {moneda(precioSimuladoConIla)}</span>
        </div>
        <p className="mt-2 text-xs text-slate-600">
          Esta simulación no modifica el precio público, el margen configurado ni el precio guardado.
          El recargo se calcula sobre el costo con IVA. El ILA puede ser un costo real de compra
          y reducir la rentabilidad: revisa el total de la factura antes de fijar precios.
          Los montos tributarios definitivos se toman del documento correspondiente.
        </p>
      </div>
    </div>
  );
}

