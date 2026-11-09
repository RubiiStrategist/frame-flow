# FRAME FLOW — reformulação visual V3

Data: 30/10/2026.

## Implementado
- Identidade preta/vermelha aplicada a todos os ambientes, navegação, cabeçalhos, cards, listas, tabelas, formulários, diálogos e estados vazios existentes.
- Dashboard executivo recomposto: quatro KPIs animados, gráfico financeiro principal com período de 3/6 meses, indicadores circulares calculados de tarefas/projetos/leads/lançamentos, projetos, prioridades e calendário semanal.
- Busca global de todos os módulos em todos os ambientes, com Ctrl/Cmd+K.
- Menu lateral recolhível preservado e corrigido para respeitar largura 72px; menu completo e atalhos mobile preservados.
- Login, telas da Cap e apresentações de módulos futuros atualizados.
- Cap original localizada nos arquivos do projeto FRAME VISION de 23/10/2026: capivara-cutout-02.webp e cap-duvida.png. Cópias em public/brand. Novo cap-blink.png gerado a partir da arte original, mantendo a pose e identidade. Animação leve e alternativa para movimento reduzido.
- Demonstração /demo utiliza o mesmo dashboard, explicitamente identificada como fictícia e sem gravação no banco.

## Validação
- TypeScript: passou.
- ESLint: passou.
- Vitest: 97 passaram; 7 testes HTTP de integração permanecem desativados sem ambiente/credenciais de teste na suíte. Não foram apresentados como aprovados.
- Build Next.js: passou, incluindo após ajuste final de 320px.
- Navegação real validada em Executivo, Comercial e Operacional. Busca -> Leads, abertura do formulário, menu mobile -> Planejamento, recolher/expandir sidebar e filtro de período funcionaram.
- 12 rotas funcionais adicionais verificadas em 320px, sem overflow horizontal: indicadores, financeiro executivo, decisões, configurações, leads, funil, clientes, projetos, tarefas, agenda, financeiro operacional e Cap.
- Dashboard testado em 320/390/768/1440px. Imagens originais carregaram. Capturas reais disponíveis em ../screenshots/v3-*.jpg.
- Login inspecionado em origem local isolada, sem encerrar a sessão existente.

## Limites e pendências
- Reformulação visual não implementa funcionalidades de negócio previstas para Fase 2/3. Planejamento, propostas, contratos, arquivos e demais módulos futuros continuam claramente identificados como indisponíveis.
- Cap mantém assistência contextual; chat com LLM e execução autônoma não estão implementados.
- Foram integradas duas poses originais e uma variação de olhos fechados. Não há novas poses de acenar/apontar produzidas nesta versão.
- Testes de escrita remota/RLS não foram repetidos nesta alteração de frontend. A auditoria anterior está em AUDITORIA-ESCRITA-E-RLS.md.
- Nesta etapa não houve alteração em schema, políticas RLS, permissões ou registros Supabase, nem deploy em produção.
- Aviso de descrição acessível ausente no menu mobile corrigido com SheetDescription.

