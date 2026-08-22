"use client";

import { useState } from "react";
import { AlertCircle, CheckCircle2, Loader2, Search, XCircle } from "lucide-react";

type EstadoValidacion = "habilitado" | "no_habilitado" | "invalido" | "error";

type DocumentoAutorizado = {
  codigo: string;
  descripcion: string;
  autorizado?: string;
  desautorizado?: string;
};

type ResultadoValidacion = {
  estado: EstadoValidacion;
  mensaje: string;
  datos: {
    rutConsultado?: string;
    rut?: string;
    razonSocial?: string;
    numeroResolucion?: string;
    fechaResolucion?: string;
    direccionRegional?: string;
    sistemaFacturacion?: string;
    documentosAutorizados?: DocumentoAutorizado[];
    textoRespuesta?: string;
  } | null;
};

const estadoTexto: Record<EstadoValidacion, string> = {
  habilitado: "Habilitado para DTE",
  no_habilitado: "No habilitado",
  invalido: "RUT inválido",
  error: "Error de consulta"
};

const estadoClases: Record<EstadoValidacion, string> = {
  habilitado: "border-green-300 bg-green-50 text-green-800",
  no_habilitado: "border-amber-300 bg-amber-50 text-amber-900",
  invalido: "border-red-300 bg-red-50 text-red-800",
  error: "border-red-300 bg-red-50 text-red-800"
};

const estadoIcono = {
  habilitado: CheckCircle2,
  no_habilitado: AlertCircle,
  invalido: XCircle,
  error: XCircle
};

export function RutSiiValidator({ defaultValue }: { defaultValue: string }) {
  const [rut, setRut] = useState(defaultValue);
  const [consultando, setConsultando] = useState(false);
  const [resultado, setResultado] = useState<ResultadoValidacion | null>(null);

  async function validarRut() {
    setConsultando(true);

    try {
      const respuesta = await fetch("/api/proveedores/validar-rut", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rut })
      });
      const datos = await respuesta.json() as ResultadoValidacion;
      setResultado(datos);
    } catch {
      setResultado({
        estado: "error",
        mensaje: "No fue posible consultar el SII desde la aplicación.",
        datos: null
      });
    } finally {
      setConsultando(false);
    }
  }

  const EstadoIcono = resultado ? estadoIcono[resultado.estado] : AlertCircle;

  return (
    <>
      <label>
        <span className="sagva-label">RUT</span>
        <div className="flex gap-2">
          <input
            name="rutRuc"
            className="sagva-field min-w-0"
            value={rut}
            onChange={(event) => setRut(event.target.value)}
            placeholder="Ej: 12.345.678-9"
          />
          <button
            type="button"
            className="inline-flex items-center gap-2 sagva-button-secondary disabled:cursor-not-allowed disabled:opacity-60"
            onClick={validarRut}
            disabled={consultando}
          >
            {consultando ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Search className="h-4 w-4" aria-hidden="true" />
            )}
            Validar
          </button>
        </div>
      </label>

      {resultado ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="w-full max-w-xl rounded-md bg-white shadow-xl">
            <div className="flex items-start justify-between gap-4 border-b border-[#d8dee8] px-5 py-4">
              <div>
                <h2 className="text-lg font-bold text-slate-950">Validación SII del proveedor</h2>
                <p className="mt-1 text-sm text-slate-500">Consulta pública de contribuyente autorizado para DTE.</p>
              </div>
              <button
                type="button"
                className="rounded-md p-1 text-slate-500 hover:bg-slate-100"
                onClick={() => setResultado(null)}
                aria-label="Cerrar"
              >
                <XCircle className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <div className="space-y-4 p-5">
              <div className={`flex items-start gap-3 rounded-md border px-4 py-3 ${estadoClases[resultado.estado]}`}>
                <EstadoIcono className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
                <div>
                  <p className="font-bold">{estadoTexto[resultado.estado]}</p>
                  <p className="mt-1 text-sm">{resultado.mensaje}</p>
                </div>
              </div>

              {resultado.datos ? (
                <div className="grid gap-3 text-sm sm:grid-cols-2">
                  <DatoSii label="RUT consultado" value={resultado.datos.rutConsultado ?? resultado.datos.rut} />
                  <DatoSii label="Razón social" value={resultado.datos.razonSocial} />
                  <DatoSii label="N° resolución" value={resultado.datos.numeroResolucion} />
                  <DatoSii label="Fecha resolución" value={resultado.datos.fechaResolucion} />
                  <DatoSii label="Dirección regional" value={resultado.datos.direccionRegional} />
                  <DatoSii label="Sistema de facturación" value={resultado.datos.sistemaFacturacion} />
                </div>
              ) : null}

              {resultado.datos?.documentosAutorizados?.length ? (
                <div className="overflow-hidden rounded-md border border-[#d8dee8]">
                  <table className="sagva-table">
                    <thead>
                      <tr>
                        <th>Código</th>
                        <th>Documento</th>
                        <th>Autorizado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {resultado.datos.documentosAutorizados.map((documento) => (
                        <tr key={`${documento.codigo}-${documento.descripcion}`}>
                          <td>{documento.codigo}</td>
                          <td>{documento.descripcion}</td>
                          <td>{documento.autorizado ?? "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}

              {resultado.datos?.textoRespuesta ? (
                <p className="rounded-md border border-[#d8dee8] bg-slate-50 p-3 text-xs text-slate-600">
                  {resultado.datos.textoRespuesta}
                </p>
              ) : null}
            </div>

            <div className="flex justify-end border-t border-[#d8dee8] px-5 py-4">
              <button type="button" className="sagva-button-primary" onClick={() => setResultado(null)}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function DatoSii({ label, value }: { label: string; value?: string }) {
  if (!value) return null;

  return (
    <div>
      <p className="text-xs font-bold uppercase text-slate-500">{label}</p>
      <p className="mt-1 font-semibold text-slate-900">{value}</p>
    </div>
  );
}
