import {readFile,readdir,writeFile,mkdir} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {cloudflareSettings} from './cloudflare-settings.mjs';
import {planMigrations} from './d1-plan.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
const mode=process.argv[2]||'plan';
function wrangler(args,json=false){
  const r=spawnSync(process.execPath,['--import','./scripts/sites-env.mjs','./node_modules/wrangler/bin/wrangler.js',...args],{cwd:root,encoding:'utf8',maxBuffer:32*1024*1024,stdio:json?'pipe':'inherit'});
  if(r.error)throw r.error;
  if(r.status!==0){
    if(json&&r.stderr)console.error(r.stderr);
    if(json&&r.stdout){try{const message=JSON.parse(r.stdout).error?.text;if(message)console.error(message);}catch{}}
    throw Error('Wrangler falhou; nenhuma próxima etapa será executada.');
  }
  return json?JSON.parse(r.stdout):undefined;
}
try{
  if(!['plan','apply'].includes(mode))throw Error('Use plan ou apply.');
  const target=cloudflareSettings();
  const config=JSON.parse(await readFile(new URL('../dist/server/wrangler.json',import.meta.url),'utf8'));
  if(config.d1_databases?.find(d=>d.binding===target.binding)?.database_id!==target.databaseId)throw Error('Execute npm run build:cloudflare para regenerar o binding correto antes de consultar o banco.');
  const common=['--remote','--config','dist/server/wrangler.json'];
  const query=sql=>wrangler(['d1','execute',target.binding,...common,'--json','--command',sql],true).flatMap(r=>r.results||[]);
  const names=query("SELECT name FROM sqlite_schema WHERE type='table' AND name IN ('projects','settings','rate_limits','media_files','media_chunks')");
  const schema={};for(const {name}of names)schema[name]=Object.fromEntries(query(`PRAGMA table_info('${name}')`).map(c=>[c.name,c.type.toUpperCase()]));
  const files=[];for(const name of (await readdir(new URL('../drizzle/',import.meta.url))).filter(n=>/^\d+.*\.sql$/.test(n)).sort())files.push({name,sql:await readFile(new URL('../drizzle/'+name,import.meta.url),'utf8')});
  const plan=planMigrations(files,schema);
  await mkdir(new URL('../work/',import.meta.url),{recursive:true});
  const planFile='work/d1-pending.sql';
  await writeFile(new URL('../'+planFile,import.meta.url),plan.map(s=>'-- '+s.file+'\n'+s.sql).join('\n\n')+'\n');
  console.log(`D1 ${target.databaseId}: ${plan.length} instruções aditivas pendentes. Plano: ${planFile}`);
  if(mode==='apply'&&plan.length){
    const backup='work/d1-backup-'+Date.now()+'.sql';
    wrangler(['d1','export',target.binding,...common,'--output',backup,'--skip-confirmation']);
    console.log('Backup concluído: '+backup);
    wrangler(['d1','execute',target.binding,...common,'--file',planFile,'--yes']);
  }
}catch(error){console.error(error.message);process.exitCode=1}
