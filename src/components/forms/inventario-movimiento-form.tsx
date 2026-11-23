"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import type { Articulo } from "@prisma/client";
import { Check, Save, Search, X } from "lucide-react";
import { registrarMovimientoInventarioAction } from "@/app/actions/inventario.actions";

type Opcion = Pick<Articulo, "id" | "nombre" | "codigoProducto" | "codigoBarra" | "estado">;
type Props = { articulos: Opcion[]; tipoDefault?: "entrada" | "salida" | "ajuste" | "merma" };
function normalizar(texto: string | null) {
  return (texto ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es").trim();
}

export function InventarioMovimientoForm({ articulos, tipoDefault = "entrada" }: Props) {
  const [texto, setTexto] = useState("");
  const [seleccionId, setSeleccionId] = useState("");
  const [abierto, setAbierto] = useState(false);
  const [activo, setActivo] = useState<number | null>(null);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus({ preventScroll: true });
  }, []);

  const seleccionado = articulos.find(a => a.id === seleccionId) ?? null;
  const resultados = useMemo(() => {
    const q = normalizar(texto);
    if (!q) return [];
    return articulos.filter(a =>
      [a.nombre, a.codigoBarra, a.codigoProducto].some(v => normalizar(v).includes(q)))
      .sort((a, b) => {
        const ea = [a.codigoBarra, a.codigoProducto].some(v => normalizar(v) === q);
        const eb = [b.codigoBarra, b.codigoProducto].some(v => normalizar(v) === q);
        return ea !== eb ? ea ? -1 : 1 : a.nombre.localeCompare(b.nombre, "es");
      }).slice(0, 15);
  }, [articulos, texto]);

  function elegir(a: Opcion) {
    setSeleccionId(a.id);
    setTexto(a.codigoBarra || a.codigoProducto);
    setActivo(null);
    setError("");
    inputRef.current?.focus({ preventScroll: true });
    inputRef.current?.select();
    setAbierto(false);
  }

  function tecla(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") { setAbierto(false); return; }
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!resultados.length) return;
      const delta = event.key === "ArrowDown" ? 1 : -1;
      setAbierto(true);
      setActivo(i => i === null ? delta === 1 ? 0 : resultados.length - 1
        : (i + delta + resultados.length) % resultados.length);
      return;
    }
    if (event.key !== "Enter") return;
    event.preventDefault(); // El escáner no puede enviar accidentalmente el movimiento.
    if (seleccionado && !abierto) { event.currentTarget.select(); return; }
    const q = normalizar(texto);
    const exactos = resultados.filter(a => normalizar(a.codigoBarra) === q ||
      normalizar(a.codigoProducto) === q);
    const candidato = activo !== null ? resultados[activo]
      : exactos.length === 1 ? exactos[0]
      : exactos.length === 0 && resultados.length === 1 ? resultados[0] : null;
    if (candidato) elegir(candidato);
    else setError("Selecciona el artículo correcto de la lista antes de continuar.");
  }

  function validar(event: FormEvent<HTMLFormElement>) {
    if (seleccionado) return;
    event.preventDefault();
    setError("Selecciona un artículo antes de guardar.");
    inputRef.current?.focus({ preventScroll: true });
  }

  return (
    <form action={registrarMovimientoInventarioAction} onSubmit={validar} className="sagva-panel">
      <div className="sagva-panel-title">Registrar movimiento</div>
      <div className="grid gap-4 p-4 md:grid-cols-5">
        <div className="min-w-0 md:col-span-2">
          <label htmlFor="movimiento-buscar-articulo" className="sagva-label">Artículo</label>
          <div className="relative" onBlur={e => {
            if (!e.currentTarget.contains(e.relatedTarget)) setAbierto(false);
          }}>
            <input id="movimiento-buscar-articulo" ref={inputRef}
              className="sagva-field pr-10" autoComplete="off"
              role="combobox" aria-autocomplete="list"
              aria-expanded={abierto && resultados.length > 0}
              aria-controls="movimiento-resultados-articulos"
              placeholder="Nombre, código de barras o código interno"
              value={texto}
              onChange={e => {
                setTexto(e.target.value);
                setSeleccionId("");
                setActivo(null);
                setAbierto(true);
                setError("");
              }}
              onFocus={() => { if (texto.trim() && !seleccionado) setAbierto(true); }}
              onKeyDown={tecla}
            />
            {texto ? (
              <button type="button" aria-label="Limpiar búsqueda" title="Limpiar búsqueda"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-500"
                onClick={() => {
                  setTexto(""); setSeleccionId(""); setAbierto(false);
                  setActivo(null); setError("");
                  inputRef.current?.focus({ preventScroll: true });
                }}>
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            ) : <Search aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />}
            {abierto && texto.trim() ? (
              <div id="movimiento-resultados-articulos" role="listbox"
                className="absolute left-0 right-0 top-[calc(100%+4px)] z-30 max-h-72 overflow-y-auto rounded-lg border border-[#d8dee8] bg-white shadow-lg">
                {resultados.length ? resultados.map((a, i) => (
                  <button key={a.id} type="button" role="option" aria-selected={activo === i}
                    onClick={() => elegir(a)}
                    className={"flex w-full items-center justify-between gap-2 border-b border-slate-100 px-3 py-2 text-left last:border-0 hover:bg-blue-50 " +
                      (activo === i ? "bg-blue-50" : "")}>
                    <span className="min-w-0">
                      <span className="block break-words text-sm font-semibold">{a.nombre}</span>
                      <span className="block text-xs text-slate-500">Barra: {a.codigoBarra || "Sin código"} · Interno: {a.codigoProducto}</span>
                    </span>
                    {a.estado === "inactivo" ? <span className="shrink-0 text-xs text-amber-700">Deshabilitado</span> : null}
                  </button>
                )) : <p className="px-3 py-3 text-sm text-slate-500">No se encontraron artículos.</p>}
              </div>
            ) : null}
          </div>
          <input type="hidden" name="articuloId" value={seleccionId} />
          {seleccionado ? <p role="status" className="mt-1 flex items-center gap-1 text-xs font-semibold text-green-800">
            <Check className="h-3.5 w-3.5" aria-hidden="true" /> Seleccionado: {seleccionado.nombre}
          </p> : <p className="mt-1 text-xs text-slate-500">Escribe o escanea; Enter selecciona un código único.</p>}
          {error ? <p role="alert" className="mt-1 text-xs font-semibold text-red-700">{error}</p> : null}
        </div>
        <label><span className="sagva-label">Tipo</span>
          <select name="tipoMovimiento" className="sagva-field" defaultValue={tipoDefault} required>
            <option value="entrada">Entrada</option>
            <option value="salida">Salida</option>
            <option value="merma">Merma</option>
            <option value="ajuste">Ajuste</option>
          </select>
        </label>
        <label><span className="sagva-label">Cantidad</span>
          <input name="cantidad" type="number" step="0.001" min="0.001" className="sagva-field" required />
        </label>
        <label><span className="sagva-label">Observación</span>
          <input name="observacion" className="sagva-field" placeholder="Motivo o detalle" />
        </label>
      </div>
      <div className="flex justify-end border-t border-[#d8dee8] p-4">
        <button type="submit" disabled={!seleccionado}
          className="inline-flex items-center gap-2 sagva-button-primary disabled:cursor-not-allowed disabled:opacity-50">
          <Save className="h-4 w-4" aria-hidden="true" /> Guardar movimiento
        </button>
      </div>
    </form>
  );
}
