export function stringValue(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

export function optionalStringValue(formData: FormData, key: string) {
  const value = stringValue(formData, key);
  return value.length > 0 ? value : undefined;
}

export function numberValue(formData: FormData, key: string, fallback = 0) {
  const value = Number(String(formData.get(key) ?? "").replace(",", "."));
  return Number.isFinite(value) ? value : fallback;
}

/** Valida en el servidor; el control del navegador nunca es suficiente. */
export function numeroDecimalValidado(formData: FormData, campo: string, decimales = 2): number {
  const entrada = formData.get(campo);
  if (entrada === null || entrada === "") return 0;
  if (typeof entrada !== "string") throw new Error("Valor numérico inválido en " + campo + ".");
  const texto = entrada.trim();
  if (!texto) return 0;
  if (!new RegExp("^\\d{1,12}(?:[.,]\\d{1," + decimales + "})?$").test(texto)) {
    throw new Error("El campo " + campo + " solo admite números no negativos, con hasta " + decimales + " decimales.");
  }
  const numero = Number(texto.replace(",", "."));
  if (!Number.isFinite(numero) || numero < 0 || numero >= 1_000_000_000_000) {
    throw new Error("El campo " + campo + " supera el rango permitido.");
  }
  return numero;
}
