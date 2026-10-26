// Only additive CREATE TABLE and ADD COLUMN statements are accepted.
export function planMigrations(files, existing={}){
  const schema=structuredClone(existing),plan=[];
  for(const file of files)for(const part of file.sql.split('--> statement-breakpoint')){
    const sql=part.trim();if(!sql)continue;
    const create=sql.match(/^CREATE TABLE `([a-z_]+)` \([\s\S]*\);$/i);
    if(create){
      const table=create[1];
      const columns=Object.fromEntries([...sql.matchAll(/^\s*`([a-z_]+)` (text|integer|blob)\b/gim)].map(m=>[m[1],m[2].toUpperCase()]));
      if(!Object.keys(columns).length)throw Error('CREATE TABLE não reconhecido: '+file.name);
      if(schema[table]){
        for(const [name,type]of Object.entries(columns))if(schema[table][name]!==type)throw Error(`Schema divergente em ${table}.${name}; revise manualmente antes de migrar.`);
      }else{schema[table]=columns;plan.push({file:file.name,sql});}
      continue;
    }
    const add=sql.match(/^ALTER TABLE `([a-z_]+)` ADD `([a-z_]+)` (text|integer|blob)(?: DEFAULT (?:'[^']*'|-?\d+|true|false))?(?: NOT NULL)?;$/i);
    if(add){
      const [,table,column,type]=add;
      if(!schema[table])throw Error('Tabela ausente: '+table);
      if(schema[table][column]){if(schema[table][column]!==type.toUpperCase())throw Error('Tipo divergente: '+table+'.'+column);}
      else{if(/NOT NULL/i.test(sql)&&!/DEFAULT/i.test(sql))throw Error('Coluna obrigatória sem default: '+column);schema[table][column]=type.toUpperCase();plan.push({file:file.name,sql});}
      continue;
    }
    throw Error('Migração não aditiva ou não reconhecida: '+file.name);
  }
  return plan;
}
