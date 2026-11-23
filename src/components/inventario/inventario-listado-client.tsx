"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Search } from "lucide-react";

type FilaInventario = {
  id: string;
  codigoBarra: string | null;
  codigoInterno: string;
  nombre: string;
  familia: string;
  marca: string;
  sucursal: string;
  stock: number;
  minimo: number;
  maximo: number;
  estado: string;
};

const POR_PAGINA = 50;
function normalizar(texto: string | null) {
  return (texto ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es").trim();
}

export function InventarioListadoClient({ filas }: { filas: FilaInventario[] }) {
  const [busqueda, setBusqueda] = useState("");
  const [pagina, setPagina] = useState(1);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus({ preventScroll: true });
  }, []);

  const filtrados = useMemo(() => {
    const q = normalizar(busqueda);
    return filas.filter(fila => !q ||
      [fila.nombre, fila.codigoBarra, fila.codigoInterno, fila.familia, fila.marca, fila.sucursal]
        .some(valor => normalizar(valor).includes(q))
    );
  }, [filas, busqueda]);

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / POR_PAGINA));
  const paginaActual = Math.min(pagina, totalPaginas);
  const visibles = filtrados.slice((paginaActual - 1) * POR_PAGINA, paginaActual * POR_PAGINA);

  return (
    <div className="sagva-panel overflow-hidden">
      <div className="sagva-panel-title flex flex-wrap items-center justify-between gap-3">
        <span>Stock actual</span>
        <span className="text-xs font-normal">{filtrados.length} resultados</span>
      </div>
      <div className="p-4">
        <label htmlFor="inventario-buscar" className="sagva-label">Buscar artículo en inventario</label>
        <div className="relative">
          <input id="inventario-buscar" ref={inputRef} value={busqueda} autoComplete="off"
            className="sagva-field pr-10"
            placeholder="Nombre, código de barras o código interno"
            onChange={event => { setBusqueda(event.target.value); setPagina(1); }}
            onKeyDown={event => {
              if (event.key === "Enter") {
                event.preventDefault();
                event.currentTarget.select(); // Dejar listo el próximo escaneo.
              }
            }} />
          <Search aria-hidden="true"
            className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="sagva-table">
          <thead><tr>
            <th>Código de barras</th>
            <th>Artículo</th>
            <th>Familia</th>
            <th>Marca</th>
            <th>Sucursal</th>
            <th>Stock</th>
            <th>Mínimo</th>
            <th>Máximo</th>
            <th>Estado</th>
          </tr></thead>
          <tbody>
            {visibles.map(fila => (
              <tr key={fila.id}>
                <td className="font-semibold text-slate-900">{fila.codigoBarra || "—"}</td>
                <td>{fila.nombre}</td>
                <td>{fila.familia}</td>
                <td>{fila.marca}</td>
                <td>{fila.sucursal}</td>
                <td className={"font-bold " + (fila.stock < 0 ? "text-amber-700" : "")}>{fila.stock}</td>
                <td>{fila.minimo}</td>
                <td>{fila.maximo}</td>
                <td><span className={fila.estado === "Crítico"
                    ? "rounded-full bg-red-50 px-2 py-1 text-xs font-bold text-red-700"
                    : "rounded-full bg-green-50 px-2 py-1 text-xs font-bold text-green-700"}>
                  {fila.estado}
                </span></td>
              </tr>
            ))}
            {visibles.length === 0 ? (
              <tr><td colSpan={9} className="py-8 text-center text-slate-500">
                {filas.length ? "No hay artículos que coincidan con la búsqueda." : "No hay stock registrado todavía."}
              </td></tr>
            ) : null}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-100 p-3">
        <span className="text-sm text-slate-500">Página {paginaActual} de {totalPaginas}</span>
        <button type="button" className="sagva-button-secondary" disabled={paginaActual <= 1}
          onClick={() => setPagina(actual => Math.max(1, actual - 1))}>Anterior</button>
        <button type="button" className="sagva-button-secondary" disabled={paginaActual >= totalPaginas}
          onClick={() => setPagina(actual => Math.min(totalPaginas, actual + 1))}>Siguiente</button>
      </div>
    </div>
  );
}
