/* Prueba aislada de apertura tardía sin acceder a SQLite. */
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");
const assert = require("node:assert/strict");
const tsJs = path => ts.transpileModule(fs.readFileSync(path,"utf8"),{
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 }
}).outputText;
const day = { exports: {} };
vm.runInNewContext(tsJs("src/lib/dia-operativo.ts"),{
  exports: day.exports, process: { env: { SAGVA_HORA_CORTE_DIA: "04:00" } },
  Date, Intl, Number, String, Error, Object, require
});
const today = new Date();
const cases = [
  { id: "venta-propia", vendedorId:"user-1", sucursalId:"sucursal-1", estado:"cobrada",
    createdAt:today, cajaId:null,
    pagos:[{ metodoPago:"efectivo", monto:4000 }] },
  { id:"venta-otro-usuario",vendedorId:"user-2",sucursalId:"sucursal-1",estado:"cobrada",
    createdAt:today,cajaId:null,pagos:[{metodoPago:"efectivo",monto:5000}] },
  { id:"venta-otra-sucursal",vendedorId:"user-1",sucursalId:"sucursal-2",estado:"cobrada",
    createdAt:today,cajaId:null,pagos:[{metodoPago:"efectivo",monto:3000}] },
  { id:"venta-otro-dia",vendedorId:"user-1",sucursalId:"sucursal-1",estado:"cobrada",
    createdAt:new Date(today.getTime()-26*3600*1000),cajaId:null,
    pagos:[{metodoPago:"efectivo",monto:6000}] },
  { id:"venta-ya-asignada",vendedorId:"user-1",sucursalId:"sucursal-1",estado:"cobrada",
    createdAt:today,cajaId:"caja-previa",pagos:[{metodoPago:"efectivo",monto:8000}] },
  { id:"venta-pendiente",vendedorId:"user-1",sucursalId:"sucursal-1",estado:"pendiente",
    createdAt:today,cajaId:null,pagos:[] }
];
const pagosRegistrados = [];
let aperturas = 0;
const tx = {
  caja: {
    findFirst: async () => null,
    create: async () => { aperturas++; return { id:"caja-nueva" }; }
  },
  cajaApertura: { create: async () => ({}) },
  cajaMovimiento: { create: async ({data}) => { pagosRegistrados.push(data); return {}; } },
  venta: {
    findMany: async ({where}) => cases.filter(x=> x.cajaId === where.cajaId &&
      x.vendedorId===where.vendedorId && x.sucursalId===where.sucursalId &&
      x.estado===where.estado && x.createdAt>=where.createdAt.gte),
    updateMany: async ({where,data}) => {
      const item=cases.find(x=>x.id===where.id && x.cajaId===null &&
        x.vendedorId===where.vendedorId && x.sucursalId===where.sucursalId &&
        x.estado===where.estado);
      if (!item) return {count:0};
      item.cajaId=data.cajaId;
      return {count:1};
    }
  }
};
const prisma = {
  sucursal:{findFirst:async()=>({id:"sucursal-1"})},
  caja:{findFirst:async()=>null},
  $transaction:async fn=>fn(tx)
};
const scope = {
  exports: {},
  require: name => {
    if(name==="@/lib/prisma")return {prisma};
    if(name==="@/lib/session")return {getCurrentUser:async()=>({id:"user-1"})};
    if(name==="@/lib/dia-operativo")return day.exports;
    if(name==="next/cache")return {revalidatePath(){}};
    if(name==="next/navigation")return {redirect:uri=>{throw Error("REDIRECT:"+uri)}};
    return require(name);
  },
  Date, Intl, Number, String, Error, Object, FormData
};
vm.runInNewContext(tsJs("src/app/caja/actions.ts"),scope);
const form = new FormData();
form.set("montoInicial","1000");
(async()=>{
  try{await scope.exports.abrirCajaAction(form);assert.fail("no redirect");}
  catch(e){assert.equal(e.message,"REDIRECT:/caja?success=abierta");}
  assert.equal(aperturas,1);
  assert.equal(cases[0].cajaId,"caja-nueva");
  assert.equal(cases[1].cajaId,null);
  assert.equal(cases[2].cajaId,null);
  assert.equal(cases[3].cajaId,null);
  assert.equal(cases[4].cajaId,"caja-previa");
  assert.equal(cases[5].cajaId,null);
  assert.equal(pagosRegistrados.length,2); // apertura + 1 venta previa
  assert.equal(pagosRegistrados[1].monto,4000);
  assert.equal(pagosRegistrados[1].observacion,"EFECTIVO · Antes de apertura");
  console.log("OK: apertura tardía, vinculación por sesión/día y sin duplicar pagos.");
})().catch(e=>{console.error(e);process.exitCode=1;});
