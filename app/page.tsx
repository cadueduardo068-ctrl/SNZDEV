import Portfolio from './portfolio';
import {getDb} from '../db';
import {projects,settings} from '../db/schema';
import {eq} from 'drizzle-orm';
import {databaseOperation} from '../lib/server-diagnostics.mts';
export const dynamic='force-dynamic';
export default async function Home(){const items=await databaseOperation('home.projects',()=>getDb().select().from(projects).where(eq(projects.visible,true)));items.sort((a,b)=>Number(b.featured)-Number(a.featured)||a.position-b.position);const config=await databaseOperation('home.settings',()=>getDb().select().from(settings));return <Portfolio projects={items} phone={config[0]?.phone||'5514991431632'} instagram={config[0]?.instagram||''}/>}
