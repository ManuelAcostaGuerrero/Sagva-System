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
};

function valorNumerico(value: string) {
  return decimalAValor(value);
}

function toField(value: number) {
  return String(roundMoney(value));
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
  margenInicial
}: PreciosImpuestosProps) {
  const [tipoImpuesto, setTipoImpuesto] = useState(tipoImpuestoInicial);
  const [tasaAdicional, setTasaAdicional] = useState(String(impuestoAdicionalInicial));
  const [precioConIva, setPrecioConIva] = useState(String(precioConIvaInicial));
  const [precioSinIva, setPrecioSinIva] = useState(String(precioSinIvaInicial));
  const [margen, setMargen] = useState(String(margenInicial));
  // Conservar el precio de venta exacto al editar solo datos de clasificación, marca o stock.
  const [conservarPrecioPublico, setConservarPrecioPublico] = useState(precioPublicoInicial > 0);
  const [ultimoEditado, setUltimoEditado] = useState<"con" | "sin">(precioConIvaInicial > 0 || precioSinIvaInicial === 0 ? "con" : "sin");

  const exento = tipoImpuesto === "exento";
  const tasa = exento ? 0 : valorNumerico(tasaAdicional);
  const neto = valorNumerico(precioSinIva);
  const bruto = valorNumerico(precioConIva);
  const ilaCompra = roundMoney(neto * tasa / 100);
  const costoTotal = calcularCostoConImpuestoAdicional(bruto, neto, tasa);
  // El ILA se conserva para simulación/compra, pero no fija el precio comercial.
  const precioPublico = conservarPrecioPublico
    ? precioPublicoInicial
    : calcularPrecioPublico(bruto, valorNumerico(margen) / 100);
  const precioSimuladoConIla = calcularPrecioPublico(costoTotal, valorNumerico(margen) / 100);
  const tasaDesconocida = !TASAS_BEBIDAS.some((item) => item.value === tasaAdicional);

  function editarConIva(value: string) {
    if (!decimalEnEdicionValido(value)) return;
    setUltimoEditado("con");
    setConservarPrecioPublico(false);
    setPrecioConIva(value);
    setPrecioSinIva(value === "" ? "" : toField(exento ? valorNumerico(value) : calcularPrecioSinIVA(valorNumerico(value))));
  }

  function editarSinIva(value: string) {
    if (!decimalEnEdicionValido(value)) return;
    setUltimoEditado("sin");
    setConservarPrecioPublico(false);
    setPrecioSinIva(value);
    setPrecioConIva(value === "" ? "" : toField(exento ? valorNumerico(value) : calcularPrecioConIVA(valorNumerico(value))));
  }

  function editarMargen(value: string) {
    if (decimalEnEdicionValido(value)) {
      setConservarPrecioPublico(false);
      setMargen(value);
    }
  }

  function cambiarTipo(value: string) {
    setConservarPrecioPublico(false);
    setTipoImpuesto(value);
    if (value === "exento") setTasaAdicional("0");
    const isExento = value === "exento";
    if (ultimoEditado === "sin") {
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
          value={margen}
          onFocus={() => {
            if (margen !== "" && valorNumerico(margen) === 0) setMargen("");
          }}
          onChange={(event) => editarMargen(event.target.value)}
          onBlur={() => setMargen((actual) => normalizarDecimalAlSalir(actual))}
        />
      </label>
      <label>
        <span className="sagva-label">{conservarPrecioPublico ? "Precio público guardado $" : "Precio público sugerido $"}</span>
        <input
          className="sagva-field bg-slate-100 font-semibold"
          value={moneda(precioPublico)}
          readOnly
          aria-label={conservarPrecioPublico ? "Precio público guardado, sin cambios" : "Precio público sugerido, calculado desde el costo y recargo"}
        />
      </label>
      <input name="ultimoPrecioEditado" type="hidden" value={ultimoEditado} />
      <input name="conservarPrecioPublico" type="hidden" value={conservarPrecioPublico ? "si" : "no"} />
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
          El precio público se calcula solo con el costo con IVA. El ILA puede ser un costo real de compra
          y reducir la rentabilidad: revisa el total de la factura antes de fijar precios.
          Los montos tributarios definitivos se toman del documento correspondiente.
        </p>
      </div>
    </div>
  );
}
