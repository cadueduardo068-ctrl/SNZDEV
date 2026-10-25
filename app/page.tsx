import Portfolio from './portfolio';
import {getDb} from '../db';
import {projects,settings} from '../db/schema';
export const dynamic='force-dynamic';
export default async function Home(){const db=getDb();const items=await db.select().from(projects);const config=await db.select().from(settings);return <Portfolio projects={items} phone={config[0]?.phone||'5514991431632'} instagram={config[0]?.instagram||''}/>}
