import {readFileSync} from 'node:fs';
const source=JSON.parse(readFileSync(new URL('../cloudflare.config.json',import.meta.url),'utf8'));
export function cloudflareSettings(env=process.env){
  const id=env.CLOUDFLARE_D1_DATABASE_ID||source.d1.databaseId;
  if(!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(id)||/^0{8}-0{4}-4000-8000-0{12}$/.test(id))throw Error('CLOUDFLARE_D1_DATABASE_ID inválido ou provisório. Remova overrides antigos e use o ID real em cloudflare.config.json.');
  const name=env.CLOUDFLARE_WORKER_NAME||source.workerName;
  if(!/^[a-z0-9-]+$/.test(name))throw Error('CLOUDFLARE_WORKER_NAME inválido.');
  return {workerName:name,binding:source.d1.binding,databaseName:env.CLOUDFLARE_D1_DATABASE_NAME||source.d1.databaseName,databaseId:id,migrationsDirectory:source.d1.migrationsDirectory};
}
