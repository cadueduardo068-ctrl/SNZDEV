import {env} from 'cloudflare:workers';
import {authorized} from '../admin/route';
import {rateLimit} from '../../../lib/rate-limit';
import {IMAGE_TYPES, ImageInputError, readImageBody, saveImage} from '../../../lib/image-store';

export async function POST(request: Request) {
  if (!await authorized() || request.headers.get('origin') !== new URL(request.url).origin) {
    return Response.json({error:'Não autorizado'}, {status:403});
  }
  if (!env.DB) return Response.json({error:'Armazenamento indisponível.'}, {status:503});
  const type = request.headers.get('content-type') || '';
  if (!IMAGE_TYPES.has(type)) return Response.json({error:'Use JPEG, PNG ou WebP.'}, {status:400});
  try {
    if (!await rateLimit('upload',20)) return Response.json({error:'Aguarde um minuto.'}, {status:429});
    const bytes = await readImageBody(request);
    const id = crypto.randomUUID();
    await saveImage(env.DB, id, bytes, type);
    return Response.json({url:'/api/images/'+id}, {headers:{'Cache-Control':'no-store'}});
  } catch (error) {
    if (error instanceof ImageInputError) return Response.json({error:error.message}, {status:error.status});
    console.error('Falha ao persistir imagem no D1.');
    return Response.json({error:'Não foi possível salvar a imagem. Verifique a configuração e as migrações do D1.'}, {status:503});
  }
}
