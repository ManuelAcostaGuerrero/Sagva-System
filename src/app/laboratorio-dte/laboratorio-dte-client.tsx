"use client";

import { useEffect, useRef, useState } from "react";

type Item = { linea: string; codigo: string; nombre: string; descripcion: string; cantidad: number | null; unidad: string; precio: number | null; monto: number | null; descuento: string };
type Documento = { emisor: string; razonSocial: string; receptor: string; razonSocialReceptor: string; tipo: string; folio: string; fecha: string; neto: number | null; exento: number | null; iva: number | null; total: number | null; items: Item[] };
type Timbre = { emisor: string; receptor: string; tipo: string; folio: string; fecha: string; total: number | null; primerProducto: string; fechaTimbre: string; contenidoOriginal: string };
type Resultado = { text?: string; format?: string; rawValue?: string };
type ZXingReader = { readBarcodes: (source: Blob | ImageData, options?: object) => Promise<Resultado[]> };
declare global { interface Window { ZXingWASM?: ZXingReader; BarcodeDetector?: new (options: { formats: string[] }) => { detect: (source: ImageBitmap | HTMLCanvasElement) => Promise<Resultado[]> }; } }
const xmlNodes = (root: ParentNode, name: string): Element[] => Array.from(root.querySelectorAll("*")).filter(e => e.localName === name);
const child = (root: Element | null, name: string): Element | null => Array.from(root?.children ?? []).find(e => e.localName === name) ?? null;
const descendant = (root: ParentNode, name: string): Element | null => xmlNodes(root, name)[0] ?? null;
const field = (root: Element | null, name: string): string => child(root, name)?.textContent?.trim() ?? "";
const amount = (v: string): number | null => /^-?\d+(\.\d+)?$/.test(v) ? Number(v) : null;
const cleanRut = (v: string) => v.replace(/[.\s-]/g, "").toUpperCase();
const fmt = (v: number | null) => v === null ? "No informado" : new Intl.NumberFormat("es-CL", { maximumFractionDigits: 2 }).format(v);
function parseXML(raw: string): XMLDocument {
  const parsed = new DOMParser().parseFromString(raw, "application/xml");
  if (parsed.querySelector("parsererror")) throw new Error("XML inválido o incompleto.");
  return parsed;
}
function parseTED(raw: string): Timbre {
  const doc = parseXML(raw), dd = descendant(doc, "DD");
  if (!dd) throw new Error("El código leído no contiene un timbre TED chileno.");
  return { emisor: field(dd,"RE"), receptor: field(dd,"RR"), tipo: field(dd,"TD"), folio: field(dd,"F"), fecha: field(dd,"FE"), total: amount(field(dd,"MNT")), primerProducto: field(dd,"IT1"), fechaTimbre: descendant(doc,"TSTED")?.textContent?.trim() ?? "", contenidoOriginal: raw };
}
function parseDTEs(raw: string): Documento[] {
  const xml = parseXML(raw);
  const dtes = xmlNodes(xml, "DTE");
  if (!dtes.length) throw new Error("No existe un DTE completo en el XML. El timbre TED por sí solo no trae todos los productos.");
  return dtes.map((dte, index) => {
    const documento = descendant(dte, "Documento"), enc = documento ? child(documento,"Encabezado") : null;
    const id = child(enc,"IdDoc"), em = child(enc,"Emisor"), rec = child(enc,"Receptor"), totals = child(enc,"Totales");
    if (!documento || !id) throw new Error("DTE "+(index+1)+" sin encabezado válido.");
    const items = Array.from(documento.children).filter(el => el.localName === "Detalle").map((d,i) => ({
      linea: field(d,"NroLinDet") || String(i+1),
      codigo: Array.from(d.children).filter(e=>e.localName==="CdgItem").map(e=>field(e,"VlrCodigo")).filter(Boolean).join(" / "),
      nombre: field(d,"NmbItem"), descripcion: field(d,"DscItem"), cantidad: amount(field(d,"QtyItem")),
      unidad: field(d,"UnmdItem"), precio: amount(field(d,"PrcItem")), monto: amount(field(d,"MontoItem")),
      descuento: field(d,"DescuentoPct") || field(d,"DescuentoMonto")
    }));
    return { emisor: field(em,"RUTEmisor"), razonSocial: field(em,"RznSoc"), receptor: field(rec,"RUTRecep"), razonSocialReceptor: field(rec,"RznSocRecep"), tipo: field(id,"TipoDTE"), folio: field(id,"Folio"), fecha: field(id,"FchEmis"), neto: amount(field(totals,"MntNeto")), exento: amount(field(totals,"MntExe")), iva: amount(field(totals,"IVA")), total: amount(field(totals,"MntTotal")), items };
  });
}
function comparisons(t: Timbre | null, d: Documento | null) {
  if (!t || !d) return [];
  return ([
    ["RUT emisor", t.emisor, d.emisor, cleanRut],
    ["RUT receptor", t.receptor, d.receptor, cleanRut],
    ["Tipo DTE", t.tipo, d.tipo, String],
    ["Folio", t.folio, d.folio, String],
    ["Fecha", t.fecha, d.fecha, String],
    ["Total", t.total, d.total, String]
  ] as const).map(([campo, izq, der, norm])=>({ campo, timbre: izq, xml: der, estado: izq===null || der===null || izq==="" || der==="" ? "Sin dato" : norm(izq as never)===norm(der as never) ? "Coincide" : "DIFERENCIA" }));
}
function download(name: string, content: string, type: string) {
  const url=URL.createObjectURL(new Blob([content],{type})), link=document.createElement("a");
  link.href=url; link.download=name; document.body.appendChild(link); link.click(); link.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1200);
}
const infoStyle = "rounded-lg border border-slate-200 bg-slate-50 p-3";
function Fields({ pairs }: { pairs: [string, string | number | null][] }) {
  return <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">{pairs.map(([k,v])=><div key={k} className={infoStyle}><p className="text-xs text-slate-500">{k}</p><p className="break-words text-sm font-semibold text-slate-900">{v===null || v==="" ? "No informado" : v}</p></div>)}</div>;
}
export function LaboratorioDTEClient() {
  const [timbre,setTimbre]=useState<Timbre|null>(null), [docs,setDocs]=useState<Documento[]>([]), [selected,setSelected]=useState(0);
  const [status,setStatus]=useState("Selecciona una imagen o activa la cámara."), [xmlStatus,setXmlStatus]=useState("Sin XML cargado."), [cameraOn,setCameraOn]=useState(false), [readerReady,setReaderReady]=useState(false);
  const video=useRef<HTMLVideoElement|null>(null), stream=useRef<MediaStream|null>(null), interval=useRef<ReturnType<typeof setInterval>|null>(null), busy=useRef(false);
  const doc=docs[selected]??null, checks=comparisons(timbre,doc);
  useEffect(()=>{
    if(window.ZXingWASM?.readBarcodes){setReaderReady(true);return;}
    const script=document.createElement("script");
    script.src="https://cdn.jsdelivr.net/npm/zxing-wasm@3.1.6/dist/iife/reader/index.js";
    script.async=true;script.onload=()=>setReaderReady(!!window.ZXingWASM?.readBarcodes);
    script.onerror=()=>setStatus("No se pudo cargar el lector PDF417. Revisa internet o utiliza el navegador compatible.");
    document.head.appendChild(script);
    return ()=>{script.remove();};
  },[]);
  function stopCamera() {
    if(interval.current){clearInterval(interval.current); interval.current=null;}
    stream.current?.getTracks().forEach(track=>track.stop());stream.current=null;
    if(video.current)video.current.srcObject=null;
    setCameraOn(false);
  }
  useEffect(()=>()=>{if(interval.current)clearInterval(interval.current); stream.current?.getTracks().forEach(t=>t.stop());},[]);
  async function decode(source: Blob | ImageData) {
    let results:Resultado[]=[];
    if(window.ZXingWASM?.readBarcodes)results=await window.ZXingWASM.readBarcodes(source,{tryHarder:true,tryInvert:true,tryRotate:true});
    else if(window.BarcodeDetector){
      const detector=new window.BarcodeDetector({formats:["pdf417","qr_code"]});
      const bitmap=source instanceof Blob ? await createImageBitmap(source) : null;
      const canvas=document.createElement("canvas");
      if(!bitmap && source instanceof ImageData){canvas.width=source.width;canvas.height=source.height;canvas.getContext("2d")?.putImageData(source,0,0);}
      results=await detector.detect(bitmap??canvas);
      bitmap?.close();
    }else throw new Error("No está disponible el lector de PDF417. Comprueba la conexión a internet.");
    const match=results.find(x=>/<TED\b/i.test(x.text??x.rawValue??""));
    if(!match)throw new Error(results.length ? "Código leído, pero no contiene un TED de factura chilena." : "No se detectó el timbre. Prueba con una imagen nítida y completa.");
    const found=parseTED(match.text??match.rawValue??"");
    setTimbre(found);setStatus("Timbre PDF417/QR leído. Sin verificación criptográfica ni consulta al SII.");
    stopCamera();
  }
  async function onImage(file?:File) {
    if(!file)return;
    if(file.size>20_000_000){setStatus("La imagen supera el límite de 20 MB.");return;}
    setStatus("Analizando imagen...");
    try{await decode(file);}catch(e){setStatus("No se pudo leer: "+(e instanceof Error?e.message:String(e)));}
  }
  async function onXML(file?:File) {
    if(!file)return;
    if(file.size>10_000_000){setXmlStatus("XML demasiado grande. Máximo 10 MB.");return;}
    try{
      const loaded=parseDTEs(await file.text());setDocs(loaded);setSelected(0);
      setXmlStatus(loaded.length+" DTE cargado(s) en memoria. No se guarda en SAGVA.");
    }catch(e){setDocs([]);setXmlStatus("Error: "+(e instanceof Error?e.message:String(e)));}
  }
  async function startCamera() {
    try{
      if(!navigator.mediaDevices?.getUserMedia)throw new Error("La cámara necesita HTTPS o localhost. Puedes usar «Tomar foto».");
      const s=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:"environment"}},audio:false});
      stream.current=s;setCameraOn(true);setStatus("Acerca el timbre completo y evita sombras.");
      if(!video.current){s.getTracks().forEach(t=>t.stop());return;}
      video.current.srcObject=s;await video.current.play();
      const canvas=document.createElement("canvas"),ctx=canvas.getContext("2d",{willReadFrequently:true});
      interval.current=setInterval(async()=>{
        if(busy.current || !stream.current || !video.current || video.current.readyState<2 || !ctx)return;
        busy.current=true;
        try{
          const v=video.current,w=Math.min(v.videoWidth,1280),h=Math.round(v.videoHeight*w/v.videoWidth);
          if(!w||!h)return;
          canvas.width=w;canvas.height=h;ctx.drawImage(v,0,0,w,h);
          await decode(ctx.getImageData(0,0,w,h));
        }catch{/* sigue intentando hasta detener */}
        finally{busy.current=false;}
      },950);
    }catch(e){stopCamera();setStatus("Error de cámara: "+(e instanceof Error?e.message:String(e)));}
  }
  function reset(){stopCamera();setTimbre(null);setDocs([]);setSelected(0);setStatus("Prueba reiniciada.");setXmlStatus("Sin XML cargado.");}
  function exportJSON(){download("laboratorio_dte_resultado.json",JSON.stringify({timbre,documento:doc,comparaciones:checks,nota:"Prueba local sin validación tributaria"},null,2),"application/json");}
  function exportCSV(){
    if(!doc)return;
    const keys=(["linea","codigo","nombre","descripcion","unidad","cantidad","precio","monto","descuento"] as const);
    const q=(x:unknown)=>'"'+String(x??"").replace(/"/g,'""')+'"';
    download("detalle_dte_"+doc.folio+".csv","\ufeff"+[keys.join(";"),...doc.items.map(item=>keys.map(key=>q(item[key])).join(";"))].join("\r\n"),"text/csv;charset=utf-8");
  }
  return <div className="space-y-5">
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950"><strong>Módulo experimental, solo lectura.</strong> No registra facturas, no modifica inventario, no consulta al SII ni guarda información en la base de datos. Los archivos se procesan en este navegador. {readerReady?"Lector preparado.":"Cargando lector de códigos…"}</div>
    <div className="grid gap-5 xl:grid-cols-2">
      <section className="sagva-panel space-y-4 p-5"><h2 className="text-lg font-bold">1. Leer timbre PDF417 / QR</h2>
        <p className="text-sm text-slate-600">Identifica RUT, folio, fecha, total y primer producto. No proporciona todas las líneas.</p>
        <input type="file" accept="image/*" aria-label="Seleccionar fotografía de factura" className="block w-full text-sm" onChange={e=>void onImage(e.target.files?.[0])}/>
        <label className="inline-flex cursor-pointer rounded-lg bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-900">Tomar foto<input type="file" accept="image/*" capture="environment" className="sr-only" onChange={e=>void onImage(e.target.files?.[0])}/></label>
        <div className="flex flex-wrap gap-2"><button type="button" className="sagva-button-primary" onClick={()=>void startCamera()} disabled={cameraOn}>Activar cámara</button><button type="button" className="rounded-md border px-3 py-2 text-sm" onClick={stopCamera} disabled={!cameraOn}>Detener cámara</button></div>
        <video ref={video} muted playsInline autoPlay className={cameraOn?"h-56 w-full rounded-lg bg-slate-950 object-cover":"hidden"}/>
        <p role="status" className="text-sm text-slate-600">{status}</p>
        {timbre?<Fields pairs={[["RUT emisor",timbre.emisor],["RUT receptor",timbre.receptor],["Tipo DTE",timbre.tipo],["Folio",timbre.folio],["Fecha",timbre.fecha],["Total",fmt(timbre.total)],["Primer producto",timbre.primerProducto],["Fecha del timbre",timbre.fechaTimbre]]}/>:<p className="text-sm text-slate-500">Todavía no se ha leído un timbre.</p>}
        {timbre?<details className="text-xs"><summary className="cursor-pointer font-semibold">Ver TED original</summary><pre className="mt-2 max-h-44 overflow-auto whitespace-pre-wrap break-all">{timbre.contenidoOriginal}</pre></details>:null}
      </section>
      <section className="sagva-panel space-y-4 p-5"><h2 className="text-lg font-bold">2. Importar factura XML (DTE)</h2>
        <p className="text-sm text-slate-600">El XML permite recuperar todas las líneas informadas por el proveedor. No se sube al servidor.</p>
        <input type="file" accept=".xml,text/xml,application/xml" aria-label="Seleccionar archivo XML DTE" className="block w-full text-sm" onChange={e=>void onXML(e.target.files?.[0])}/>
        <p role="status" className="text-sm text-slate-600">{xmlStatus}</p>
        {docs.length>1?<label className="block text-sm">Documento <select className="mt-1 w-full rounded border p-2" value={selected} onChange={e=>setSelected(Number(e.target.value))}>{docs.map((d,i)=><option key={i} value={i}>{d.tipo} / {d.folio} • {d.razonSocial}</option>)}</select></label>:null}
        {doc?<Fields pairs={[["Proveedor",doc.razonSocial],["RUT proveedor",doc.emisor],["Receptor",doc.razonSocialReceptor],["RUT receptor",doc.receptor],["Tipo / folio",doc.tipo+" / "+doc.folio],["Emisión",doc.fecha],["Neto",fmt(doc.neto)],["IVA",fmt(doc.iva)],["Exento",fmt(doc.exento)],["Total",fmt(doc.total)],["Líneas",doc.items.length]]}/>:<p className="text-sm text-slate-500">Todavía no hay DTE cargado.</p>}
      </section>
    </div>
    <section className="sagva-panel p-5"><h2 className="mb-3 text-lg font-bold">3. Detalle de productos desde XML</h2><div className="overflow-auto"><table className="sagva-table min-w-[720px]"><thead><tr>{["Línea","Código","Producto","Unidad","Cantidad","Precio","Monto"].map(x=><th key={x}>{x}</th>)}</tr></thead><tbody>{doc?.items.length?doc.items.map((item,i)=><tr key={i}><td>{item.linea}</td><td>{item.codigo}</td><td>{item.nombre}{item.descripcion?" • "+item.descripcion:""}</td><td>{item.unidad||"No informada"}</td><td>{fmt(item.cantidad)}</td><td>{fmt(item.precio)}</td><td>{fmt(item.monto)}</td></tr>):<tr><td colSpan={7} className="py-8 text-center text-slate-500">Carga el XML para ver los productos; el timbre por sí solo no alcanza.</td></tr>}</tbody></table></div></section>
    <section className="sagva-panel space-y-3 p-5"><h2 className="text-lg font-bold">4. Comparar y exportar</h2><p className="text-sm text-slate-600">La foto y el XML deben corresponder al mismo documento. Esta comparación no verifica la firma tributaria.</p>
      {checks.length?<ul className="space-y-2">{checks.map(c=><li className="rounded border border-slate-200 p-2 text-sm" key={c.campo}><strong>{c.campo}:</strong> <span className={c.estado==="Coincide"?"font-semibold text-emerald-700":c.estado==="DIFERENCIA"?"font-semibold text-red-700":"text-amber-700"}>{c.estado}</span><span className="block break-words text-xs text-slate-500">Timbre: {String(c.timbre??"sin dato")} | XML: {String(c.xml??"sin dato")}</span></li>)}</ul>:<p className="text-sm text-slate-500">Para comparar, escanea el timbre e importa el XML.</p>}
      <div className="flex flex-wrap gap-2"><button type="button" className="sagva-button-primary" disabled={!doc&&!timbre} onClick={exportJSON}>Exportar JSON</button><button type="button" className="rounded border px-3 py-2 text-sm font-semibold" disabled={!doc?.items.length} onClick={exportCSV}>Exportar productos CSV</button><button type="button" className="rounded border px-3 py-2 text-sm" onClick={reset}>Limpiar prueba</button></div>
    </section>
  </div>;
}
