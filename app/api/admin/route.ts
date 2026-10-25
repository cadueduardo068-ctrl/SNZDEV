import {rateLimit} from '../../../lib/rate-limit';
import {env} from 'cloudflare:workers';
import {getChatGPTUser} from '../../chatgpt-auth';
import {getDb} from '../../../db';
import {projects,settings,limits} from '../../../db/schema';
import {eq} from 'drizzle-orm';
import {z} from 'zod';
const safeUrl=z.string().max(2000).refine(s=>!s||/^https:\/\//.test(s)||/^\/api\/images\/[a-f0-9-]+$/.test(s));
const schema=z.object({id:z.string().min(1).max(80),name:z.string().min(1).max(150),category:z.enum(['Sites institucionais','Landing pages','Lojas e catálogos','Projetos personalizados']),description:z.string().min(1).max(6000),image:safeUrl,url:safeUrl,tech:z.string().max(500),demo:z.boolean(),featured:z.boolean(),position:z.number().int().min(0).max(9999)});
export async function authorized(){const user=await getChatGPTUser();const email=(env as unknown as Record<string,string>).ADMIN_EMAIL;return !!user&&!!email&&user.email.toLowerCase()===email.toLowerCase()}
export async function GET(){if(!await authorized())return Response.json({error:'Acesso restrito. Configure ADMIN_EMAIL no servidor.'},{status:403});const db=getDb();return Response.json({projects:await db.select().from(projects),settings:(await db.select().from(settings))[0]||{phone:'5514991431632',instagram:''}})}
export async function POST(req:Request){if(!await authorized())return Response.json({error:'Não autorizado'},{status:403});if(req.headers.get('origin')!==new URL(req.url).origin)return Response.json({error:'Origem inválida'},{status:403});const db=getDb();if(!await rateLimit('admin'))return Response.json({error:'Aguarde um minuto.'},{status:429});
if(Number(req.headers.get('content-length'))>100000)return Response.json({error:'Dados muito grandes'},{status:413});try{const body=z.object({action:z.string(),id:z.string().optional(),data:z.unknown()}).parse(await req.json());if(body.action==='delete'){await db.delete(projects).where(eq(projects.id,z.string().max(80).parse(body.id)));}else if(body.action==='settings'){const s=z.object({phone:z.string().regex(/^\d{10,15}$/),instagram:safeUrl}).parse(body.data);await db.insert(settings).values({id:1,...s}).onConflictDoUpdate({target:settings.id,set:s});}else{const p=schema.parse(body.data);await db.insert(projects).values(p).onConflictDoUpdate({target:projects.id,set:p});}return Response.json({ok:true});}catch{return Response.json({error:'Dados inválidos. Revise os campos.'},{status:400})}}
