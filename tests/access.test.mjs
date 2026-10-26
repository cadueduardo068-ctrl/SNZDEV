import {test} from 'node:test';
import assert from 'node:assert/strict';
import {verifyAccessJwt,standaloneIdentity} from '../lib/access-auth.mts';
const keys=await crypto.subtle.generateKey({name:'RSASSA-PKCS1-v1_5',modulusLength:2048,publicExponent:new Uint8Array([1,0,1]),hash:'SHA-256'},true,['sign','verify']);
const jwk=await crypto.subtle.exportKey('jwk',keys.publicKey);jwk.kid='test-key';
const config={teamDomain:'snz-test.cloudflareaccess.com',audience:'snz-admin'};
const fetcher=async()=>Response.json({keys:[jwk]});
const encode=value=>Buffer.from(typeof value==='string'?value:JSON.stringify(value)).toString('base64url');
async function token(overrides={}){const head=encode({alg:'RS256',kid:jwk.kid}),body=encode({sub:'cadu',email:'cadueduardo068@gmail.com',iss:'https://'+config.teamDomain,aud:[config.audience],exp:Date.now()/1000+3600,...overrides});const signature=await crypto.subtle.sign('RSASSA-PKCS1-v1_5',keys.privateKey,new TextEncoder().encode(head+'.'+body));return head+'.'+body+'.'+Buffer.from(signature).toString('base64url')}
test('JWT Access com assinatura e audiência válidas',async()=>assert.equal((await verifyAccessJwt(await token(),config,fetcher)).sub,'cadu'));
test('expiração, issuer e audiência errados são recusados',async()=>{
  for(const overrides of [{exp:0},{iss:'https://evil.example'},{aud:['another-app']}])await assert.rejects(verifyAccessJwt(await token(overrides),config,fetcher));
});
test('assinatura alterada recusada',async()=>{
  const parts=(await token()).split('.');parts[1]=encode({sub:'attacker',email:'cadueduardo068@gmail.com',iss:'https://'+config.teamDomain,aud:[config.audience],exp:Date.now()/1000+3600});
  await assert.rejects(verifyAccessJwt(parts.join('.'),config,fetcher));
});
test('cabeçalhos de identidade falsos não liberam rotas protegidas',async()=>{
  for(const path of ['/admin','/api/admin','/api/upload']){const response=await standaloneIdentity(new Request('https://snz.example'+path,{headers:{'oai-authenticated-user-email':'cadueduardo068@gmail.com','oai-authenticated-user-id':'attacker'}}),{});assert.equal(response.status,401)}
});
test('cabeçalhos falsos são removidos também de páginas públicas',async()=>{
  const request=await standaloneIdentity(new Request('https://snz.example/',{headers:{'oai-authenticated-user-email':'attacker'}}),{});
  assert.equal(request.headers.get('oai-authenticated-user-email'),null);
});
test('JWT verificado substitui identidade falsa e preserva corpo POST',async()=>{
  await verifyAccessJwt(await token(),config,fetcher);
  const request=await standaloneIdentity(new Request('https://snz.example/api/upload',{
    method:'POST',body:'image-bytes',headers:{'cf-access-jwt-assertion':await token(),'oai-authenticated-user-email':'attacker'},
  }),{ACCESS_TEAM_DOMAIN:config.teamDomain,ACCESS_AUD:config.audience});
  assert.equal(request.headers.get('oai-authenticated-user-email'),'cadueduardo068@gmail.com');
  assert.equal(await request.text(),'image-bytes');
});
