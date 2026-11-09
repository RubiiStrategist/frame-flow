/** PROMPT 05 — conteúdo A: Sumário Executivo + Estado Atual Verificado (pt-BR) */
module.exports = function build(kit) {
  const { h1, h2, p, bullets, tbl, t, b, c, note } = kit;
  const out = [];

  /* ═══ Sumário Executivo ═══ */
  out.push(h1("Sumário Executivo"));

  out.push(p([
    t("Este documento responde ao PROMPT 05 e entrega exclusivamente o "),
    b("plano técnico de integração progressiva"),
    t(" da experiência visual aprovada — o Conceito C consolidado, avaliado no protótipo do PROMPT 04 — ao aplicativo FRAME FLOW existente. Nenhum arquivo do aplicativo principal foi modificado para produzir este plano: a árvore de fontes em "),
    c("src/"),
    t(" e as migrations permanecem exatamente como estavam no último commit, com a árvore de trabalho limpa. Os únicos artefatos novos desta entrega são este documento e os scripts que o geram, ambos fora do código do aplicativo."),
  ]));

  out.push(p([
    t("A verificação em disco corrigiu premissas importantes herdadas do histórico do projeto. As "),
    b("oito correções técnicas da Etapa 1.1 já estão aplicadas"),
    t(" e auditáveis no repositório: o tipo de prioridade de tarefas voltou a ser exportado, a validação de tipos está ativa no build, a view financeira usa security_invoker, os votos de sócios vivem em tabela relacional com RLS por identidade, todas as funções têm search_path fixado e a suíte de testes automatizados está instalada, com 84 testes aprovados e 7 pulados. O que de fato permanece pendente é menor e bem delimitado: a suíte de integração RLS nunca foi executada contra um banco real — ela pula sozinha enquanto as variáveis de ambiente não existirem — e o arquivo "),
    c(".env.local"),
    t(" não foi criado, por ser insumo exclusivo do contratante."),
  ]));

  out.push(p([
    t("O plano segue as três fases exigidas. A "),
    b("Fase 1"),
    t(" — comparação de componentes, inventário de reutilização, estratégia de transformação, mapeamento de indicadores para fontes reais, separação entre visual e regra de negócio, riscos de regressão e critérios de rollback — é entregue executada, por análise documentada com base em leitura direta dos arquivos. A "),
    b("Fase 2"),
    t(" prepara a validação técnica: conexão Supabase sem criar credenciais ou dados fictícios, revisão formal das migrations endurecidas, especificação de execução dos sete testes de integração RLS e auditoria de segredos no frontend. A "),
    b("Fase 3"),
    t(", que depende de autorização específica, substituirá somente a tela inicial do CEO por composição protegida por flag, preservando integralmente login, controle de acesso, navegação entre ambientes, dados compartilhados, funcionalidades comerciais e operacionais, PWA e testes existentes."),
  ]));

  out.push(p([
    t("O esforço estimado é de "),
    b("6 a 8 horas para a Fase 2"),
    t(" e de "),
    b("66 a 97 horas para a Fase 3"),
    t(" (76 a 112 horas com reserva de contingência de 15%), além de insumos que só o contratante pode fornecer: o projeto Supabase de teste com quatro usuários de teste, as variáveis de ambiente e, para os gates finais de desempenho, o ambiente de publicação. As estimativas assumem um único desenvolvedor sênior familiarizado com a base, com precisão declarada de mais ou menos 30%. Os pontos de autorização são explícitos: nada da Fase 2 será executado antes de autorização, e a Fase 3 exige autorização adicional e específica, nos termos do PROMPT 05."),
  ]));

  /* ═══ 1. Estado Atual Verificado ═══ */
  out.push(h1("1. Estado Atual Verificado"));

  out.push(h2("1.1 Fundação técnica verificada em disco"));
  out.push(p([
    t("O inventário abaixo foi obtido por leitura direta dos arquivos do repositório — não por memória, nem por documentação. Ele estabelece a linha de base contra a qual qualquer integração será medida e explica por que este plano parte de evoluir a fundação existente, e não de recriar sistema algum. A fundação compreende oito módulos de biblioteca em "),
    c("src/lib/frameflow/"),
    t(", o cliente Supabase com fluxo PKCE, o shell responsivo com três ambientes, quarenta e sete primitivas de interface, a camada PWA e seis migrations SQL com políticas RLS completas."),
  ]));

  out.push(...tbl({
    caption: "Fundação do FRAME FLOW — verificação atual",
    headers: ["Ativo", "Estado verificado"],
    widths: [34, 66],
    rows: [
      [[c("supabase/migrations/")], "Seis migrations (0001 a 0006): perfis e permissões com trigger de criação de perfil e anti-elevação de cargo; comercial; operacional; financeiro com view blindada; decisões com votos relacionais e histórico protegido por trigger; engine de automações idempotente."],
      ["Camada de dados", [t("DataProvider tipado em ", { size: 20 }), c("data.tsx", { size: 20 }), t(" com mappers de centavos para BRL, conversão de convenções de nomes e estados honestos (ListResult) para carregando, vazio, erro e não configurado.", { size: 20 })]],
      ["Autenticação", "Cliente Supabase com fluxo PKCE persistido (chave frameflow.auth), login por e-mail e senha, modo de pré-visualização restrito ao estado sem configuração e nunca gerador de sessão."],
      ["Shell e ambientes", "Sidebar recolhível no desktop, bottom-nav com cinco atalhos por ambiente no mobile, troca de ambiente sem novo login e trinta e seis módulos mapeados com fase."],
      ["Tela inicial do CEO atual", "Nove componentes em src/components/executivo/ (Direção Criativa 02): Command Header, Cap Intelligence, Financial Intelligence, Operational Pulse, Decision Center, paleta de comandos, véu de boot cinematográfico e hook de derivação de dados."],
      ["Testes automatizados", "Vitest 3 com Testing Library e jsdom: oito suítes unitárias (84 testes aprovados) e uma suíte de integração RLS com sete testes que pulam sozinha sem banco de teste."],
      ["PWA", "Manifest gerado por código, service worker que mantém Supabase e autenticação fora do cache, ícones gerados, botão de instalação e registro apenas em produção."],
      ["Qualidade da Etapa 1.1", "ESLint sem erros, verificação de tipos sem erros, build de produção com validação de tipos ativa, smoke test HTTP e verificação em navegador nos formatos desktop e mobile, conforme documentado em docs/STATUS.md."],
    ],
  }));

  out.push(h2("1.2 Correção de premissas históricas"));
  out.push(p([
    t("O histórico do projeto registrou as oito correções da Etapa 1.1 como autorizadas e ainda não executadas. A verificação atual demonstra que elas "),
    b("já foram executadas e validadas"),
    t(". A tabela a seguir confronta cada afirmação anterior com o estado verificado e a evidência encontrada no código. Esse acerto de contas importa porque o plano não pode recomendar trabalho já feito, nem omitir trabalho realmente pendente."),
  ]));

  out.push(...tbl({
    caption: "Afirmações anteriores x estado verificado no repositório",
    headers: ["Afirmação anterior", "Estado", "Evidência verificada"],
    widths: [34, 14, 52],
    rows: [
      ["TaskPriority não exportado de types.ts", "Corrigido", "O tipo está exportado em src/lib/frameflow/types.ts e é usado pelo schema de tarefas."],
      ["ignoreBuildErrors ativo no next.config.ts", "Corrigido", "A configuração contém apenas output standalone e reactStrictMode falso; comentário local declara que o build valida tipos."],
      ["tsconfig.json incluindo scaffold no include", "Corrigido", "O include cobre src, tests e configurações; pastas de scaffold aparecem apenas no exclude."],
      ["View da migration 0004 sem security_invoker", "Corrigido", "vencimentos_em_aberto é criada com security_invoker ativo e grants revogados de anon e public."],
      ["Votos armazenados em coluna JSONB (0005)", "Corrigido", "Os votos vivem na tabela relacional decisao_votos, com chave primária dupla e RLS por identidade; o histórico permanece JSONB, porém blindado por trigger."],
      ["Função eh_interno sem search_path fixado", "Corrigido", "Todas as funções SQL declaram search_path explícito, conforme a regra de segurança do Supabase."],
      ["Nenhum framework de testes instalado", "Corrigido", "Vitest, Testing Library e jsdom estão nas dependências de desenvolvimento, com vitest.config.ts e nove suítes em tests/."],
      ["Arquivo .env.local inexistente", "Confirmado", "Existe apenas .env.example, listando somente os nomes das duas variáveis públicas exigidas. É insumo do contratante, não pendência de engenharia."],
    ],
  }));

  out.push(p([
    t("Duas pendências permanecem reais e inerentes ao processo: a suíte de integração RLS ainda não teve um banco Supabase real contra o qual rodar e o aplicativo ainda não foi conectado a projeto algum. Nenhuma delas bloqueia este planejamento; ambas têm lugar definido na Fase 2, com pré-requisitos e método especificados no capítulo 3. Enquanto as variáveis de ambiente não forem fornecidas, a suíte de integração continua pulando de forma automática e honesta, e o aplicativo continua exibindo seus estados não configurados com dignidade, sem qualquer número fictício."),
  ]));

  out.push(h2("1.3 O protótipo aprovado está versionado no repositório"));
  out.push(p([
    t("O protótipo do PROMPT 04 está presente em dois locais: em "),
    c("download/frameflow-prototipo-prompt04/"),
    t(", como pacote de entrega com o relatório em PDF e treze capturas de tela, e em cópia idêntica em "),
    c("public/prototypes/"),
    t(", dentro da pasta servida pelos builds de produção. Os ativos técnicos do protótipo são sete arquivos: "),
    c("common.css"),
    t(" com os tokens compartilhados, as folhas desktop e mobile, os roteiros de interação desktop e mobile, o dataset demonstrativo rotulado em "),
    c("data.js"),
    t(" e o motor do núcleo orbital em "),
    c("orbital.js"),
    t(". A composição aprovada compreende quatro contextos (Visão Geral, Inteligência Financeira, Central de Decisões e Ecossistema), dois modos (Comando e Imersivo), a paleta de comandos com doze ações em seis grupos, o dock da Cap com quatro estados demonstrativos e o núcleo orbital desenhado em canvas 2D com projeção 3D própria, sem dependências externas."),
  ]));
  out.push(p([
    t("Um ponto de higiene de implantação é levantado como risco R13 no capítulo 2: a cópia em "),
    c("public/prototypes/"),
    t(" adiciona 4,2 megabytes a cada bundle de produção, porque o processo de build copia a pasta pública para o artefato autônomo. O plano recomenda removê-la da pasta pública durante a Fase 3, mantendo o pacote íntegro em download/ e no histórico do git. A decisão, contudo, pertence ao contratante, pois a cópia pública pode estar servindo de referência a sócios e avaliadores. Se mantida, o custo é apenas de peso, sem risco funcional."),
  ]));

  out.push(h2("1.4 Pendências reais e insumos externos"));
  out.push(p([
    t("Encerrado o acerto de premissas, as pendências reais do projeto são exclusivamente operacionais e dependem de insumos do contratante. A tabela abaixo registra cada uma, o responsável natural e o momento do plano em que se resolve. Nenhuma delas é criada ou simulada por esta engenharia: o PROMPT 05 é explícito ao proibir credenciais, contas ou dados fictícios, e este plano cumpre a proibição ponta a ponta."),
  ]));

  out.push(...tbl({
    caption: "Pendências reais — responsável e momento de resolução",
    headers: ["Pendência", "Responsável", "Quando resolve"],
    widths: [46, 20, 34],
    rows: [
      ["Projeto Supabase real e variáveis em .env.local (duas variáveis públicas)", "Contratante", "Antes ou durante a Fase 2; guia existente em docs/SETUP-SUPABASE.md"],
      ["Projeto Supabase de teste descartável com as seis migrations e quatro usuários de teste", "Contratante", "Fase 2 — pré-requisito da suíte RLS"],
      ["Execução da suíte de integração RLS (sete testes) com evidências", "Engenharia", "Fase 2, imediatamente após os insumos acima"],
      ["Assets oficiais da Cap (arte 2D aprovada)", "Contratante", "Fase 3 — a área integrada permanece com arte de referência rotulada"],
      ["Ambiente de publicação para os gates de desempenho", "Contratante", "Fase 3, etapa final — sem ele, Lighthouse é medido em build local com ressalva"],
    ],
  }));

  out.push(note("Nota de escopo: este documento não altera o aplicativo, não executa migrations, não cria contas e não gera dados. Toda execução começa somente após as autorizações previstas nos marcos do capítulo 5."));

  return out;
};
