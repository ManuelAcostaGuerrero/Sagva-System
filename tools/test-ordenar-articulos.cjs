/* Verifica ordenación de TODO el catálogo antes de la paginación, sin SQLite. */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");
const js = ts.transpileModule(fs.readFileSync("src/lib/ordenar-articulos.ts", "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 }
}).outputText;
const scope = { exports: {}, require, Intl, Number, Set, Map, String, Math };
vm.runInNewContext(js, scope);
const { ordenarArticulos, siguienteOrdenArticulo } = scope.exports;
const filas = [
  { id:"1", codigoProducto:"10", codigoBarra:"78010", nombre:"Alfa",
    tipoArticulo:"PRODUCTO", familiaId:"f1", marcaId:"m1", estado:"activo",
    precioPublico:1500, costoConIva:1100, stock:0 },
  { id:"2", codigoProducto:"2", codigoBarra:"7802", nombre:"Beta",
    tipoArticulo:"PRODUCTO", familiaId:"f2", marcaId:null, estado:"inactivo",
    precioPublico:2000, costoConIva:1750, stock:30 },
  { id:"3", codigoProducto:"3", codigoBarra:null, nombre:"Gama",
    tipoArticulo:"ARTICULO", familiaId:null, marcaId:"m2", estado:"activo",
    precioPublico:500, costoConIva:700, stock:-5 }
];
const familias=[{id:"f1",nombre:"Bebidas"},{id:"f2",nombre:"Tabacos"}];
const marcas=[{id:"m1",nombre:"Marca A"},{id:"m2",nombre:"Marca B"}];
const ids = (orden, lista=filas) =>
  ordenarArticulos(lista, orden, familias, marcas).map(x=>x.id).join(",");

let orden=siguienteOrdenArticulo(null,"stock");
assert.equal(orden.direccion,"desc");
assert.equal(ids(orden),"2,1,3");
orden=siguienteOrdenArticulo(orden,"stock");
assert.equal(orden.direccion,"asc");
assert.equal(ids(orden),"3,1,2");
orden=siguienteOrdenArticulo(orden,"precioPublico");
assert.equal(ids(orden),"2,1,3");
assert.equal(ids({campo:"ganancia",direccion:"asc"}),"3,2,1");
assert.equal(ids({campo:"codigoBarra",direccion:"asc"}),"2,1,3"); // numérico natural, vacío último
assert.equal(ids({campo:"marca",direccion:"desc"}),"3,1,2"); // vacío al final
assert.equal(ids({campo:"familia",direccion:"asc"}),"1,2,3");
assert.equal(ids({campo:"nombre",direccion:"desc"}),"3,2,1");
assert.equal(ids({campo:"tipoArticulo",direccion:"asc"}),"3,1,2");
assert.equal(ids({campo:"estado",direccion:"asc"}),"2,1,3");

// Orden global: aun si el mayor stock está en la página 3, debe pasar a la primera.
const muchas=Array.from({length:130},(_,i)=>({
  ...filas[0], id:String(1000+i), codigoProducto:String(i), nombre:"Artículo "+i,
  stock:i===128 ? 999 : i%3
}));
assert.equal(
  ordenarArticulos(muchas,{campo:"stock",direccion:"desc"},familias,marcas).slice(0,50)[0].stock,
  999
);
// La función no muta el orden original, importante para seguir filtrando y editando.
assert.equal(muchas[0].id,"1000");
assert.equal(filas[0].id,"1");
console.log("OK: flechas bidireccionales, 9 campos, vacíos al final y ordenación global.");
