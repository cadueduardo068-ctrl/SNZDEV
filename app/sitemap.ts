import {getDb} from '../db';
import {projects} from '../db/schema';
export default async function sitemap(){const base='https://snz-dev.bloomygenet3.chatgpt.site';const rows=await getDb().select().from(projects);return [{url:base},...rows.map(p=>({url:base+'/projetos/'+p.id}))]}
