/**
 * Día comercial local (Chile). El corte se configura en .env:
 * SAGVA_HORA_CORTE_DIA="HH:MM". Valor por defecto 00:00.
 */
const FORMATO = new Intl.DateTimeFormat("en-GB", {
  timeZone: "America/Santiago",
  year: "numeric", month: "2-digit", day: "2-digit",
  hour: "2-digit", minute: "2-digit", hourCycle: "h23"
});
const REGEX_HORA = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

export function horaCorteDia(): string {
  const valor = process.env.SAGVA_HORA_CORTE_DIA || "00:00";
  if (!REGEX_HORA.test(valor)) {
    throw new Error("Configura SAGVA_HORA_CORTE_DIA en formato HH:MM.");
  }
  return valor;
}

export function diaOperativo(fecha: Date, corte = horaCorteDia()): string {
  if (!REGEX_HORA.test(corte)) throw new Error("Corte de jornada inválido.");
  const partes = Object.fromEntries(FORMATO.formatToParts(fecha)
    .filter(p => p.type !== "literal").map(p => [p.type,p.value]));
  const identificador = [partes.year,partes.month,partes.day].join("-");
  const minutos = Number(partes.hour) * 60 + Number(partes.minute);
  const [horas,mins] = corte.split(":").map(Number);
  if (minutos >= horas * 60 + mins) return identificador;
  return new Date(Date.UTC(Number(partes.year),Number(partes.month)-1,
    Number(partes.day)-1)).toISOString().slice(0,10);
}
