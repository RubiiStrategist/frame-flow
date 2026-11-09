/** PROMPT 05 — conteúdo D: Consolidado — Esforço, Sequência e Marcos (pt-BR) */
module.exports = function build(kit) {
  const { h1, h2, p, bullets, num, tbl, t, b, c, note } = kit;
  const out = [];

  out.push(h1("5. Consolidado — Esforço, Sequência e Marcos"));

  out.push(h2("5.1 Matriz de esforço consolidada"));
  out.push(p([
    t("As faixas abaixo cobrem engenharia de execução — planejamento, código, testes e gates — e excluem o tempo de avaliação do contratante, o fornecimento de insumos externos e qualquer rollout além da tela inicial do CEO. Premissas: um único desenvolvedador sênior familiarizado com a base, ambiente com as ferramentas já instaladas, revisões feitas na sequência sem fila, precisão declarada de mais ou menos trinta por cento."),
  ]));

  out.push(...tbl({
    caption: "Esforço por item, com faixas e notas",
    headers: ["Item", "Faixa", "Notas de estimativa"],
    widths: [40, 14, 46],
    rows: [
      ["Fase 1 — planejamento de integração", "Entregue", "É o conteúdo dos capítulos 2 a 4 deste documento; zero hora de engenharia restante."],
      ["Fase 2 — runbook de validação RLS", "2 h", "Roteiro passo a passo materializado em docs/VALIDACAO-RLS.md."],
      ["Fase 2 — auditoria de segredos e varredura", "1 a 2 h", "Roteiro executável de varredura estática e conferência de coberturas."],
      ["Fase 2 — revisão formal das migrations", "1 h", "Revisão já executada analiticamente aqui; o restante é registro formal junto às evidências."],
      ["Fase 2 — execução da suíte RLS e evidências", "2 a 3 h", "Com banco de teste fornecido; inclui diagnóstico se qualquer teste falhar."],
      ["Subtotal Fase 2", "6 a 8 h", "Bloqueada até autorização e insumos do contratante."],
      ["Fase 3 — S1 a S11 (capítulos 4.3)", "66 a 97 h", "Onze etapas com PR atômico cada; faixa reflete a incerteza normal de composição visual."],
      ["Fase 3 — reserva de contingência", "10 a 15 h", "Quinze por cento sobre o teto da faixa, para correções de gate."],
      ["Subtotal Fase 3", "76 a 112 h", "Aproximadamente onze a dezesseis dias úteis de um desenvolvedor sênior."],
      ["Total geral de engenharia", "82 a 120 h", "Somatório das fases autorizáveis; não inclui rollout às demais telas."],
    ],
  }));

  out.push(h2("5.2 Sequência com pontos de autorização"));
  out.push(p([
    t("O plano avança por marcos, e cada marco tem um gatilho claro — quem decide e o que desbloqueia. Nenhuma execução começa sem o gatilho correspondente, cumprindo a exigência do PROMPT 05 de aguardar autorização, com a Fase 3 exigindo autorização específica e adicional à da Fase 2."),
  ]));

  out.push(...tbl({
    caption: "Marcos, gatilhos e entregáveis",
    headers: ["Marco", "Gatilho", "Entregável"],
    widths: [12, 36, 52],
    rows: [
      ["M0", "Entrega do PROMPT 05 (agora)", "Este plano técnico — nenhum arquivo do aplicativo alterado."],
      ["M1", "Autorização expressa da Fase 2 e insumos: projeto de teste com quatro usuários e variáveis", "Runbook de validação, auditoria de segredos executada, suíte RLS rodada com log integral e resultado sete aprovados."],
      ["M2", "Autorização específica da Fase 3", "Execução S1 a S11 com PR atômico por etapa e flag desligada."],
      ["M3", "Gates verdes da Fase 3", "Relatório final com evidências medidas, flag liberada para avaliação e matriz de preservação verificada."],
      ["M4", "Decisão do contratante", "Aprovação: extensão da linguagem às demais telas vira nova solicitação; ou rollback conforme seção 2.7."],
    ],
  }));

  out.push(p([
    t("Dependências entre marcos: M1 exige os insumos do contratante e nada mais; M2 é recomendada somente após M1 verde, porque a suíte RLS é a rede de segurança da fronteira de dados usada pela nova tela; M3 exige ambiente de publicação para os gates de Lighthouse — sem ele, a medição é feita em build local com a ressalva registrada no relatório. O caminho crítico do início de M1 ao relatório de M3 é a soma das faixas: cerca de onze a dezesseis dias úteis de engenharia, intercalados com as revisões do contratante."),
  ]));

  out.push(h2("5.3 PENDENTE DE VALIDAÇÃO — verificado agora x medível depois"));
  out.push(p([
    t("Nos termos da disciplina do projeto — resultados medidos, nunca presumidos —, a tabela abaixo separa o que foi verificado de fato nesta entrega daquilo que só poderá ser medido após as autorizações e os insumos. Nada da lista abaixo é tratado como concluído; o relatório da Fase 3 atualizará esta lista item a item com os valores medidos."),
  ]));

  out.push(...tbl({
    caption: "Situação atual dos itens de validação",
    headers: ["Item", "Situação verificada agora", "Quando poderá ser medido"],
    widths: [30, 40, 30],
    rows: [
      ["Sete testes de integração RLS", "Suíte pronta; pula sozinha sem variáveis; sete pulados na última execução documentada", "Fase 2, com o banco de teste do contratante"],
      ["CRUD real contra Supabase", "Camada pronta e testada para recusar com clareza sem configuração", "Assim que .env.local existir"],
      ["Lighthouse da nova tela", "Inexistente por projeto: o aplicativo ainda não tem a tela nova", "Fase 3, etapa S11"],
      ["Contraste medido da nova interface", "Escada do protótipo medida nos QA do PROMPT 04; no app, nada a medir ainda", "Fase 3, etapa S11"],
      ["Overflow em 390 pixels da nova composição", "Protótipo mobile verificado em 390; composição no app ainda não existe", "Fase 3, etapa S11"],
      ["Atualização do PWA após troca de shell", "Estratégia de cache correta e verificada na fundação", "No release da Fase 3, com versão de cache elevada"],
      ["Quadros por segundo do orbital no aplicativo", "Motor medido nos QA do protótipo com degradação adaptativa", "Fase 3, em dispositivo real"],
      ["Estado do repositório, migrations e testes", "Verificado nesta entrega, por leitura direta: fundação íntegra e endurecida", "Confirmado em cada marco"],
    ],
  }));

  out.push(h2("5.4 Próximos passos"));
  out.push(p([
    t("O plano está pronto para decisão. A sequência recomendada de ações, na ordem exata em que cada uma se desbloqueia:"),
  ]));
  out.push(...num("num-passos", [
    "O contratante revisa este plano e ajusta premissas que julgar necessárias — especialmente a decisão do risco R13 sobre o protótipo na pasta pública.",
    "Autorização expressa da Fase 2, acompanhada dos insumos: projeto Supabase de teste descartável com as migrations e os quatro usuários, além das variáveis de ambiente.",
    "Execução da Fase 2 com evidências: runbook, auditoria de segredos e a suíte RLS completa com sete testes aprovados.",
    "Autorização específica da Fase 3, que inicia a sequência S1 a S11 com PR atômico por etapa e flag desligada até o fim.",
    "Relatório final com todos os gates executados e evidências anexadas, separando o medido do pendente — e a avaliação do contratante com a flag ligada.",
  ]));

  out.push(p([
    t("Até a próxima autorização, nada será executado no aplicativo: nenhuma alteração em código, nenhuma migration rodada, nenhuma conta criada, nenhum dado gerado. Este documento é a única entrega da solicitação e permanece como referência vinculante para as fases que ele descreve."),
  ]));

  return out;
};
