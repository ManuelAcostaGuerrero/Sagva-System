"use client";

import { useState } from "react";

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
  const [familiaId, setFamiliaId] = useState(familiaInicial);
  const [subfamiliaId, setSubfamiliaId] = useState(subfamiliaInicial);
  const opciones = subfamilias.filter((opcion) => opcion.familiaId === familiaId);

  return (
    <>
      <label>
        <span className="sagva-label">Familia</span>
        <select
          name="familiaId"
          className="sagva-field"
          value={familiaId}
          onChange={(event) => {
            setFamiliaId(event.target.value);
            setSubfamiliaId("");
          }}
        >
          <option value="">Sin familia</option>
          {familias.map((familia) => (
            <option key={familia.id} value={familia.id}>{familia.nombre}</option>
          ))}
        </select>
      </label>
      <label>
        <span className="sagva-label">Subfamilia</span>
        <select
          name="subfamiliaId"
          className="sagva-field"
          value={opciones.some((opcion) => opcion.id === subfamiliaId) ? subfamiliaId : ""}
          disabled={!familiaId}
          onChange={(event) => setSubfamiliaId(event.target.value)}
        >
          <option value="">{familiaId ? "Sin subfamilia" : "Selecciona primero una familia"}</option>
          {opciones.map((subfamilia) => (
            <option key={subfamilia.id} value={subfamilia.id}>{subfamilia.nombre}</option>
          ))}
        </select>
      </label>
    </>
  );
}
