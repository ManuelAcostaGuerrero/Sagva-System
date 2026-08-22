"use client";

import { useState } from "react";
import { AlertCircle, CheckCircle2, Loader2, Search, XCircle } from "lucide-react";

type EstadoConsulta = "habilitado" | "no_habilitado" | "invalido" | "error";

type DocumentoAutorizado = {
  codigo: string;
  descripcion: string;
  autorizado?: string;
  desautorizado?: string;
};

type ResultadoConsulta = {
  estado: EstadoConsulta;
  mensaje: string;
  datos: {
    rutConsultado?: string;
    razonSocial?: string;
    numeroResolucion?: string;
    fechaResolucion?: string;
    direccionRegional?: string;
    documentosAutorizados?: DocumentoAutorizado[];
  } | null;
};

const estadoClases: Record<EstadoConsulta, string> = {
  habilitado: "border-green-300 bg-green-50 text-green-800",
  no_habilitado: "border-amber-300 bg-amber-50 text-amber-900",
  invalido: "border-red-300 bg-red-50 text-red-800",
  error: "border-red-300 bg-red-50 text-red-800"
};

const estadoTitulos: Record<EstadoConsulta, string> = {
  habilitado: "Aprobado: habilitado para emitir DTE",
  no_habilitado: "No aprobado: no habilitado para DTE",
  invalido: "RUT inválido",
  error: "Error de consulta"
};

const estadoIconos = {
  habilitado: CheckCircle2,
  no_habilitado: AlertCircle,
  invalido: XCircle,
  error: XCircle
};

export function ProveedorAutocompleteFields() {
  const [rutRuc, setRutRuc] = useState("");
  const [razonSocial, setRazonSocial] = useState("");
  const [consultando, setConsultando] = useState(false);
  const [resultado, setResultado] = useState<ResultadoConsulta | null>(null);
  const [mostrarDocumentos, setMostrarDocumentos] = useState(false);

  async function buscarDatos() {
    setConsultando(true);

    try {
      const respuesta = await fetch("/api/proveedores/validar-rut", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rut: rutRuc })
      });
      const datos = await respuesta.json() as ResultadoConsulta;

      if (datos.datos?.razonSocial) {
        setRazonSocial(datos.datos.razonSocial);
      }

      setMostrarDocumentos(false);
      setResultado(datos);
    } catch {
      setResultado({
        estado: "error",
        mensaje: "No fue posible buscar datos del proveedor en este momento.",
        datos: null
      });
    } finally {
      setConsultando(false);
    }
  }

  const EstadoIcono = resultado ? estadoIconos[resultado.estado] : AlertCircle;

  return (
    <>
      <label>
        <span className="sagva-label">Código *</span>
        <input name="codigo" className="sagva-field" required />
      </label>

      <label>
        <span className="sagva-label">RUT/RUC *</span>
        <div className="flex gap-2">
          <input
            name="rutRuc"
            className="sagva-field min-w-0"
            value={rutRuc}
            onChange={(event) => setRutRuc(event.target.value)}
            placeholder="Ej: 12.345.678-9"
            required
          />
          <button
            type="button"
            className="inline-flex items-center gap-2 sagva-button-secondary disabled:cursor-not-allowed disabled:opacity-60"
            onClick={buscarDatos}
            disabled={consultando}
          >
            {consultando ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Search className="h-4 w-4" aria-hidden="true" />
            )}
            Buscar datos
          </button>
        </div>
      </label>

      <label className="md:col-span-2">
        <span className="sagva-label">Razón social *</span>
        <input
          name="razonSocial"
          className="sagva-field"
          value={razonSocial}
          onChange={(event) => setRazonSocial(event.target.value)}
          required
        />
      </label>

      {resultado ? (
        <div className={`md:col-span-4 rounded-md border px-4 py-3 text-sm ${estadoClases[resultado.estado]}`}>
          <div className="flex items-start gap-3">
            <EstadoIcono className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
            <div>
              <p className="font-bold">{estadoTitulos[resultado.estado]}</p>
              <p className="mt-1">{resultado.mensaje}</p>
              {resultado.datos?.rutConsultado ? (
                <p className="mt-2 text-xs font-semibold">RUT consultado: {resultado.datos.rutConsultado}</p>
              ) : null}
              <p className="mt-2 text-xs">
                Sagva completa solo los datos que el SII entrega con confianza. Dirección, teléfono, contacto y
                nombre comercial quedan editables para completarlos manualmente si no vienen en la consulta.
              </p>
            </div>
          </div>

          {resultado.datos?.documentosAutorizados?.length ? (
            <div className="mt-3">
              <button
                type="button"
                className="text-xs font-bold underline"
                onClick={() => setMostrarDocumentos((valor) => !valor)}
              >
                {mostrarDocumentos ? "Ocultar documentos autorizados" : "Ver documentos autorizados"}
              </button>

              {mostrarDocumentos ? (
                <div className="mt-2 overflow-hidden rounded-md border border-[#d8dee8] bg-white text-slate-800">
                  <table className="sagva-table">
                    <thead>
                      <tr>
                        <th>Código</th>
                        <th>Documento autorizado</th>
                        <th>Desde</th>
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
            </div>
          ) : null}
        </div>
      ) : null}

      <label className="md:col-span-2">
        <span className="sagva-label">Nombre comercial</span>
        <input name="nombreComercial" className="sagva-field" />
      </label>
      <label className="md:col-span-2">
        <span className="sagva-label">Dirección</span>
        <input name="direccion" className="sagva-field" />
      </label>
      <label>
        <span className="sagva-label">Teléfono</span>
        <input name="telefono" className="sagva-field" />
      </label>
      <label>
        <span className="sagva-label">Correo</span>
        <input name="correo" type="email" className="sagva-field" />
      </label>
      <label className="md:col-span-2">
        <span className="sagva-label">Contacto</span>
        <input name="contacto" className="sagva-field" />
      </label>
      <label className="md:col-span-4">
        <span className="sagva-label">Condiciones comerciales</span>
        <textarea name="condicionesComerciales" className="sagva-field min-h-24" />
      </label>
    </>
  );
}
