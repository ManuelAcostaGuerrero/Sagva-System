"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Edit, Plus, Save, Search } from "lucide-react";
import { formatCurrency } from "@/utils/formatters/currency";
import {
  guardarClasificacionRapidaAction,
  asignarMarcaMasivaAction,
  crearMarcaRapidaAction
} from "@/app/actions/articulos-rapido.actions";

type Categoria = { id: string; nombre: string };
type Subfamilia = Categoria & { familiaId: string };
type ArticuloFila = {
  id: string;
  codigoProducto: string;
  codigoBarra: string | null;
  nombre: string;
  tipoArticulo: string;
  familiaId: string | null;
  subfamiliaId: string | null;
  marcaId: string | null;
  estado: string;
  precioPublico: number;
  costoConIva: number;
  stock: number;
};
type Clasificacion = {
  familiaId: string | null;
  subfamiliaId: string | null;
  marcaId: string | null;
  estado: "activo" | "inactivo";
};
type Props = {
  articulos: ArticuloFila[];
  familias: Categoria[];
  subfamilias: Subfamilia[];
  marcas: Categoria[];
  puedeEditar: boolean;
  mostrarGanancia: boolean;
};
const POR_PAGINA = 50;
function normalizar(texto: string | null) {
  return (texto ?? "").normalize("NFC").trim().toLocaleLowerCase("es");
}
function opcionNombre(lista: Categoria[], id: string | null) {
  return lista.find(opcion => opcion.id === id)?.nombre ?? "-";
}

export function ArticulosListadoClient({
  articulos, familias, subfamilias, marcas, puedeEditar, mostrarGanancia
}: Props) {
  const [filas, setFilas] = useState(articulos);
  const [marcasDisponibles, setMarcasDisponibles] = useState(marcas);
  const [busqueda, setBusqueda] = useState("");
  const [busquedaEnFoco, setBusquedaEnFoco] = useState(false);
  const [tipo, setTipo] = useState("");
  const [familia, setFamilia] = useState("");
  const [estado, setEstado] = useState("");
  const [pagina, setPagina] = useState(1);
  const [seleccionados, setSeleccionados] = useState<string[]>([]);
  const [marcaMasiva, setMarcaMasiva] = useState("");
  const [nuevaMarca, setNuevaMarca] = useState("");
  const [editando, setEditando] = useState<string | null>(null);
  const [borrador, setBorrador] = useState<Clasificacion | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");

  const filtrados = useMemo(() => {
    const q = normalizar(busqueda);
    return filas.filter(articulo =>
      (!q || [articulo.nombre, articulo.id, articulo.codigoProducto, articulo.codigoBarra]
        .some(texto => normalizar(texto).includes(q))) &&
      (!tipo || articulo.tipoArticulo === tipo) &&
      (!familia || articulo.familiaId === familia) &&
      (!estado || articulo.estado === estado)
    );
  }, [filas, busqueda, tipo, familia, estado]);

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / POR_PAGINA));
  const paginaActual = Math.min(pagina, totalPaginas);
  const visibles = filtrados.slice((paginaActual - 1) * POR_PAGINA, paginaActual * POR_PAGINA);
  const todasVisiblesSeleccionadas = visibles.length > 0 &&
    visibles.every(a => seleccionados.includes(a.id));

  function cambiarFiltro(setter: (value:string)=>void, value:string) {
    setter(value);
    setPagina(1);
  }
  function alternar(id: string, checked: boolean) {
    setSeleccionados(actual => checked ? [...new Set([...actual,id])] : actual.filter(x => x !== id));
  }
  function alternarPagina() {
    setSeleccionados(actual => {
      const ids = visibles.map(a => a.id);
      return todasVisiblesSeleccionadas
        ? actual.filter(id => !ids.includes(id))
        : [...new Set([...actual, ...ids])];
    });
  }
  function comenzarEdicion(articulo: ArticuloFila) {
    setEditando(articulo.id);
    setBorrador({
      familiaId: articulo.familiaId, subfamiliaId: articulo.subfamiliaId,
      marcaId: articulo.marcaId, estado: articulo.estado === "inactivo" ? "inactivo" : "activo"
    });
    setMensaje("");
  }
  async function guardarEdicion() {
    if (!editando || !borrador || guardando) return;
    setGuardando(true);
    setMensaje("");
    try {
      await guardarClasificacionRapidaAction(editando,borrador);
      const id = editando;
      setFilas(actual => actual.map(a => a.id === id ? { ...a, ...borrador } : a));
      setEditando(null);
      setBorrador(null);
      setMensaje("Clasificación guardada sin recargar la página.");
    } catch (error) {
      setMensaje(error instanceof Error ? error.message : "No se pudo guardar.");
    } finally {
      setGuardando(false);
    }
  }
  async function asignarEnLote() {
    if (!seleccionados.length || seleccionados.length > 100 || guardando) {
      setMensaje("Selecciona entre 1 y 100 artículos por operación.");
      return;
    }
    setGuardando(true);
    setMensaje("");
    try {
      const marcaId = marcaMasiva || null;
      const respuesta = await asignarMarcaMasivaAction(seleccionados,marcaId);
      setFilas(actual => actual.map(a => seleccionados.includes(a.id) ? {...a,marcaId} : a));
      setSeleccionados([]);
      setMensaje("Marca actualizada en "+respuesta.actualizados+" artículos, sin recargar.");
    } catch (error) {
      setMensaje(error instanceof Error ? error.message : "Error al asignar marca.");
    } finally {
      setGuardando(false);
    }
  }
  async function agregarMarca() {
    if (!nuevaMarca.trim() || guardando) return;
    setGuardando(true);
    setMensaje("");
    try {
      const marca = await crearMarcaRapidaAction(nuevaMarca);
      setMarcasDisponibles(actual => actual.some(a => a.id === marca.id) ? actual :
        [...actual,marca].sort((a,b)=>a.nombre.localeCompare(b.nombre,"es")));
      setMarcaMasiva(marca.id);
      setNuevaMarca("");
      setMensaje("Marca disponible. Selecciona los artículos para asignarla.");
    } catch (error) {
      setMensaje(error instanceof Error ? error.message : "No se pudo crear la marca.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap justify-between gap-3">
        <div className="grid flex-1 gap-2 md:grid-cols-4">
          <label className="md:col-span-2">
            <span className="sagva-label">Buscar por nombre, ID o código de barras</span>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <input
                className="sagva-field pl-9"
                value={busqueda} onChange={e=>cambiarFiltro(setBusqueda,e.target.value)}
                onFocus={()=>setBusquedaEnFoco(true)} onBlur={()=>setBusquedaEnFoco(false)}
                onKeyDown={e=>{if(e.key==="Enter")e.preventDefault();}}
                placeholder={busquedaEnFoco ? "" : "Escribe o escanea un código"}
              />
            </div>
          </label>
          <label>
            <span className="sagva-label">Tipo</span>
            <select className="sagva-field" value={tipo} onChange={e=>cambiarFiltro(setTipo,e.target.value)}>
              <option value="">Todos</option>
              <option value="PRODUCTO">Producto</option>
              <option value="ARTICULO">Artículo</option>
              <option value="PROMOCION">Promoción</option>
            </select>
          </label>
          <label>
            <span className="sagva-label">Estado</span>
            <select className="sagva-field" value={estado} onChange={e=>cambiarFiltro(setEstado,e.target.value)}>
              <option value="">Todos</option>
              <option value="activo">Habilitado</option>
              <option value="inactivo">Deshabilitado</option>
            </select>
          </label>
          <label>
            <span className="sagva-label">Familia</span>
            <select className="sagva-field" value={familia} onChange={e=>cambiarFiltro(setFamilia,e.target.value)}>
              <option value="">Todas las familias</option>
              {familias.map(f=><option key={f.id} value={f.id}>{f.nombre}</option>)}
            </select>
          </label>
        </div>
        <Link href="/articulos/nuevo" className="inline-flex h-10 items-center gap-2 sagva-button-primary">
          <Plus className="h-4 w-4" /> Nuevo artículo
        </Link>
      </div>

      {puedeEditar ? (
        <div className="sagva-panel space-y-3 p-4">
          <p className="text-sm font-semibold">Asignación de marcas por lote ({seleccionados.length} seleccionados)</p>
          <div className="flex flex-wrap items-end gap-3">
            <label className="min-w-52 flex-1">
              <span className="sagva-label">Marca para artículos seleccionados</span>
              <select className="sagva-field" value={marcaMasiva} onChange={e=>setMarcaMasiva(e.target.value)}>
                <option value="">Sin marca</option>
                {marcasDisponibles.map(m=><option key={m.id} value={m.id}>{m.nombre}</option>)}
              </select>
            </label>
            <button type="button" className="sagva-button-primary" disabled={!seleccionados.length || guardando || seleccionados.length > 100} onClick={asignarEnLote}>
              Asignar a seleccionados
            </button>
            <label className="min-w-52 flex-1">
              <span className="sagva-label">Nueva marca (opcional)</span>
              <input className="sagva-field" value={nuevaMarca} onChange={e=>setNuevaMarca(e.target.value)}
                onKeyDown={e=>{if(e.key==="Enter"){e.preventDefault();void agregarMarca();}}}
                placeholder="Marca comercial"/>
            </label>
            <button type="button" className="sagva-button-secondary" disabled={guardando || !nuevaMarca.trim()} onClick={agregarMarca}>
              <Plus className="inline h-4 w-4" /> Crear marca
            </button>
          </div>
          <p className="text-xs text-slate-500">Se asigna la misma marca hasta a 100 artículos por operación. No se infieren marcas automáticamente.</p>
        </div>
      ) : null}

      {mensaje ? <p role="status" className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm">{mensaje}</p> : null}
      <div className="sagva-panel overflow-hidden">
        <div className="sagva-panel-title flex flex-wrap justify-between gap-3">
          <span>Listado de artículos</span>
          <span className="text-sm font-normal">{filtrados.length} resultados · página {paginaActual} de {totalPaginas}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="sagva-table">
            <thead>
              <tr>
                {puedeEditar ? (
                  <th><input type="checkbox" aria-label="Seleccionar artículos visibles"
                    checked={todasVisiblesSeleccionadas} onChange={alternarPagina}/></th>
                ) : null}
                <th>Código de barras</th><th>Artículo</th><th>Tipo</th><th>Familia</th><th>Marca</th>
                <th>Precio público</th>
                {mostrarGanancia ? <th>Ganancia estimada</th> : null}
                <th>Stock</th><th>Estado</th><th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {visibles.map(articulo => (
                <tr key={articulo.id}>
                  {puedeEditar ? (
                    <td><input type="checkbox" checked={seleccionados.includes(articulo.id)}
                      aria-label={"Seleccionar "+articulo.nombre}
                      onChange={e=>alternar(articulo.id,e.target.checked)}/></td>
                  ) : null}
                  <td className="font-semibold">{articulo.codigoBarra || "—"}</td>
                  <td>{articulo.nombre}</td>
                  <td>{articulo.tipoArticulo}</td>
                  <td>{opcionNombre(familias,articulo.familiaId)}</td>
                  <td>{opcionNombre(marcasDisponibles,articulo.marcaId)}</td>
                  <td>{formatCurrency(articulo.precioPublico)}</td>
                  {mostrarGanancia ? (
                    <td className={articulo.precioPublico < articulo.costoConIva ? "text-red-700" : "text-green-700"}>
                      {formatCurrency(articulo.precioPublico-articulo.costoConIva)}
                    </td>
                  ) : null}
                  <td>{articulo.stock}</td>
                  <td>{articulo.estado === "activo" ? "Habilitado" : articulo.estado === "inactivo" ? "Deshabilitado" : articulo.estado}</td>
                  <td className="whitespace-nowrap">
                    {puedeEditar ? (
                      <button type="button" onClick={()=>comenzarEdicion(articulo)}
                        className="mr-2 text-sm font-semibold text-[#064ea4]">Edición rápida</button>
                    ) : null}
                    <Link href={`/articulos/${articulo.id}/editar`} className="inline-flex items-center gap-1 text-sm font-bold text-[#064ea4]">
                      <Edit className="h-4 w-4"/> Ficha
                    </Link>
                  </td>
                </tr>
              )).flatMap((fila,i) => {
                const articulo = visibles[i];
                if (!borrador || editando !== articulo.id) return [fila];
                return [fila,
                  <tr key={articulo.id+"-edicion"} className="bg-blue-50" onKeyDown={event=>{
                    if (event.key === "Enter") { event.preventDefault(); void guardarEdicion(); }
                  }}>
                    <td colSpan={puedeEditar ? (mostrarGanancia ? 11 : 10) : (mostrarGanancia ? 10 : 9)}>
                      <div className="grid items-end gap-3 p-3 md:grid-cols-5">
                        <label><span className="sagva-label">Familia</span>
                          <select className="sagva-field" value={borrador.familiaId ?? ""} onChange={e=>setBorrador(a=>a?{...a,familiaId:e.target.value||null,subfamiliaId:null}:a)}>
                            <option value="">Sin familia</option>
                            {familias.map(f=><option key={f.id} value={f.id}>{f.nombre}</option>)}
                          </select>
                        </label>
                        <label><span className="sagva-label">Subfamilia</span>
                          <select className="sagva-field" disabled={!borrador.familiaId}
                            value={borrador.subfamiliaId ?? ""} onChange={e=>setBorrador(a=>a?{...a,subfamiliaId:e.target.value||null}:a)}>
                            <option value="">Sin subfamilia</option>
                            {subfamilias.filter(f=>f.familiaId===borrador.familiaId).map(f=><option key={f.id} value={f.id}>{f.nombre}</option>)}
                          </select>
                        </label>
                        <label><span className="sagva-label">Marca</span>
                          <select className="sagva-field" value={borrador.marcaId ?? ""} onChange={e=>setBorrador(a=>a?{...a,marcaId:e.target.value||null}:a)}>
                            <option value="">Sin marca</option>
                            {marcasDisponibles.map(m=><option key={m.id} value={m.id}>{m.nombre}</option>)}
                          </select>
                        </label>
                        <label><span className="sagva-label">Estado</span>
                          <select className="sagva-field" value={borrador.estado} onChange={e=>setBorrador(a=>a?{...a,estado:e.target.value==="inactivo"?"inactivo":"activo"}:a)}>
                            <option value="activo">Habilitado</option><option value="inactivo">Deshabilitado</option>
                          </select>
                        </label>
                        <div className="flex gap-2">
                          <button className="sagva-button-primary" type="button" disabled={guardando}
                            onClick={()=>void guardarEdicion()}><Save className="inline h-4 w-4"/> Guardar</button>
                          <button className="sagva-button-secondary" type="button" disabled={guardando}
                            onClick={()=>{setEditando(null);setBorrador(null);}}>Cancelar</button>
                        </div>
                      </div>
                    </td>
                  </tr>];
              })}
              {!visibles.length ? <tr><td colSpan={11} className="py-8 text-center text-slate-500">No hay artículos con estos filtros.</td></tr> : null}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-end gap-3 border-t border-slate-100 p-3">
          <button type="button" className="sagva-button-secondary" disabled={paginaActual===1}
            onClick={()=>setPagina(p=>Math.max(1,p-1))}>Anterior</button>
          <span className="text-sm text-slate-500">{paginaActual} / {totalPaginas}</span>
          <button type="button" className="sagva-button-secondary" disabled={paginaActual===totalPaginas}
            onClick={()=>setPagina(p=>Math.min(totalPaginas,p+1))}>Siguiente</button>
        </div>
      </div>
    </section>
  );
}
