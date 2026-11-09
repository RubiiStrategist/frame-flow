# FRAME FLOW — Caps V4

Entrega local em 4 de novembro de 2026.

## Implementado

As três apresentações usam a Cap da FRAME VISION como referência: mesma identidade, pose, enquadramento e proporções alongadas. A Operacional foi refeita para acompanhar o corpo das outras duas.

| Ambiente | Roupa | Animação |
| --- | --- | --- |
| Executivo | Blazer preto com detalhes vermelhos | Piscar discreto e movimento suave, em ciclo de 6 segundos |
| Comercial | Polo preta com gola e mangas vermelhas | Piscadinha de um olho e leve inclinação, em ciclo de 5,6 segundos |
| Operacional | Jaqueta utilitária preta com costuras vermelhas e calça cargo ajustada | Piscar duplo e movimento leve, em ciclo de 7 segundos |

Foram incluídas seis imagens PNG transparentes, duas por apresentação, com dimensões iguais de 1145 × 1374 pixels. O componente usa a otimização de imagens do Next.js e só inicia a expressão depois que ambos os quadros terminam de carregar. A troca ocorre apenas na região dos olhos para evitar saltos no corpo e no contorno; a Comercial altera somente um olho.

O componente compartilhado aplica as novas Caps aos locais que já o utilizavam. A página Cap inclui uma galeria com as três apresentações e permite mudar de ambiente. A Cap selecionada tem controles de ativar/repetir e pausar/retomar junto à personagem. As rotas são `/#/executivo/cap`, `/#/comercial/cap` e `/#/operacional/cap`.

As animações respeitam a preferência de movimento reduzido do dispositivo. Quando essa preferência está ativa, a personagem fica com os olhos abertos; o botão **Ativar animação** permite assistir à Cap selecionada por escolha explícita do usuário. Pausar também retorna à imagem de olhos abertos.

## Verificação

- Suíte existente: **97 testes aprovados e 7 testes HTTP ignorados** na execução registrada.
- TypeScript, lint e build aprovados. O build final após o ajuste de posição dos controles concluiu a compilação, a verificação de TypeScript, a geração das páginas e a preparação do servidor standalone.
- Na sessão autenticada do aplicativo, foram observados os ciclos de abrir/fechar os olhos da Executiva, a piscadinha da Comercial e os dois piscados da Operacional, além da pausa com olhos abertos.
- Os quadros carregaram pelo otimizador de imagens; a inspeção do console não encontrou erros nem avisos durante essa validação.
- Layout mobile validado em viewports de 390 × 844 e 320 × 740 pixels, com áreas úteis de 375 e 305 pixels: sem transbordamento horizontal após a estabilização do layout e com os seis quadros carregados.
- No mobile, **Ativar animação** mudou para **Repetir animação** e iniciou o ciclo de piscar da Executiva com duração de 6 segundos. A inspeção do console terminou sem erros nem avisos.
- Capturas reais salvas em `outputs/screenshots/v4-caps-desktop.jpg` (galeria das três Caps), `outputs/screenshots/v4-caps-mobile.jpg` (cards mobile) e `outputs/screenshots/v4-cap-controles-mobile.jpg` (Cap e controles mobile).

## Escopo e pendências

Esta entrega altera a apresentação e a animação das Caps. Não altera autenticação, políticas do Supabase, esquema do banco ou registros. Não foi feito deploy em produção.

Os movimentos são animações de interface com dois quadros de expressão por Cap, não vídeos. A conversa com LLM e a execução de tarefas pela assistente continuam identificadas no produto como capacidades futuras; não foram implementadas nesta entrega.

## Arquivos principais

- `src/components/cap/cap.tsx`: renderização compartilhada e controle de carregamento dos quadros.
- `src/components/cap/cap-panel.tsx`: controles e conteúdo da Cap selecionada.
- `src/components/views/cap-view.tsx`: galeria das três apresentações.
- `src/app/globals.css`: máscaras dos olhos, ciclos de animação e movimento reduzido.
- `public/brand/cap-v4/`: seis imagens transparentes.

O pacote `FRAME-FLOW-V4.zip` contém o código-fonte do aplicativo e este relatório, sem dependências instaladas, build, credenciais locais ou arquivos `.env` privados. A configuração deve ser feita a partir de `.env.example` no destino.
