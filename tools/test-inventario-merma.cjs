/* Prueba aislada: merma/salida descuentan; entrada suma; ajuste fija stock. */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");

const source = fs.readFileSync("src/app/actions/inventario.actions.ts", "utf8");
const js = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 }
}).outputText;
let stock = 10;
const movimientos = [];
const tx = {
  inventarioStock: {
    upsert: async ({ create, update }) => {
      if (stock === null) stock = create.stockActual;
      else if (typeof update.stockActual === "number") stock = update.stockActual;
      else stock += update.stockActual.increment;
      return { id: "stock-prueba", stockActual: stock };
    }
  },
  inventarioMovimiento: {
    create: async ({ data }) => { movimientos.push(data); return {}; }
  }
};
const prisma = {
  sucursal: {
    upsert: async arg => {
      assert.deepEqual(Object.keys(arg.update), []); // No sobreescribir sucursal.
      return { id: "sucursal-principal" };
    }
  },
  $transaction: async fn => fn(tx)
};
const output = { exports: {} };
const revalidados = [];
vm.runInNewContext(js, {
  exports: output.exports,
  require: name => name === "@/lib/prisma" ? { prisma }
    : name === "@/lib/form-utils" ? {
      stringValue: (form, key) => String(form.get(key) ?? ""),
      numberValue: (form, key, fallback) => Number(form.get(key) ?? fallback),
      optionalStringValue: (form, key) => String(form.get(key) ?? "") || null
    } : name === "next/cache" ? { revalidatePath: p => revalidados.push(p) }
    : require(name),
  Number, FormData
});
async function registrar(tipo, cantidad) {
  const form = new FormData();
  form.set("articuloId", "articulo-prueba");
  form.set("tipoMovimiento", tipo);
  form.set("cantidad", String(cantidad));
  form.set("observacion", "Control de prueba");
  return output.exports.registrarMovimientoInventarioAction(form);
}
(async () => {
  await registrar("merma", 2);
  assert.equal(stock, 8);
  assert.equal(movimientos.at(-1).tipoMovimiento, "merma");
  assert.equal(movimientos.at(-1).cantidad, 2);
  await registrar("salida", 3);
  assert.equal(stock, 5);
  await registrar("entrada", 4);
  assert.equal(stock, 9);
  await registrar("ajuste", 12);
  assert.equal(stock, 12);
  await registrar("merma", 15);
  assert.equal(stock, -3);
  const n = movimientos.length;
  await registrar("inventado", 99);
  await registrar("merma", -2);
  assert.equal(stock, -3);
  assert.equal(movimientos.length, n);

  const formulario = fs.readFileSync("src/components/forms/inventario-movimiento-form.tsx", "utf8");
  assert.match(formulario, /role="combobox"/);
  assert.match(formulario, /name="articuloId" value=\{seleccionId\}/);
  assert.match(formulario, /value="merma"/);
  assert.doesNotMatch(formulario, /<select name="articuloId"/);

  const inventario = fs.readFileSync("src/components/inventario/inventario-listado-client.tsx", "utf8");
  assert.match(inventario, /fila\.codigoBarra \|\| "—"/);
  assert.match(inventario, /fila\.codigoInterno/);
  assert.match(inventario, /filtrados\.slice/);
  assert.ok(revalidados.includes("/inventario"));
  console.log("OK: merma, entrada, salida, ajuste, búsqueda y código de barras.");
})().catch(error => { console.error(error); process.exitCode = 1; });
