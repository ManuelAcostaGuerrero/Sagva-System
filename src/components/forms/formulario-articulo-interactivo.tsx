"use client";
import { useState, type ReactNode } from "react";

type Props = { children: ReactNode; tipoInicial: string; action: (data: FormData) => void | Promise<void> };

/** Enter confirma un campo sin enviar toda la ficha; Guardar ejecuta la acción real. */
export function FormularioArticuloInteractivo({ children, tipoInicial, action }: Props) {
  const [tipo, setTipo] = useState(tipoInicial);
  const [advertencia, setAdvertencia] = useState("");
  return (
    <form action={action} className="space-y-5" data-tipo-articulo={tipo}
      onChangeCapture={(event) => {
        const campo = event.target;
        if (campo instanceof HTMLSelectElement && campo.name === "tipoArticulo") {
          setTipo(campo.value);
          setAdvertencia("");
        }
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter" && event.target instanceof HTMLInputElement) {
          event.preventDefault();
          // Los cálculos y las opciones relacionadas se actualizan mediante estado React.
          event.target.blur();
        }
      }}
      onSubmit={(event) => {
        if (tipo === "PROMOCION") {
          event.preventDefault();
          setAdvertencia("Las promociones necesitan componentes. Se configurarán después en el módulo de ensamblaje.");
        }
      }}
    >
      {children}
      {tipo === "PROMOCION" ? (
        <p role="status" className="rounded-md bg-amber-50 p-3 text-sm text-amber-800">
          La creación de promociones queda pendiente. No se guardarán como productos individuales.
        </p>
      ) : null}
      {advertencia ? <p role="alert" className="text-sm text-red-700">{advertencia}</p> : null}
    </form>
  );
}
