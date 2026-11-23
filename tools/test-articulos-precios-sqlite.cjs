/* Integración con una SQLite temporal nueva, sin abrir la base real de SAGVA. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const vm = require('node:vm');
const { DatabaseSync } = require('node:sqlite');
const { PrismaClient } = require('@prisma/client');
const ts = require('typescript');

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sagva-precios-test-'));
const dbFile = path.join(tempDir, 'prueba.sqlite');
const sqlite = new DatabaseSync(dbFile);
sqlite.exec(`
  CREATE TABLE sucursales (id TEXT PRIMARY KEY, nombre TEXT NOT NULL, codigo TEXT NOT NULL UNIQUE, estado TEXT NOT NULL DEFAULT 'activo', created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME NOT NULL);
  CREATE TABLE articulos (id TEXT PRIMARY KEY, codigo_producto TEXT NOT NULL UNIQUE, codigo_inventario TEXT UNIQUE, codigo_barra TEXT UNIQUE, nombre TEXT NOT NULL, tipo_articulo TEXT NOT NULL DEFAULT 'PRODUCTO', familia_id TEXT, subfamilia_id TEXT, marca_id TEXT, unidad_medida TEXT NOT NULL, cantidad_especifica TEXT, tipo_impuesto TEXT NOT NULL DEFAULT 'IVA', impuesto_adicional DECIMAL, stock_minimo DECIMAL, stock_maximo DECIMAL, comentario TEXT, estado TEXT NOT NULL DEFAULT 'activo', created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME NOT NULL);
  CREATE TABLE articulo_precios (id TEXT PRIMARY KEY, articulo_id TEXT NOT NULL, precio_con_iva DECIMAL NOT NULL, precio_sin_iva DECIMAL NOT NULL, margen DECIMAL NOT NULL DEFAULT 0.3, precio_publico DECIMAL NOT NULL, precio_mayorista DECIMAL, cantidad_minima_mayorista DECIMAL, vigente BOOLEAN NOT NULL DEFAULT 1, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME NOT NULL);
  CREATE TABLE inventario_stock (id TEXT PRIMARY KEY, articulo_id TEXT NOT NULL, sucursal_id TEXT NOT NULL, stock_actual DECIMAL NOT NULL DEFAULT 0, stock_minimo DECIMAL, stock_maximo DECIMAL, updated_at DATETIME NOT NULL, UNIQUE(articulo_id, sucursal_id));
  CREATE TABLE proveedor_productos_asociados (id TEXT PRIMARY KEY, proveedor_id TEXT NOT NULL, producto_proveedor_codigo TEXT NOT NULL, producto_proveedor_nombre TEXT NOT NULL, articulo_id TEXT NOT NULL, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME NOT NULL, UNIQUE(proveedor_id, producto_proveedor_codigo));
  CREATE TABLE articulo_reglas_mayoristas (id TEXT PRIMARY KEY, articulo_id TEXT NOT NULL, cantidad_minima DECIMAL NOT NULL, precio_unitario DECIMAL NOT NULL, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME NOT NULL, UNIQUE(articulo_id, cantidad_minima));
`);
sqlite.close();
const prisma = new PrismaClient({ datasources: { db: { url: 'file:' + dbFile.replace(/\\/g, '/') } } });

function loadTS(file, resolve) {
  const output = {};
  const js = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 }
  }).outputText;
  vm.runInNewContext(js, { exports: output, require: resolve, FormData, Number, BigInt, Set, console });
  return output;
}
const prices = loadTS('src/utils/calculations/prices.ts', require);
const form = loadTS('src/lib/form-utils.ts', require);
const actions = loadTS('src/app/actions/articulos.actions.ts', name => {
  if (name === '@/lib/prisma') return { prisma };
  if (name === '@/lib/form-utils') return form;
  if (name === '@/utils/calculations/prices') return prices;
  if (name === 'next/cache') return { revalidatePath() {} };
  if (name === 'next/navigation') return { redirect() {} };
  return require(name);
});
let usuarioSesion = null;
const busqueda = loadTS('src/app/venta/nueva/buscar-productos.ts', name => {
  if (name === '@/lib/prisma') return { prisma };
  if (name === '@/lib/session') return { getCurrentUser: async () => usuarioSesion };
  return require(name);
});

async function main() {
  const input = new FormData();
  for (const [key, value] of Object.entries({ nombre: 'Artículo de prueba temporal', codigoBarra: '7801234567890', tipoArticulo: 'PRODUCTO', tipoImpuesto: 'IVA', impuestoAdicional: '0', precioSinIva: '9.12345', precioConIva: '10.86', precioPublico: '8', margen: '-26.34', ultimoPrecioEditado: 'sin', reglasMayoristas: '[]', conservarPrecioPublico: 'no', actualizarPrecio: 'si' })) input.set(key, value);
  await actions.crearArticuloAction(input);
  const articulo = await prisma.articulo.findFirstOrThrow();
  async function precioVigente() {
    const registros = await prisma.articuloPrecio.findMany({ where: { articuloId: articulo.id, vigente: true } });
    assert.equal(registros.length, 1);
    return registros[0];
  }
  let precio = await precioVigente();
  assert.equal(Number(precio.precioPublico), 8);
  assert.equal(Number(precio.precioConIva), 10.86);
  assert.ok(Number(precio.margen) < 0);

  // Una ficha histórica puede tener costos sin y con IVA que no coinciden exactamente.
  await prisma.articuloPrecio.update({ where: { id: precio.id }, data: { precioConIva: 11 } });
  input.set('precioConIva', '11');
  input.set('ultimoPrecioEditado', 'ninguno');
  input.set('precioPublico', '1000');
  await actions.actualizarArticuloAction(articulo.id, input);
  precio = await precioVigente();
  assert.equal(Number(precio.precioPublico), 1000);
  assert.equal(Number(precio.precioConIva), 11);
  assert.equal(Number(precio.precioSinIva), 9.12345);

  input.set('precioConIva', '20');
  input.set('ultimoPrecioEditado', 'con');
  input.set('precioPublico', '99');
  input.set('conservarPrecioPublico', 'si');
  await actions.actualizarArticuloAction(articulo.id, input);
  precio = await precioVigente();
  assert.equal(Number(precio.precioConIva), 20);
  assert.equal(Number(precio.precioPublico), 1000);
  assert.equal(Number(precio.margen), 49);

  input.set('precioPublico', '15');
  input.set('conservarPrecioPublico', 'no');
  await actions.actualizarArticuloAction(articulo.id, input);
  precio = await precioVigente();
  assert.equal(Number(precio.precioPublico), 15);
  assert.equal(Number(precio.margen), -0.25);

  input.set('actualizarPrecio', 'no');
  input.set('nombre', 'Otro nombre');
  await actions.actualizarArticuloAction(articulo.id, input);
  assert.equal(Number((await precioVigente()).precioPublico), 15);
  assert.equal(await prisma.articuloPrecio.count({ where: { articuloId: articulo.id } }), 4);

  const sucursal = await prisma.sucursal.findFirstOrThrow();
  let resultado = await busqueda.buscarProductosParaCajaAction('7801234567890', sucursal.id);
  assert.equal(resultado.ok, false); assert.equal(resultado.motivo, 'sesion');
  usuarioSesion = { estado: 'inactivo' };
  resultado = await busqueda.buscarProductosParaCajaAction('7801234567890', sucursal.id);
  assert.equal(resultado.ok, false); assert.equal(resultado.motivo, 'sesion');
  usuarioSesion = { estado: 'activo' };
  resultado = await busqueda.buscarProductosParaCajaAction('7801234567890', sucursal.id);
  assert.equal(resultado.ok, true); assert.equal(resultado.productos.length, 1);
  assert.equal(resultado.productos[0].codigoBarra, '7801234567890');
  assert.equal(resultado.productos[0].precioPublico, 15);
  assert.equal(resultado.productos[0].stockDisponible, 0);
  resultado = await busqueda.buscarProductosParaCajaAction('Otro nombre', sucursal.id);
  assert.equal(resultado.ok, true); assert.equal(resultado.productos.length, 1);
  await prisma.articulo.update({ where: { id: articulo.id }, data: { estado: 'inactivo' } });
  resultado = await busqueda.buscarProductosParaCajaAction('7801234567890', sucursal.id);
  assert.equal(resultado.ok, true); assert.equal(resultado.productos.length, 0);
  console.log('Precios y búsqueda de Ventas en SQLite temporal: correctos.');
}

main().catch(error => { console.error(error); process.exitCode = 1; }).finally(async () => {
  await prisma.$disconnect();
  fs.unlinkSync(dbFile);
  fs.rmdirSync(tempDir);
});
