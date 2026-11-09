/* ════════════════════════════════════════════════════════════════════
   FRAME FLOW OS · PROMPT 04 — Protótipo interativo independente
   Dataset DEMONSTRATIVO — 100% fictício, sem conexão com Supabase
   ou migrations. Fonte única de verdade para desktop e mobile.
   Números e nomes preservados do Conceito C (PROMPT 03, aprovado
   como direção): Rubian·CEO, William·CRO, Letícia·COO+CFO,
   R$ 284.500 receita, semana 44, 2 contas vencidas.
   ════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var D = {

    meta: {
      produto: 'FRAME FLOW OS',
      etapa: 'PROMPT 04 · Protótipo interativo de exploração',
      usuario: 'Rubian',
      iniciais: 'R',
      papel: 'CEO',
      semana: '44',
      parceiros: [
        { n: 'William', p: 'CRO', voto: 'aprova' },
        { n: 'Letícia', p: 'COO+CFO', voto: 'aprova com ressalva de caixa' }
      ],
      aviso: 'Protótipo de exploração — não faz parte do aplicativo em produção · dados demonstrativos fictícios',
      avisoCurto: 'DEMO'
    },

    /* ── Inteligência Financeira ─────────────────────────────── */
    financeiro: {
      receitaMes: { v: 'R$ 284.500', delta: '+6,2%', label: 'receita do mês' },
      resultado: { v: 'R$ 106.200', label: 'resultado' },
      despesas: { v: 'R$ 178.300', label: 'despesas' },
      aReceber: { v: 'R$ 96.200', nota: '2 vencidas' },
      metaQ4: { v: '74%', nota: '▲' },
      caixa: { v: 'R$ 1.610.000' },
      runway: { v: '9 meses' },
      /* série demonstrativa — receita mensal MAI→OUT (SVG no brief em papel) */
      serie: [
        { m: 'MAI', y: 126 }, { m: 'JUN', y: 118 }, { m: 'JUL', y: 104 },
        { m: 'AGO', y: 92 }, { m: 'SET', y: 74 }, { m: 'OUT', y: 30 }
      ],
      despesasCat: [
        { k: 'Equipe', pct: 58 },
        { k: 'Produção', pct: 22 },
        { k: 'Infra', pct: 11 },
        { k: 'Outros', pct: 9 }
      ],
      contas: [
        { cliente: 'Set Vitta', nf: 'NF 1043', v: 'R$ 38.400', estado: 'vencida há 12 dias', tone: 'vencida' },
        { cliente: 'Norte Produções', nf: 'NF 1047', v: 'R$ 12.900', estado: 'vencida há 3 dias', tone: 'vencida' },
        { cliente: 'Agência Vértice', nf: 'NF 1051', v: 'R$ 28.300', estado: 'vence sexta', tone: 'proxima' },
        { cliente: 'Aurora Filmes', nf: 'NF 1052', v: 'R$ 16.600', estado: 'vence 12 NOV', tone: 'ok' }
      ],
      alertas: [
        { t: '2 contas vencidas', d: 'Set Vitta e Norte Produções · R$ 51.300 parado', acao: 'Ver contas', ctx: 'financeiro' },
        { t: 'Locação de equipamentos', d: 'contrato renova em 12 NOV · R$ 8.400/mês', acao: 'Abrir decisão das lentes', ctx: 'decisoes' },
        { t: 'Folha de pagamento', d: '.fecha dia 05 NOV · R$ 96.800' }
      ],
      aportes: [
        { k: 'Agência Vértice', v: 'R$ 60.000', d: '06 NOV' },
        { k: 'Festival Lume — inscrição', v: '−R$ 4.800', d: '10 NOV', neg: true }
      ]
    },

    /* ── Indicadores Comerciais ───────────────────────────────── */
    comercial: {
      pipeline: [
        { k: 'Prospecção', pct: 62, v: 'R$ 180K' },
        { k: 'Proposta', pct: 78, v: 'R$ 220K' },
        { k: 'Fechamento', pct: 28, v: 'R$ 80K', hot: true }
      ],
      stats: [
        { k: 'Propostas ativas', v: '7' },
        { k: 'Conversão', v: '32%' },
        { k: 'Meta Q4', v: '74%', nota: '▲' }
      ]
    },

    /* ── Pulso Operacional ───────────────────────────────────── */
    pulso: {
      projetos: [
        { id: 'aurora', nome: 'Filme Aurora', desc: 'longa-metragem · corte em revisão', status: 'Produção', hot: true },
        { id: 'vertice', nome: 'Campanha Vértice', desc: 'lançamento · entrega sexta', status: 'Revisão' },
        { id: 'horizonte', nome: 'Série Horizonte', desc: 'documentário · pré-produção', status: 'Planejamento' }
      ],
      stats: [
        { k: 'Em andamento', v: '12', nota: 'tarefas' },
        { k: 'Atrasadas', v: '3', nota: 'tarefas', alerta: true },
        { k: 'Aprovações', v: '2', nota: 'pendentes' },
        { k: 'Entregas 7d', v: '3' }
      ],
      semana: [
        { d: 'DOM', cls: '' }, { d: 'SEG', cls: '' }, { d: 'TER', cls: 'red' },
        { d: 'QUA', cls: 'has' }, { d: 'QUI', cls: 'has' }, { d: 'SEX', cls: 'red' }, { d: 'SÁB', cls: '' }
      ]
    },

    /* ── Central de Decisões ─────────────────────────────────── */
    decisoes: [
      {
        id: 'lentes',
        idx: '01',
        titulo: 'Pacote de lentes anamórficas',
        prazo: 'DOM · 18:00', diasRestantes: 3,
        impacto: 'R$ 42.000', regra: 'maioria', votos: 2, total: 3,
        urgente: true, financeira: true,
        resumo: 'Impacto R$ 42.000 · regra: maioria · 2 de 3 votos',
        contexto: 'O corte final do Filme Aurora exige o look anamórfico definido na direção de fotografia aprovada em agosto. A locação recorrente soma R$ 8.400 por mês e já atrasou duas diárias por indisponibilidade do fornecedor. Restam seis semanas úteis de pós-produção e a janela de entrega do festival não se move. Comprar o pacote elimina o gargalo de agenda e devolve previsibilidade ao cronograma.',
        opcoes: [
          { l: 'A', t: 'Compra à vista', d: 'CAPEX de R$ 42.000 hoje. Payback estimado de 5 meses frente à locação. Menor custo total no ano.' },
          { l: 'B', t: 'Leasing 24 meses', d: 'R$ 2.050/mês, preserva caixa de curto prazo. Custo total de R$ 49.200 — R$ 7.200 acima da compra.' },
          { l: 'C', t: 'Manter locação', d: 'Sem CAPEX, porém exposto à indisponibilidade que já custou duas diárias (R$ 11.600 perdidos).' }
        ],
        impactos: [
          { k: 'CAPEX imediato', v: 'R$ 42.000' },
          { k: 'Fluxo 12 meses (vs. locação)', v: '−R$ 58.800' },
          { k: 'Efeito na margem Q4', v: '+1,8 p.p.' }
        ],
        votoParceiros: 'William aprova · Letícia aprova com ressalva de caixa'
      },
      {
        id: 'editor',
        idx: '02',
        titulo: 'Contratação de editor sênior',
        prazo: 'QUA · 12:00', diasRestantes: 6,
        impacto: 'folha R$ 14.500/mês', regra: 'maioria', votos: 1, total: 3,
        urgente: false, financeira: false,
        resumo: 'Pós-produção · sem impacto direto no caixa · 1 de 3 votos',
        contexto: 'A pós-produção opera com três projetos simultâneos e um único editor fixo, criando gargalo em todas as revisões. A Série Horizonte entra em montagem em janeiro e o Documentário dependente deste fluxo já sente o atraso. Um editor sênior de planta reduz o ciclo de revisão em cerca de dois dias por corte e absorve picos sem diárias de freelancer. A efetivação tem início de janeiro, fora do trimestre atual.',
        opcoes: [
          { l: 'A', t: 'Efetivar em janeiro', d: 'CLT R$ 14.500/mês a partir de 04 JAN. Cobre Horizonte e picos de 2027 com folga.' },
          { l: 'B', t: 'PJ por projeto', d: 'R$ 18.000/mês apenas nos meses de corte intenso. Flexível, porém sem continuidade de critérios.' },
          { l: 'C', t: 'Adiar decisão', d: 'Mantém freelancer atual a R$ 9.800/mês médio, mantendo o gargalo de revisão.' }
        ],
        impactos: [
          { k: 'Folha mensal (efetivado)', v: 'R$ 14.500' },
          { k: 'Efeito no trimestre atual', v: 'neutro' },
          { k: 'Ciclo de revisão', v: '−2 dias por corte' }
        ],
        votoParceiros: 'Letícia aprova · William pendente'
      },
      {
        id: 'festival',
        idx: '03',
        titulo: 'Orçamento Festival Lume 27',
        prazo: 'NOV · 10', diasRestantes: 11,
        impacto: 'R$ 68.000', regra: 'unanimidade', votos: 0, total: 3,
        urgente: false, financeira: true,
        resumo: 'Impacto R$ 68.000 · regra: unanimidade · 0 de 3 votos',
        contexto: 'A edição 27 do Festival Lume concentra os quatro clientes institucionais que a FRAME VISION quer atrair em 2027. O pacote de patrocínio garante curadoria à mesa, case de 12 minutos e networking dirigido com os tomadores de decisão do setor. O investimento de R$ 68.000 entra no orçamento do trimestre e pressiona a Meta Q4 — o histórico do festival aponta retorno médio de 1,9x em novos contratos em até dois trimestres.',
        opcoes: [
          { l: 'A', t: 'Patrocínio ouro', d: 'R$ 68.000 — case de 12 min, mesa de curadoria e dois credenciais de networking.' },
          { l: 'B', t: 'Patrocínio prata', d: 'R$ 36.000 — case de 6 min, um credencial. Perde a mesa de curadoria.' },
          { l: 'C', t: 'Não participar', d: 'Preserva o caixa do trimestre; mantém o gap de prospecção institucional em 2027.' }
        ],
        impactos: [
          { k: 'Investimento trimestral', v: 'R$ 68.000' },
          { k: 'Pressão na Meta Q4', v: 'de 74% para 61%' },
          { k: 'Retorno histórico', v: '1,9x em 2 trimestres' }
        ],
        votoParceiros: 'William e Letícia pendentes'
      }
    ],

    /* ── Cap (placeholder — asset oficial será fornecido) ─────── */
    cap: {
      titulo: 'Cap Executiva',
      notaAsset: 'Arte de referência · asset oficial da Cap será fornecido pela FRAME VISION',
      notaIntegracao: 'Área reservada de integração: 1:1, quatro estados animados (atenção · processando · alerta · confirmação), formato vetorial + PNG @2x.',
      estados: {
        atencao: {
          rotulo: 'Atenção — 2 contas vencidas',
          fala: 'Cap: separei os vencidos e preparei o resumo da semana 44. Quer que eu abra a Inteligência Financeira?',
          acao: { t: 'Abrir brief financeiro', ctx: 'financeiro' }
        },
        processando: {
          rotulo: 'Processando — consolidando a semana',
          fala: 'Cap: cruzando entregas, notas fiscais e votos dos sócios. O resumo fica pronto em instantes.',
          acao: null
        },
        confirmacao: {
          rotulo: 'Confirmação — resumo enviado',
          fala: 'Cap: resumo da semana 44 enviado ao seu e-mail às 09h12. Três decisões seguem aguardando voto.',
          acao: { t: 'Ver decisões', ctx: 'decisoes' }
        },
        alerta: {
          rotulo: 'Alerta — prazo dominical',
          fala: 'Cap: o pacote de lentes anamórficas vence domingo às 18h. Falta apenas o seu voto para a maioria.',
          acao: { t: 'Abrir decisão das lentes', ctx: 'decisoes', dec: 'lentes' }
        }
      }
    },

    /* ── Ecossistema — núcleo orbital (relações reais) ───────── */
    ecos: {
      nodes: [
        { id: 'hub', tipo: 'hub', nome: 'FRAME OS', sub: 'Rubian · CEO' },
        { id: 'aurora', tipo: 'projeto', nome: 'Filme Aurora', sub: 'produção' },
        { id: 'vertice', tipo: 'projeto', nome: 'Campanha Vértice', sub: 'revisão' },
        { id: 'horizonte', tipo: 'projeto', nome: 'Série Horizonte', sub: 'planejamento' },
        { id: 'lentes', tipo: 'decisao', nome: 'Lentes anamórficas', sub: 'vence domingo' },
        { id: 'editor', tipo: 'decisao', nome: 'Editor sênior', sub: 'quarta' },
        { id: 'festival', tipo: 'decisao', nome: 'Festival Lume 27', sub: 'unanimidade' },
        { id: 'receita', tipo: 'indicador', nome: 'Receita', sub: 'R$ 284.500/mês' },
        { id: 'conversao', tipo: 'indicador', nome: 'Conversão', sub: '32%' },
        { id: 'metaq4', tipo: 'indicador', nome: 'Meta Q4', sub: '74%' },
        { id: 'contas', tipo: 'alerta', nome: 'Contas vencidas', sub: 'R$ 96.200 a receber' }
      ],
      edges: [
        { a: 'hub', b: 'lentes', rel: 'aguarda voto do CEO', tone: 'red' },
        { a: 'hub', b: 'editor', rel: 'aguarda voto do CEO', tone: 'red' },
        { a: 'hub', b: 'festival', rel: 'aguarda voto do CEO', tone: 'red' },
        { a: 'lentes', b: 'aurora', rel: 'destrava o corte final', tone: 'red' },
        { a: 'editor', b: 'horizonte', rel: 'fortalece a pós-produção', tone: 'red' },
        { a: 'festival', b: 'metaq4', rel: 'impacto de R$ 68.000', tone: 'red' },
        { a: 'aurora', b: 'receita', rel: 'financia o resultado' },
        { a: 'vertice', b: 'receita', rel: 'financia o resultado' },
        { a: 'horizonte', b: 'receita', rel: 'financia o resultado' },
        { a: 'conversao', b: 'vertice', rel: 'fechamento do trimestre' },
        { a: 'contas', b: 'receita', rel: 'R$ 51.300 parado', tone: 'alerta' }
      ],
      relacoes: [
        'Lentes anamórficas → Filme Aurora · destrava o corte final',
        'Editor sênior → Série Horizonte · fortalece a pós',
        'Festival Lume 27 → Meta Q4 · impacto de R$ 68.000',
        '3 projetos → Receita · R$ 284.500 no mês',
        'Conversão 32% → Campanha Vértice · fechamento',
        'Contas vencidas → Receita · R$ 96.200 a receber'
      ]
    },

    /* ── Paleta de comandos ⌘K ────────────────────────────────── */
    comandos: [
      { ic: 'IR', t: 'Ir para o <b>Painel executivo</b>', k: 'EX·00', run: 'ctx:painel', kw: 'painel inicio home visao geral' },
      { ic: 'IR', t: 'Ir para <b>Inteligência Financeira</b> — brief do mês', k: 'FF·01', run: 'ctx:financeiro', kw: 'financeiro receita despesas brief caixa contas runway resultado meta' },
      { ic: 'IR', t: 'Ir para a <b>Central de Decisões</b>', k: 'DC·03', run: 'ctx:decisoes', kw: 'decisoes votos socios' },
      { ic: 'IR', t: 'Ir para o <b>Ecossistema</b> — relações reais', k: 'EC·05', run: 'ctx:ecos', kw: 'ecossistema orbital mapa relacoes projetos' },
      { ic: 'VOTO', t: 'Abrir decisão — <b>Pacote de lentes anamórficas</b>', k: 'DOM 18h', run: 'dec:lentes', kw: 'lentes anamorficas aurora 42000', urgent: true },
      { ic: 'VOTO', t: 'Abrir decisão — <b>Contratação de editor sênior</b>', k: 'QUA 12h', run: 'dec:editor', kw: 'editor senior horizonte pos' },
      { ic: 'VOTO', t: 'Abrir decisão — <b>Orçamento Festival Lume 27</b>', k: 'NOV 10', run: 'dec:festival', kw: 'festival lume 68000 meta' },
      { ic: 'CAP', t: 'Abrir a <b>Cap</b>', k: '⇧C', run: 'cap:open', kw: 'cap mascote assistente resumo' },
      { ic: 'CAP', t: 'Pedir à Cap o <b>resumo da semana 44</b>', k: '', run: 'cap:resumo', kw: 'resumo semana cap' },
      { ic: 'MODO', t: 'Alternar <b>Comando / Imersivo</b>', k: '⇧M', run: 'modo:toggle', kw: 'modo comando imersivo 3d ambiente' },
      { ic: 'A11Y', t: 'Alternar <b>movimento reduzido</b>', k: '⇧R', run: 'a11y:toggle', kw: 'movimento reduzido acessibilidade' },
      { ic: 'NOVA', t: 'Nova decisão para os sócios', k: '⇧D', run: 'nova:decisao', kw: 'nova decisao criar' }
    ]
  };

  window.FFDATA = D;

  /* ── Tempo dinâmico (protótipo vivo) ─────────────────────── */
  window.FFTIME = {
    hora: function () { return new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }); },
    relogio: function () {
      return new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    },
    saudacao: function () {
      var h = new Date().getHours();
      if (h < 12) return 'Bom dia';
      if (h < 18) return 'Boa tarde';
      return 'Boa noite';
    },
    dataLonga: function () {
      var s = new Intl.DateTimeFormat('pt-BR', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' }).format(new Date());
      return s.replace(/\./g, '');
    }
  };
})();
