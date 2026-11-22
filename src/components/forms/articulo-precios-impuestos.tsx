"use client";

import { useState } from "react";
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
  margenInicial: number;
};

function valorNumerico(value: string) {
  const valueNumber = Number(value);
  return Number.isFinite(valueNumber) && valueNumber > 0 ? valueNumber : 0;
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
  margenInicial
}: PreciosImpuestosProps) {
  const [tipoImpuesto, setTipoImpuesto] = useState(tipoImpuestoInicial);
  const [tasaAdicional, setTasaAdicional] = useState(String(impuestoAdicionalInicial));
  const [precioConIva, setPrecioConIva] = useState(String(precioConIvaInicial));
  const [precioSinIva, setPrecioSinIva] = useState(String(precioSinIvaInicial));
  const [margen, setMargen] = useState(String(margenInicial));
  const [ultimoEditado, setUltimoEditado] = useState<"con" | "sin">(precioConIvaInicial > 0 || precioSinIvaInicial === 0 ? "con" : "sin");

  const exento = tipoImpuesto === "exento";
  const tasa = exento ? 0 : valorNumerico(tasaAdicional);
  const neto = valorNumerico(precioSinIva);
  const bruto = valorNumerico(precioConIva);
  const ilaCompra = roundMoney(neto * tasa / 100);
  const costoTotal = calcularCostoConImpuestoAdicional(bruto, neto, tasa);
  const precioPublico = calcularPrecioPublico(costoTotal, valorNumerico(margen) / 100);
  const tasaDesconocida = !TASAS_BEBIDAS.some((item) => item.value === tasaAdicional);

  function editarConIva(value: string) {
    setUltimoEditado("con");
    setPrecioConIva(value);
    setPrecioSinIva(value === "" ? "" : toField(exento ? valorNumerico(value) : calcularPrecioSinIVA(valorNumerico(value))));
  }

  function editarSinIva(value: string) {
    setUltimoEditado("sin");
    setPrecioSinIva(value);
    setPrecioConIva(value === "" ? "" : toField(exento ? valorNumerico(value) : calcularPrecioConIVA(valorNumerico(value))));
  }

  function cambiarTipo(value: string) {
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
          {tipoImpuesto === "impuesto_adicional" ? (
            <option value="impuesto_adicional">IVA + adicional (registro anterior)</option>
          ) : null}
        </select>
      </label>
      <label className="md:col-span-3">
        <span className="sagva-label">Impuesto adicional de bebidas (ILA)</span>
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
        IVA general: 19%. El ILA se aplica a compras gravadas según el tipo de bebida; en una venta minorista al consumidor final no se recarga nuevamente en la boleta.
      </p>
      <label>
        <span className="sagva-label">Costo sin IVA (base) $</span>
        <input
          name="precioSinIva"
          type="number"
          min="0"
          step="0.01"
          className="sagva-field"
          value={precioSinIva}
          onChange={(event) => editarSinIva(event.target.value)}
        />
      </label>
      <label>
        <span className="sagva-label">Costo con IVA (sin ILA) $</span>
        <input
          name="precioConIva"
          type="number"
          min="0"
          step="0.01"
          className="sagva-field"
          value={precioConIva}
          onChange={(event) => editarConIva(event.target.value)}
        />
      </label>
      <label>
        <span className="sagva-label">Margen / recargo sobre costo %</span>
        <input
          name="margen"
          type="number"
          min="0"
          step="0.01"
          className="sagva-field"
          value={margen}
          onChange={(event) => setMargen(event.target.value)}
        />
      </label>
      <label>
        <span className="sagva-label">Precio público sugerido $</span>
        <input
          className="sagva-field bg-slate-100 font-semibold"
          value={moneda(precioPublico)}
          readOnly
          aria-label="Precio público sugerido, calculado automáticamente"
        />
      </label>
      <input name="ultimoPrecioEditado" type="hidden" value={ultimoEditado} />
      <div className="md:col-span-4 rounded-md bg-slate-50 p-3 text-sm text-slate-700" aria-live="polite">
        <span>IVA incluido en el costo: {moneda(Math.max(0, bruto - neto))}</span>
        <span className="mx-2">·</span>
        <span>ILA de compra estimado: {moneda(ilaCompra)} ({tasa}%)</span>
        <span className="mx-2">·</span>
        <strong>Costo estimado con impuestos: {moneda(costoTotal)}</strong>
        <p className="mt-1 text-xs text-slate-600">
          El precio público usa el costo con IVA más el ILA de compra cuando corresponde, y el recargo definido.
          Si el costo digitado ya incluye ILA, no lo vuelvas a incorporar; ajusta la base de compra antes de guardar.
        </p>
      </div>
    </div>
  );
}
