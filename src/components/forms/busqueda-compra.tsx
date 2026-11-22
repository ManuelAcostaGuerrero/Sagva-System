"use client";

import { useState, useTransition } from "react";
import { buscarArticulosFactura, buscarProveedoresFactura, vincularCodigoFactura } from "@/app/actions/factura-busqueda.actions";

type Proveedor = Awaited<ReturnType<typeof buscarProveedoresFactura>>[number];
type Articulo = Awaited<ReturnType<typeof buscarArticulosFactura>>[number];

export function BusquedaCompra() {
  const [proveedorTexto, setProveedorTexto] = useState("");
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [proveedor, setProveedor] = useState<Proveedor | null>(null);
  const [texto, setTexto] = useState("");
  const [articulos, setArticulos] = useState<Articulo[]>([]);
  const [articulo, setArticulo] = useState<Articulo | null>(null);
  const [codigo, setCodigo] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [pendiente, iniciar] = useTransition();

  function buscarProveedor() {
    setMensaje("");
    iniciar(async () => {
      try { const encontrados = await buscarProveedoresFactura(proveedorTexto); setProveedores(encontrados); if (!encontrados.length) setMensaje("No se encontraron proveedores."); }
      catch { setMensaje("No se pudieron buscar proveedores."); }
    });
  }
  function buscarArticulo() {
    if (!proveedor) return;
    setMensaje("");
    iniciar(async () => {
      try { const encontrados = await buscarArticulosFactura(proveedor.id, texto); setArticulos(encontrados); if (!encontrados.length) setMensaje("No se encontraron artículos para esa búsqueda."); }
      catch { setMensaje("No se pudieron buscar artículos."); }
    });
  }
  function vincular() {
    if (!proveedor || !articulo) return;
    iniciar(async () => {
      const resultado = await vincularCodigoFactura(proveedor.id, articulo.id, codigo);
      if (resultado.error) { setMensaje(resultado.error); return; }
      setMensaje("Código asociado al proveedor y al artículo.");
      setCodigo("");
      setArticulos(await buscarArticulosFactura(proveedor.id, texto));
    });
  }
  return (
    <div className="space-y-4">
      <section className="sagva-panel p-4 space-y-3">
        <h2 className="font-bold">Proveedor</h2>
        <label className="block"><span className="sagva-label">Buscar por nombre o RUT</span>
          <input className="sagva-field" value={proveedorTexto} onChange={(e) => { setProveedorTexto(e.target.value); setProveedor(null); setArticulo(null); setArticulos([]); setProveedores([]); }} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); buscarProveedor(); } }} />
        </label>
        <button type="button" className="sagva-button-secondary" onClick={buscarProveedor} disabled={pendiente}>Buscar proveedor</button>
        {proveedores.length > 0 && !proveedor && <ul className="space-y-1">{proveedores.map((item) => <li key={item.id}><button type="button" className="text-blue-700 underline text-left" onClick={() => { setProveedor(item); setProveedores([]); setProveedorTexto(item.nombreComercial || item.razonSocial); setMensaje(""); }}>{item.nombreComercial || item.razonSocial} — {item.rut}</button></li>)}</ul>}
        {mensaje && !proveedor && <p role="status">{mensaje}</p>}
        {proveedor && <p>Proveedor seleccionado: <strong>{proveedor.razonSocial}</strong> · {proveedor.rut}</p>}
      </section>
      <section className="sagva-panel p-4 space-y-3">
        <h2 className="font-bold">Buscar artículo para la compra</h2>
        <label className="block"><span className="sagva-label">Nombre, código de barras o código del proveedor seleccionado</span>
          <input className="sagva-field" value={texto} disabled={!proveedor} onChange={(e) => { setTexto(e.target.value); setArticulo(null); }} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); buscarArticulo(); } }} />
        </label>
        <button type="button" className="sagva-button-secondary" onClick={buscarArticulo} disabled={!proveedor || pendiente}>Buscar artículo</button>
        <ul className="space-y-2">{articulos.map((item) => <li key={item.id}><button type="button" className="text-blue-700 underline text-left" onClick={() => { setArticulo(item); setMensaje(""); }}>{item.nombre} · {item.unidadMedida}{item.codigoBarra ? ` · Barra: ${item.codigoBarra}` : ""}{item.proveedorProductos.length ? ` · Código proveedor: ${item.proveedorProductos.map((p) => p.productoProveedorCodigo).join(", ")}` : ""}</button></li>)}</ul>
        {articulo && <div className="space-y-2 rounded border p-3"><p>Artículo seleccionado: <strong>{articulo.nombre}</strong></p><label className="block"><span className="sagva-label">Asociar otro código de {proveedor?.nombreComercial || proveedor?.razonSocial}</span><input className="sagva-field" value={codigo} onChange={(e) => setCodigo(e.target.value)} maxLength={100} /></label><button type="button" className="sagva-button-secondary" onClick={vincular} disabled={pendiente || !codigo.trim()}>Guardar código del proveedor</button></div>}
        {mensaje && <p role="status">{mensaje}</p>}
      </section>
      <p className="rounded border border-amber-300 bg-amber-50 p-4 text-sm">La búsqueda y la asociación de códigos están disponibles. El registro y guardado de facturas aún está en desarrollo.</p>
    </div>
  );
}
