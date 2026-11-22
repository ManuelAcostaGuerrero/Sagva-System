/** Precio unitario aplicable: tramo de mayor cantidad mínima que no supere la cantidad vendida. */
export type TramoMayorista = { cantidadMinima: number; precioUnitario: number };

export function precioPorCantidad(precioPublico: number, cantidad: number, tramos: TramoMayorista[]): number {
  if (!Number.isFinite(cantidad) || cantidad <= 0) return precioPublico;
  let minimoAplicado = 0;
  let precio = precioPublico;
  for (const tramo of tramos) {
    if (Number.isFinite(tramo.cantidadMinima) && Number.isFinite(tramo.precioUnitario) &&
        tramo.cantidadMinima > 0 && tramo.precioUnitario > 0 &&
        cantidad >= tramo.cantidadMinima && tramo.cantidadMinima >= minimoAplicado) {
      minimoAplicado = tramo.cantidadMinima;
      precio = tramo.precioUnitario;
    }
  }
  return precio;
}
