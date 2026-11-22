/**
 * Entrada decimal editable de formularios: sin letras, signos ni exponentes.
 * En Chile se admiten tanto coma como punto decimal (sin separadores de miles).
 */
export function decimalEnEdicionValido(valor: string, decimales = 2): boolean {
  if (!Number.isInteger(decimales) || decimales < 0 || decimales > 6) return false;
  return new RegExp("^\\d{0,12}(?:[.,]\\d{0," + decimales + "})?$").test(valor);
}

export function decimalAValor(valor: string): number {
  const numero = Number(valor.replace(",", "."));
  return Number.isFinite(numero) && numero >= 0 ? numero : 0;
}

export function normalizarDecimalAlSalir(valor: string): string {
  if (!valor || valor === "." || valor === ",") return "0";
  return valor.endsWith(".") || valor.endsWith(",") ? valor.slice(0, -1) : valor;
}
