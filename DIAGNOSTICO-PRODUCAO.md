# Renderização na Cloudflare

Destino confirmado pelo proprietário: https://snzdev.cadueduardo068.workers.dev/.
O nome de origem foi corrigido de `snz-dev` para `snzdev`; o nome do banco permanece independente do nome do Worker.

## Evidências e limites

A resposta pública apresentou HTTP 200 com erro RSC serializado (digest `2111554662`). HTTP 200 não valida a renderização. O mesmo tipo de falha é reproduzível com o bundle de produção e D1 local sem tabelas. Isso não prova que o banco remoto esteja vazio: a inspeção remota exige autenticação e não foi possível neste ambiente sem CLOUDFLARE_API_TOKEN.

O layout não consulta D1 nem depende de segredos. A home consulta `projects` (incluindo colunas das migrações 0001 e 0002) e `settings`. As páginas de projeto também dependem dessas tabelas. Uploads dependem de `media_files` e `media_chunks`; limitação de requisições usa `rate_limits`. Access é necessário para o painel, não para a home pública. Não foi encontrada evidência suficiente para atribuir o erro a incompatibilidade de Vinext.

As consultas da home agora registram no servidor `[snz:database]`, operação, incidente e categoria: `D1_TABLE_MISSING`, `D1_COLUMN_MISSING`, `D1_BINDING_MISSING` ou `D1_QUERY_FAILED`. A exceção original é relançada; não há dados substitutos, fallback de banco ou supressão do erro. Mensagens arbitrárias e parâmetros SQL não são registrados.

## Procedimento no ambiente do proprietário

1. Autentique o Wrangler com `npx wrangler login` em terminal interativo, ou configure CLOUDFLARE_API_TOKEN no ambiente privado. Não versione o token.
2. Execute `npm ci` e `npm run build:cloudflare`.
3. Execute `npm run db:plan:remote`. Confirme o ID `b0fa8f72-758f-415d-8c46-63e93cb122b2` e revise `work/d1-pending.sql`.
4. Se houver instruções pendentes, execute `npm run db:migrate:remote`. O script exporta um backup antes de aplicar apenas CREATE TABLE e ADD COLUMN compatíveis; se o backup falhar, interrompe. Não apaga nem recria tabelas. Se houver schema incompatível, pare e revise; não force migrações.
5. Execute `npm run deploy:cloudflare`. Agora esse comando verifica o schema remoto antes de publicar. Um deploy configurado diretamente como `wrangler deploy` no painel ignora essa proteção; use o script do projeto.
6. No painel Cloudflare, Workers & Pages → `snzdev` → Settings → Bindings, confirme D1 `DB` ligado ao ID acima. Settings → Variables and Secrets: `DEPLOYMENT_TARGET=cloudflare`, `ADMIN_EMAIL` com o e-mail autorizado, `ACCESS_TEAM_DOMAIN` e `ACCESS_AUD` da aplicação Cloudflare Access. Preserve segredos já existentes. Proteja `/admin*`, `/api/admin*` e `/api/upload*` no Access. R2 não é obrigatório.
7. Abra `npx wrangler tail snzdev --format pretty` e recarregue a URL publicada. Procure o evento `[snz:database]`. Para `D1_QUERY_FAILED`, investigue o erro no ambiente autenticado antes de alterar o banco; a categoria genérica não determina uma causa.
8. Valide no navegador a home com projetos reais, detalhes de projeto, login/admin, leitura de imagens e upload de uma imagem de teste. Confirme ausência de erros RSC e dos novos logs de falha. Não considere resolvido somente pelo HTTP 200 ou pelo build.

Migrar schema não transfere projetos ou imagens de outro banco/conta. Se o D1 correto estiver vazio, será necessário importar um backup da origem preservando IDs e mídias; não foi executada importação automática nem substituição de dados.

## Validação local executada

Bundle de produção executado pelo Wrangler com persistência isolada em `work/rsc-diagnostic-state`: antes das migrações, home HTTP 200 com erro RSC e diagnóstico `home.projects / D1_TABLE_MISSING`. Depois das 14 instruções das migrações originais: home HTTP 200, hero presente e sem digest de erro. `/admin` e `/api/admin` retornaram 401 sem identidade Access, `/api/images/inexistente` e `/projetos/inexistente` retornaram 404. Isso valida o cenário de schema ausente localmente, não o schema remoto, login real do administrador ou conteúdo do banco remoto.
