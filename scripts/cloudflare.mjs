import {readFile,writeFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {cloudflareSettings} from './cloudflare-settings.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
const configPath=new URL('../dist/server/wrangler.json',import.meta.url);
const mode=process.argv[2];
function run(args,env=process.env){const result=spawnSync(process.execPath,args,{cwd:root,stdio:'inherit',env});if(result.error)throw result.error;if(result.status!==0)process.exit(result.status??1)}
async function configure(){
  const config=JSON.parse(await readFile(configPath,'utf8'));
  const database=cloudflareSettings();
  const name=database.workerName;
  config.name=name;config.topLevelName=name;
  config.r2_buckets=[];
  config.vars={...config.vars,DEPLOYMENT_TARGET:'cloudflare'};
  config.d1_databases=[{binding:database.binding,database_name:database.databaseName,database_id:database.databaseId,migrations_dir:'../../'+database.migrationsDirectory}];
  config.assets={...config.assets,run_worker_first:['/admin*','/api/*','/signin-with-chatgpt','/signout-with-chatgpt']};
  await writeFile(configPath,JSON.stringify(config,null,2)+'\n');
}
try{
  if(mode==='build'){
    run(['scripts/run-framework.mjs','build'],{...process.env,SNZ_DEPLOYMENT_TARGET:'cloudflare'});
    await configure();
  }else if(mode==='dry-run'||mode==='deploy'){
    await configure();
    run(['--import','./scripts/sites-env.mjs','./node_modules/wrangler/bin/wrangler.js','deploy','--config','dist/server/wrangler.json',...(mode==='dry-run'?['--dry-run']:[])]);
  }else throw Error('Use build, dry-run ou deploy.');
}catch(error){console.error(error.message);process.exitCode=1}
