/* Pruebas aisladas del cobro con inventario negativo. Nunca abre SQLite. */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");

function compilar(path) {
  return ts.transpileModule(fs.readFileSync(path, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 }
  }).outputText;
}
const util = { exports: {} };
vm.runInNewContext(compilar("src/lib/venta-precios.ts"), {
  exports: util.exports, require, Number, Math
});

let habilitado = true;
let stock = null;
let movimientos = [];
let ventas = [];
let pagosCaja = [];
const tx = {
  caja: { findFirst: async () => null },
  articulo: { findMany: async ({ where }) =>
    habilitado && where.estado === "activo" ? [{ id: "articulo-prueba" }] : [] },
  articuloPrecio: { findMany: async () =>
    [{ articuloId: "articulo-prueba", precioPublico: 1000, precioMayorista: null, cantidadMinimaMayorista: null }] },
  articuloReglaMayorista: { findMany: async () => [] },
  venta: {
    findMany: async () => [],
    create: async ({ data }) => {
      ventas.push(data);
      return { id: "venta-prueba-" + ventas.length };
    }
  },
  ventaDetalle: { create: async () => ({}) },
  inventarioStock: { upsert: async ({ where, create, update, select }) => {
    assert.equal(where.articuloId_sucursalId.articuloId, "articulo-prueba");
    assert.equal(where.articuloId_sucursalId.sucursalId, "principal");
    assert.equal(select.stockActual, true);
    stock = stock === null ? create.stockActual : stock - update.stockActual.decrement;
    return { stockActual: stock };
  } },
  inventarioMovimiento: { create: async ({ data }) => { movimientos.push(data); return {}; } },
  ventaPago: { create: async () => ({}) },
  cajaMovimiento: { create: async ({ data }) => { pagosCaja.push(data); return {}; } },
  auditoria: { create: async () => ({}) }
};
const prisma = {
  venta: { findUnique: async () => null },
  caja: { findFirst: async () => ({ id: "caja-prueba" }) },
  $transaction: async fn => fn(tx)
};
const scope = {
  exports: {},
  require: name => {
    if (name === "@/lib/prisma") return { prisma };
    if (name === "@/lib/session") return { getCurrentUser: async () => ({ id: "usuario-prueba" }) };
    if (name === "@/lib/venta-permisos") return { puedeAutorizarDescuento: async () => false };
    if (name === "@/lib/venta-precios") return util.exports;
    if (name === "@/lib/dia-operativo") return { diaOperativo: () => "2026-11-23" };
    if (name === "next/cache") return { revalidatePath() {} };
    if (name === "next/navigation") return { redirect: url => { throw Error("REDIRECT:" + url); } };
    return require(name);
  },
  FormData, Date, Number, Math, JSON, Set
};
vm.runInNewContext(compilar("src/app/venta/nueva/actions.ts"), scope);
function form(cantidad, folio) {
  const data = new FormData();
  data.set("idempotencyKey", "venta-stock-prueba-" + folio);
  data.set("sucursalId", "principal");
  data.set("cajaId", "caja-prueba");
  data.set("accion", "cobrar");
  data.set("lineas", JSON.stringify([
    { articuloId: "articulo-prueba", cantidad, precioUnitario: 1000, descuento: 0 }
  ]));
  data.set("pagos", JSON.stringify([{ metodo: "efectivo", monto: 1000 * cantidad }]));
  return data;
}
async function cobrar(cantidad, folio) {
  try {
    const resultado = await scope.exports.guardarVentaAction(form(cantidad, folio));
    return resultado;
  } catch (error) {
    if (String(error.message).startsWith("REDIRECT:/venta/nueva?success=cobrada")) return { ok: true };
    throw error;
  }
}
(async () => {
  // Stock inexistente: se crea en -1 y el movimiento queda identificado.
  stock = null; habilitado = true;
  assert.equal((await cobrar(1, "01")).ok, true);
  assert.equal(stock, -1);
  assert.equal(movimientos.at(-1).tipoMovimiento, "salida_venta_sin_stock");
  // Caja sin abrir: la venta es válida y todavía no genera movimientos de caja.
  assert.equal(pagosCaja.length, 0);

  // Desde negativo se siguen anotando salidas, sin perderlas.
  assert.equal((await cobrar(2, "02")).ok, true);
  assert.equal(stock, -3);
  assert.equal(movimientos.at(-1).cantidad, 2);

  // Hay stock 1 pero se venden 2: saldo -1, con advertencia/auditoría de inventario.
  stock = 1;
  assert.equal((await cobrar(2, "03")).ok, true);
  assert.equal(stock, -1);
  assert.equal(movimientos.at(-1).tipoMovimiento, "salida_venta_sin_stock");
  assert.match(movimientos.at(-1).observacion, /negativo/);

  // Producto deshabilitado: el servidor lo rechaza y no altera existencias.
  habilitado = false;
  const antes = { stock, ventas: ventas.length, movimientos: movimientos.length };
  const rechazado = await cobrar(1, "04");
  assert.ok(rechazado.error);
  assert.equal(stock, antes.stock);
  assert.equal(ventas.length, antes.ventas);
  assert.equal(movimientos.length, antes.movimientos);

  // La lista amarilla no debe bloquear selección ni limitar cantidad.
  const cliente = fs.readFileSync("src/app/venta/nueva/ventas-nueva-client.tsx", "utf8");
  assert.ok(cliente.includes("border-amber-200 bg-amber-50"));
  assert.ok(!cliente.includes("disabled={sinStock}"));
  assert.ok(!cliente.includes("max={linea.stockDisponible}"));
  // El servidor debe consultar exclusivamente artículos habilitados.
  const busqueda = fs.readFileSync("src/app/venta/nueva/buscar-productos.ts", "utf8");
  assert.ok(busqueda.includes('estado: "activo"'));

  console.log("OK: venta con stock inexistente, insuficiente y negativo; deshabilitados excluidos.");
})().catch(error => { console.error(error); process.exitCode = 1; });
