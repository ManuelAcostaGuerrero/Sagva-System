export const DEFAULT_IVA_RATE = 0.19;

export function calcularPrecioSinIVA(precioConIVA: number, ivaRate = DEFAULT_IVA_RATE) {
  return roundMoney(precioConIVA / (1 + ivaRate));
}

export function calcularPrecioConIVA(precioSinIVA: number, ivaRate = DEFAULT_IVA_RATE) {
  return roundMoney(precioSinIVA * (1 + ivaRate));
}

export function calcularPrecioPublico(precioBase: number, margen = 0.3) {
  return roundMoney(precioBase * (1 + margen));
}

export function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
