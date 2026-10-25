import Portfolio from './portfolio';
import {getDb} from '../db';
import {projects,settings} from '../db/schema';
import {eq} from 'drizzle-orm';
export const dynamic='force-dynamic';
export default async function Home(){const db=getDb();const items=await db.select().from(projects).where(eq(projects.visible,true));items.sort((a,b)=>Number(b.featured)-Number(a.featured)||a.position-b.position);const config=await db.select().from(settings);return <Portfolio projects={items} phone={config[0]?.phone||'5514991431632'} instagram={config[0]?.instagram||''}/>}
