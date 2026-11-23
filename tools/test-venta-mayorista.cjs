/* Pruebas de tramos, simulación pura sin SQLite. */
const fs = require("node:fs");
const vm = require("node:vm");
const assert = require("node:assert/strict");
const ts = require("typescript");

const source = fs.readFileSync("src/lib/venta-precios.ts", "utf8");
const js = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 }
}).outputText;
const scope = { exports: {}, require };
vm.runInNewContext(js, scope);

const calcular = scope.exports.precioPorCantidad;
const tramos = [
  { cantidadMinima: 12, precioUnitario: 950 },
  { cantidadMinima: 6, precioUnitario: 1000 }
];
assert.equal(calcular(1100, 1, tramos), 1100);
assert.equal(calcular(1100, 5, tramos), 1100);
assert.equal(calcular(1100, 6, tramos), 1000);
assert.equal(calcular(1100, 11, tramos), 1000);
assert.equal(calcular(1100, 12, tramos), 950);
assert.equal(calcular(1100, 40, tramos), 950);
assert.equal(calcular(1100, 0, tramos), 1100);
assert.equal(calcular(1100, 6, []), 1100);
console.log("Tramos mayoristas por cantidad: correcto.");
