"use client";

import { useState } from "react";
import {
  decimalAValor,
  decimalEnEdicionValido,
  normalizarDecimalAlSalir
} from "@/lib/validacion-decimal";

type CampoNumericoProps = {
  name: string;
  defaultValue: number;
  decimales?: number;
  className?: string;
};

export function CampoNumerico({
  name,
  defaultValue,
  decimales = 2,
  className = "sagva-field"
}: CampoNumericoProps) {
  const [valor, setValor] = useState(String(defaultValue));
  return (
    <input
      name={name}
      type="text"
      inputMode="decimal"
      autoComplete="off"
      spellCheck={false}
      className={className}
      value={valor}
      onFocus={() => {
        // Si hay cero, al hacer clic se puede escribir el nuevo número directamente.
        if (valor !== "" && decimalAValor(valor) === 0) setValor("");
      }}
      onChange={(event) => {
        if (decimalEnEdicionValido(event.target.value, decimales)) setValor(event.target.value);
      }}
      onBlur={() => setValor((actual) => normalizarDecimalAlSalir(actual))}
    />
  );
}
