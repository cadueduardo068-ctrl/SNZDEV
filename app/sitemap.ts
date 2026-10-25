import {getDb} from '../db';
import {projects} from '../db/schema';
import {eq} from 'drizzle-orm';
export default async function sitemap(){const base='https://snz-dev.bloomygenet3.chatgpt.site';const rows=await getDb().select().from(projects).where(eq(projects.visible,true));return [{url:base},...rows.map(p=>({url:base+'/projetos/'+p.id}))]}
