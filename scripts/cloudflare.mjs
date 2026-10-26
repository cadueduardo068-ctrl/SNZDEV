import {readFile,writeFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const configPath=new URL('../dist/server/wrangler.json',import.meta.url);
const mode=process.argv[2];
const placeholder='00000000-0000-4000-8000-000000000000';
function run(args,env=process.env){const result=spawnSync(process.execPath,args,{cwd:root,stdio:'inherit',env});if(result.error)throw result.error;if(result.status!==0)process.exit(result.status??1)}
async function configure(requireRealDatabase=false){
  const config=JSON.parse(await readFile(configPath,'utf8'));
  const id=process.env.CLOUDFLARE_D1_DATABASE_ID||config.d1_databases?.[0]?.database_id||placeholder;
  if(!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(id)||requireRealDatabase&&id===placeholder)throw Error('Defina CLOUDFLARE_D1_DATABASE_ID com o ID do D1 existente. Nenhum banco será criado automaticamente.');
  const name=process.env.CLOUDFLARE_WORKER_NAME||'snz-dev';
  if(!/^[a-z0-9-]+$/.test(name))throw Error('CLOUDFLARE_WORKER_NAME inválido.');
  config.name=name;config.topLevelName=name;
  config.r2_buckets=[];
  config.vars={...config.vars,DEPLOYMENT_TARGET:'cloudflare'};
  config.d1_databases=[{binding:'DB',database_name:process.env.CLOUDFLARE_D1_DATABASE_NAME||'snz-dev',database_id:id}];
  config.assets={...config.assets,run_worker_first:['/admin*','/api/*','/signin-with-chatgpt','/signout-with-chatgpt']};
  await writeFile(configPath,JSON.stringify(config,null,2)+'\n');
  if(id===placeholder)console.warn('Build de validação: informe CLOUDFLARE_D1_DATABASE_ID antes do deploy.');
}
try{
  if(mode==='build'){
    run(['scripts/run-framework.mjs','build'],{...process.env,SNZ_DEPLOYMENT_TARGET:'cloudflare'});
    await configure();
  }else if(mode==='dry-run'||mode==='deploy'){
    await configure(mode==='deploy');
    run(['--import','./scripts/sites-env.mjs','./node_modules/wrangler/bin/wrangler.js','deploy','--config','dist/server/wrangler.json',...(mode==='dry-run'?['--dry-run']:[])]);
  }else throw Error('Use build, dry-run ou deploy.');
}catch(error){console.error(error.message);process.exitCode=1}
