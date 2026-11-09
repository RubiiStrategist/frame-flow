# STATUS — FRAME FLOW · Etapa 1 (Fundação) + Etapa 1.1 (Correção técnica) + Direção Criativa 02

Data: 30/10/2026 · Prazo-alvo do MVP: 02/11/2026
Princípio: **nada é declarado concluído se estiver apenas visualmente simulado.**

Legenda: ✅ implementado e verificado · 🟡 estrutura pronta, operação pendente
de configuração externa · ⏳ fora do escopo da etapa (fase planejada identificada)

---

## 0b. Direção Criativa 02 — FRAME FLOW OS (tela inicial do CEO)

Reformulação visual profunda **somente da tela Início do Ambiente Executivo**,
preservando arquitetura, dados, autenticação, navegação e as demais telas.
Linguagem: *Cinematic Intelligence System* — grafite em níveis com profundidade
discreta, moldura viewfinder, tipografia editorial, vermelho como assinatura.

- ✅ **5 regiões**: Command Header (saudação personalizada + data pt-BR + status
  do sistema + campo ⌘K) · Cap Executive Intelligence (palco viewfinder com
  cantos de frame, estados sincronizando/atenção/em ordem, resumo determinístico
  com dados reais) · Financial Intelligence (KPIs com hairlines, evolução em 6
  barras mensais, slots honestos de recorrência/metas — Fase 2) · Operational
  Pulse (projetos, entregas 14 dias, aprovações, atrasos, capacidade) ·
  Decision Center (prioridade determinística, contexto e ação por decisão)
- ✅ **Central de Comandos (⌘K)**: navegação por teclado em módulos, ambientes
  e ações rápidas (cmdk já existente — nenhuma dependência nova)
- ✅ **Boot cinematográfico** curto (~0,95s): cantos desenham, redmark cresce,
  véu dissolve; 1× por sessão, decorativo, ignora `prefers-reduced-motion`
- ✅ **Motion leve**: cascata de entrada (`ff-rise`), barras crescem
  (`ff-bar`), dot de status (`ff-dot-pulse`) — só transform/opacity (GPU)
- ✅ **Mobile primeiro**: composição em uma mão, bottom-nav preservada (5
  destinos), alvos ≥44px, sem overflow horizontal (390px verificado)
- ✅ **Zero números fictícios**: sem Supabase, cada região exibe estado
  pendente desenhado com dignidade e CTA para configuração
- ✅ Componentes novos em `src/components/executivo/` (9 arquivos reutilizáveis)
- ✅ Validado: ESLint 0 · `tsc --noEmit` 0 · 84 testes · build com tipos ·
  navegador (desktop 1440 + mobile 390): boot, palette, navegação, zero erros
- ⏳ Outros ambientes permanecem no layout da Etapa 1 — **aguardando aprovação
  dos sócios** para receber a linguagem OS

---

## 0. Etapa 1.1 — Correção técnica e preparação para produção (30/10/2026)

Rodada autorizada pelos sócios após auditoria técnica. Arquitetura, três
ambientes, identidade visual e funcionalidades **preservados**.

### TypeScript — corrigido e enforceado
- ✅ `TaskPriority` exportado de `types.ts` (erro TS2305 resolvido — sem `any`, sem `@ts-ignore`)
- ✅ `typescript.ignoreBuildErrors` **removido** do `next.config.ts` — build agora valida tipos ("Running TypeScript…" no log)
- ✅ `tsconfig.json` com escopo exclusivo da aplicação (`src/`, `tests/`, configs) — `examples/`, `skills/` e resíduos fora da verificação
- ✅ `tsc --noEmit` com **zero erros** (verificado nesta etapa)

### Segurança financeira — view blindada
- ✅ `vencimentos_em_aberto` recriada com `security_invoker = true` (PostgreSQL 15+) — RLS da tabela base aplica-se integralmente a quem consulta; `anon`/`public` sem grant; clientes externos do futuro portal consultam zero linhas

### Decisões societárias — votos relacionais
- ✅ Novo esquema relacional: tabela `decisao_votos` (PK `decisao_id + socio_id`) substitui o campo `votos jsonb` editável
- ✅ RLS por identidade: sócio insere/altera **apenas o próprio voto** (`socio_id = auth.uid()`), apenas em decisão aberta; sem policy de delete (voto é histórico)
- ✅ Histórico de auditoria protegido por trigger `decisoes_01_protege_historico` (UPDATE manual de `historico` falha no banco)
- ✅ Regras configuráveis (maioria/unanimidade/socio_presente/livre) preservadas
- ✅ UI: cada sócio vê e grava o próprio voto (A favor/Contra/Abstenção); sem UI de voto na pré-visualização nem sem sessão

### Autenticação e autorização — defesa em profundidade
- ✅ Anti-elevação no BANCO: trigger `proteger_cargo` bloqueia `set role = …` de qualquer sessão autenticada (SEED via SQL/dashboard segue funcionando)
- ✅ Higiene de execução: `eh_interno()` restrita a `authenticated`; funções de trigger sem EXECUTE público
- ✅ `search_path` fixo em todas as funções de trigger (regra Supabase)
- ✅ Pré-visualização reauditada: existe apenas sem configuração (`isPreview = flag && !configured`), nunca cria sessão e a camada de dados responde `not-configured` — nunca alcança dados reais (testado em `tests/unit/auth-status.test.ts` e `supabase-config.test.ts`)

### Limpeza do scaffold (apenas o comprovadamente não utilizado)
- ✅ Removidos: `examples/` (websocket demo quebrado), `prisma/` + `db/` (SQLite sem uso), `src/lib/db.ts`, rota `/api` hello-world, `tests/*.sh` (scripts de runtime do scaffold), `.env` (só tinha DATABASE_URL do Prisma)
- ✅ 18 pacotes npm não utilizados removidos (next-auth, next-intl, prisma, @dnd-kit ×3, @mdxeditor, react-query, react-table, react-syntax-highlighter, uuid, z-ai-web-dev-sdk, zustand, framer-motion, react-markdown, @reactuses/core, date-fns)
- ℹ️ Mantidos por segurança: `sharp` (gerador de ícones), toda a biblioteca `ui/` e suas deps, `skills/` (infraestrutura da plataforma, não do app)

### Testes automatizados — criados (Vitest + jsdom + Testing Library)
- ✅ `bun run test`: **84 testes aprovados, 7 pulados** (integração RLS aguarda banco de teste)
  - Schemas de formulários (21) · mappers/centavos (10) · ambientes/navegação (13+7) · formatação BRL/datas (12) · login componente (7) · gate de config Supabase (9) · derivação de status (5)
- 🟡 Suíte de integração RLS preparada (`tests/integration/rls-supabase.test.ts`): anti-elevação, isolamento de votos, blindagem do histórico, view financeira para externos, idempotência do engine — executa com `SUPABASE_TEST_URL` + credenciais de teste (pula sozinha sem elas)

### Validação executada nesta etapa (resultados reais)
| Verificação | Resultado |
|---|---|
| ESLint (`bun run lint`) | ✅ zero erros |
| TypeScript (`tsc --noEmit`) | ✅ zero erros |
| Testes (`bun run test`) | ✅ 84 aprovados · 7 pulados (integração pendente de banco) |
| Build de produção (`next build`) | ✅ aprovado **com validação de tipos ativa** |
| Smoke test HTTP (standalone) | ✅ `/` 200 · manifest 200 · sw.js 200 · ícones 200 · `/api` 404 (resíduo removido) |
| Navegador (agent-browser) | ✅ login renderiza honesto · preview rotulado · troca de ambiente sem reload · bottom-nav 5 atalhos · decisões sem voto na prévia · zero erros de console |

---

## 1. Implementado e verificado na Etapa 1

| Item | Detalhe |
|---|---|
| ✅ Design tokens oficiais | Extraídos do site real da FRAME VISION (`#0a0a0a`, `#f4f0e7`, `#e10606`, easing da marca, frame corners). Ver `docs/ARQUITETURA.md §4` |
| ✅ Identidade premium | Tema único escuro, tipografia editorial (caixa alta tight, eyebrows), cantos retos, vermelho como único acento |
| ✅ Shell responsivo desktop | Sidebar recolhível (estado persistido), módulos por categoria, largura máx. 1600px |
| ✅ Shell responsivo mobile | Bottom-nav fixa com **5 atalhos por ambiente** (CEO: Início·Indicadores·Financeiro·Decisões·Cap / CRO: Início·Funil·Leads·Equipe·Cap / COO: Início·Projetos·Agenda·Financeiro·Cap), área de segurança iOS |
| ✅ Menu superior completo | Todos os módulos acessíveis; troca de ambiente **sem novo login e sem recarregar** (testado) |
| ✅ Três ambientes | Executivo (Rubian), Comercial (William), Operacional (Letícia) com apresentação correspondente da Cap |
| ✅ Registro de módulos | 36 módulos mapeados com fase (MVP/Fase 2/Fase 3); fora do MVP → página "funcionalidade futura" com escopo |
| ✅ PWA fundação | Manifest, service worker (auth/supabase fora do cache), ícones gerados, botão de instalação, meta/viewport/theme-color |
| ✅ Componente Cap | Máquina de 8 estados × 4 apresentações, arte de referência **rotulada** ("assets oficiais pendentes"), slot `CapAssetsResolver` para assets 2D/3D oficiais |
| ✅ Cap operacional | Resumos determinísticos a partir de dados reais (vencimentos, decisões), roteiro de capacidades rotulado (Conversar/Analisar F2, Recomendar/Executar F3), estados testáveis |
| ✅ Views MVP (layout + lógica de formulário) | Login, Início ×3, Leads, Funil, Clientes, Projetos, Tarefas, Agenda (calendário real do mês), Financeiro (com pró-labore/reembolso/distribuição), Decisões (regra configurável), Indicadores, Configurações, Cap |
| ✅ Formulários com validação | Zod + react-hook-form; envio sem configuração exibe "nada foi gravado" (sem sucesso falso — testado) |
| ✅ Estados vazios/carregamento | `EmptyState` com motivo honesto (`vazio`/`not-configured`/`erro`) em todas as listas |
| ✅ Camada de dados | `DataProvider` tipado, centavos↔BRL, snake_case↔camelCase; views desacopladas do Supabase |
| ✅ Esquema SQL completo | 6 migrations: perfis/papéis (trigger de criação + anti-elevação), comercial, operacional, financeiro (view security_invoker), decisões (votos **relacionais** + histórico via trigger blindado), engine de automações idempotente |
| ✅ RLS planejada e escrita | Todas as tabelas com policies; `eh_interno()` prepara portal do cliente; sócios decidem e votam apenas em nome próprio (banco valida identidade) |
| ✅ Engine — automação piloto | Gatilho `venda_fechada` idempotente (único evento na tabela `automacoes`) |
| ✅ Documentação | ARQUITETURA.md, SETUP-SUPABASE.md, supabase/README.md, .env.example |
| ✅ Qualidade | ESLint limpo · `tsc --noEmit` zero erros · 84 testes automatizados aprovados · build valida tipos · navegação, formulários e troca de ambiente verificados no navegador (desktop 1440px e mobile 390px — Etapas 1 e 1.1) |

## 2. Estrutura pronta — operação real exige configuração externa

| Item | O que falta (exatamente) |
|---|---|
| 🟡 Autenticação real | **Projeto Supabase + as 2 variáveis de ambiente** (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) + contas dos 3 sócios criadas no Auth + bloco SEED_SÓCIOS. Passo a passo: `docs/SETUP-SUPABASE.md` |
| 🟡 CRUD persistido (leads, clientes, projetos, tarefas, transações, decisões) | Migrations executadas no projeto Supabase → as mesmas views passam a ler/escrever Postgres real (nenhum código extra necessário) |
| 🟡 KPIs e resumos da Cap com dados reais | Ativam automaticamente com o item acima |
| 🟡 Publicação Vercel | Deploy + as mesmas variáveis no ambiente da Vercel |

## 3. O que NÃO foi implementado nesta etapa (por decisão de escopo)

- ⏳ Portal externo do cliente (Frame Portal) — Fase 3
- ⏳ IA conversacional / LLM / voz da Cap — Fase 2/3 (a Cap hoje resume dados reais, sem simular IA)
- ⏳ Drag-and-drop do funil — Fase 2 (a movimentação de etapa já funciona por ação)
- ⏳ Propostas, metas, comissões, aprovações, custos, pessoas, jurídico, planejamento, BI avançado, arquivos (Storage), Frame Content, qualidade — páginas honestas com escopo e fase
- ⏳ Assets oficiais da Cap (2D animado / 3D) — aguardando envio; componente pronto para recebê-los
- ⏳ Integrações de publicação e e-mail — Fase 2/3

## 4. Necessidades externas (o que precisamos de vocês)

1. **Supabase**: criação do projeto + execução das migrations + 3 contas reais
   (e-mails oficiais de Rubian, William e Letícia) + envio das 2 variáveis
   para `.env.local`/Vercel. *(Guia completo pronto.)*
2. **Vercel**: conta/repo para publicação (a estrutura de build Next.js já está pronta).
3. **Assets da Cap**: arte oficial aprovada (sprites/JSON 2D — o componente aceita
   via `CapAssetsResolver`; versão 3D em fase futura).
4. **Logotipo FRAME FLOW oficial** (opcional): os ícones PWA atuais seguem o motivo
   de frame corners da marca; podem ser substituídos a qualquer momento
   (`scripts/generate-icons.mjs`).

## 5. Critérios de qualidade — autoverificação

- Login/logout: estrutura real; operação real pendente de Supabase (🟡 honesto, sem ficção)
- Proteção de rotas: gate por status de sessão no SPA + RLS no banco (escrito)
- Persistência: idem — camada pronta e testada para "recusar com clareza" sem config
- Responsividade: ✅ verificada em 390px e 1440px
- Tratamento de erros: ✅ toasts + estados de erro rotulados
- Estados vazios/carregamento: ✅ sistemáticos
- Integridade relacional: ✅ `projetos.cliente_id NOT NULL`, FKs, idempotência de automações
- PWA instalável: ✅ manifest/SW/ícones prontos (instalação visível em navegadores compatíveis)
- Segredos expostos: ✅ nenhum (nenhum segredo no bundle; validação estrita de env)
- Fluxos principais: ✅ jornada lead→funil→cliente→projeto→tarefa→financeiro→decisão estruturada ponta a ponta
