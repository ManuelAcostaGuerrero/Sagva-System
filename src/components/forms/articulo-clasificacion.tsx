"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import {
  crearFamiliaDesdeArticuloAction,
  crearSubfamiliaDesdeArticuloAction
} from "@/app/actions/catalog.actions";

type FamiliaOpcion = { id: string; nombre: string };
type SubfamiliaOpcion = { id: string; nombre: string; familiaId: string };

type Props = {
  familias: FamiliaOpcion[];
  subfamilias: SubfamiliaOpcion[];
  familiaInicial: string;
  subfamiliaInicial: string;
};

export function ArticuloClasificacion({
  familias,
  subfamilias,
  familiaInicial,
  subfamiliaInicial
}: Props) {
  const [familiasDisponibles, setFamiliasDisponibles] = useState(familias);
  const [subfamiliasDisponibles, setSubfamiliasDisponibles] = useState(subfamilias);
  const [familiaId, setFamiliaId] = useState(familiaInicial);
  const [subfamiliaId, setSubfamiliaId] = useState(subfamiliaInicial);
  const [mostrarNuevaFamilia, setMostrarNuevaFamilia] = useState(false);
  const [mostrarNuevaSubfamilia, setMostrarNuevaSubfamilia] = useState(false);
  const [nombreFamilia, setNombreFamilia] = useState("");
  const [nombreSubfamilia, setNombreSubfamilia] = useState("");
  const [errorFamilia, setErrorFamilia] = useState("");
  const [errorSubfamilia, setErrorSubfamilia] = useState("");
  const [guardandoFamilia, iniciarGuardadoFamilia] = useTransition();
  const [guardandoSubfamilia, iniciarGuardadoSubfamilia] = useTransition();

  const opciones = subfamiliasDisponibles.filter((opcion) => opcion.familiaId === familiaId);

  function guardarFamilia() {
    setErrorFamilia("");
    iniciarGuardadoFamilia(async () => {
      try {
        const resultado = await crearFamiliaDesdeArticuloAction(nombreFamilia);
        if (!resultado.ok) {
          setErrorFamilia(resultado.error);
          return;
        }
        setFamiliasDisponibles((actuales) =>
          actuales.some((familia) => familia.id === resultado.id)
            ? actuales
            : [...actuales, { id: resultado.id, nombre: resultado.nombre }]
                .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"))
        );
        setFamiliaId(resultado.id);
        setSubfamiliaId("");
        setNombreFamilia("");
        setNombreSubfamilia("");
        setMostrarNuevaFamilia(false);
        setMostrarNuevaSubfamilia(false);
        setErrorSubfamilia("");
      } catch {
        setErrorFamilia("No se pudo crear la familia. Intenta nuevamente.");
      }
    });
  }

  function guardarSubfamilia() {
    if (!familiaId) {
      setErrorSubfamilia("Selecciona una familia antes de crear una subfamilia.");
      return;
    }
    const familiaSeleccionada = familiaId;
    setErrorSubfamilia("");
    iniciarGuardadoSubfamilia(async () => {
      try {
        const resultado = await crearSubfamiliaDesdeArticuloAction(familiaSeleccionada, nombreSubfamilia);
        if (!resultado.ok) {
          setErrorSubfamilia(resultado.error);
          return;
        }
        setSubfamiliasDisponibles((actuales) =>
          actuales.some((subfamilia) => subfamilia.id === resultado.id)
            ? actuales
            : [...actuales, { id: resultado.id, nombre: resultado.nombre, familiaId: familiaSeleccionada }]
                .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"))
        );
        setSubfamiliaId(resultado.id);
        setNombreSubfamilia("");
        setMostrarNuevaSubfamilia(false);
      } catch {
        setErrorSubfamilia("No se pudo crear la subfamilia. Intenta nuevamente.");
      }
    });
  }

  return (
    <>
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <label htmlFor="articulo-familia" className="sagva-label">Familia</label>
          <button
            type="button"
            aria-label="Agregar nueva familia"
            title="Agregar familia"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-300 text-[#064ea4] hover:bg-slate-50"
            onClick={() => {
              setMostrarNuevaFamilia((actual) => !actual);
              setErrorFamilia("");
            }}
            disabled={guardandoFamilia}
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
        <select
          id="articulo-familia"
          name="familiaId"
          className="sagva-field"
          value={familiaId}
          onChange={(event) => {
            setFamiliaId(event.target.value);
            setSubfamiliaId("");
            setMostrarNuevaSubfamilia(false);
            setNombreSubfamilia("");
            setErrorSubfamilia("");
          }}
          disabled={guardandoSubfamilia}
        >
          <option value="">Sin familia</option>
          {familiasDisponibles.map((familia) => (
            <option key={familia.id} value={familia.id}>{familia.nombre}</option>
          ))}
        </select>
        {mostrarNuevaFamilia ? (
          <div className="space-y-2 rounded-md border border-slate-200 p-2">
            <input
              className="sagva-field"
              aria-label="Nombre de la nueva familia"
              placeholder="Nombre de la nueva familia"
              value={nombreFamilia}
              maxLength={100}
              onChange={(event) => setNombreFamilia(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  if (!guardandoFamilia) guardarFamilia();
                }
              }}
            />
            <div className="flex flex-wrap gap-2">
              <button type="button" className="sagva-button-primary" disabled={guardandoFamilia} onClick={guardarFamilia}>
                {guardandoFamilia ? "Guardando..." : "Agregar familia"}
              </button>
              <button type="button" className="sagva-button-secondary" disabled={guardandoFamilia} onClick={() => setMostrarNuevaFamilia(false)}>
                Cancelar
              </button>
            </div>
          </div>
        ) : null}
        {errorFamilia ? <p role="alert" className="text-xs text-red-700">{errorFamilia}</p> : null}
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <label htmlFor="articulo-subfamilia" className="sagva-label">Subfamilia</label>
          <button
            type="button"
            aria-label="Agregar nueva subfamilia"
            title={familiaId ? "Agregar subfamilia" : "Selecciona primero una familia"}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-300 text-[#064ea4] hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            onClick={() => {
              setMostrarNuevaSubfamilia((actual) => !actual);
              setErrorSubfamilia("");
            }}
            disabled={!familiaId || guardandoSubfamilia || guardandoFamilia}
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
        <select
          id="articulo-subfamilia"
          name="subfamiliaId"
          className="sagva-field"
          value={opciones.some((opcion) => opcion.id === subfamiliaId) ? subfamiliaId : ""}
          disabled={!familiaId || guardandoSubfamilia}
          onChange={(event) => setSubfamiliaId(event.target.value)}
        >
          <option value="">{familiaId ? "Sin subfamilia" : "Selecciona primero una familia"}</option>
          {opciones.map((subfamilia) => (
            <option key={subfamilia.id} value={subfamilia.id}>{subfamilia.nombre}</option>
          ))}
        </select>
        {mostrarNuevaSubfamilia && familiaId ? (
          <div className="space-y-2 rounded-md border border-slate-200 p-2">
            <input
              className="sagva-field"
              aria-label="Nombre de la nueva subfamilia"
              placeholder="Nombre de la nueva subfamilia"
              value={nombreSubfamilia}
              maxLength={100}
              onChange={(event) => setNombreSubfamilia(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  if (!guardandoSubfamilia) guardarSubfamilia();
                }
              }}
            />
            <div className="flex flex-wrap gap-2">
              <button type="button" className="sagva-button-primary" disabled={guardandoSubfamilia} onClick={guardarSubfamilia}>
                {guardandoSubfamilia ? "Guardando..." : "Agregar subfamilia"}
              </button>
              <button type="button" className="sagva-button-secondary" disabled={guardandoSubfamilia} onClick={() => setMostrarNuevaSubfamilia(false)}>
                Cancelar
              </button>
            </div>
          </div>
        ) : null}
        {errorSubfamilia ? <p role="alert" className="text-xs text-red-700">{errorSubfamilia}</p> : null}
      </div>
    </>
  );
}
