# Binding D1 corrigido

O ID real `b0fa8f72-758f-415d-8c46-63e93cb122b2` está em `cloudflare.config.json`. Não é um segredo: é o identificador do banco criado pelo proprietário. Tanto `vite.config.ts` quanto o pós-build `scripts/cloudflare.mjs` leem essa origem por `scripts/cloudflare-settings.mjs`.

Isso corrige também builds que executam `npm run build` diretamente, além de `npm run build:cloudflare`. O arquivo `dist/server/wrangler.json` é regenerado com o mesmo ID; `.wrangler/deploy/config.json` aponta para ele. Os arquivos gerados continuam ignorados pelo Git. R2 permanece desativado.

Se houver uma variável antiga `CLOUDFLARE_D1_DATABASE_ID` no painel de build, remova-a ou atualize para o ID real. Overrides inválidos ou provisórios são recusados antes de gerar outro pacote incorreto. `CLOUDFLARE_D1_DATABASE_NAME` é opcional e pode refletir o nome escolhido no painel; o identificador real vem da configuração acima.

## Migrações sem apagar dados

Os arquivos originais de `drizzle` foram mantidos:

- `0000_absent_ricochet.sql`: tabelas de projetos, configurações e rate limit.
- `0001_late_maggott.sql`: campos adicionais dos projetos.
- `0002_spicy_prowler.sql`: direção de arte e paleta.
- `0003_faulty_vulcan.sql`: tabelas de mídia no D1.

O planejador compara essas instruções com as tabelas e colunas existentes. Em banco vazio, prepara todas; em banco parcialmente configurado, omite o que já existe. Divergências de tipo/estrutura conhecida, comandos destrutivos e instruções não reconhecidas bloqueiam a operação. Ele não apaga ou reinicializa tabelas, não modifica registros e não regrava o histórico de migrações do Drizzle/Wrangler. Use esse planejador para bases cujo histórico de execução não seja conhecido, em vez de reaplicar todos os arquivos à força.

Na sua máquina autenticada no Wrangler, ou no CI com um `CLOUDFLARE_API_TOKEN` de acesso ao D1 da conta:

```sh
npm ci
npm run build:cloudflare
npm run db:plan:remote
```

O último comando faz apenas leituras do schema e salva `work/d1-pending.sql` para revisão. Depois de revisar o plano, execute:

```sh
npm run db:migrate:remote
```

Esse comando reconsulta o schema, exige que `wrangler d1 export` produza um backup em `work/d1-backup-<timestamp>.sql` e somente então executa o plano aditivo. Se a consulta ou o backup falhar, não executa o SQL. Não execute mudanças concorrentes no schema enquanto aplica o plano. Os backups ficam ignorados pelo Git, pois podem conter dados privados.

Aplicar schema a um banco novo não transfere automaticamente os projetos da hospedagem anterior. Caso esse novo D1 substitua um banco em outra conta, restaure os dados por um procedimento separado e revisado; nenhum dado foi transferido ou substituído nesta correção.

Para publicar depois da migração:

```sh
npm run deploy:cloudflare
```

## Verificação desta entrega

Passaram 17 testes, TypeScript, build de produção e dry-run do Wrangler. O teste de migração em SQLite verificou banco vazio, reexecução sem DDL repetido e atualização de schema parcial preservando projeto e contato existentes.

A consulta remota foi tentada, mas o Wrangler informou ausência de `CLOUDFLARE_API_TOKEN` no ambiente não interativo. Nenhuma migração, backup ou escrita remota foi executada. A configuração de Cloudflare Access/segredos administrativos descrita em `CLOUDFLARE-SEM-R2.md` continua necessária para a hospedagem independente.
