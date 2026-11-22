"use client";

import { useState } from "react";
import { Plus, Trash2, Pencil } from "lucide-react";
import { decimalEnEdicionValido } from "@/lib/validacion-decimal";

type Regla = {
  id: string;
  cantidadMinima: string;
  precioUnitario: string;
};

type Props = {
  iniciales: Array<{ id: string; cantidadMinima: number; precioUnitario: number }>;
};

function numero(valor: string) {
  return Number(valor.replace(",", "."));
}

function moneda(value: number) {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 2
  }).format(value);
}

export function ArticuloReglasMayoristas({ iniciales }: Props) {
  const [reglas, setReglas] = useState<Regla[]>(() =>
    iniciales.map((regla) => ({
      id: regla.id,
      cantidadMinima: String(regla.cantidadMinima),
      precioUnitario: String(regla.precioUnitario)
    })).sort((a, b) => numero(a.cantidadMinima) - numero(b.cantidadMinima))
  );
  const [cantidad, setCantidad] = useState("");
  const [precio, setPrecio] = useState("");
  const [editando, setEditando] = useState<string | null>(null);
  const [error, setError] = useState("");

  function agregarOActualizar() {
    const cantidadValor = numero(cantidad);
    const precioValor = numero(precio);
    if (
      !decimalEnEdicionValido(cantidad, 3) || !decimalEnEdicionValido(precio, 2) ||
      !Number.isFinite(cantidadValor) || cantidadValor <= 0 ||
      !Number.isFinite(precioValor) || precioValor <= 0
    ) {
      setError("Ingresa una cantidad mínima y un precio por unidad mayores que cero.");
      return;
    }
    if (reglas.some((regla) => regla.id !== editando && numero(regla.cantidadMinima) === cantidadValor)) {
      setError("Ya existe una regla para esa cantidad mínima.");
      return;
    }
    if (editando === null && reglas.length >= 30) {
      setError("Puedes registrar hasta 30 reglas por artículo.");
      return;
    }

    const nueva: Regla = {
      id: editando ?? "nueva-" + Date.now().toString() + "-" + Math.random().toString(36).slice(2),
      cantidadMinima: String(cantidadValor),
      precioUnitario: String(precioValor)
    };
    setReglas((actuales) =>
      (editando ? actuales.map((regla) => regla.id === editando ? nueva : regla) : [...actuales, nueva])
        .sort((a, b) => numero(a.cantidadMinima) - numero(b.cantidadMinima))
    );
    setCantidad("");
    setPrecio("");
    setEditando(null);
    setError("");
  }

  function comenzarEdicion(regla: Regla) {
    setCantidad(regla.cantidadMinima);
    setPrecio(regla.precioUnitario);
    setEditando(regla.id);
    setError("");
  }

  function eliminar(reglaId: string) {
    setReglas((actuales) => actuales.filter((regla) => regla.id !== reglaId));
    if (editando === reglaId) {
      setEditando(null);
      setCantidad("");
      setPrecio("");
    }
    setError("");
  }

  return (
    <div className="space-y-4 p-4">
      <p className="text-sm text-slate-600">
        Agrega tramos por cantidad. Cuando se alcance más de un mínimo, corresponde el precio
        de la regla con la mayor cantidad mínima alcanzada. Las reglas son independientes del costo y del ILA.
      </p>
      <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto] md:items-end">
        <label>
          <span className="sagva-label">Cantidad mínima</span>
          <input
            type="text"
            inputMode="decimal"
            className="sagva-field"
            placeholder="Ej.: 6"
            value={cantidad}
            onChange={(event) => {
              if (decimalEnEdicionValido(event.target.value, 3)) setCantidad(event.target.value);
            }}
          />
        </label>
        <label>
          <span className="sagva-label">Precio por unidad ($)</span>
          <input
            type="text"
            inputMode="decimal"
            className="sagva-field"
            placeholder="Ej.: 1000"
            value={precio}
            onChange={(event) => {
              if (decimalEnEdicionValido(event.target.value, 2)) setPrecio(event.target.value);
            }}
          />
        </label>
        <button type="button" className="sagva-button-secondary inline-flex items-center justify-center gap-2" onClick={agregarOActualizar}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          {editando ? "Guardar cambio" : "Agregar regla"}
        </button>
      </div>
      {editando ? (
        <button
          type="button"
          className="text-sm text-slate-600 underline"
          onClick={() => {
            setEditando(null);
            setCantidad("");
            setPrecio("");
            setError("");
          }}
        >
          Cancelar edición
        </button>
      ) : null}
      {error ? <p role="alert" className="text-sm text-red-700">{error}</p> : null}
      <input
        type="hidden"
        name="reglasMayoristas"
        value={JSON.stringify(reglas.map((regla) => ({
          cantidadMinima: regla.cantidadMinima,
          precioUnitario: regla.precioUnitario
        })))}
      />
      {reglas.length ? (
        <div className="overflow-x-auto">
          <table className="sagva-table">
            <thead>
              <tr><th>Desde</th><th>Precio por unidad</th><th>Acciones</th></tr>
            </thead>
            <tbody>
              {reglas.map((regla) => (
                <tr key={regla.id}>
                  <td>{numero(regla.cantidadMinima)} unidades</td>
                  <td className="font-semibold">{moneda(numero(regla.precioUnitario))}</td>
                  <td className="space-x-2">
                    <button type="button" onClick={() => comenzarEdicion(regla)} className="inline-flex items-center gap-1 text-sm text-blue-700" aria-label={"Editar regla de " + regla.cantidadMinima + " unidades"}>
                      <Pencil className="h-4 w-4" aria-hidden="true" /> Editar
                    </button>
                    <button type="button" onClick={() => eliminar(regla.id)} className="inline-flex items-center gap-1 text-sm text-red-700" aria-label={"Eliminar regla de " + regla.cantidadMinima + " unidades"}>
                      <Trash2 className="h-4 w-4" aria-hidden="true" /> Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-slate-500">Sin reglas mayoristas. Se utiliza el precio público normal.</p>
      )}
      <p className="text-xs text-slate-500">
        Los cambios de esta lista se guardan al seleccionar «Guardar artículo». El precio público normal no se modifica.
      </p>
    </div>
  );
}
