type AccessConfig = {teamDomain:string; audience:string};
type AccessClaims = {sub:string; email:string; iss:string; aud:string|string[]; exp:number; nbf?:number; iat?:number};
type SigningKey = JsonWebKey & {kid?:string};
let cached:{url:string;expires:number;keys:SigningKey[]}|undefined;
const decode = (value:string) => Uint8Array.from(atob(value.replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0));

export async function verifyAccessJwt(token:string, config:AccessConfig, fetcher:typeof fetch=fetch):Promise<AccessClaims> {
  if (!/^[a-z0-9-]+\.cloudflareaccess\.com$/.test(config.teamDomain) || !config.audience) throw Error('Access não configurado');
  if (!token || token.length > 20000) throw Error('Token inválido');
  const parts=token.split('.');
  if (parts.length!==3) throw Error('Token inválido');
  const header=JSON.parse(new TextDecoder().decode(decode(parts[0])));
  const claims=JSON.parse(new TextDecoder().decode(decode(parts[1]))) as AccessClaims;
  const issuer='https://'+config.teamDomain;
  const now=Date.now()/1000;
  const audience=Array.isArray(claims.aud)?claims.aud:[claims.aud];
  if(header.alg!=='RS256'||typeof header.kid!=='string'||claims.iss!==issuer||!audience.includes(config.audience)
    ||!Number.isFinite(claims.exp)||claims.exp<=now||claims.nbf!==undefined&&claims.nbf>now+30
    ||claims.iat!==undefined&&claims.iat>now+30||typeof claims.email!=='string'||!claims.email.includes('@')||typeof claims.sub!=='string'||!claims.sub) throw Error('Token inválido');
  const url=issuer+'/cdn-cgi/access/certs';
  async function getKeys(force=false) {
    if(!force&&cached?.url===url&&cached.expires>Date.now())return cached.keys;
    const response=await fetcher(url,{redirect:'error',signal:AbortSignal.timeout(5000)});
    if(!response.ok)throw Error('Certificados Access indisponíveis');
    const data=await response.json() as {keys?:SigningKey[]};
    if(!Array.isArray(data.keys))throw Error('Certificados Access inválidos');
    cached={url,expires:Date.now()+300000,keys:data.keys};return data.keys;
  }
  let keys=await getKeys();let jwk=keys.find(k=>k.kid===header.kid&&k.kty==='RSA');
  if(!jwk){keys=await getKeys(true);jwk=keys.find(k=>k.kid===header.kid&&k.kty==='RSA')}
  if(!jwk)throw Error('Chave Access não encontrada');
  const key=await crypto.subtle.importKey('jwk',jwk,{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['verify']);
  const valid=await crypto.subtle.verify('RSASSA-PKCS1-v1_5',key,decode(parts[2]),new TextEncoder().encode(parts[0]+'.'+parts[1]));
  if(!valid)throw Error('Assinatura Access inválida');
  return claims;
}

export async function standaloneIdentity(request:Request, env:{ACCESS_TEAM_DOMAIN?:string;ACCESS_AUD?:string}) {
  const headers=new Headers(request.headers);
  for(const name of [...headers.keys()])if(name.startsWith('oai-authenticated-user-'))headers.delete(name);
  const path=new URL(request.url).pathname;
  const protectedPath=/^\/admin(?:\/|$)/.test(path)||/^\/api\/(?:admin|upload)(?:\/|$)/.test(path);
  const token=headers.get('cf-access-jwt-assertion');
  if(token){
    try {
      const claims=await verifyAccessJwt(token,{teamDomain:env.ACCESS_TEAM_DOMAIN||'',audience:env.ACCESS_AUD||''});
      headers.set('oai-authenticated-user-id',claims.sub);
      headers.set('oai-authenticated-user-email',claims.email);
    } catch {if(protectedPath)return new Response('Acesso não autorizado',{status:403,headers:{'Cache-Control':'no-store'}});}
  }else if(protectedPath)return new Response('Autenticação Cloudflare Access necessária',{status:401,headers:{'Cache-Control':'no-store'}});
  if(path==='/signin-with-chatgpt')return Response.redirect(new URL('/admin',request.url).href,302);
  if(path==='/signout-with-chatgpt')return Response.redirect(new URL('/cdn-cgi/access/logout',request.url).href,302);
  return new Request(request,{headers});
}
