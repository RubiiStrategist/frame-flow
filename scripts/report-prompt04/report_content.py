# -*- coding: utf-8 -*-
"""FRAME FLOW OS · PROMPT 04 — conteúdo do relatório (PT-BR).
Separado do motor de layout para iteração segura. Todos os números
vêm de medições reais executadas no navegador (scripts/qa-prompt04)."""

SHOTS = '/home/z/my-project/download/frameflow-prototipo-prompt04/screenshots'

BLOCO = [

# ══════════════ 1. SUMÁRIO EXECUTIVO ══════════════
('h1', 'Sumário executivo'),
('p', 'Este relatório documenta o protótipo interativo independente construído para o PROMPT 04, '
      'após a seleção do Conceito C — Frame Flow Signature como direção principal. O protótipo '
      'materializa a consolidação pedida: a estrutura funcional do Conceito C foi preservada '
      'integralmente, a elegância editorial do Conceito A entrou pelo brief financeiro em papel '
      'e pela tipografia ampliada, e o núcleo orbital do Conceito B aparece exclusivamente onde '
      'existem relações reais entre projetos, decisões, indicadores e contas do dataset. Nada '
      'no aplicativo FRAME FLOW em produção foi alterado — o protótipo vive em um diretório '
      'estático separado, sem conexão com Supabase ou migrations.'),
('p', 'Foram entregues dois protótipos navegáveis — desktop (projetado para 1440px) e mobile '
      '(design próprio para 390px) — com quatro contextos executivos no desktop (Painel, '
      'Inteligência Financeira, Central de Decisões e Ecossistema) e seis vistas no mobile. '
      'As seis interações obrigatórias do PROMPT 04 foram implementadas e verificadas '
      'individualmente no navegador, com resultados registrados no capítulo 7. O ambiente 3D '
      'usa um motor próprio em canvas com projeção em perspectiva real, câmera que responde '
      'aos contextos e degradação adaptativa — sem nenhuma dependência externa adicionada.'),
('callout', [
    ('6/6', 'interações obrigatórias verificadas no navegador'),
    ('15/15', 'pares de contraste WCAG 2.1 aprovados (razão mínima de texto: 4,96:1)'),
    ('0 px', 'de overflow horizontal em 1440 e em 390, nos dois modos'),
]),
('h2', 'Onde avaliar'),
('bullets', [
    'Navegável pelo servidor de preview do projeto: caminho /prototypes/ (desktop.html, mobile.html e hub index.html com o guia de demonstração).',
    'Pacote completo em download/frameflow-prototipo-prompt04/ — fontes do protótipo, 13 screenshots e este relatório — e o arquivo frameflow-prototipo-prompt04.zip.',
    'Cada tela carrega o aviso permanente de dados demonstrativos; todos os votos e ações exibem confirmação de que nada real foi alterado.',
]),

# ══════════════ 2. DIREÇÃO VISUAL ══════════════
('h1', 'Direção visual consolidada'),
('p', 'A direção parte do Conceito C aprovado no PROMPT 03 e aplica os ajustes obrigatórios do '
      'PROMPT 04. A estrutura funcional é a mesma que a equipe conheceu: trilho vertical com '
      'ambientes, topbar com crumb e paleta de comandos, mosaico de painéis codificados (FF·01, '
      'FC·02, DC·03, OP·04), palco lateral com a Cap e linguagem de frames com cantoneiras e '
      'perfuração de película. Os três pilares do ajuste — tipografia maior, contraste mais '
      'equilibrado e menos áreas pretas sem função — foram tratados como regras de sistema, '
      'não como retoques pontuais.'),
('p', 'Da herança do Conceito A veio o gesto editorial mais forte do protótipo: o contexto '
      'Inteligência Financeira é um documento em papel quente sobre o palco escuro, com números '
      'em tinta, gráfico de linha vermelha e tabela de contas a receber — a leitura financeira '
      'ganha a seriedade de um impresso. A tipografia subiu em toda a hierarquia: a saudação '
      'do painel saltou de 44px para 56px no desktop, valores principais foram para 38px, e o '
      'piso dos textos de apoio subiu de 45% para 62% de opacidade do branco quente, elevando '
      'o pior par de contraste da interface de aproximadamente 4,5:1 para 6,95:1 medido.'),
('p', 'Do Conceito B permaneceu apenas o que o PROMPT 04 autorizou: o orbital existe quando '
      'representa relações reais. As onze entidades do dataset — o hub FRAME OS, três projetos, '
      'três decisões, três indicadores e o alerta de contas vencidas — orbitam em três anéis '
      'com inclinações distintas, e cada aresta liga entidades que de fato se relacionam '
      '(a decisão das lentes destrava o Filme Aurora; o Festival Lume pressiona a Meta Q4; as '
      'contas vencidas pesam sobre a Receita). Não há nó decorativo nem aresta sem significado.'),
('figures2', [SHOTS + '/01-desktop-painel-imersivo.png', SHOTS + '/02-desktop-painel-comando.png'],
 'Figura 1 — Painel executivo nos dois modos: Imersivo (esq.) com o orbital em cena e letterbox '
 'cinematográfico; Comando (dir.) com o 3D completamente ausente e grade calma. Dados demonstrativos.'),
('p', 'O vermelho assinatura #E10606 segue como acento cirúrgico, agora com uma regra de uso '
      'explícita: em texto pequeno ele não aparece sobre o preto (razão medida de 3,99:1 '
      'atende apenas texto grande e componentes), então rótulos de urgência usam texto claro '
      'com borda vermelha, e o vermelho pleno fica reservado para índices serifados grandes, '
      'indicadores e botões de ação urgentes com texto branco (4,96:1). O grão de película e '
      'a vinheta permanecem como assinatura, em intensidade reduzida para não competir com a leitura.'),

# ══════════════ 3. O PROTÓTIPO ══════════════
('h1', 'O protótipo: acesso e arquitetura'),
('p', 'O protótipo é um conjunto de arquivos estáticos autocontidos servidos pelo mesmo servidor '
      'de preview do projeto, sem tocar em nenhuma rota, componente ou configuração do aplicativo. '
      'O dataset demonstrativo é uma única fonte de verdade compartilhada pelos dois protótipos, '
      'mantendo os números e nomes do Conceito C aprovado (Rubian · CEO, R$ 284.500 de receita, '
      'semana 44, duas contas vencidas). A tabela a seguir resume a arquitetura de arquivos.'),
('table', {
  'ratios': [0.22, 0.16, 0.62],
  'head': ['Módulo', 'Papel', 'Conteúdo'],
  'rows': [
    ['index.html', 'Hub', 'Capa de avaliação com links, aviso de dados demonstrativos e guia das seis interações obrigatórias.'],
    ['desktop.html + assets', 'Protótipo desktop', 'Quatro contextos executivos, modos Comando/Imersivo, paleta Ctrl+K, drawer de decisão, painel da Cap.'],
    ['mobile.html + assets', 'Protótipo mobile', 'Design próprio 390px: cinco abas inferiores, bottom sheet de decisão, paleta em tela cheia, Ecossistema adaptado.'],
    ['assets/data.js', 'Dataset demo', 'Fonte única dos dois protótipos: financeiro, comercial, decisões, Cap, ecossistema e comandos.'],
    ['assets/orbital.js', 'Motor 3D', 'Projeção em perspectiva, fog por profundidade, presets de câmera por contexto, parallax, hit-test, reduced-motion.'],
    ['assets/common.css', 'Tokens', 'Paleta, escada de opacidade, tipografia, componentes compartilhados, letterbox, grão e foco visível.'],
    ['screenshots/', 'Evidências', 'Treze capturas nomeadas dos dois modos, das interações e das duas plataformas.'],
  ],
  'caption': 'Tabela 1 — Arquitetura de arquivos do protótipo (totalmente aditiva ao projeto).'
}),
('h2', 'As seis interações obrigatórias'),
('p', 'Cada interação exigida pelo PROMPT 04 foi executada no navegador e verificada por '
      'medição de estado no DOM — os valores da coluna de verificação são saídas reais dos '
      'testes automatizados, não afirmações. O leitor pode repetir qualquer uma delas ao vivo; '
      'o hub index.html descreve o passo a passo de cada uma.'),
('table', {
  'ratios': [0.24, 0.38, 0.38],
  'head': ['Interação', 'Como demonstrar', 'Verificação real executada'],
  'rows': [
    ['1. Comando / Imersivo', 'Botão no topo (desktop e mobile) ou comando na paleta Ctrl+K.', 'Canvas do 3D muda de block para none; letterbox 28px↔0px (desktop) e 14px↔0px (mobile); aria-pressed correto.'],
    ['2. Abertura da Cap', 'Clique na zona da Cap no palco (desktop) ou aba Cap (mobile).', 'Painel abre com foco no fechar; quatro estados demonstráveis trocam rótulo, fala e anel de status.'],
    ['3. Central Ctrl+K', 'Ctrl+K / Cmd+K (desktop) ou botão de busca (mobile); filtrar e Enter.', '12 comandos listados; filtro por "lentes" e "runway" retorna 1 resultado correto; setas navegam; Esc fecha.'],
    ['4. Abertura de decisão', 'Central de Decisões → clicar em uma decisão.', 'Drawer/sheet abre com contexto (388 caracteres), 3 opções e 3 impactos; voto Aprovar registra APROVADA · 3/3.'],
    ['5. Inteligência Financeira', 'Trilho, paleta Ctrl+K, alerta de contas ou link no painel.', 'Contexto renderiza brief em papel com R$ 284.500, 4 contas e 3 alertas; câmera destaca Receita e contas.'],
    ['6. Estado entre contextos', 'Abrir decisão, aplicar filtro Urgentes, trocar de contexto e voltar.', 'Drawer continua aberto com o mesmo título; filtro persiste (1 linha antes e depois); voto e modo preservados.'],
  ],
  'caption': 'Tabela 2 — As seis interações obrigatórias e suas verificações (status: REALIZADO).'
}),
('figure', SHOTS + '/03-desktop-palette-ctrlk.png',
 'Figura 2 — Central de comandos Ctrl+K com filtro ativo. Navegação por setas, execução com Enter. Dados demonstrativos.'),

# ══════════════ 4. MODOS ══════════════
('h1', 'Modos Comando e Imersivo'),
('p', 'Os dois modos compartilham exatamente os mesmos dados, contextos e ações — a única '
      'diferença é a presença do ambiente tridimensional e da cenografia cinematográfica. O '
      'modo Comando é o teste de honestidade da arquitetura: quando ele está ativo, o canvas '
      'do motor 3D sai do fluxo de renderização por completo (display:none), o loop de animação '
      'é cancelado e o custo de GPU tende a zero. Nenhuma funcionalidade depende do modo '
      'Imersivo, atendendo à exigência de independência absoluta entre os dois modos.'),
('table', {
  'ratios': [0.26, 0.37, 0.37],
  'head': ['Aspecto', 'Modo Comando', 'Modo Imersivo'],
  'rows': [
    ['Ambiente 3D', 'Ausente — canvas fora do render, loop cancelado.', 'Orbital em cena com fog, rotação lenta e parallax de ponteiro (desktop).'],
    ['Cenografia', 'Fundo preto com grade sutil de comandos.', 'Letterbox 28px (desktop) / 14px (mobile), vinheta e brilho de feixe da Cap reforçados.'],
    ['Painéis 2D', 'Sólidos (#101010), opacos, foco total em dados.', 'Translúcidos (rgba 13,13,13 · 0,82) com blur discreto — texto segue em 92% de contraste.'],
    ['Câmera', 'Sem custo, sem presets.', 'Presets por contexto com transição suave; destaca contas no Financeiro e decisões na Central.'],
    ['Público-alvo', 'Uso diário intenso, máquinas modestas, bateria.', 'Apresentação, revisão executiva e exploração do ecossistema.'],
  ],
  'caption': 'Tabela 3 — Comparativo entre os modos Comando e Imersivo.'
}),
('p', 'No mobile, o modo Imersivo ganhou uma adaptação própria em vez de uma cópia do desktop: '
      'o orbital aparece na janela de palco entre a saudação e os cartões, com densidade '
      'reduzida, sem parallax de ponteiro e com letterbox compacto de 14px. O padrão do mobile '
      'é Comando, coerente com desempenho e bateria; a alternância fica ao alcance do '
      'polegar na topbar, com alvos de toque de no mínimo 44px.'),
('figure', SHOTS + '/04-desktop-decisao-drawer.png',
 'Figura 3 — Abertura de uma decisão: drawer com contexto, opções A/B/C, impactos financeiros '
 'e votação. Aprovar registra APROVADA · 3/3 pela regra da maioria (demonstrativo).'),
('figures2', [SHOTS + '/09-mobile-painel-imersivo.png', SHOTS + '/11-mobile-decisao-sheet.png'],
 'Figura 4 — Mobile 390px: Início em Imersivo com o orbital na janela de palco (esq.); bottom '
 'sheet de decisão com ações fixas no rodapé (dir.). Áreas seguras e alvos de 44px.'),

# ══════════════ 5. COMPONENTES ══════════════
('h1', 'Componentes 2D e 3D'),
('p', 'A divisão de camadas segue a regra do PROMPT 04: todo conteúdo funcional é 2D e '
      'permanece legível em qualquer modo; o 3D é ambiente, nunca interface. No desktop, o '
      'orbital habita o palco à direita do painel e atravessa discreto o fundo; no Ecossistema '
      'ele ocupa o centro com rótulos e inspeção por clique. No mobile, ele vive na janela de '
      'palco e no overlay do Ecossistema, sempre atrás de camadas com contraste garantido.'),
('table', {
  'ratios': [0.24, 0.12, 0.64],
  'head': ['Componente 2D', 'Camada', 'Função'],
  'rows': [
    ['Trilho vertical', 'Navegação', 'Ambientes R/W/L, contextos, configurações de movimento e perfil; logo vertical FRAME FLOW OS.'],
    ['Topbar', 'Navegação', 'Crumb do contexto, busca Ctrl+K, alternador de modo, sino, relógio ao vivo e chip DEMO.'],
    ['Painel FF·01', 'Dados', 'Receita do mês com gráfico de seis meses, resultado, despesas e a receber.'],
    ['Painel FC·02', 'Dados', 'Pipeline comercial (prospecção, proposta, fechamento) e estatísticas.'],
    ['Painel DC·03', 'Decisão', 'Lista editorial de decisões com prazos, regra de votação e abertura do drawer.'],
    ['Painel OP·04', 'Operação', 'Projetos com status, métricas da semana e linha de agenda de sete dias.'],
    ['Brief em papel', 'Editorial', 'Documento financeiro em papel quente: números em tinta, gráfico vermelho, contas a receber.'],
    ['Drawer / Bottom sheet', 'Decisão', 'Contexto, opções, impactos, votação e ações (aprovar, pedir contexto, rejeitar).'],
    ['Paleta Ctrl+K', 'Comando', '12 comandos filtráveis com navegação por setas e execução por Enter.'],
    ['Painel / aba da Cap', 'Assistência', 'Quatro estados demonstráveis, fala, ação sugerida e nota de asset pendente.'],
    ['Ecossistema (lista)', 'Dados', 'Relações reais legíveis, legenda de tipos de nó e hint de interação.'],
    ['Navegação inferior (mobile)', 'Navegação', 'Cinco abas com alvos de 44px+, indicador vermelho e área segura nativa.'],
    ['Toasts', 'Feedback', 'Confirmações de modo, voto e movimento reduzido; nada real é alterado.'],
  ],
  'caption': 'Tabela 4 — Componentes 2D do protótipo (desktop e mobile).'
}),
('table', {
  'ratios': [0.26, 0.74],
  'head': ['Componente 3D', 'Comportamento'],
  'rows': [
    ['Nós orbitais', 'Onze entidades em três anéis com inclinações distintas; hub FRAME OS com núcleo vermelho; decisões em vermelho; indicadores em losango; alerta com pulso.'],
    ['Arestas de relação', 'Onze conexões apenas entre entidades relacionadas de fato; arestas de decisão em vermelho, com opacidade modulada pela profundidade (fog).'],
    ['Anéis-guia', 'Elipses projetadas dos três anéis a 5,5% de opacidade — dão leitura imediata de profundidade sem competir com os nós.'],
    ['Poeira de ambiente', 'Pontos flutuantes com variação vertical sutil (congelada em reduced-motion) reforçando o efeito de espaço.'],
    ['Câmera por contexto', 'Presets com interpolação suave: o Painel enquadra o palco; o Financeiro gira para Receita e contas; Decisões traz o anel vermelho à frente; o Ecossistema aproxima e liga rótulos.'],
    ['Parallax de ponteiro', 'Inclinação de até 1,5 grau seguindo o cursor — apenas no desktop e apenas em movimento pleno.'],
    ['Hit-test', 'Hover revela rótulo e subtítulo; clique/torque abre card com as relações reais da entidade e atalho para o contexto dela.'],
    ['Degradação adaptativa', 'Se o quadro médio passa de ~34ms, o motor reduz o DPR sozinho; aba oculta pausa tudo; Comando desliga o loop.'],
  ],
  'caption': 'Tabela 5 — Componentes 3D do motor orbital (canvas, sem dependências externas).'
}),
('figure', SHOTS + '/06-desktop-ecossistema-imersivo.png',
 'Figura 5 — Contexto Ecossistema: câmera aproximada, rótulos ativos, legenda de tipos e a lista '
 'de relações reais à esquerda. Cada aresta corresponde a uma relação do dataset.'),

# ══════════════ 6. CAP ══════════════
('h1', 'Cap: área de integração'),
('p', 'Nenhuma mascote nova foi criada e nenhum robô foi usado. A arte atual é a mesma de '
      'referência do Conceito C aprovado, rotulada como asset oficial pendente em toda '
      'aparição — no palco do painel, no painel dedicado do desktop e na aba do mobile. O '
      'protótipo entrega o que o PROMPT 04 pediu: uma área de integração pronta para receber '
      'os assets oficiais da FRAME VISION, com os quatro estados planejados já demonstráveis '
      'e específicação técnica explícita para a produção desses assets.'),
('table', {
  'ratios': [0.22, 0.42, 0.36],
  'head': ['Estado', 'Comportamento demonstrado', 'Sinal visual (anel de status)'],
  'rows': [
    ['Atenção', 'Cap: separei os vencidos e preparei o resumo da semana 44.', 'Ponto vermelho pulsando lentamente com borda vermelha.'],
    ['Processando', 'Cap: cruzando entregas, notas fiscais e votos dos sócios.', 'Borda tracejada girando continuamente.'],
    ['Alerta', 'Cap: o pacote de lentes vence domingo às 18h — falta apenas o seu voto.', 'Piscar rápido do ponto vermelho; ação sugerida abre a decisão.'],
    ['Confirmação', 'Cap: resumo da semana 44 enviado ao seu e-mail às 09h12.', 'Borda calma em branco quente, ponto neutro.'],
  ],
  'caption': 'Tabela 6 — Estados planejados da Cap, demonstráveis no protótipo.'
}),
('p', 'A especificação de integração ficou registrada dentro do próprio protótipo: formato '
      '1:1, quatro estados animados, entrega em vetorial e PNG @2x, dimensões de 132px de '
      'altura no palco do desktop, 128px na aba mobile e 52px no badge do painel. As posições '
      'já estão reservadas com zona de luz, marca de chão e rótulo de "asset oficial pendente". '
      'Quando a FRAME VISION fornecer os arquivos, a substituição é uma troca de asset — '
      'nenhuma reescrita de layout.'),
('figures2', [SHOTS + '/07-desktop-cap-panel.png', SHOTS + '/12-mobile-cap.png'],
 'Figura 6 — Área de integração da Cap no desktop (esq., estado Alerta) e no mobile (dir.), '
 'com os chips dos quatro estados e a nota de arte de referência.'),

# ══════════════ 7. TESTES ══════════════
('h1', 'Resultados dos testes'),
('p', 'Os testes abaixo foram executados de verdade no navegador headless (Chrome) contra os '
      'arquivos servidos, em viewport 1440×900 (desktop) e 390×844 (mobile). Os números da '
      'coluna de resultado são saídas literais das medições — incluindo as falhas encontradas '
      'no caminho: seis bugs reais foram detectados e corrigidos durante a bateria (detalhes '
      'no final do capítulo). Nenhum item foi marcado como verificado sem execução; o que não '
      'pôde ser medido nesta etapa está, honestamente, na tabela de pendências.'),
('table', {
  'ratios': [0.26, 0.36, 0.38],
  'head': ['Teste executado', 'Método', 'Resultado medido (REALIZADO)'],
  'rows': [
    ['Overflow horizontal — desktop', 'scrollWidth vs viewport em 1440×900, nos dois modos.', 'scrollWidth = 1440 = viewport. Sem overflow.'],
    ['Overflow horizontal — mobile', 'scrollWidth vs viewport em 390×844, nos dois modos.', 'scrollWidth = 390 = viewport. Sem overflow.'],
    ['Contraste WCAG 2.1', 'Cálculo de razão de luminância dos 15 pares de tokens efetivamente usados.', '15/15 aprovados. Texto: mínimo 4,96:1 (branco sobre vermelho); principais 17,41 / 16,73 / 17,20 / 10,58 / 6,95. Vermelho sobre preto 3,99:1, restrito a texto grande e indicadores.'],
    ['Independência do Comando', 'Alternância de modo com medição de display do canvas e altura do letterbox.', 'Canvas display:none em Comando; letterbox 0px ↔ 28px (desktop) e 0px ↔ 14px (mobile); aria-pressed correto.'],
    ['Teclado — Ctrl+K / Esc', 'Disparo de eventos de teclado e inspeção de foco e de pilha de overlays.', 'Paleta abre com foco no input, filtra, navega com setas, executa com Enter e fecha com Esc; Esc fecha o topo da pilha (paleta → drawer → Cap).'],
    ['Foco visível', 'Foco programático em botões e leitura de outline computado.', 'Outline de 2px em branco quente presente em todos os focáveis (:focus-visible).'],
    ['Abertura de decisão', 'Clique na primeira decisão + inspeção do drawer/sheet.', 'Título correto; contexto de 388 caracteres; 3 opções e 3 impactos; votos 2/3.'],
    ['Votação (maioria)', 'Aprovação da decisão das lentes.', 'Status APROVADA · 3/3; botões substituídos por chip de status; preview do painel atualizado.'],
    ['Preservação de estado', 'Abrir drawer, aplicar filtro Urgentes, trocar de contexto, retornar.', 'Drawer segue aberto com o mesmo título; filtro persiste (1 linha antes e depois); voto e modo preservados nas idas e voltas.'],
    ['Movimento reduzido', 'Alternador manual + comparação de pixels do canvas a 800ms de intervalo.', 'Classe reduced aplicada; quadro do canvas byte a byte idêntico; movimento retomado ao desligar.'],
    ['Alvos de toque — mobile', 'Bounding boxes de todos os controles visíveis.', 'Mínimo medido 44×46px após correção (o botão COM tinha 42px e foi ajustado); abas de 78×58px.'],
    ['Áreas seguras — mobile', 'Leitura de padding computado e presença da barra indicadora.', 'env(safe-area-inset-bottom) declarado na navegação e no sheet; home indicator presente.'],
    ['Desempenho indicativo', 'Contagem de quadros por segundo durante 3s no Imersivo (desktop, headless).', '51 fps médios no ambiente de teste — abaixo do teto de 60, dentro do esperado para headless.'],
    ['Capturas de tela', 'Renderização real + análise visual computacional das telas.', '13 screenshots validados; nenhum texto cortado ou sobreposto após três rodadas de correção.'],
  ],
  'caption': 'Tabela 7 — Testes executados com resultado medido (status: REALIZADO).'
}),
('h2', 'Verificações pendentes'),
('table', {
  'ratios': [0.30, 0.38, 0.32],
  'head': ['Verificação pendente', 'Método planejado', 'Motivo da pendência'],
  'rows': [
    ['Lighthouse mobile (Perf ≥ 85 · A11y ≥ 90)', 'Execução do Lighthouse contra mobile.html em perfil mobile.', 'Ferramenta não disponível neste ambiente; é gate obrigatório antes da integração real.'],
    ['Leitor de tela (NVDA / VoiceOver)', 'Percurso completo das seis interações com leitor ativo.', 'Requer ambiente de acessibilidade nativo; rótulos aria já estão no lugar para o teste.'],
    ['Dispositivo físico', 'Uso em iPhone/Android reais: toque, safe-area com notch, OLED.', 'Emulador cobre geometria, não cobre toque real e calibração de tela.'],
    ['Bateria e térmica em uso prolongado', 'Sessão de 30 min em Imersivo com medição de consumo.', 'Hardware de entrada não disponível no ambiente; degradação adaptativa já implementada.'],
    ['Dados reais do Supabase', 'Ligação às queries existentes do aplicativo.', 'Fora de escopo por decisão do PROMPT 04 — protótipo isolado por design.'],
  ],
  'caption': 'Tabela 8 — Verificações pendentes e seus métodos (status: PENDENTE DE VALIDAÇÃO).'
}),
('h2', 'Falhas encontradas e corrigidas durante o controle de qualidade'),
('bullets', [
    'Cenas do desktop não exibiam conteúdo: o atributo data-ctx faltava nas quatro seções — corrigido e revalidado.',
    'O alternador de modo não tinha listener no desktop e no mobile — conectado e retestado.',
    'O mobile quebrava antes de registrar os handlers: faltava o markup do nodecard 3D — incluído.',
    'Botão COM do modo tinha 42px de largura no mobile — elevado a 46px (piso de 44px respeitado).',
    'O Ecossistema do mobile aparecia vazio: o overlay opaco cobria o canvas — motor passou a renderizar em um canvas dedicado dentro da janela.',
    'As ações do bottom sheet ficavam abaixo da área visível — movidas para o rodapé fixo, sempre visíveis.',
    'Filtro da paleta não achava "runway" e a fala da Cap tinha um erro de artigo — dataset corrigido.',
]),

# ══════════════ 8. LIMITAÇÕES ══════════════
('h1', 'Limitações técnicas'),
('bullets', [
    'Fontes via Google Fonts CDN: sem rede, o protótipo cai para Georgia e monospace do sistema — a identidade degrada com elegância, mas degrada.',
    'Motor 3D em canvas 2D puro: projeção em perspectiva real, porém sem WebGL — escolha deliberada de viabilidade zero-dependência para esta fase; a integração real planeja React Three Fiber.',
    'Sem persistência: recarregar devolve o protótipo ao estado inicial — votos, filtros e modo são estado de sessão, não de banco (por design, nada aqui toca dados reais).',
    'Ambientes Comercial (W) e Operacional (L) respondem com aviso de fora de escopo — o protótipo é o ambiente executivo solicitado.',
    'O letterbox do modo Imersivo ocupa 28px no desktop e 14px no mobile: é assinatura cinematográfica, mas é área cedida — o modo Comando existe justamente para quem quer tudo de volta.',
    'Rótulos do orbital dependem do carregamento da fonte mono; antes disso, o fallback monoespaçado do sistema assume.',
    'A paleta Ctrl+K filtra o dataset carregado — na aplicação real ela consultará projetos, contas e pessoas via Supabase.',
    'O FPS de 51 quadros é indicativo do ambiente headless de teste, não um resultado de dispositivo final; a degradação adaptativa existe para os casos-limite.',
]),

# ══════════════ 9. INTEGRAÇÃO ══════════════
('h1', 'Plano de integração futura'),
('p', 'O plano abaixo está desenhado para que a aprovação desta direção visual se converta em '
      'implementação sem reescritas: cada fase reutiliza o que o aplicativo já tem (tipos, '
      'roteador por hash, camada de dados, autenticação e RLS intocados) e adiciona apenas '
      'camada de apresentação. Nenhuma fase começa sem os critérios de saída da anterior, e '
      'todas as métricas do PROMPT 03 continuam valendo como gates: Lighthouse mobile com '
      'desempenho mínimo 85, acessibilidade mínima 90, 390px sem overflow, navegação por '
      'teclado, reduced-motion respeitado, modo Comando dispensando o 3D e fallback 2D '
      'garantido.'),
('table', {
  'ratios': [0.16, 0.50, 0.34],
  'head': ['Fase', 'Escopo', 'Critério de saída'],
  'rows': [
    ['F1 — Camada 2D', 'Tokens do protótipo viram tema (Tailwind); contextos existentes recebem a tipografia ampliada, a escada de opacidade, o brief em papel do Financeiro e a lista editorial de decisões.', 'Nenhum fluxo existente regredido; verificação de tipos e build limpas; contraste revalidado por script.'],
    ['F2 — Orbital real', 'Motor migrado para React Three Fiber com dados vivos (projetos, decisões, contas); carregamento preguiçoso; Comando padrão no mobile; reduced-motion e fallback 2D no mesmo contrato atual.', 'Gates do PROMPT 03 medidos e aprovados (Lighthouse, a11y, 390px, teclado); custo de GPU monitorado em dispositivos de entrada.'],
    ['F3 — Cap oficial', 'Troca dos placeholders pelos assets oficiais da FRAME VISION nos quatro estados, nas posições já reservadas do desktop e do mobile.', 'Estados aprovados pela FRAME VISION; nenhuma alteração de layout além da troca de asset.'],
  ],
  'caption': 'Tabela 9 — Fases de integração com critérios de saída mensuráveis.'
}),
('table', {
  'ratios': [0.30, 0.70],
  'head': ['Risco', 'Mitigação prevista'],
  'rows': [
    ['Custo de GPU em máquinas modestas', 'Comando como modo padrão em desktops detectados como de baixo desempenho; degradação adaptativa; carregamento do 3D apenas sob demanda.'],
    ['Legibilidade sobre o ambiente 3D', 'Regra vigente: painéis translúcidos a 82% com texto em 92% de opacidade — já validada nos 15 pares de contraste.'],
    ['Regressão de fluxos existentes', 'F1 isolada em camada de tema; suíte existente de testes do aplicativo roda em todas as fases; nada de banco, auth ou RLS muda.'],
    ['Dependência da rede para fontes', 'Self-hosting das fontes no aplicativo real (a privacidade e o offline da PWA já exigem isso).'],
    ['Assets da Cap fora do padrão', 'Especificação 1:1 com quatro estados já documentada no protótipo; validação da FRAME VISION antes da F3.'],
  ],
  'caption': 'Tabela 10 — Riscos mapeados e mitigações.'
}),
('p', 'Nada disto foi iniciado. O aplicativo FRAME FLOW em produção permanece exatamente como '
      'estava antes do PROMPT 04 — o protótipo é puramente aditivo, servido como arquivos '
      'estáticos em um diretório próprio, e a Etapa 1.1 (correções técnicas já autorizadas) '
      'continua disponível para execução assim que a FRAME VISION definir a prioridade entre '
      'ela e a implementação visual.'),

# ══════════════ 10. PRÓXIMOS PASSOS ══════════════
('h1', 'Próximos passos e aprovação'),
('p', 'Para a avaliação, sugerimos o percurso completo do hub index.html: os dois protótipos, '
      'as seis interações na ordem do guia e uma passada livre pelos contextos. Os critérios '
      'que recomendamos observar são exatamente os do PROMPT 03.1 — a matriz de 100 pontos '
      'permanece com a equipe de avaliação, e este relatório fornece as evidências para cada '
      'dimensão, sem autoatribuição de nota. Três decisões ficam pendentes da FRAME VISION '
      'após a demonstração: o fornecimento dos assets oficiais da Cap, a confirmação do dataset '
      'demonstrativo como referência de conteúdo, e a ordem de execução entre a Etapa 1.1 e a '
      'implementação visual. Após a aprovação, a F1 pode começar imediatamente — a base de '
      'código do protótipo foi escrita para ser portada, não reescrita.'),
('note', 'Nenhuma alteração foi aplicada ao aplicativo FRAME FLOW em produção. Este relatório '
         'e os protótipos usam exclusivamente dados demonstrativos fictícios, sem qualquer '
         'conexão com Supabase, migrations ou dados reais da FRAME VISION.'),
]
