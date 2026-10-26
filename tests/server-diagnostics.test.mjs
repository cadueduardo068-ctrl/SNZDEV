import {test} from 'node:test';
import assert from 'node:assert/strict';
import {databaseFailure,databaseOperation} from '../lib/server-diagnostics.mts';
test('D1 nested causes distinguish missing schema from binding and unknown errors',()=>{
 assert.equal(databaseFailure(new Error('Failed query',{cause:new Error('D1_ERROR: no such table: projects')})),'D1_TABLE_MISSING');
 assert.equal(databaseFailure(new Error('no such column: palette')),'D1_COLUMN_MISSING');
 assert.equal(databaseFailure(new Error('Cloudflare D1 binding `DB` is unavailable')),'D1_BINDING_MISSING');
 const circular=new Error('secret');circular.cause=circular;
 assert.equal(databaseFailure(circular),'D1_QUERY_FAILED');
});
test('diagnostics rethrow original failure without logging sensitive messages',async()=>{
 const original=console.error,logs=[];console.error=(...args)=>logs.push(args.join(' '));
 const failure=new Error('secret SQL email token',{cause:new Error('no such table: projects')});
 try {await assert.rejects(databaseOperation('home.projects',()=>{throw failure}),e=>e===failure);}
 finally {console.error=original;}
 assert.match(logs[0],/D1_TABLE_MISSING/);assert.doesNotMatch(logs[0],/secret|SQL|email|token/);
 assert.equal(await databaseOperation('home.settings',async()=>42),42);
});
