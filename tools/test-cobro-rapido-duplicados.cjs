/* Prueba aislada F10 -> F2 y colisión real de folios, sin abrir SQLite. */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");
const compilar = path => ts.transpileModule(fs.readFileSync(path,"utf8"),{
  compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}
}).outputText;
const precios={exports:{}};
vm.runInNewContext(compilar("src/lib/venta-precios.ts"),{
  exports:precios.exports,require,Number,Math
});

let crearIntentos=0;
let colisionFolio=true;
const folios=new Set();
const ventas=new Map();
function duplicado(target){
  return Object.assign(new Error("Prisma unique violation"),{code:"P2002",meta:{target:[target]}});
}
const tx={
  caja:{findFirst:async()=>null},
  articulo:{findMany:async()=>[{id:"articulo-1"}]},
  articuloPrecio:{findMany:async()=>[{
    articuloId:"articulo-1",precioPublico:500,precioMayorista:null,cantidadMinimaMayorista:null
  }]},
  articuloReglaMayorista:{findMany:async()=>[]},
  venta:{
    findMany:async()=>[...folios].map(folioDefinitivo=>({folioDefinitivo})),
    create:async({data})=>{
      crearIntentos++;
      if(colisionFolio){
        colisionFolio=false;
        folios.add(data.folioDefinitivo);
        throw duplicado("folio_definitivo");
      }
      if(ventas.has(data.idTemporal))throw duplicado("id_temporal");
      const guardada={...data,id:"venta-"+(ventas.size+1),pagos:[]};
      ventas.set(data.idTemporal,guardada);
      folios.add(data.folioDefinitivo);
      return {id:guardada.id};
    }
  },
  ventaDetalle:{create:async()=>({})},
  inventarioStock:{upsert:async()=>({stockActual:-1})},
  inventarioMovimiento:{create:async()=>({})},
  ventaPago:{create:async({data})=>{
    const guardada=[...ventas.values()].find(v=>v.id===data.ventaId);
    guardada.pagos.push({metodoPago:data.metodoPago});
    return {};
  }},
  cajaMovimiento:{create:async()=>({})},
  auditoria:{create:async()=>({})}
};
const prisma={
  venta:{findUnique:async({where})=>ventas.get(where.idTemporal)??null},
  $transaction:async fn=>fn(tx)
};
const scope={
  exports:{},
  require:name=>{
    if(name==="@/lib/prisma")return {prisma};
    if(name==="@/lib/session")return {getCurrentUser:async()=>({id:"cajera-1"})};
    if(name==="@/lib/venta-permisos")return {puedeAutorizarDescuento:async()=>false};
    if(name==="@/lib/venta-precios")return precios.exports;
    if(name==="@/lib/dia-operativo")return {diaOperativo:()=> "2026-11-23"};
    if(name==="next/cache")return {revalidatePath(){}};
    if(name==="next/navigation")return {redirect:uri=>{throw Error("REDIRECT:"+uri)}};
    return require(name);
  },
  Date,Number,Math,JSON,Set,Error,FormData
};
vm.runInNewContext(compilar("src/app/venta/nueva/actions.ts"),scope);
function form(id,metodo){
  const f=new FormData();
  f.set("idempotencyKey",id);
  f.set("sucursalId","principal");
  f.set("quickMetodo",metodo);
  if(metodo==="efectivo")f.set("efectivoRecibido","500");
  f.set("lineas",JSON.stringify([{articuloId:"articulo-1",cantidad:1,precioUnitario:500,descuento:0}]));
  f.set("pagos","[]");
  return f;
}
async function cobrar(id,metodo){
  try {return await scope.exports.guardarVentaAction(form(id,metodo));}
  catch(e){
    if(String(e.message).startsWith("REDIRECT:/venta/nueva?success=cobrada"))return {ok:true};
    throw e;
  }
}
(async()=>{
  // F10: primer folio choca, transacción se reintenta, solo un cobro queda guardado.
  assert.equal((await cobrar("venta-f10-prueba-001","transferencia")).ok,true);
  assert.equal(crearIntentos,2);
  assert.equal(ventas.size,1);
  const primera=[...ventas.values()][0];
  assert.equal(primera.folioDefinitivo,"B-00000002");
  assert.equal(primera.pagos[0].metodoPago,"transferencia");
  // F2 con el mismo identificador: informar que ya fue registrada, jamás cobrar otra vez.
  const repetida=await cobrar("venta-f10-prueba-001","efectivo");
  assert.equal(repetida.codigo,"VENTA_YA_REGISTRADA");
  assert.match(repetida.error,/TRANSFERENCIA/);
  assert.equal(ventas.size,1);
  assert.equal(crearIntentos,2);
  // Otra venta nueva sí permite cobrar en efectivo.
  assert.equal((await cobrar("venta-f2-prueba-002","efectivo")).ok,true);
  assert.equal(ventas.size,2);
  assert.equal([...ventas.values()][1].pagos[0].metodoPago,"efectivo");
  // Se mantienen restricciones a descuentos y estados válidos en el servidor.
  const fuente=fs.readFileSync("src/app/venta/nueva/actions.ts","utf8");
  assert.match(fuente,/estado: "activo"/);
  assert.match(fuente,/puedeAutorizarDescuento/);
  console.log("OK: transferencia F10, colisión de folio, reintento seguro y efectivo F2.");
})().catch(e=>{console.error(e);process.exitCode=1;});
