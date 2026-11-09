# FRAME FLOW — revisão visual V6

Consolidada em 8 de novembro de 2026. Implementação e testes concluídos em 7 de novembro; conferência visual final em 8 de novembro. Alterações locais sobre a V5; nenhum deploy em produção.

## Cap vinculada ao ambiente

- Removida a galeria que permitia escolher personagens dentro da página da Cap.
- Executivo abre apenas a Cap Executiva; Comercial abre apenas a Comercial; Operacional abre apenas a Operacional. O painel lateral segue o mesmo ambiente.
- Mantidos os seis assets originais e as três animações próprias, com controles compactos de reprodução e pausa.
- Novo painel para computador: coluna da mascote e radar contextual à esquerda, conversa ampla à direita. Em celular, a disposição se adapta para uma coluna.
- Conversa com cabeçalho, mensagens, horários, estado vazio contextual, atalhos e campo de envio ancorado no rodapé do próprio painel. Mensagens e ações propostas têm rolagem interna.
- Painel lateral compacto utiliza a altura disponível. Teclado, foco visível e botões de confirmação/cancelamento preservados.
- Radar consulta somente fontes do ambiente: financeiro/decisões, leads/clientes ou tarefas/projetos. Loading, erro e ausência de registros têm textos distintos; nenhum número de demonstração foi inserido.
- Datas de vencimento respeitam o dia civil em São Paulo. Radar atualiza após ações da Cap.
- A conversa é reiniciada ao trocar conta ou ambiente, evitando mostrar histórico anterior durante o carregamento.
- Dashboard executivo tem acesso direto à conversa, substituindo o aviso antigo de indisponibilidade.

## Movimento aplicado ao aplicativo

- Entrada curta de páginas sem remontar componentes apenas para animar.
- Cards e painéis aparecem em sequência curta; conteúdo continua disponível desde o primeiro frame.
- Feedback de hover, foco e pressão em botões; transições em campos, abas e seletores.
- Abertura/fechamento de menus, popovers, diálogos e painéis laterais com tempos reduzidos.
- Entrada de mensagens e propostas da Cap, sinal de consulta enquanto uma resposta está em andamento.
- Skeletons com pulsação limitada; nenhuma animação decorativa infinita nova.
- Movimento reduzido do dispositivo respeitado. A reprodução explícita da mascote continua disponível.
- Troca de módulo retorna ao topo da página de forma imediata.

## Validação

- 206 testes aprovados na suíte completa; 7 testes HTTP de integração legados ignorados por falta da configuração específica dessa suíte.
- Os 9 testes do chat foram reexecutados e aprovados após o ajuste final de rolagem.
- ESLint, TypeScript e build otimizado/standalone aprovados. CSS compilado pelo pipeline real do Next.js.
- Conferência no navegador com sessão real: três ambientes, consulta de resumo, persistência do histórico, reprodução/pausa, painel lateral, abertura/digitação/cancelamento de formulário e navegação.
- Layouts conferidos em 1440×1000, 1366×768, 390×844 e 320×740; sem overflow horizontal nos painéis verificados.
- Capturas reais em `outputs/screenshots/v6-*.jpg` no workspace. As capturas mostram a aplicação, sem dados fictícios adicionados para preencher o layout.

## Arquivos principais

- `src/components/views/cap-view.tsx`
- `src/components/cap/cap-panel.tsx` e `cap-panel.css`
- `src/components/cap/cap-chat.tsx` e `cap-chat.css`
- `src/components/cap/cap-insights.tsx`
- `src/components/shell/app-shell.tsx`
- `src/app/motion.css`
- `src/components/executivo/executive-dashboard.tsx`
- Testes de contexto, radar e conversa; ajuste do pipeline CSS exclusivamente no Vitest.

## Limites preservados

Esta revisão trata de design, contexto da Cap e movimento. A autenticação, schema, permissões e políticas do banco não foram alterados. A consulta de validação à Cap gerou apenas seu histórico normal de conversa; o formulário de teste foi cancelado sem criar tarefa.

A Cap continua identificando seu modo como assistência local quando não há provedor de IA configurado. As integrações externas ainda pendentes da V5 não foram ativadas por esta revisão visual. Não houve publicação em produção.

## Executar localmente

Na pasta do aplicativo, mantenha a configuração local existente e execute:

```powershell
npm.cmd install
node node_modules/next/dist/bin/next dev -p 3010 -H 127.0.0.1
```

O ZIP inclui código, testes, migrations existentes e assets. Exclui `.env.local`, dependências instaladas e cache/build. Não substitua a configuração local por valores vazios ao copiar o pacote.


