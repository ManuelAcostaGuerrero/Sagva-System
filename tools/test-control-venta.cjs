/* Prueba de seguridad de precios sin acceso a datos reales. */
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const ts = require('typescript');
let active = true, currentPrice = 1000, created = 0, storedSale = null;
const tx = {
  articuloReglaMayorista: { findMany: async () => [] },
  articulo: { findMany: async () => active ? [{ id: 'articulo-prueba' }] : [] },
  articuloPrecio: { findMany: async () => [{ articuloId: 'articulo-prueba', precioPublico: currentPrice }] },
  venta: { create: async input => { created++; storedSale = input.data; return { id: 'venta-prueba' }; } },
  ventaDetalle: { create: async () => ({}) }
};
const prisma = { venta: { findUnique: async () => null }, $transaction: async fn => fn(tx) };
const source = fs.readFileSync('src/app/venta/nueva/actions.ts', 'utf8');
const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
const helper = ts.transpileModule(fs.readFileSync('src/lib/venta-precios.ts','utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const util = { exports: {} };
vm.runInNewContext(helper, { ...util, require, Number, Math, console });
const scope = { exports: {}, require: name => name === '@/lib/prisma' ? { prisma } : name === '@/lib/session' ? { getCurrentUser: async () => ({ id: 'usuario-prueba' }) } : name === '@/lib/venta-permisos' ? { puedeAutorizarDescuento: async () => false } : name === '@/lib/venta-precios' ? util.exports : name === 'next/cache' ? { revalidatePath() {} } : name === 'next/navigation' ? { redirect() {} } : require(name), FormData, Date, Number, Math, JSON, console };
vm.runInNewContext(js, scope);
const form = (price, discount = 0) => { const value = new FormData(); value.set('sucursalId', 'sucursal-prueba'); value.set('idempotencyKey','venta-prueba-12345'); value.set('accion', 'pendiente'); value.set('lineas', JSON.stringify([{ articuloId: 'articulo-prueba', cantidad: 1, precioUnitario: price, descuento: discount }])); return value; };
(async () => {
  await scope.exports.guardarVentaAction(form(1000));
  assert.equal(created, 1); assert.equal(storedSale.total, 1000);
  let result = await scope.exports.guardarVentaAction(form(1));
  assert.ok(result.error); assert.equal(created, 1);
  currentPrice = 1100;
  result = await scope.exports.guardarVentaAction(form(1000));
  assert.ok(result.error); assert.equal(created, 1);
  active = false;
  result = await scope.exports.guardarVentaAction(form(1100));
  assert.ok(result.error); assert.equal(created, 1);
  await assert.rejects(() => scope.exports.guardarVentaAction(form(1100, 1101)));
  assert.equal(created, 1);
  console.log('Precio vigente, artículos activos y descuento no superior al total: correctos.');
})().catch(error => { console.error(error); process.exitCode = 1; });
