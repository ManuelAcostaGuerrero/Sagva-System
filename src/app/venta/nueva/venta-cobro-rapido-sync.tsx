"use client";

import { useEffect } from "react";

const quickMethodsByKey: Record<string, string> = {
  F2: "efectivo",
  F6: "debito",
  F8: "credito",
  F10: "transferencia",
};

const quickMethodsByText: Array<[string, string]> = [
  ["Efectivo F2", "efectivo"],
  ["Débito F6", "debito"],
  ["Debito F6", "debito"],
  ["Crédito F8", "credito"],
  ["Credito F8", "credito"],
  ["Transferencia F10", "transferencia"],
];

function setHiddenValue(name: string, value: string) {
  const input = document.querySelector<HTMLInputElement>(`input[name="${name}"]`);
  if (input) input.value = value;
}

function readButtonText(target: EventTarget | null) {
  const element = target instanceof HTMLElement ? target.closest("button") : null;
  return element?.textContent?.replace(/\s+/g, " ").trim() ?? "";
}

export function VentaCobroRapidoSync() {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const method = quickMethodsByKey[event.key];
      if (!method || event.ctrlKey || event.altKey || event.metaKey) return;
      setHiddenValue("quickMetodo", method);

      if (method !== "efectivo") {
        setHiddenValue("efectivoRecibido", "");
      }
    }

    function handleClick(event: MouseEvent) {
      const text = readButtonText(event.target);
      const match = quickMethodsByText.find(([label]) => text.includes(label));

      if (match) {
        setHiddenValue("quickMetodo", match[1]);
        if (match[1] !== "efectivo") {
          setHiddenValue("efectivoRecibido", "");
        }
        return;
      }

      if (text.includes("Confirmar")) {
        const dialogTitle = Array.from(document.querySelectorAll("h2")).some((node) =>
          node.textContent?.includes("Pago en efectivo"),
        );
        if (dialogTitle) {
          setHiddenValue("quickMetodo", "efectivo");
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown, true);
    window.addEventListener("click", handleClick, true);

    return () => {
      window.removeEventListener("keydown", handleKeyDown, true);
      window.removeEventListener("click", handleClick, true);
    };
  }, []);

  return null;
}
