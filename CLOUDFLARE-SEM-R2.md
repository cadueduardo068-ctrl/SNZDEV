# Publicar SNZ DEV na Cloudflare sem R2

## Diagnóstico

O projeto é **Vinext sobre Vite/React**, com rotas no formato App Router e runtime Cloudflare Workers. Não é um export estático nem um projeto com React Router. O comando existente gera `dist/client` e `dist/server`, não `.next/routes-manifest.json`.

Antes, `.openai/hosting.json` declarava `r2: "BUCKET"`. O `vite.config.ts` transformava isso em `r2_buckets`, e upload/leitura chamavam `env.BUCKET` incondicionalmente. Assim, a publicação exigia R2, mesmo usando imagens estáticas na vitrine. Isso é compatível com a falha de conta não habilitada para R2; a documentação exige a ativação do produto antes de usar seus buckets. Não foi possível inspecionar a assinatura da sua conta Cloudflare nem o log completo do erro 10042.

## Solução adotada

- R2 não é provisionado nem exigido: manifesto com `r2: null`, bundle com `r2_buckets: []`.
- Novos uploads continuam aceitando JPEG, PNG e WebP de até **5 MB**, com autorização, checagem de origem, assinatura de arquivo e rate limit.
- Os bytes são persistidos **no mesmo D1**, em blocos de 256 KiB. As tabelas novas são `media_files` e `media_chunks`. A gravação usa `batch()` transacional; a leitura usa stream para não carregar o arquivo inteiro na memória.
- `/api/upload` e `/api/images/:id` mantêm seus contratos. As demais rotas e o painel continuam existentes.
- A migração `drizzle/0003_faulty_vulcan.sql` apenas cria as tabelas de mídia; não altera nem remove projetos, contatos, imagens ou tabelas anteriores.
- Arquivos em `public/concepts` e `public/media`, incluindo a foto do hero, continuam servidos como assets.

Isso **não substitui nem migra o banco**. É uma extensão do D1 atual. Imagens passam a consumir a capacidade e as cotas de leitura/escrita do D1; é uma alternativa para um portfólio com volume moderado, não um substituto de object storage para uma biblioteca grande. D1 limita cada linha/BLOB a 2 MB, por isso os arquivos são fragmentados. No plano Free, o banco tem limite de 500 MB. Não aumentamos quotas nem ativamos produtos pagos.

## Preservar conteúdo antes de publicar

Use o **ID do D1 existente**, não crie outro banco vazio. Exporte um backup antes de aplicar a migração. As oito entradas consultadas no site atual usam `/concepts/*.webp`, não URLs de R2; seu conteúdo e visibilidade não foram alterados nesta tarefa.

Se o banco pertence à hospedagem gerenciada pelo Sites, ele pode estar em outra conta Cloudflare e não aparecer na sua conta pessoal. Um binding chamado `DB` não transfere seus dados entre contas. Nesse caso, exportação/importação do D1 é uma etapa manual a combinar antes do deploy independente. Não executamos essa transferência nem aplicamos migrações remotas.

Imagens antigas em R2 não são apagadas. A API preserva leitura opcional por `BUCKET` quando esse binding já existir. Para um destino sem R2, pode-se configurar `LEGACY_MEDIA_ORIGIN` com a origem anterior que ainda serve `/api/images/:id`. Se for um Site privado, `LEGACY_MEDIA_TOKEN` deve ser um segredo do servidor autorizado para essa origem. O proxy não segue redirecionamentos nem repassa tokens ao navegador. Essa compatibilidade depende de a origem anterior continuar ativa. Para independência completa, exporte os arquivos legados e importe seus bytes no D1 preservando os UUIDs antes de desligar a origem. Nenhum arquivo legado foi movido automaticamente.

## Configuração manual necessária

No ambiente de build, configure:

```text
CLOUDFLARE_D1_DATABASE_ID=b0fa8f72-758f-415d-8c46-63e93cb122b2
CLOUDFLARE_D1_DATABASE_NAME=nome-do-banco
CLOUDFLARE_WORKER_NAME=snz-dev
```

O arquivo de exemplo `.env.example` documenta nomes; os scripts não carregam `.env` automaticamente. Configure as variáveis no painel de build ou na sessão do terminal. Não use variáveis `VITE_*` para segredos.

Execute:

```sh
npm ci
npm run typecheck
npm test
npm run build:cloudflare
npm run deploy:check
```

O ID real já está versionado em `cloudflare.config.json` e é usado pelo Vite e pelo pós-build. A variável de ambiente é apenas um override opcional; remova valores provisórios antigos. `deploy:check` executa somente `wrangler deploy --dry-run`: não publica, não cria buckets e não comprova credenciais remotas.

Para consultar e aplicar somente o schema pendente com backup obrigatório, siga [D1-CONFIGURACAO.md](./D1-CONFIGURACAO.md). Os comandos são:

```sh
npm run db:plan:remote
npm run db:migrate:remote
```

Depois:

```sh
npm run deploy:cloudflare
```

Em Workers Builds: comando de build `npm run build:cloudflare`; comando de deploy `npm run deploy:cloudflare`. O script ajusta o **Wrangler gerado** em `dist/server/wrangler.json`, mantém o entrypoint Worker e os assets e adiciona `DEPLOYMENT_TARGET=cloudflare`. Não edite esse arquivo gerado à mão; ele é recriado nos builds. Não use preset Next.js, Vercel ou diretório `.next` nesse destino.

## Login do painel fora do Sites

No Sites, o login ChatGPT é fornecido pela plataforma. Uma publicação independente não tem essa infraestrutura; confiar diretamente em cabeçalhos `oai-authenticated-user-*` enviados pelo visitante permitiria falsificação de identidade.

Para manter a administração segura, o destino independente usa **Cloudflare Access**. Configure uma aplicação Access no seu domínio protegendo `/admin`, `/admin/*`, `/api/admin`, `/api/admin/*`, `/api/upload` e `/api/upload/*`, com política que permita o e-mail do proprietário. Use o mesmo aplicativo/audience nessas rotas. Os assets e as páginas públicas não precisam dessa política.

Nos **segredos de runtime do Worker**, configure:

```text
ADMIN_EMAIL=cadueduardo068@gmail.com
ACCESS_TEAM_DOMAIN=sua-equipe.cloudflareaccess.com
ACCESS_AUD=audience-do-aplicativo
```

O Worker remove cabeçalhos de identidade fornecidos pelo visitante e verifica assinatura RS256, emissor, audience e expiração do JWT Access antes de autorizar as rotas. Sem Access configurado, as APIs administrativas permanecem bloqueadas. A conta autenticada ainda precisa corresponder a `ADMIN_EMAIL`. O modo Sites mantém a autenticação existente; o script de deploy independente ativa o modo Cloudflare.

Essa configuração manual e um teste de login no domínio real são necessários antes de considerar o painel disponível na hospedagem independente. Não testamos um login real no seu Zero Trust nem publicamos na sua conta.

## Testes

- `npm test`: 12 testes de armazenamento, limites, stream e autenticação JWT.
- `npm run typecheck`: verificação TypeScript.
- `npm run build:cloudflare`: produção, com todas as rotas dinâmicas e APIs.
- `npm run deploy:check`: pacote Wrangler aceito em dry-run, apenas DB e variável de destino, sem R2.
- Com um banco **local isolado** e `ADMIN_EMAIL=seedy@sites.test` em `.dev.vars`: `pwsh -File tests/cloudflare-integration.ps1` executa 63 verificações de painel e APIs.
- `node tests/image-http.mjs`: upload real de 5 MB no D1 local, download byte a byte com SHA-256 idêntico, MIME, HEAD, ETag/304, 404 e limites com/sem Content-Length.

Os testes de integração se recusam a executar em domínio remoto. Não usam credenciais Cloudflare nem substituem a validação final da conta, Access e D1 de produção.

## GitHub

As alterações estão preparadas na branch `fix/cloudflare-sem-r2`. A CI executa tipos, testes e build sem R2. Não faz deploy automático nem aplica migrações. Os arquivos `.dev.vars`, `.env`, dados locais e segredos não entram no commit. O repositório remoto identificado é `cadueduardo068-ctrl/SNZDEV`; não fizemos push.

## Fontes oficiais

- [Pré-requisitos do R2](https://developers.cloudflare.com/r2/get-started/)
- [Limites do D1](https://developers.cloudflare.com/d1/platform/limits/)
- [Transações batch do D1](https://developers.cloudflare.com/d1/worker-api/d1-database/)
- [Validar JWTs do Cloudflare Access](https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/validating-json/)
