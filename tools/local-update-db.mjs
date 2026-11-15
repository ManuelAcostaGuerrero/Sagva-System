// Copia SQLite consistente con Node 24; no depende de node_modules ni ejecuta seed.
import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {DatabaseSync,backup} from 'node:sqlite';
const root=path.resolve(import.meta.dirname,'..');const env=fs.readFileSync(path.join(root,'.env'),'utf8');const match=env.match(/^\s*DATABASE_URL\s*=\s*(.+?)\s*$/m);if(!match)throw Error('Falta DATABASE_URL.');const value=match[1].replace(/^(['"])(.*)\1$/,'$2');if(!value.startsWith('file:'))throw Error('Este respaldo requiere SQLite local.');const database=path.resolve(root,'prisma',value.slice(5).split('?')[0]);if(!database.startsWith(root+path.sep)||!fs.existsSync(database))throw Error('Base local no encontrada dentro del proyecto.');
const action=process.argv[2];const destination=path.resolve(process.argv[3]||path.join(root,'.local/unused'));
if(!destination.startsWith(root+path.sep))throw Error('Destino fuera del proyecto.');
const source=new DatabaseSync(database,{readOnly:true,timeout:5000});
try{
 assert.equal(source.prepare('PRAGMA integrity_check').get().integrity_check,'ok');assert.equal(source.prepare('PRAGMA foreign_key_check').all().length,0);
 if(action==='backup'){
  fs.mkdirSync(destination,{recursive:true});const file=path.join(destination,'sqlite.db');if(fs.existsSync(file))throw Error('Respaldo ya existente.');await backup(source,file);const copy=new DatabaseSync(file,{readOnly:true});try{assert.equal(copy.prepare('PRAGMA integrity_check').get().integrity_check,'ok');assert.equal(copy.prepare('PRAGMA foreign_key_check').all().length,0);}finally{copy.close();}console.log('Respaldo consistente verificado; integridad y referencias correctas.');
 }else if(action==='compare'){
  const before=new DatabaseSync(path.join(destination,'sqlite.db'),{readOnly:true});try{for(const {name}of before.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all()){const quoted='"'+name.replaceAll('"','""')+'"';const cols=before.prepare('PRAGMA table_info('+quoted+')').all().map(c=>'"'+c.name.replaceAll('"','""')+'"').join(',');if(JSON.stringify(source.prepare('SELECT '+cols+' FROM '+quoted+' ORDER BY rowid').all())!==JSON.stringify(before.prepare('SELECT '+cols+' FROM '+quoted+' ORDER BY rowid').all()))throw Error('Datos existentes cambiaron; revisar respaldo privado.');}}finally{before.close();}console.log('Datos anteriores conservados tras actualizar.');
 }else if(action==='check')console.log('SQLite íntegra y referencias correctas.');else throw Error('Acción no válida.');
}finally{source.close();}
