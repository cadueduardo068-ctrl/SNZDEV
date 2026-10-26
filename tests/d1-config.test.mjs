import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {DatabaseSync} from 'node:sqlite';
import {cloudflareSettings} from '../scripts/cloudflare-settings.mjs';
import {planMigrations} from '../scripts/d1-plan.mjs';
const files=[];for(const name of (await readdir(new URL('../drizzle/',import.meta.url))).filter(n=>n.endsWith('.sql')).sort())files.push({name,sql:await readFile(new URL('../drizzle/'+name,import.meta.url),'utf8')});
function schema(db){return Object.fromEntries(db.prepare("SELECT name FROM sqlite_schema WHERE type='table'").all().map(({name})=>[name,Object.fromEntries(db.prepare(`PRAGMA table_info('${name}')`).all().map(c=>[c.name,c.type.toUpperCase()]))]));}
test('ID real vem da origem sem depender do arquivo gerado',()=>assert.equal(cloudflareSettings({}).databaseId,'b0fa8f72-758f-415d-8c46-63e93cb122b2'));
test('deploy aponta para o Worker publicado pelo proprietário',()=>assert.equal(cloudflareSettings({}).workerName,'snzdev'));
test('override provisório antigo é recusado',()=>assert.throws(()=>cloudflareSettings({CLOUDFLARE_D1_DATABASE_ID:'00000000-0000-4000-8000-000000000000'})));
test('migrações completas criam banco vazio e segunda execução não repete DDL',()=>{const db=new DatabaseSync(':memory:');const plan=planMigrations(files);for(const item of plan)db.exec(item.sql);assert.equal(Object.keys(schema(db)).length,5);assert.equal(planMigrations(files,schema(db)).length,0);db.close();});
test('schema parcial é atualizado preservando projetos e contatos',()=>{const db=new DatabaseSync(':memory:');for(const item of planMigrations(files.slice(0,1)))db.exec(item.sql);db.exec("INSERT INTO projects(id,name,category,description,image) VALUES('preserve','Projeto real','Site','Conteúdo original','/original.webp');INSERT INTO settings(id,phone) VALUES(1,'5514991431632')");for(const item of planMigrations(files,schema(db)))db.exec(item.sql);assert.equal(db.prepare('SELECT name FROM projects').get().name,'Projeto real');assert.equal(db.prepare('SELECT phone FROM settings').get().phone,'5514991431632');db.close();});
test('comando destrutivo ou schema incompatível bloqueia o plano inteiro',()=>{assert.throws(()=>planMigrations([{name:'unsafe.sql',sql:'DROP TABLE projects;'}]));assert.throws(()=>planMigrations(files,{projects:{id:'INTEGER'}}));});
