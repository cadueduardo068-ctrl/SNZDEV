# SNZ DEV

Portfólio em React e TypeScript, executado com Vinext em Cloudflare Workers. D1 persiste o conteúdo; R2 guarda imagens enviadas no painel. O mesmo site e a autorização administrativa foram preservados.

## Acessar e editar

Acesse `/admin` e entre pelo ChatGPT com `cadueduardo068@gmail.com`. A variável de servidor `ADMIN_EMAIL` autoriza essa conta. Sem autenticação e autorização, as operações retornam 403. Nenhuma credencial administrativa fica no frontend.

O painel permite adicionar e editar conceitos, enviar uma capa JPEG/PNG/WebP de até 5 MB, alterar categoria e descrição, cadastrar direção de arte e paleta, escolher imagens complementares, reordenar, destacar, ocultar e excluir. Use uma cor hexadecimal por item da paleta, separada por vírgulas. O campo de ordem e as setas definem a sequência dentro do grupo de destaques ou dos demais itens.

Marque **Visível no site público** para apresentar o conceito. Desmarcar também retira a página individual e o item do sitemap. O conteúdo vem do banco em cada carregamento; basta abrir ou recarregar a página para ver a alteração, sem novo build. Edições no próprio painel atualizam sua lista após o salvamento.

**Importar conceitos SNZ** adiciona os oito conceitos fornecidos nesta entrega. A operação não sobrescreve registros de mesmos IDs nem suas edições; trabalhos de outros IDs são preservados no banco e ocultados da vitrine. Não use essa ação para recuperar um conceito apagado com conteúdo personalizado: nesse caso, ela restaura somente o conteúdo inicial fornecido.

Excluir um projeto remove seu registro, mas preserva arquivos R2 para não apagar imagens compartilhadas acidentalmente. Imagens órfãs podem ser limpas pelo responsável na configuração do Storage.

## Conteúdo conceitual

A vitrine apresenta Velar Motors, Aura Architecture, Noir Atelier, Ignite Fitness, Orbital Tech, Sora Sushi, Vanta Estate e Echo Sound. São marcas fictícias, identificadas como **Projeto conceitual**. As imagens representam a primeira tela de uma proposta visual; não são sites completos ou funcionalidades implementadas para terceiros.

Os textos das interfaces estão em português brasileiro. Nomes próprios das marcas foram mantidos conforme o briefing. Os PNGs originais estão no pacote de imagens da entrega. O site usa WebP em 1600 × 900 e 720 × 405, escolhidos por `srcset`. A galeria mostra a imagem completa, sem cortar sua tipografia. Cada página permite ampliar a imagem.

## Imagem do hero

O hero usa a imagem de workspace noturno enviada pelo proprietário. Ela foi otimizada em WebP, com variantes responsivas e enquadramento por object-fit: cover. Substitui a antiga cena em vídeo. As animações de entrada da interface continuam respeitando movimento reduzido.

## Contato

O formulário pede nome, empresa opcional, tipo de projeto e ideia. Não solicita telefone, e-mail ou cadastro. A mensagem é organizada e aberta no WhatsApp; o visitante revisa e envia. Os CTAs de conceito incluem seu nome na mensagem. O WhatsApp de destino pode ser atualizado no painel.

## Desenvolvimento e publicação

Execute `npm run install:ci`, depois `npm run dev`. Para checar tipos: `node node_modules/typescript/bin/tsc --noEmit`. Para produção: `npm run build`.

Alterações no schema exigem `npm run db:generate`. As migrações existentes são imutáveis; acrescente outra migração. Para preview local, use o comando D1 documentado no README com o nome exato da migração pendente. As migrações desta entrega apenas adicionam colunas, sem apagar dados.

Publique atualizações pelo fluxo Sites, usando o projeto já registrado em `.openai/hosting.json`. Ele sincroniza o código, aplica migrações e publica o Worker com os bindings D1 `DB` e R2 `BUCKET`. Segredos ficam nas variáveis de ambiente do Sites. A audiência privada foi preservada; libere o acesso nas configurações do Sites antes de divulgar o link a clientes.

Uma publicação independente em Cloudflare exige configurar Workers, D1, R2, domínio e autenticação verificada (por exemplo Cloudflare Access). O login desta entrega é fornecido pelo Sites: os cabeçalhos de identidade não devem ser aceitos diretamente de visitantes em outra hospedagem. Não publique esse código em uma origem externa sem substituir essa fronteira de autenticação. Atualize canonical, sitemap e Open Graph ao definir outro domínio.
