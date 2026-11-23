/* Verificación estática del flujo de foco para escáneres HID, sin tocar datos. */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const venta = fs.readFileSync("src/app/venta/nueva/ventas-nueva-client.tsx", "utf8");
const articulos = fs.readFileSync("src/app/articulos/articulos-listado-client.tsx", "utf8");

assert.match(venta, /ref=\{busquedaProductoRef\}/);
assert.match(venta, /useEffect\(\(\) => \{\s*if \(!dialogoEfectivoAbierto\) \{\s*busquedaProductoRef\.current\?\.focus\(\{ preventScroll: true \}\);\s*\}\s*\}, \[ventaActivaId, dialogoEfectivoAbierto\]\)/);
assert.match(venta, /function finalizarVentaConfirmada\(id: string\)/);
assert.match(venta, /setVentaActivaId\(nueva\.id\)/);
assert.match(venta, /setBusqueda\(""\);\s*\/\/ Al agregar desde la lista,[\s\S]*?busquedaProductoRef\.current\?\.focus/);
assert.match(venta, /if \(!dialogoEfectivoAbierto\)/);
assert.match(venta, /efectivoInputRef\.current\?\.focus\(\)/);

assert.match(articulos, /ref=\{busquedaArticuloRef\}/);
assert.match(articulos, /useEffect\(\(\) => \{\s*busquedaArticuloRef\.current\?\.focus\(\{ preventScroll: true \}\);\s*\}, \[\]\)/);
assert.match(articulos, /e\.currentTarget\.select\(\)/);
assert.match(articulos, /setMensaje\("Clasificación guardada sin recargar la página\."\);\s*busquedaArticuloRef\.current\?\.focus/);

console.log("OK: foco al iniciar, después de venta, escaneo continuo y búsqueda de artículos.");
