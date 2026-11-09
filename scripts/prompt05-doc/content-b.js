/** PROMPT 05 — conteúdo B: Fase 1 — Planejamento de Integração (pt-BR) */
module.exports = function build(kit) {
  const { h1, h2, p, bullets, num, tbl, t, b, c, note } = kit;
  const out = [];

  out.push(h1("2. Fase 1 — Planejamento de Integração"));

  out.push(p([
    t("A Fase 1 foi executada como análise documentada, por leitura cruzada dos sete ativos do protótipo com os componentes React do aplicativo, sem qualquer modificação no código. O método foi: enumerar cada módulo do protótipo a partir dos roteiros de interação e das folhas de estilo; localizar o correspondente funcional no aplicativo; classificar o veredicto entre estender, evoluir, reutilizar ou criar; e definir a estratégia de tradução de cada um. O resultado é o comparativo, o inventário de reutilização e a estratégia de transformação das seções a seguir, seguidos do mapeamento de indicadores, da separação de responsabilidades, dos riscos de regressão e dos critérios de rollback."),
  ]));

  out.push(h2("2.1 Comparação módulo a módulo: protótipo x componentes existentes"));
  out.push(p([
    t("A tela inicial do CEO atual já segue a Direção Criativa 02, com cinco regiões cinematográficas em grafite e dados reais com estados honestos. A integração, portanto, não parte do zero: é a evolução dessa composição para a linguagem Signature aprovada no PROMPT 04, acrescentando os módulos que só existem no protótipo — contextos, modos e núcleo orbital — e revestindo os painéis existentes com a caligrafia editorial do Conceito C consolidado, que funde a estrutura funcional de C com a elegância editorial de A e o núcleo orbital de B como recurso opcional."),
  ]));

  out.push(...tbl({
    caption: "Módulos do protótipo x correspondentes no aplicativo — veredicto e estratégia",
    headers: ["Módulo do protótipo", "Correspondente atual no app", "Veredicto", "Estratégia"],
    widths: [26, 28, 12, 34],
    rows: [
      ["Tokens de common.css (escada de contraste, painéis por modo, serif e mono)", [t("src/app/globals.css — tokens ink, paper e vermelho, utilitários ff, já em Tailwind v4", { size: 20 })], "Estender", "Adição exclusivamente aditiva: escada de opacidades, fundos de painel por modo, utilitários serifados e monoespaçados; nada é removido; paleta e easing idênticos aos da marca."],
      ["Famílias Instrument Serif e JetBrains Mono (via CDN no protótipo)", "Apenas Inter via next/font no layout", "Novo no app", "Carregar as duas famílias com next/font auto-hospedado; o import de CDN do protótipo não é portado porque o aplicativo é um PWA que deve funcionar offline."],
      ["Quatro contextos com navegação própria por hash (painel, financeiro, decisões, ecossistema)", "Tela única com cinco regiões em src/components/views/executivo/inicio.tsx", "Novo no app", "Contextos como estado interno do componente, navegáveis por trilho visual e pela paleta; o hash do protótipo não é portado (ver 2.3, decisão 3)."],
      ["Modos Comando e Imersivo com body por atributo de dados", "Não existe; apenas o véu de boot pontual por sessão", "Novo no app", "Provedor de modo com persistência por flag de armazenamento; padrão Comando no servidor; Imersivo ativa a camada 3D (ver 2.3, decisão 4)."],
      ["Núcleo orbital (orbital.js, canvas 2D com projeção 3D)", "Não existe", "Novo no app", "Porte do motor para módulo TypeScript isolado e componente React; nós e arestas derivados apenas de relações reais; todas as regras de movimento aprovadas preservadas."],
      ["Painel financeiro editorial (KPIs, série de 6 meses, categorias, contas, alertas, aportes)", "src/components/executivo/financial-intelligence.tsx — quatro KPIs, série mensal e slots honestos", "Evoluir", "Revestimento editorial mais derivações novas (caixa, runway, categorias, contas com nome de cliente); aportes e metas permanecem slots honestos por não terem fonte real."],
      ["Central de decisões com prévia, filtros, gaveta de detalhe e votação", "src/components/executivo/decision-center.tsx e views/executivo/decisoes.tsx com voto real", "Evoluir", "Nova composição visual reutilizando a votação real via castVote; gaveta no padrão de interface do app; pedir contexto vira abstenção com comentário, que já existe no modelo."],
      ["Pipeline comercial e estatísticas na visão geral do CEO", "Existe no ambiente Comercial (comercial/inicio.tsx)", "Reutilizar dado", "Composição nova na tela do CEO lendo leads pelo DataProvider; nenhuma duplicação de lógica, apenas nova derivação no hook do CEO."],
      ["Pulso operacional com projetos, contadores e linha da semana", "src/components/executivo/operational-pulse.tsx", "Evoluir", "Revestimento editorial e acréscimo da linha da semana derivada de prazos de tarefas e projetos."],
      ["Dock e painel da Cap com quatro estados demonstrativos", "Máquina real de oito estados por quatro apresentações em cap.tsx e cap-panel.tsx", "Reutilizar máquina", "Mapear os quatro rótulos demonstrativos para estados reais da máquina; o componente da Cap permanece intocado; a área oficial segue rotulada."],
      ["Paleta de comandos com doze ações em seis grupos", "src/components/executivo/command-palette.tsx sobre cmdk", "Estender", "Acrescentar comandos de contexto, de alternância de modo e de acessibilidade, mantendo módulos, ambientes e ações rápidas existentes."],
      ["Camada cinematográfica (grão, vinheta, letterbox, cantoneiras, perfuração)", "Véu de boot e utilitários ff existentes", "Novo no app", "Camada decorativa isolada, ativa apenas no modo Imersivo, congelada em movimento reduzido, sem peso perceptível de bundle."],
      ["Toasts e sobreposições com fechamento por Esc empilhado", "Sonner instalado e diálogos Radix existentes", "Reutilizar", "Revestimento visual do sonner já instalado; a semântica de Esc fechando o topo da pilha é reproduzida nos manipuladores React."],
    ],
  }));

  out.push(h2("2.2 O que pode ser reutilizado sem alteração"));
  out.push(p([
    t("A fundação é o ativo a preservar. Todo o núcleo de domínio, autenticação, roteação, formatação, armazenamento, shell e componentes de interface permanecem intocados pela integração — não por conveniência, mas porque concentram as garantias testadas do sistema: estados honestos, centavos convertidos nas bordas, troca de ambiente sem novo login e políticas RLS prontas para validação. A tabela abaixo formaliza o inventário de reutilização direta, que serve também de lista de proibições de toque para a Fase 3."),
  ]));

  out.push(...tbl({
    caption: "Inventário de reutilização direta (sem alteração)",
    headers: ["Grupo", "Arquivos", "Motivo da preservação"],
    widths: [22, 42, 36],
    rows: [
      ["Núcleo de domínio", [c("src/lib/frameflow/{types,environments,router,format,data,auth,storage,schemas}"), t("", { size: 20 })], "Tipos, ambientes, roteador por hash, formatação BRL, camada de dados honesta, sessão PKCE e esquemas Zod concentram as regras testadas do sistema."],
      ["Cliente Supabase", [c("src/lib/supabase/{client,config}"), t("", { size: 20 })], "Validação estrita de variáveis, fluxo PKCE e chave de armazenamento de sessão; qualquer toque aqui é risco de autenticação."],
      ["Shell responsivo", [c("src/components/shell/"), t(" (app-shell, topbar, sidebar, bottom-nav, preview-banner)", { size: 20 })], "Navegação entre ambientes sem novo login e adaptação mobile já verificadas em 390 e 1440 pixels."],
      ["Biblioteca de interface", [t("47 componentes em ", { size: 20 }), c("src/components/ui/"), t("", { size: 20 })], "Base shadcn de onde saem diálogos, gavetas, formulários e toasts usados pela nova composição."],
      ["PWA", [c("src/app/manifest.tsx, public/sw.js, src/components/pwa/"), t("", { size: 20 })], "Instalação e cache já corretos; a Fase 3 apenas eleva a versão de cache no release, preservando as estratégias."],
      ["Cap", [c("src/components/cap/{cap,cap-panel}"), t("", { size: 20 })], "Máquina de oito estados por quatro apresentações e slot de assets oficiais; nenhum novo mascote, nenhuma arte inventada."],
      ["Views de negócio", [c("src/components/views/ (comercial, operacional, decisoes, indicadores, financeiro, login, configuracoes)"), t("", { size: 20 })], "Funcionalidades comerciais e operacionais do MVP permanecem intactas; a prova de conceito não as toca."],
      ["Testes existentes", [c("tests/unit (8 suítes) e tests/integration"), t("", { size: 20 })], "84 testes aprovados e a suíte RLS são a rede de segurança da integração; precisam continuar verdes sem edição."],
      ["Migrations", [c("supabase/migrations/0001 a 0006"), t("", { size: 20 })], "Esquema endurecido na Etapa 1.1; a prova de conceito não exige nenhuma mudança de banco."],
    ],
  }));

  out.push(h2("2.3 Estratégia de transformação: HTML/CSS/JS do protótipo em React/TypeScript"));
  out.push(p([
    t("A tradução segue sete decisões explícitas, cada uma tomada para eliminar uma classe de risco antes que ela exista. Elas valem como especificação vinculante para a Fase 3: qualquer implementação que as contrarie deve ser tratada como desvio de escopo."),
  ]));
  out.push(...num("num-transformacao", [
    [b("Tokens primeiro, por extensão aditiva. "), t("A escada de contraste, os fundos de painel por modo e os utilitários tipográficos de "), c("common.css"), t(" entram em globals.css sem remover linha alguma; a paleta e o easing já são os da marca, o que reduz a superfície de mudança ao mínimo necessário.")],
    [b("Fontes auto-hospedadas. "), t("Instrument Serif e JetBrains Mono entram via next/font com subconjuntos, no lugar do import de CDN do protótipo; o aplicativo é PWA e precisa renderizar offline; o peso adicional é medido no gate de desempenho.")],
    [b("Contextos como estado interno. "), t("O roteador do aplicativo usa hash no formato ambiente seguido de módulo, com deep links já em uso; portar o hash de contexto do protótipo quebraria o roteador. Os quatro contextos vivem como estado do componente, navegáveis pelo trilho e pela paleta; extensão futura do roteador para contexto profundo fica registrada como opcional e fora da prova de conceito.")],
    [b("Modos com padrão seguro. "), t("O servidor renderiza sempre o modo Comando; a escolha do usuário persiste por flag de armazenamento já existente, com chave nova; quem pede movimento reduzido ao sistema operacional permanece em Comando. Assim não há falha de hidratação nem custo de render 3D no carregamento inicial.")],
    [b("Orbital isolado e fiel. "), t("O motor de canvas com projeção 3D própria é portado para um módulo TypeScript sem dependências; preservadas as regras aprovadas: câmera por presets discretos com interpolação, pausa total em modo Comando e aba oculta, cena estática em movimento reduzido, degradação adaptativa de resolução e densidade.")],
    [b("Interações no paradigma React. "), t("O estado vira React; os toasts migram para o sonner já instalado com revestimento editorial; os diálogos usam as primitivas Radix existentes; a gaveta de decisão usa sheet no desktop e drawer no mobile, com foco preso; Esc continua fechando o topo da pilha de sobreposições.")],
    [b("Tipagem estrita e zero dependências novas. "), t("Todos os componentes tipam contra os tipos de domínio existentes, sem any e sem supressões; nenhuma dependência nova entra no package.json — motor orbital, cmdk e sonner já cobrem tudo o que o protótipo demonstra.")],
  ]));

  out.push(h2("2.4 Mapeamento dos indicadores demonstrativos para fontes reais no Supabase"));
  out.push(p([
    t("O dataset demonstrativo do protótipo ("),
    c("data.js"),
    t(", rotulado como cem por cento fictício) não é portado ao aplicativo. Cada indicador que ele exibe recebe uma fonte real no Supabase, uma derivação nova sobre dados já lidos ou, quando não existe fonte, um slot honesto rotulado — porque o aplicativo jamais apresenta número inventado como resultado da empresa. O mapeamento completo segue abaixo; ele é a base do contrato de dados da etapa S2 na Fase 3."),
  ]));

  out.push(...tbl({
    caption: "Indicador demonstrativo x fonte real no Supabase x situação",
    headers: ["Indicador do protótipo", "Fonte real", "Situação"],
    widths: [30, 42, 28],
    rows: [
      ["Receita do mês", "transacoes_financeiras com tipo entrada e vencimento no mês corrente, soma de valor em centavos", "Já existe: receitaMes no hook do CEO"],
      ["Despesas do mês", "transacoes_financeiras com tipo saída no mês corrente", "Já existe: despesasMes"],
      ["Resultado operacional", "receita do mês menos despesas do mês", "Já existe: resultadoOperacional"],
      ["Contas a receber e contas vencidas", "entradas não pagas; vencidas por comparação de data", "Já existe: contasReceber e vencidas"],
      ["Serie de 6 meses", "agrupamento de transações por mês de vencimento", "Já existe: serieMensal"],
      ["Caixa", "soma de entradas pagas menos saídas pagas", "Derivação nova em use-dados-ceo, sem nova tabela"],
      ["Runway", "caixa dividido pela média de saídas dos últimos seis meses", "Derivação nova; nulo quando o histórico for insuficiente, com estado honesto"],
      ["Despesas por categoria", "agrupamento por finance_category (doze categorias do enum)", "Derivação nova"],
      ["Contas por cliente com nota fiscal", "transações não pagas com junção de projeto e cliente para exibir nome", "Extensão aditiva de leitura: junção de nome de cliente"],
      ["Alertas financeiros", "contas vencidas e decisões com prazo próximo", "Derivação nova, reutilizando os sinais que a Cap já calcula hoje"],
      ["Aportes de capital", "não há tabela para aportes na fundação", "Slot honesto rotulado de Fase 2 — sem número fictício"],
      ["Meta trimestral", "não há tabela de metas na fundação", "Slot honesto rotulado de Fase 2"],
      ["Pipeline comercial por etapa", "leads agrupados por etapa com valor estimado em centavos", "Dado já existente; composição nova na tela do CEO"],
      ["Estatísticas comerciais", "derivações sobre leads e clientes", "Derivação nova no hook do CEO"],
      ["Projetos ativos e principais projetos", "projetos por status, excluindo entregues e pausados", "Já existe: operacional.projetosAtivos e topProjetos"],
      ["Entregas em 14 dias, aprovações, tarefas atrasadas", "projetos e tarefas por datas e status", "Já existe no hook do CEO"],
      ["Linha da semana", "prazos de tarefas e projetos distribuídos nos sete dias", "Derivação nova"],
      ["Decisões abertas com regra, prazo, impacto e votos", "decisoes com junção de decisao_votos já implementada em listDecisions", "Já existe; voto real via castVote"],
      ["Nós do ecossistema", "projetos ativos, decisões abertas, indicadores-chave e alertas derivados dos dados acima", "Derivação nova; orbital desenha apenas relações reais"],
      ["Arestas do ecossistema", "chaves estrangeiras reais: projeto-cliente, transação-projeto, decisão-núcleo", "Derivação nova a partir das mesmas leituras"],
      ["Comandos da paleta", "ações reais existentes: navegação, votação, Cap, modos, acessibilidade", "Nova definição estática ligando a ações reais"],
      ["Estados da Cap (quatro rótulos demonstrativos)", "máquina real de oito estados: atenção para alerta, processando para espera, alerta para alerta com outra fala, confirmação para celebração", "Mapeamento de rótulos; máquina intacta"],
    ],
  }));

  out.push(p([
    t("Três consequências práticas desse mapeamento orientam a Fase 3: o hook "),
    c("use-dados-ceo.ts"),
    t(" ganha derivações novas sem perder o contrato de pronto e nulos honestos; a leitura de transações ganha uma junção aditiva opcional para exibir nome de cliente, sem alterar os mappers testados; e dois indicadores do protótipo — aportes e metas — permanecem slots honestos até existir modelo de dados, porque inventar fonte seria violar a regra de honestidade do produto."),
  ]));

  out.push(h2("2.5 Separação: componentes puramente visuais x componentes com regras de negócio"));
  out.push(p([
    t("A fronteira é mecânica e verificável em revisão: componente visual não conhece Supabase. Tudo o que ele exibe chega por propriedades; tudo o que ele dispara chega por retornos de chamada. As regras de negócio — derivações, votação, acesso e roteação — vivem nos hooks e módulos já existentes, que a integração apenas estende. Essa separação permite revestir a interface sem risco funcional e testar cada lado por métodos próprios: snapshot e acessibilidade para o visual; unidade e integração para as regras."),
  ]));

  out.push(...tbl({
    caption: "Classificação visual x regra de negócio",
    headers: ["Componente", "Classificação", "Contrato"],
    widths: [32, 18, 50],
    rows: [
      ["Painéis editoriais, KPIs, hairlines, cantoneiras, grão, letterbox", "Visual puro", "Recebem valores prontos; nenhum acesso a dados; nenhuma decisão de negócio."],
      ["Núcleo orbital e motor de canvas", "Visual com entrada", "Recebe nós e arestas prontos por propriedades; ignora a origem dos dados; só desenha relações recebidas."],
      ["Hook do CEO estendido", "Regra de negócio", "Única fonte de derivação dos indicadores; mantém o contrato de pronto e nulos; sem acesso a componentes."],
      ["Central de decisões com gaveta", "Regra com revestimento", "Votação via castVote com identidade do sócio autenticado; voto em nome de outro é bloqueado pelo banco."],
      ["Paleta de comandos estendida", "Regra", "Navegação pelo roteador existente; modos pelo provedor de modo; nenhuma navegação improvisada."],
      ["Provedor de modo", "Regra leve", "Persistência por flag de armazenamento; movimento reduzido do sistema vence; nenhum dado sensível."],
    ],
  }));

  out.push(p([
    t("A estrutura de pastas proposta respeita a mesma fronteira: a camada visual nova vive em "),
    c("src/components/executivo/signature/"),
    t("; as derivações estendem "),
    c("src/components/executivo/use-dados-ceo.ts"),
    t("; e os testes novos entram em "),
    c("tests/unit/"),
    t(" espelhando as suítes existentes. Nenhum arquivo da fronteira de regras é movido ou renomeado — apenas estendido de forma aditiva, o que mantém o histórico de revisões legível e o risco de conflito baixo."),
  ]));

  out.push(h2("2.6 Riscos de regressão documentados"));
  out.push(p([
    t("Cada risco abaixo tem causa identificada, mitigação planejada e método objetivo de detecção — porque risco sem detecção é só esperança. Probabilidade e impacto foram classificados à luz do estado verificado da fundação; a lista é revisada ao final de cada etapa da Fase 3, e qualquer risco que se materialize entra no critério de rollback da seção 2.7."),
  ]));

  out.push(...tbl({
    caption: "Matriz de riscos de regressão",
    headers: ["Id", "Risco", "Prob.", "Impacto", "Mitigação", "Detecção"],
    widths: [5, 24, 9, 10, 32, 20],
    rows: [
      ["R1", "Conflito entre o hash de contexto do protótipo e o roteador real do app", "Baixa", "Alto", "Contextos como estado interno; roteador intocado (decisão 3 da seção 2.3)", "Suítes de navegação existentes mais caminhada manual de deep links"],
      ["R2", "Service worker servindo shell antigo após a atualização", "Média", "Médio", "Elevação da versão de cache no release da Fase 3; estratégia network-first para navegação já existente", "Teste de atualização pós-release com verificação da nova versão ativa"],
      ["R3", "Falha de hidratação entre modo persistido e render do servidor", "Média", "Médio", "Padrão Comando no servidor; escolha aplicada apenas após a montagem", "Fumaça em navegador e teste de unidade do provedor de modo"],
      ["R4", "Peso de bundle (duas famílias de fonte e camada 3D) contra o alvo de desempenho", "Média", "Alto", "next/font com subconjuntos; motor sem dependências; camada 3D carregada apenas sob demanda", "Delta de bundle medido a cada etapa e gate de Lighthouse"],
      ["R5", "Contraste insuficiente nos novos tokens editoriais", "Baixa", "Alto", "Escada de contraste do protótipo, com piso elevado aprovado no PROMPT 04", "Medição por script de contraste reutilizado dos QA do protótipo"],
      ["R6", "Regressão nos 84 testes existentes", "Baixa", "Alto", "Suítes intocadas; um PR atômico por etapa; proibições de toque da seção 2.2", "Suíte completa executada a cada etapa antes do avanço"],
      ["R7", "Quebra de login ou do fluxo PKCE", "Baixa", "Crítico", "Arquivos de autenticação intocados; matriz de preservação da seção 4.1", "Fumaça de login, logout e sessão persistida"],
      ["R8", "Nova leitura com junção que contorne o RLS", "Baixa", "Crítico", "Toda leitura pelo cliente anônimo sob RLS; a suíte T1 a T7 cobre a fronteira; service_role proibido", "Reexecução da suíte RLS e revisão de código na fronteira de dados"],
      ["R9", "Erro de conversão centavos x BRL nos painéis novos", "Baixa", "Médio", "Reuso obrigatório dos mappers e formatadores testados", "Suíte de mappers existente mais testes das derivações novas"],
      ["R10", "Overflow horizontal em 390 pixels na nova composição", "Média", "Alto", "Composição mobile-first herdada do protótipo mobile; trilho de contexto adaptado", "Medição objetiva em 390, 768 e 1440 pixels na etapa final"],
      ["R11", "Quebra de deep links entre ambientes", "Baixa", "Alto", "Roteador intocado; nenhum formato novo de URL", "Abertura direta por URL em cada ambiente"],
      ["R12", "Custo de processamento do orbital em celulares modestos", "Média", "Médio", "Pausa total fora do Imersivo e em aba oculta; degradação adaptativa; cena estática em movimento reduzido", "Medidor interno de quadros por segundo e teste de pausa por visibilidade"],
      ["R13", "Protótipo servido em produção pesando 4,2 megabytes", "Alta", "Baixo", "Remoção recomendada de public/prototypes na Fase 3, mantendo o pacote em download/ e no git; decisão do contratante", "Tamanho do bundle de produção medido antes e depois"],
    ],
  }));

  out.push(h2("2.7 Critérios de rollback"));
  out.push(p([
    t("O rollback é projeto, não improviso. A composição nova vive atrás de flag de recurso em tempo de build, com padrão desligado, e a composição atual permanece no código até a aceitação formal — nada é apagado. Com isso, voltar ao estado anterior tem dois caminhos: desligar a flag e regenerar, ou reverter o PR atômico da etapa incriminada; ambos ficam abaixo de trinta minutos em ambiente de build. Como a prova de conceito não altera esquema de banco, nenhum rollback toca dados; o repositório e o banco permanecem histórias independentes."),
  ]));
  out.push(p([
    t("Os gatilhos abaixo são objetivos e disparam o rollback da etapa automaticamente, sem julgamento no meio do caminho:"),
  ]));
  out.push(...num("num-gatilhos", [
    "Falha em qualquer gate obrigatório: ESLint, verificação de tipos, build ou suíte de testes.",
    "Contraste abaixo de 4,5 para 1 em qualquer par obrigatório de texto da nova interface.",
    "Overflow horizontal em qualquer largura verificada, notadamente 390 pixels.",
    "Lighthouse mobile abaixo de 85 de performance ou de 90 de acessibilidade.",
    "Qual quebra de login, logout ou do fluxo PKCE.",
    "Quebra de instalação ou de atualização do PWA.",
    "Falha em qualquer um dos sete testes de integração RLS.",
    "Regressão de navegação por hash em qualquer ambiente.",
    "Número fictício exibido como real — violação da regra de honestidade do produto.",
  ]));
  out.push(note("Objetivo de restauração: flag desligada em minutos; reversão completa do PR em menos de trinta minutos. O banco de dados não participa do rollback da Fase 3 por não ser alterado por ela."));

  return out;
};
