import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {validateImage,readImageBody,saveImage,imageStream,MAX_IMAGE_BYTES,IMAGE_CHUNK_BYTES} from '../lib/image-store.ts';
const png=new Uint8Array(await readFile(new URL('../public/og.png',import.meta.url)));
test('PNG existente válido e MIME forjado recusado',()=>{
  assert.doesNotThrow(()=>validateImage(png,'image/png'));
  assert.throws(()=>validateImage(png,'image/jpeg'));
  assert.throws(()=>validateImage(new Uint8Array([137,80,78,71]),'image/png'));
  assert.throws(()=>validateImage(png,'image/svg+xml'));
});
test('limite de 5 MB preservado e excesso rejeitado',()=>{
  const large=new Uint8Array(MAX_IMAGE_BYTES);large.set(png);
  assert.doesNotThrow(()=>validateImage(large,'image/png'));
  assert.throws(()=>validateImage(new Uint8Array(MAX_IMAGE_BYTES+1),'image/png'));
});
test('corpo sem Content-Length não ultrapassa o limite',async()=>{
  let cancelled=false;
  const body=new ReadableStream({start(c){c.enqueue(new Uint8Array(MAX_IMAGE_BYTES));c.enqueue(new Uint8Array(1))},cancel(){cancelled=true}});
  await assert.rejects(readImageBody(new Request('https://test/upload',{method:'POST',body,duplex:'half'})),e=>e.status===413);
  assert.equal(cancelled,true);
});
test('upload máximo dividido em blocos menores que limite de linha do D1',async()=>{
  let batch;
  const db={prepare(sql){return {bind(...values){return {sql,values}}}},async batch(values){batch=values;return values.map(()=>({success:true}))}};
  const large=new Uint8Array(MAX_IMAGE_BYTES);large.set(png);
  await saveImage(db,'11111111-1111-4111-8111-111111111111',large,'image/png');
  assert.equal(batch.length,21);
  assert.equal(batch[0].values[2],MAX_IMAGE_BYTES);
  assert.ok(batch.slice(1).every(s=>s.values[2].byteLength<=IMAGE_CHUNK_BYTES));
});
test('stream reproduz bytes completos sem carregar a imagem toda de uma vez',async()=>{
  const source=new Uint8Array(IMAGE_CHUNK_BYTES*2+15);source.set(png);source[source.length-1]=97;
  let queries=0;
  const db={prepare(){return {bind(id,index){return {async first(){queries++;return {data:[...source.slice(index*IMAGE_CHUNK_BYTES,(index+1)*IMAGE_CHUNK_BYTES)]}}}}}}};
  const stream=imageStream(db,{id:'sample',byte_size:source.length,chunk_count:3});
  const result=new Uint8Array(await new Response(stream).arrayBuffer());
  assert.deepEqual(result,source);assert.equal(queries,3);
});
test('stream corrompido falha em vez de servir imagem truncada',async()=>{
  const db={prepare(){return {bind(){return {async first(){return null}}}}}};
  await assert.rejects(new Response(imageStream(db,{id:'missing',byte_size:10,chunk_count:1})).arrayBuffer());
});
