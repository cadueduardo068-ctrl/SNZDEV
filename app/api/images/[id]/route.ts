import {env} from 'cloudflare:workers';
import {findImage, imageStream, IMAGE_ID, IMAGE_TYPES} from '../../../../lib/image-store';

const headersFor = (type:string, id:string) => ({
  'Content-Type':type, 'X-Content-Type-Options':'nosniff',
  'Cache-Control':'public, max-age=31536000, immutable', ETag:'"'+id+'"',
});
async function serve(request:Request, {params}:{params:Promise<{id:string}>}) {
  const {id} = await params;
  if (!IMAGE_ID.test(id)) return new Response('Não encontrado', {status:404});
  if (!env.DB) return new Response('Armazenamento indisponível', {status:503});
  try {
    const file = await findImage(env.DB,id);
    if (file) {
      const headers = headersFor(file.content_type,id);
      if (request.headers.get('if-none-match') === headers.ETag) return new Response(null,{status:304,headers});
      return new Response(request.method === 'HEAD' ? null : imageStream(env.DB,file),{
        headers:{...headers,'Content-Length':String(file.byte_size)},
      });
    }
    // Optional read-only compatibility; new uploads never require R2.
    if (env.BUCKET) {
      const legacy = await env.BUCKET.get(id);
      if (legacy) return new Response(request.method === 'HEAD' ? null : legacy.body,{
        headers:headersFor(legacy.httpMetadata?.contentType || 'application/octet-stream',id),
      });
    }
    if (env.LEGACY_MEDIA_ORIGIN) {
      const origin = new URL(env.LEGACY_MEDIA_ORIGIN);
      if (origin.protocol !== 'https:' || origin.origin === new URL(request.url).origin || origin.username || origin.password) throw Error('Origem legada inválida');
      const auth:Record<string,string> = {};
      if (env.LEGACY_MEDIA_TOKEN) auth['OAI-Sites-Authorization'] = 'Bearer '+env.LEGACY_MEDIA_TOKEN;
      const response = await fetch(new URL('/api/images/'+id,origin),{
        method:request.method,headers:auth,redirect:'error',signal:AbortSignal.timeout(8000),
      });
      if (response.status === 404) return new Response('Não encontrado',{status:404});
      const type = response.headers.get('content-type')?.split(';')[0] || '';
      if (!response.ok || !IMAGE_TYPES.has(type)) throw Error('Origem legada indisponível');
      return new Response(request.method === 'HEAD' ? null : response.body,{headers:headersFor(type,id)});
    }
    return new Response('Não encontrado',{status:404});
  } catch {
    console.error('Falha ao recuperar imagem persistida.');
    return new Response('Armazenamento temporariamente indisponível',{status:503});
  }
}
export const GET = serve;
export const HEAD = serve;
