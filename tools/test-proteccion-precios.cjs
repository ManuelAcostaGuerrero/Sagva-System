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
function render() { cursor = 0; return component.ArticuloPreciosImpuestos({ tipoImpuestoInicial: 'IVA', impuestoAdicionalInicial: 0, precioConIvaInicial: 119.6, precioSinIvaInicial: 100.5, precioPublicoInicial: 1000, margenInicial: 42.8 }); }
function nodes(value) { if (!value) return []; if (Array.isArray(value)) return value.flatMap(nodes); if (typeof value !== 'object') return []; return [value, ...nodes(value.props?.children)]; }
function field(tree, name) { const match = nodes(tree).find(x => x.props?.name === name); assert.ok(match, `Falta ${name}`); return match; }
let tree = render();
assert.equal(field(tree, 'actualizarPrecio').props.value, 'no');
const publicValue = nodes(tree).find(x => x.props?.['aria-label'] === 'Precio público guardado, sin cambios').props.value;
field(tree, 'precioSinIva').props.onChange({ target: { value: '9.12345' } });
tree = render();
assert.equal(field(tree, 'precioSinIva').props.value, '9.12345');
assert.equal(field(tree, 'precioConIva').props.value, '10.86');
assert.equal(field(tree, 'conservarPrecioPublico').props.value, 'si');
assert.equal(field(tree, 'actualizarPrecio').props.value, 'si');
assert.equal(nodes(tree).find(x => x.props?.['aria-label'] === 'Precio público guardado, sin cambios').props.value, publicValue);
const unlock = nodes(tree).find(x => x.type === 'button' && x.props.children === 'Modificar recargo y recalcular precio');
assert.ok(unlock); unlock.props.onClick(); tree = render();
assert.equal(field(tree, 'conservarPrecioPublico').props.value, 'no');

let saved = null, savedArticle = null, writes = 0;
const tx = {
  articulo: { findUnique: async () => ({ nombre: '  Prueba  ' }), update: async value => { savedArticle = value.data; } },
  articuloPrecio: { findFirst: async () => ({ precioPublico: 1000 }), updateMany: async () => { writes++; }, create: async v => { saved = v.data; } },
  proveedorProductoAsociado: { findMany: async () => [] }, articuloReglaMayorista: { deleteMany: async () => {} }
};
const prisma = { $transaction: async fn => fn(tx) };
const actions = loadTS('src/app/actions/articulos.actions.ts', n =>
  n === '@/lib/prisma' ? { prisma } : n === '@/lib/form-utils' ? form : n === '@/utils/calculations/prices' ? prices :
    n === 'next/cache' ? { revalidatePath() {} } : n === 'next/navigation' ? { redirect() {} } : require(n));
(async () => {
  const input = new FormData();
  for (const [key, value] of Object.entries({ nombre: '  Prueba  ', tipoArticulo: 'PRODUCTO', tipoImpuesto: 'IVA_RETENIDO', precioSinIva: '9.12345', precioConIva: '10.86', margen: '42.80', ultimoPrecioEditado: 'sin', reglasMayoristas: '[]', conservarPrecioPublico: 'si', actualizarPrecio: 'no' })) input.set(key, value);
  await actions.actualizarArticuloAction('prueba', input);
  assert.equal(writes, 0); assert.equal(saved, null); assert.equal(savedArticle.nombre, '  Prueba  ');
  input.set('actualizarPrecio', 'si'); input.set('margen', '-1');
  await actions.actualizarArticuloAction('prueba', input);
  assert.equal(saved.precioPublico, 1000); assert.equal(saved.precioSinIva, 9.12345); assert.equal(saved.precioConIva, 10.86);
  input.set('conservarPrecioPublico', 'no'); input.set('margen', '20');
  await actions.actualizarArticuloAction('prueba', input);
  assert.equal(saved.precioPublico, prices.calcularPrecioPublico(10.86, 0.2));
  console.log('Precios, conservación y actualización explícita: correctos.');
})().catch(error => { console.error(error); process.exitCode = 1; });
