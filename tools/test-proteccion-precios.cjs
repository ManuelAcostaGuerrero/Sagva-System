/* Pruebas aisladas de cálculos y conservación de precios; no acceden a SQLite. */
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const ts = require('typescript');
const { Prisma } = require('@prisma/client');

function loadTS(path, resolve) {
  const output = {};
  const js = ts.transpileModule(fs.readFileSync(path, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX }
  }).outputText;
  vm.runInNewContext(js, { exports: output, require: resolve, FormData, Number, BigInt, Set, console, Intl });
  return output;
}
const prices = loadTS('src/utils/calculations/prices.ts', require);
const decimal = loadTS('src/lib/validacion-decimal.ts', require);
const form = loadTS('src/lib/form-utils.ts', require);

for (const value of ['0.01', '0.5', '100.5', '9.12345', '7.23456', '999999999990.01']) {
  const expected = new Prisma.Decimal(value).mul('1.19').toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP).toNumber();
  assert.equal(prices.calcularPrecioConIVA(Number(value)), expected, `IVA de ${value}`);
}

let hooks = [], cursor = 0;
const react = { useState(init) { const i = cursor++; if (!(i in hooks)) hooks[i] = typeof init === 'function' ? init() : init; return [hooks[i], value => hooks[i] = typeof value === 'function' ? value(hooks[i]) : value]; } };
const jsx = { jsx: (type, props) => ({ type, props: props || {} }), jsxs: (type, props) => ({ type, props: props || {} }), Fragment: 'fragment' };
const component = loadTS('src/components/forms/articulo-precios-impuestos.tsx', n =>
  n === 'react' ? react : n === 'react/jsx-runtime' ? jsx : n === '@/lib/validacion-decimal' ? decimal :
    n === '@/utils/calculations/prices' ? prices : require(n));
const defaults = { tipoImpuestoInicial: 'IVA', impuestoAdicionalInicial: 0, precioConIvaInicial: 119.6, precioSinIvaInicial: 100.5, precioPublicoInicial: 1000, margenInicial: 30, precioExistente: true };
function render(props = {}) { cursor = 0; return component.ArticuloPreciosImpuestos({ ...defaults, ...props }); }
function nodes(value) { if (!value) return []; if (Array.isArray(value)) return value.flatMap(nodes); if (typeof value !== 'object') return []; return [value, ...nodes(value.props?.children)]; }
function field(tree, name) { const match = nodes(tree).find(x => x.props?.name === name); assert.ok(match, `Falta ${name}`); return match; }
function words(value) { if (Array.isArray(value)) return value.map(words).join(' '); if (typeof value === 'object' && value) return words(value.props?.children); return value == null ? '' : String(value); }
function change(tree, name, value) { field(tree, name).props.onChange({ target: { value } }); }
let tree = render();
assert.equal(field(tree, 'actualizarPrecio').props.value, 'no');
assert.equal(field(tree, 'precioPublico').props.value, '1000');
assert.equal(field(tree, 'precioPublico').props.readOnly, undefined);
assert.equal(field(tree, 'margen').props.value, '736.12');
assert.equal(field(tree, 'ultimoPrecioEditado').props.value, 'ninguno');
change(tree, 'precioSinIva', '9.12345');
tree = render();
assert.equal(field(tree, 'precioSinIva').props.value, '9.12345');
assert.equal(field(tree, 'precioConIva').props.value, '10.86');
assert.equal(field(tree, 'conservarPrecioPublico').props.value, 'si');
assert.equal(field(tree, 'actualizarPrecio').props.value, 'si');
assert.equal(field(tree, 'precioPublico').props.value, '1000');
change(tree, 'precioPublico', '8');
tree = render();
assert.equal(field(tree, 'margen').props.value, '-26.34');
assert.match(words(tree), /Pérdida estimada:/);
assert.equal(field(tree, 'conservarPrecioPublico').props.value, 'no');
change(tree, 'margen', '-20');
tree = render();
assert.equal(field(tree, 'precioPublico').props.value, String(prices.calcularPrecioPublico(10.86, -0.2)));
const precioElegido = field(tree, 'precioPublico').props.value;
change(tree, 'margen', '-101');
tree = render();
assert.equal(field(tree, 'margen').props.value, '-20');
change(tree, 'precioConIva', '20');
tree = render();
assert.equal(field(tree, 'precioPublico').props.value, precioElegido);
assert.equal(field(tree, 'precioSinIva').props.value, '16.81');

hooks = [];
const zeroProps = { precioConIvaInicial: 0, precioSinIvaInicial: 0, precioPublicoInicial: 0, precioExistente: false };
tree = render(zeroProps);
assert.equal(field(tree, 'margen').props.disabled, true);
change(tree, 'precioSinIva', '100');
tree = render(zeroProps);
assert.equal(field(tree, 'margen').props.disabled, false);
assert.equal(field(tree, 'precioPublico').props.value, '154.7');
change(tree, 'precioPublico', '80,5');
tree = render(zeroProps);
assert.equal(field(tree, 'margen').props.value, '-32.35');
assert.match(words(tree), /Pérdida estimada:/);

hooks = [];
const existingZero = { precioPublicoInicial: 0, precioExistente: true };
tree = render(existingZero);
change(tree, 'precioConIva', '200');
tree = render(existingZero);
assert.equal(field(tree, 'precioPublico').props.value, '0');
assert.equal(field(tree, 'conservarPrecioPublico').props.value, 'si');

let saved = null, savedArticle = null, writes = 0, storedPrice = 1000;
const tx = {
  articulo: { findUnique: async () => ({ nombre: '  Prueba  ' }), update: async value => { savedArticle = value.data; } },
  articuloPrecio: { findFirst: async () => ({ precioPublico: storedPrice }), updateMany: async () => { writes++; }, create: async v => { saved = v.data; } },
  proveedorProductoAsociado: { findMany: async () => [] }, articuloReglaMayorista: { deleteMany: async () => {} }
};
const prisma = { $transaction: async fn => fn(tx) };
const actions = loadTS('src/app/actions/articulos.actions.ts', n =>
  n === '@/lib/prisma' ? { prisma } : n === '@/lib/form-utils' ? form : n === '@/utils/calculations/prices' ? prices :
    n === 'next/cache' ? { revalidatePath() {} } : n === 'next/navigation' ? { redirect() {} } : require(n));
(async () => {
  const input = new FormData();
  for (const [key, value] of Object.entries({ nombre: '  Prueba  ', tipoArticulo: 'PRODUCTO', tipoImpuesto: 'IVA_RETENIDO', precioSinIva: '9.12345', precioConIva: '10.86', precioPublico: '9999', margen: '-20', ultimoPrecioEditado: 'sin', reglasMayoristas: '[]', conservarPrecioPublico: 'si', actualizarPrecio: 'no' })) input.set(key, value);
  await actions.actualizarArticuloAction('prueba', input);
  assert.equal(writes, 0); assert.equal(saved, null); assert.equal(savedArticle.nombre, '  Prueba  ');
  input.set('actualizarPrecio', 'si');
  await actions.actualizarArticuloAction('prueba', input);
  assert.equal(saved.precioPublico, 1000); assert.equal(saved.precioSinIva, 9.12345); assert.equal(saved.precioConIva, 10.86);
  storedPrice = 0;
  await actions.actualizarArticuloAction('prueba', input);
  assert.equal(saved.precioPublico, 0); assert.equal(saved.margen, -1);
  input.set('conservarPrecioPublico', 'no'); input.set('precioPublico', '8,00');
  await actions.actualizarArticuloAction('prueba', input);
  assert.equal(saved.precioPublico, 8);
  assert.equal(saved.margen, Number((8 / 10.86 - 1).toFixed(10)));
  input.set('precioPublico', String(prices.calcularPrecioPublico(10.86, 0.2)));
  await actions.actualizarArticuloAction('prueba', input);
  assert.equal(saved.precioPublico, prices.calcularPrecioPublico(10.86, 0.2));
  input.set('ultimoPrecioEditado', 'ninguno'); input.set('precioSinIva', '100');
  input.set('precioConIva', '110'); input.set('precioPublico', '150');
  await actions.actualizarArticuloAction('prueba', input);
  assert.equal(saved.precioSinIva, 100); assert.equal(saved.precioConIva, 110);
  assert.equal(saved.precioPublico, 150);
  input.set('precioPublico', '-1');
  await assert.rejects(actions.actualizarArticuloAction('prueba', input), /precioPublico/);
  input.delete('precioPublico'); input.set('margen', '20'); input.set('ultimoPrecioEditado', 'sin');
  input.set('precioSinIva', '9.12345'); input.set('precioConIva', '10.86');
  await actions.actualizarArticuloAction('prueba', input);
  assert.equal(saved.precioPublico, prices.calcularPrecioPublico(10.86, 0.2));
  console.log('Precio editable, recargo, pérdidas y conservación: correctos.');
})().catch(error => { console.error(error); process.exitCode = 1; });
