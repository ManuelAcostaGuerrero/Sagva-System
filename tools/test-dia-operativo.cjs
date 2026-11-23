/* Verifica jornadas que cruzan medianoche en America/Santiago, sin BD. */
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");
const assert = require("node:assert/strict");
const js = ts.transpileModule(fs.readFileSync("src/lib/dia-operativo.ts","utf8"),{
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 }
}).outputText;
const scope = { exports: {}, process: { env: { SAGVA_HORA_CORTE_DIA:"04:00" } },
  Date, Intl, Object, Number, String, Error, require };
vm.runInNewContext(js,scope);
const dia = scope.exports.diaOperativo;
assert.equal(dia(new Date("2026-11-23T01:30:00Z")),"2026-11-22"); // 22:30 CLST
assert.equal(dia(new Date("2026-11-23T05:00:00Z")),"2026-11-22"); // 02:00 CLST
assert.equal(dia(new Date("2026-11-23T08:00:00Z")),"2026-11-23"); // 05:00 CLST
assert.equal(dia(new Date("2026-11-23T05:00:00Z"),"00:00"),"2026-11-23");
scope.process.env.SAGVA_HORA_CORTE_DIA = "invalid";
assert.throws(() => scope.exports.horaCorteDia());
console.log("OK: jornada chilena, corte configurable y fecha posterior a medianoche.");
