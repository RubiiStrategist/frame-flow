/** PROMPT 05 — conteúdo C: Fase 2 — Validação Técnica + Fase 3 — Prova de Conceito (pt-BR) */
module.exports = function build(kit) {
  const { h1, h2, p, bullets, num, tbl, t, b, c, note } = kit;
  const out = [];

  /* ═══ 3. Fase 2 — Validação Técnica ═══ */
  out.push(h1("3. Fase 2 — Validação Técnica"));

  out.push(h2("3.1 Conexão com o Supabase, sem credenciais nem dados fictícios"));
  out.push(p([
    t("O princípio é taxativo: nada é criado por esta engenharia — nenhum projeto, nenhuma conta, nenhuma chave, nenhum dado, fictício ou não. A conexão usa o contrato já implementado e testado: as duas variáveis públicas lidas por "),
    c("src/lib/supabase/config.ts"),
    t(", com validação estrita de URL em https, host supabase e formato de JWT, fornecidas pelo contratante em "),
    c(".env.local"),
    t(" conforme o guia existente em "),
    c("docs/SETUP-SUPABASE.md"),
    t(". Enquanto essas variáveis não existirem, o aplicativo permanece em seu estado não configurado, honesto e rotulado, e o modo de pré-visualização segue disponível apenas nesse estado — comportamento já coberto por testes de unidade."),
  ]));
  out.push(p([
    t("Para a suíte de integração, o banco é um projeto de teste descartável, criado e mantido pelo contratante. O runbook abaixo será materializado como "),
    c("docs/VALIDACAO-RLS.md"),
    t(" na primeira hora da Fase 2 autorizada, e cada passo é do contratante — a engenharia somente prepara o roteiro, executa a suíte e registra as evidências:"),
  ]));
  out.push(...bullets([
    [t("Criar um projeto Supabase de ", { size: 24 }), b("teste descartável"), t(", separado de qualquer dado real.", { size: 24 })],
    [t("Executar as seis migrations em ordem (0001 a 0006) no editor SQL do projeto de teste.", { size: 24 })],
    [t("Criar os ", { size: 24 }), b("quatro usuários de teste"), t(" na autenticação com senhas fortes: sócio A (cargo ceo), sócio B (cargo cro), colaborador e cliente externo.", { size: 24 })],
    [t("Atribuir os cargos por SQL, usando o bloco SEED documentado na migration 0001 — o trigger anti-elevação bloqueia promoção pelo próprio cliente, por projeto.", { size: 24 })],
    [t("Definir as variáveis de teste: URL e chave anônima do projeto de teste mais as credenciais dos quatro usuários, conforme o cabeçalho da suíte.", { size: 24 })],
    [t("Executar a suíte completa e registrar o log integral como evidência.", { size: 24 })],
  ]));
  out.push(p([
    t("Os quatro estados reais exigidos pelo PROMPT 05 — carregando, vazio, erro e conectado — já têm contrato implementado na fundação, via "),
    c("ListResult"),
    t(", "),
    c("useAsyncList"),
    t(" e "),
    c("EmptyState"),
    t(", com o motivo de não configurado como cidadão de primeira classe. A Fase 2 formaliza esse contrato; a Fase 3 apenas o aplica à nova composição visual. Nenhum estado novo é inventado e nenhum dado de demonstração é promovido a dado real."),
  ]));

  out.push(h2("3.2 Revisão das migrations endurecidas na Etapa 1.1"));
  out.push(p([
    t("A revisão por arquivo, abaixo, confirma que as seis migrations estão na forma endurecida descrita na Etapa 1.1 — a verificação foi feita por leitura direta do SQL, nesta entrega, sem executar nada contra banco. A conclusão é direta: "),
    b("nenhuma mudança de esquema é necessária"),
    t(" para a prova de conceito da Fase 3, e a execução real dessas migrations no projeto de teste é o pré-requisito imediato dos sete testes de integração."),
  ]));

  out.push(...tbl({
    caption: "Migrations — conteúdo essencial e verificação",
    headers: ["Arquivo", "Conteúdo essencial verificado", "Estado"],
    widths: [22, 62, 16],
    rows: [
      [[c("0001_perfis_e_permissoes.sql")], "Enums de papel e ambiente; tabela de perfis ligada a auth.users; função eh_interno com search_path fixo; trigger de criação de perfil no primeiro login; trigger anti-elevação de cargo; RLS de leitura própria ou interna; bloco SEED de sócios documentado em comentário.", "Endurecida"],
      [[c("0002_comercial.sql")], "Clientes e leads com valor estimado em centavos; RLS interno para leitura e escrita via eh_interno.", "Endurecida"],
      [[c("0003_operacional.sql")], "Projetos e tarefas com chaves estrangeiras e orçamento em centavos; RLS interno para CRUD.", "Endurecida"],
      [[c("0004_financeiro.sql")], "Transações financeiras com valor em centavos e restrição de não negativo; view vencimentos_em_aberto com security_invoker ativo e grants revogados de anon e public; RLS interno.", "Endurecida"],
      [[c("0005_decisoes.sql")], "Decisões com impacto financeiro em centavos e histórico blindado por trigger; tabela relacional decisao_votos com chave primária dupla; RLS por identidade: sócio grava apenas o próprio voto, apenas em decisão aberta, sem política de exclusão.", "Endurecida"],
      [[c("0006_engine.sql")], "Automações com unicidade por nome, entidade e identificador; trigger idempotente de venda fechada; RLS de leitura interna.", "Endurecida"],
    ],
  }));

  out.push(h2("3.3 Os sete testes de integração RLS pendentes"));
  out.push(p([
    t("A suíte existe e está pronta em "),
    c("tests/integration/rls-supabase.test.ts"),
    t(": usa a mesma biblioteca do aplicativo, autentica quatro clientes com sessões distintas e limpa os registros que cria. Sem as variáveis de ambiente, ela pula sozinha — comportamento verificado na última execução documentada, com sete testes reportados como pulados. Os sete testes, suas garantias e resultados esperados:"),
  ]));

  out.push(...tbl({
    caption: "Sete testes de integração RLS — especificação e resultado esperado",
    headers: ["Id", "Garantia verificada", "Resultado esperado"],
    widths: [8, 57, 35],
    rows: [
      ["T1", "O trigger de criação de perfil gerou perfil com cargo correto para o sócio autenticado", "Perfil único do usuário com cargo ceo, sem erro"],
      ["T2", "Anti-elevação: usuário autenticado não promove o próprio cargo", "Atualização bloqueada com a mensagem de elevação de cargo"],
      ["T3", "Decisões: sócio cria; colaborador interno lê e não cria; cliente externo não lê nada", "Criação do sócio sem erro; leitura do colaborador; bloqueio da criação do colaborador; zero linhas para o externo"],
      ["T4", "Votos relacionais: cada sócio grava apenas o próprio voto; voto em nome de outro é bloqueado; alteração do voto alheio não altera nada", "Inserção própria sem erro; inserção fraudulenta com erro; atualização alheia sem erro porém zero linhas afetadas"],
      ["T5", "Histórico de decisão imune a reescrita manual; mudança legítima de status segue funcionando", "Reescrita manual falha com erro de histórico; mudança de status grava evento pelo trigger"],
      ["T6", "Financeiro: sócio lê tabela e view; cliente externo lê zero nas duas; colaborador interno lê", "Uma linha para interno na tabela e na view; zero para o externo nas duas"],
      ["T7", "Engine idempotente: um único evento de venda fechada por lead, mesmo reentrando na etapa", "Contagem exatamente igual a um em todos os cenários de reentrada"],
    ],
  }));

  out.push(p([
    t("Método de execução: rodar a suíte completa com as variáveis de teste presentes e anexar o log integral, a data e a identificação do banco descartável como evidência. O resultado esperado é sete testes aprovados e nenhum pulado naquela execução. A higiene é herdada da própria suíte: leads e decisões criadas são removidas ao final de cada caso; eventos de automação são registrados por design sem política de exclusão, o que reforça a recomendação de banco descartável. Se qualquer teste falhar, a falha é tratada como bloqueador da Fase 3 e diagnosticada antes de qualquer avanço — nunca relativa."),
  ]));

  out.push(h2("3.4 Segurança de segredos no frontend"));
  out.push(p([
    t("A arquitetura de segurança é explícita: a chave anônima do Supabase é pública por design — trafega no frontend de qualquer aplicação Supabase — e a fronteira real de proteção é o conjunto de políticas RLS no banco, que é exatamente o que a suíte T1 a T7 valida. O que é proibido, sem exceção: a chave de função de serviço (service_role) em qualquer arquivo de "),
    c("src/"),
    t(", em qualquer variável com prefixo público, no service worker ou no bundle. O arquivo "),
    c(".env.example"),
    t(" existe apenas com os nomes das duas variáveis públicas e uma advertência comentada sobre a chave de serviço; o "),
    c(".gitignore"),
    t(" cobre arquivos de ambiente; o service worker mantém Supabase e autenticação fora do cache por estratégia de rede somente — tudo verificado nesta entrega."),
  ]));
  out.push(p([
    t("Na Fase 2, a auditoria vira rotina executável: um roteiro de varredura estática confirma zero ocorrências de service_role em código e em pasta pública, confirma a cobertura do gitignore e confirma que nenhuma variável nova de ambiente entra sem nome documentado. O risco R13 conecta-se aqui: o build copia a pasta pública para o artefato autônomo, portanto nenhum segredo pode jamais residir ali. O fluxo PKCE persistido com a chave de sessão existente permanece intocado pela integração, e qualquer mudança futura nas estratégias de cache do service worker exige justificativa explícita em revisão."),
  ]));

  /* ═══ 4. Fase 3 — Prova de Conceito Integrada ═══ */
  out.push(h1("4. Fase 3 — Prova de Conceito Integrada"));

  out.push(h2("4.1 Escopo estrito e matriz de preservação"));
  out.push(p([
    t("A prova de conceito substitui exclusivamente a tela inicial do Ambiente Executivo, atrás de flag com padrão desligado. Tudo o mais é preservado por matriz verificável — cada item exigido pelo PROMPT 05 mapeado ao ativo concreto que o cumpre e ao método que comprovará a preservação no encerramento da fase. A área da Cap permanece com arte de referência rotulada, aguardando os assets oficiais; nenhum mascote é inventado."),
  ]));

  out.push(...tbl({
    caption: "Matriz de preservação — exigência, ativo e verificação",
    headers: ["Exigência do PROMPT 05", "Ativo concreto preservado", "Verificação na Fase 3"],
    widths: [26, 42, 32],
    rows: [
      ["Login e autenticação", [t("Sessão PKCE em ", { size: 20 }), c("auth.tsx", { size: 20 }), t(", cliente em ", { size: 20 }), c("client.ts", { size: 20 }), t(", tela de login e gate por status", { size: 20 })], "Fumaça de login, logout e sessão persistida; arquivos intocados na revisão"],
      ["Controle de acesso", [t("Definições de ambiente em ", { size: 20 }), c("environments.ts", { size: 20 }), t(" e políticas RLS do banco", { size: 20 })], "Reexecução da suíte RLS; nenhum papel novo criado"],
      ["Navegação entre ambientes", [c("router.ts", { size: 20 }), t(", seletor de ambiente do topbar, troca sem novo login", { size: 20 })], "Caminhada pelos três ambientes por clique e por URL direta"],
      ["Dados compartilhados", [t("DataProvider com mappers e estados honestos", { size: 20 })], "Extensão apenas aditiva; suíte de mappers existente continua verde"],
      ["Funcionalidades comerciais e operacionais", [t("Views de comercial, operacional, decisões, indicadores e financeiro", { size: 20 })], "Zero alteração nesses arquivos; listados como proibidos de toque"],
      ["PWA", [t("Manifest, service worker, registro apenas em produção e botão de instalação", { size: 20 })], "Teste de instalação e de atualização com a versão de cache elevada"],
      ["Testes existentes", [t("Oito suítes unitárias e a suíte de integração RLS", { size: 20 })], "Execução integral a cada etapa; qualquer vermelho é bloqueador"],
    ],
  }));

  out.push(h2("4.2 Dos dados demonstrativos aos estados reais"));
  out.push(p([
    t("O dataset do protótipo não entra no aplicativo — nem valores, nem textos de contexto, nem votações simuladas. Cada região da nova tela consome as derivações reais do hook estendido e apresenta os quatro estados contratuais, já usados pela fundação e agora aplicados à linguagem editorial:"),
  ]));
  out.push(...bullets([
    [b("Carregando: "), t("esqueleto editorial em silhueta, sem número provisório.", { size: 24 })],
    [b("Vazio: "), t("estado vazio com convite para a ação, no padrão do EmptyState existente.", { size: 24 })],
    [b("Erro: "), t("mensagem objetiva com botão de repetir, sem esconder a falha.", { size: 24 })],
    [b("Conectado: "), t("dados reais lidos pelo cliente sob RLS, convertidos dos centavos pela camada testada.", { size: 24 })],
  ]));
  out.push(p([
    t("Indicadores sem fonte real — aportes e metas — permanecem slots honestos rotulados, visíveis como capacidades futuras, jamais como números. A regra de honestidade do produto vale para a camada visual nova exatamente como vale hoje: sem Supabase configurado, a tela é digna e clara sobre o que falta, com chamada para a configuração. Esse comportamento é o que separa a prova de conceito de uma maquete e é condição de aceite inegociável."),
  ]));

  out.push(h2("4.3 Sequência de implementação"));
  out.push(p([
    t("Onze etapas, cada uma com entregas verificáveis, dependências explícitas, esforço estimado e um PR atômico. Nenhuma etapa avança com a anterior vermelha em qualquer gate; a flag permanece desligada até a etapa final, e as camadas visuais novas convivem com a composição atual no mesmo pacote, sem custo de render para o usuário enquanto desligadas."),
  ]));

  out.push(...tbl({
    caption: "Sequência S1 a S11 — entregas, dependências e esforço",
    headers: ["Etapa", "Entregas e arquivos afetados", "Depende de", "Esforço"],
    widths: [8, 56, 16, 20],
    rows: [
      ["S1", [t("Tokens e fontes: extensão aditiva de ", { size: 20 }), c("globals.css", { size: 20 }), t(" (escada de contraste, painéis por modo, utilitários serif e mono, cantoneiras, perfuração, grão, vinheta, letterbox) e ", { size: 20 }), c("layout.tsx", { size: 20 }), t(" com next/font para as duas famílias novas", { size: 20 })], "Nenhuma", "4 a 6 h"],
      ["S2", [t("Camada de dados: derivações novas em ", { size: 20 }), c("use-dados-ceo.ts", { size: 20 }), t(" (caixa, runway, categorias, semana, pipeline, contas com nome de cliente); junção aditiva opcional de leitura em ", { size: 20 }), c("data.tsx", { size: 20 }), t("; testes unitários das derivações", { size: 20 })], "S1", "6 a 9 h"],
      ["S3", [t("Primitivas editoriais em ", { size: 20 }), c("src/components/executivo/signature/", { size: 20 }), t(": painel editorial, KPI, barra de segmentos de voto, chips", { size: 20 })], "S1", "4 a 6 h"],
      ["S4", [t("Contextos e integração ao shell: trilho de contexto, cabeçalho editorial fundido ao Command Header existente, ramo por flag em ", { size: 20 }), c("views/executivo/inicio.tsx", { size: 20 })], "S2, S3", "6 a 8 h"],
      ["S5", [t("Painel financeiro editorial: contexto financeiro completo e região na visão geral, com séries, categorias, contas por cliente e alertas derivados", { size: 20 })], "S4", "8 a 12 h"],
      ["S6", [t("Central de decisões contextual: prévia, lista com filtros, gaveta com foco preso e votação real via castVote; pedir contexto vira abstenção com comentário", { size: 20 })], "S4", "8 a 12 h"],
      ["S7", [t("Ecossistema e núcleo orbital: ", { size: 20 }), c("orbital-engine.ts", { size: 20 }), t(" portado, componente de canvas, derivador de nós e arestas reais, presets de câmera por contexto", { size: 20 })], "S2, S3", "10 a 14 h"],
      ["S8", [t("Modos e camada cinematográfica: provedor de modo com persistência, grão, vinheta e letterbox ativos apenas no Imersivo, alternador no cabeçalho", { size: 20 })], "S4", "5 a 7 h"],
      ["S9", [t("Cap no novo palco e paleta estendida: reskin do palco da Cap na tela do CEO (componente da Cap intocado) e comandos novos na paleta de comandos", { size: 20 })], "S4", "4 a 6 h"],
      ["S10", [t("Testes novos: derivações, estados honestos por região, provedor de modo, orbital estático em movimento reduzido, navegação de contextos", { size: 20 })], "S1 a S9", "6 a 9 h"],
      ["S11", [t("Gates finais e evidências: execução integral da qualidade obrigatória, correções finais, relatório com resultados medidos e flag liberada para avaliação", { size: 20 })], "S10", "5 a 8 h"],
    ],
  }));

  out.push(h2("4.4 Gates de qualidade obrigatórios — como serão executados e apresentados"));
  out.push(p([
    t("Cada gate tem comando, critério objetivo e evidência entregue. Nada é autoavaliado: o que o PROMPT 05 pede para executar e apresentar será apresentado como saída de ferramenta — log, captura ou relatório — e o relatório final separa explicitamente o que foi medido do que permanece pendente de validação por falta de ambiente. A última execução integral conhecida da base é a da Etapa 1.1, com zero erros de lint e de tipos, 84 testes aprovados, build com validação de tipos e verificação em navegador; a Fase 3 repete esse protocolo sobre a base estendida."),
  ]));

  out.push(...tbl({
    caption: "Gates obrigatórios — método, critério e evidência",
    headers: ["Verificação", "Método e comando", "Critério de aprovação", "Evidência apresentada"],
    widths: [18, 30, 26, 26],
    rows: [
      ["ESLint", [c("bun run lint", { size: 20 })], "Zero erros", "Log integral da execução"],
      ["TypeScript", [c("bun run typecheck", { size: 20 }), t(" (tsc sem emissão)", { size: 20 })], "Zero erros", "Log integral da execução"],
      ["Build", [c("bun run build", { size: 20 })], "Aprovado com validação de tipos ativa", "Log de build com a etapa de tipos presente"],
      ["Testes automatizados", [c("bun run test", { size: 20 })], "Suítes existentes preservadas e novas aprovadas; sete de RLS aprovados quando as variáveis existirem na data", "Log com contagens por suíte"],
      ["Responsividade", "Protocolo nos formatos 390, 768 e 1440 pixels, reutilizando os roteiros de QA do PROMPT 04", "Zero overflow horizontal; alvos de toque mantidos", "Capturas de tela com as medidas registradas"],
      ["Acessibilidade", "Contraste medido por script (reuso do medidor dos QA do protótipo); caminhada de teclado; movimento reduzido", "Contraste AA nos pares obrigatórios; foco visível; Esc por camada; orbital estático em movimento reduzido", "Relatório de contraste com valores por par e roteiro de teclado registrado"],
      ["Desempenho", "Lighthouse mobile sobre build de produção; delta de bundle; quadros por segundo do orbital com medidor interno", "Performance igual ou acima de 85; acessibilidade igual ou acima de 90; delta de bundle documentado", "Relatório Lighthouse em JSON e medições anotadas"],
    ],
  }));

  out.push(note("Endurecimento futuro, fora do escopo e recomendado: as aproximadamente trinta regras de ESLint desligadas no config atual e o any implícito permitido no tsconfig merecem revisão dedicada após a prova de conceito — registrados aqui para não se perderem."));

  out.push(h2("4.5 Aceite e rollback da Fase 3"));
  out.push(p([
    t("O aceite é uma lista curta e verificável, sem espaço para interpretação:"),
  ]));
  out.push(...num("num-aceite", [
    "Todos os gates verdes, com evidências de ferramenta anexadas ao relatório final.",
    "Matriz de preservação verificada item a item, com fumaças registradas.",
    "Estados reais confirmados em cada região da nova tela, incluindo não configurado.",
    "Flag ligada apenas para avaliação do contratante, com composição atual ainda presente no código.",
    "Relatório final separando o medido do pendente de validação, com motivos de cada pendência.",
  ]));
  out.push(p([
    t("O rollback segue os critérios objetivos da seção 2.7: qualquer gatilho dispara a reversão da etapa correspondente, com a flag desligada por padrão mantendo os usuários na composição atual o tempo todo. Se o contratante aprovar, a extensão da linguagem às demais telas passa a ser escopo de nova solicitação — a decisão de rollout não pertence a esta fase."),
  ]));

  return out;
};
