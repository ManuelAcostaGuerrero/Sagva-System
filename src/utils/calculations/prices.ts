export const DEFAULT_IVA_RATE = 0.19;

export function calcularPrecioSinIVA(precioConIVA: number, ivaRate = DEFAULT_IVA_RATE) {
  return roundMoney(precioConIVA / (1 + ivaRate));
}

export function calcularPrecioConIVA(precioSinIVA: number, ivaRate = DEFAULT_IVA_RATE) {
  // Los costos importados pueden tener hasta cinco decimales. Operar en enteros
  // evita que una mitad de centavo se redondee hacia abajo por precisión binaria.
  const texto = String(precioSinIVA);
  const partes = /^(\d+)(?:\.(\d{1,6}))?$/.exec(texto);
  if (ivaRate === DEFAULT_IVA_RATE && partes && Number.isFinite(precioSinIVA)) {
    const fraccion = partes[2] ?? "";
    const escala = BigInt(10) ** BigInt(fraccion.length);
    const base = BigInt(partes[1]) * escala + BigInt(fraccion || "0");
    const dos = BigInt(2);
    const centavos = (base * BigInt(119) * dos + escala) / (escala * dos);
    return Number(centavos) / 100;
  }
  return roundMoney(precioSinIVA * (1 + ivaRate));
}

export function calcularPrecioPublico(precioBase: number, margen = 0.3) {
  return roundMoney(precioBase * (1 + margen));
}

export function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * Costo estimado de adquisición para venta minorista al consumidor final.
 * La base neta no incluye ILA. No agregar el impuesto de nuevo a la boleta.
 */
export function calcularCostoConImpuestoAdicional(
  precioConIVA: number,
  precioSinIVA: number,
  tasaIlaPorcentaje: number
) {
  return roundMoney(precioConIVA + precioSinIVA * tasaIlaPorcentaje / 100);
}

