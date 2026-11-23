/**
 * Ordenación local de artículos del listado. Opera sobre el resultado ya filtrado
 * ANTES de paginarlo, para que el orden sea global y no solo de 50 filas.
 * No modifica el catálogo ni realiza consultas a SQLite.
 */
export type CampoOrdenArticulo =
  | "codigoBarra"
  | "nombre"
  | "tipoArticulo"
  | "familia"
  | "marca"
  | "precioPublico"
  | "ganancia"
  | "stock"
  | "estado";

export type OrdenArticulo = {
  campo: CampoOrdenArticulo;
  direccion: "asc" | "desc";
};

type ArticuloOrdenable = {
  id: string;
  codigoProducto: string;
  codigoBarra: string | null;
  nombre: string;
  tipoArticulo: string;
  familiaId: string | null;
  marcaId: string | null;
  estado: string;
  precioPublico: number;
  costoConIva: number;
  stock: number;
};

type CategoriaOrdenable = { id: string; nombre: string };

const NUMERICOS: ReadonlySet<CampoOrdenArticulo> = new Set<CampoOrdenArticulo>(["precioPublico", "ganancia", "stock"]);
const COLLATOR = new Intl.Collator("es-CL", { numeric: true, sensitivity: "base" });

export function siguienteOrdenArticulo(
  actual: OrdenArticulo | null,
  campo: CampoOrdenArticulo
): OrdenArticulo {
  if (actual?.campo === campo) {
    return { campo, direccion: actual.direccion === "asc" ? "desc" : "asc" };
  }
  return { campo, direccion: NUMERICOS.has(campo) ? "desc" : "asc" };
}

export function ordenarArticulos<T extends ArticuloOrdenable>(
  articulos: readonly T[],
  orden: OrdenArticulo | null,
  familias: readonly CategoriaOrdenable[],
  marcas: readonly CategoriaOrdenable[]
): T[] {
  if (!orden) return [...articulos];

  const familiasPorId = new Map(familias.map(familia => [familia.id, familia.nombre]));
  const marcasPorId = new Map(marcas.map(marca => [marca.id, marca.nombre]));

  function valor(articulo: T): string | number | null {
    switch (orden!.campo) {
      case "codigoBarra": return articulo.codigoBarra?.trim() || null;
      case "nombre": return articulo.nombre;
      case "tipoArticulo": return articulo.tipoArticulo;
      case "familia": return articulo.familiaId ? familiasPorId.get(articulo.familiaId) ?? null : null;
      case "marca": return articulo.marcaId ? marcasPorId.get(articulo.marcaId) ?? null : null;
      case "precioPublico": return articulo.precioPublico;
      case "ganancia": return articulo.precioPublico - articulo.costoConIva;
      case "stock": return articulo.stock;
      case "estado": return articulo.estado === "activo" ? "Habilitado"
        : articulo.estado === "inactivo" ? "Deshabilitado" : articulo.estado;
      default: return null;
    }
  }

  const factor = orden.direccion === "asc" ? 1 : -1;
  return [...articulos].sort((a, b) => {
    const va = valor(a);
    const vb = valor(b);
    const vacioA = va === null || va === "" || (typeof va === "number" && !Number.isFinite(va));
    const vacioB = vb === null || vb === "" || (typeof vb === "number" && !Number.isFinite(vb));

    // Sin marca/barra/familia siempre al final, en ambas direcciones.
    if (vacioA !== vacioB) return vacioA ? 1 : -1;
    if (!vacioA && !vacioB) {
      const comparacion = typeof va === "number" && typeof vb === "number"
        ? va - vb
        : COLLATOR.compare(String(va), String(vb));
      if (comparacion !== 0) return Math.sign(comparacion) * factor;
    }
    // Desempate determinista: las filas no saltan de lugar con igual stock o precio.
    return COLLATOR.compare(a.nombre, b.nombre)
      || COLLATOR.compare(a.codigoProducto, b.codigoProducto)
      || COLLATOR.compare(a.id, b.id);
  });
}
