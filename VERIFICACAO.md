# Verificação da reconstrução

Foram executadas 63 verificações locais de integração: autenticação, autorização, origem de requisição, validação de URL, criação, edição, exclusão, visibilidade, páginas ocultas, reordenação atômica, importação idempotente, upload R2, rejeição de imagem forjada, imagem recuperável, oito conceitos visíveis, oito páginas individuais, oito imagens, mensagens com nome do conceito, sitemap, robots, Open Graph, vídeo e remoção do telefone do visitante.

O formulário foi preenchido no navegador com dados fictícios de teste. A abertura do WhatsApp foi interceptada somente no harness local e seu destino/mensagem foram conferidos; nenhuma mensagem foi enviada. Menu móvel, filtro e navegação por âncoras também foram acionados no navegador.

As oito imagens finais foram inspecionadas visualmente após a edição para português brasileiro. Não há índices de projetos ou separadores decorativos nas imagens. Mantêm-se contornos funcionais de botões e campos e os nomes próprios das marcas.

O navegador desta sessão informa movimento reduzido. A experiência padrão foi conferida com vídeo pausado e sem botão de início. Para testar o outro caminho sem alterar a configuração do usuário, o ambiente de desenvolvimento emulou movimento normal temporariamente. Em 390 × 844, o hero mediu 844px, o vídeo avançou em loop sem clique, `paused=false`, havia oito conceitos, nenhum botão de início e nenhuma rolagem horizontal. Em 1440 × 900, o hero mediu 900px, com reprodução ativa e sem overflow. O código de emulação e os arquivos de harness foram removidos antes do build final.

Também foi conferida uma viewport móvel de 360px. Isso não substitui testes em aparelhos físicos, Safari/iOS ou uma medição de Core Web Vitals. Não foram atribuídas pontuações Lighthouse ou certificações de acessibilidade.

TypeScript e build de produção são executados novamente no empacotamento final. Os resultados estruturados de integração estão em `integration-results.json` na pasta de entrega.
