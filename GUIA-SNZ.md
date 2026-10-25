# SNZ DEV

Site em React, TypeScript e Vinext, executado em Cloudflare Workers. D1 guarda projetos e contato; R2 guarda imagens. O hero usa o vídeo original fornecido, sem recriar a cena em código. Exemplos iniciais são demonstrações e somem quando o primeiro projeto é cadastrado.

## Administrar

Configure a variável de ambiente `ADMIN_EMAIL` com o e-mail da conta ChatGPT de Cadu. Acesse `/admin`, autentique-se com essa conta e cadastre projetos. Sem a variável, o painel recusa todo acesso. A autenticação é gerenciada pelo Sites e a autorização é conferida no servidor em cada operação. Não use o e-mail de exemplo em produção.

O formulário permite nome, descrição, categoria, tecnologias, ordem, destaque e identificação como demonstração. Informe uma imagem HTTPS ou envie JPEG, PNG ou WebP de até 5 MB. Imagens enviadas ficam no R2. O link do projeto é opcional. Salve e recarregue o site para ver a alteração. A exclusão remove o registro, mas preserva a imagem para evitar perda acidental de arquivos compartilhados.

O contato permite alterar WhatsApp e URL do Instagram. O formulário público apenas prepara a mensagem para o WhatsApp: o visitante revisa e envia. Nenhuma mensagem é enviada automaticamente.

## Desenvolvimento

1. `npm run install:ci`
2. `npm run db:generate` depois de alterar `db/schema.ts`.
3. `npm run build`
4. Aplique a migração local com `node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_*.sql` (substitua pelo nome exato).
5. `npm run dev`.

No preview local a autenticação simulada usa `seedy@sites.test`; configure esse e-mail somente no ambiente local se precisar testar a administração.

## Publicação

O manifesto `.openai/hosting.json` declara os bindings DB e BUCKET. Publique com a skill Sites: ela compila, sincroniza o código, aplica migrações e provisiona D1/R2 na Cloudflare. A prévia inicial é privada. Para divulgação pública, altere o acesso pelo Sites e mantenha `ADMIN_EMAIL` configurado; a autorização do painel é independente da audiência do site.

Para Cloudflare independente, é necessário substituir os cabeçalhos de identidade do Sites por autenticação verificada (por exemplo Cloudflare Access), configurar domínio, D1, R2 e segredos. Não confie nesses cabeçalhos enviados diretamente por visitantes em hospedagem externa. Atualize a URL canônica em layout, sitemap e robots ao trocar de domínio.

## Conteúdo pendente

Cadastre os projetos reais, configure o e-mail administrador e a URL real do Instagram. Nenhum depoimento, cliente, métrica ou experiência profissional foi inventado. A imagem Open Graph é fornecida em PNG, com fonte SVG editável.
