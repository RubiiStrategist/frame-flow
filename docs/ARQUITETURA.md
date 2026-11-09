# ARQUITETURA — FRAME FLOW (Etapa 1 · Fundação)

Plataforma proprietária de gestão integrada da FRAME VISION.
PWA · React + TypeScript · Next.js 16 (App Router) · Tailwind CSS 4 ·
Supabase (Auth + PostgreSQL + RLS + Storage) · destino de publicação: Vercel.

---

## 1. Decisões estruturais

| # | Decisão | Motivo |
|---|---------|--------|
| 1 | **SPA servida em `/` com roteamento por hash** (`#/ambiente/modulo`) | O shell precisa funcionar em preview isolado e em PWA standalone; a troca de ambientes **nunca recarrega** (requisito do produto). O roteador é uma abstração (`navigate()`/`useRoute()` em `lib/frameflow/router.ts`) — a publicação na Vercel pode migrar para rotas reais do App Router sem alterar nenhuma view. |
| 2 | **Registro canônico de módulos** (`lib/frameflow/environments.ts`) | Única fonte de verdade para sidebar, bottom-nav, menu completo e fases (MVP/Fase 2/Fase 3). Adicionar módulo = registrar ali + criar a view. |
| 3 | **Camada de dados tipada** (`lib/frameflow/data.tsx`) | Views nunca falam com o Supabase diretamente. O repositório responde `reason` honesto (`vazio`, `not-configured`, `erro`, `carregando`) — a UI nunca inventa dados. |
| 4 | **Honestidade como invariant** | Sem credenciais: login real fica indisponível (e explícito), CRUD informa "nada foi gravado", dashboards mostram `—`/estados vazios rotulados. Modo **Pré-visualização de Layout** é separado, rotulado em todas as telas e não cria sessão. |
| 5 | **Supabase-first com RLS** | Chave anon no cliente (protegida por RLS); `service_role` nunca no frontend. Elevação de cargo sem policy via frontend. Dinheiro em centavos (`bigint`). |
| 6 | **Cap com máquina de estados + slot de assets** | 8 estados (`idle, blink, wave, point, think, celebrate, alert, wait`) × 4 apresentações (`executiva, comercial, operacional, concierge`). Arte atual é **referência rotulada**; `CapAssetsResolver` substitui por assets oficiais 2D sem mudar consumidores, e a máquina é reutilizável pela futura versão 3D. |

## 2. Estrutura de pastas

```
src/
  app/
    layout.tsx              # raiz: pt-BR, Inter, metadata/viewport PWA, SW register
    page.tsx                # SPA: providers → auth gate → shell → view do módulo
    manifest.ts             # manifest.webmanifest (PWA standalone, tema #0a0a0a)
  components/
    shell/                  # app-shell, sidebar (recolhível), topbar (troca de
                            # ambiente + menu completo), bottom-nav (5 atalhos/
                            # ambiente), preview-banner
    cap/                    # cap.tsx (máquina de estados + arte de referência),
                            # cap-panel.tsx (insights determinísticos + roteiro)
    common/frame-primitives # FrameMark (cantos de frame), Redmark, Eyebrow,
                            # Kpi, EmptyState honesto, ModuleHeader, PhaseChip
    pwa/                    # service-worker-register, install-button
    views/
      login-view.tsx        # entrada real + estado "configuração necessária"
      future-module.tsx     # placeholder identificado de módulos Fase 2/3
      cap-view.tsx, configuracoes.tsx
      executivo/            # inicio, indicadores, decisoes
      comercial/            # inicio, leads, funil, clientes
      operacional/          # inicio, projetos, tarefas, agenda, financeiro (lens)
  lib/
    frameflow/
      types.ts              # domínio espelhando o SQL (snake_case ↔ camelCase na borda)
      schemas.ts            # Schemas Zod dos formulários (fonte única, testáveis)
      environments.ts       # registro de ambientes/módulos/fases
      router.ts             # navegação abstrata por hash
      format.ts             # BRL, datas, fuso America/Sao_Paulo
      data.tsx              # DataProvider (repositório tipado) + useAsyncList
      auth.tsx              # AuthProvider (sessão real + preview rotulado) + derivarAuthStatus
      storage.ts            # flags em WebStorage via useSyncExternalStore
    supabase/
      config.ts             # validação estrita de env (sem defaults inventados)
      client.ts             # cliente singleton (PKCE, chave anon apenas)
public/
  sw.js                     # SW: precache shell; auth/supabase sempre rede
  icons/                    # 192/512/maskable/apple (gerados por sharp)
supabase/migrations/        # 0001–0006: perfis, comercial, operacional,
                            # financeiro, decisões (votos relacionais), engine
                            # (RLS + triggers + anti-elevação + security_invoker)
docs/                       # ARQUITETURA, STATUS, SETUP-SUPABASE
tests/
  unit/                     # Vitest: schemas de formulários, BRL/centavos,
                            # mappers, roteador hash, ambientes, login (RTL),
                            # gate de config Supabase, derivação de status
  integration/              # rls-supabase.test.ts — exige banco de TESTE
                            # (pula sozinha sem as variáveis SUPABASE_TEST_*)
  setup.ts                  # limpeza automática do DOM entre testes
vitest.config.ts            # jsdom + alias @ → src
scripts/generate-icons.mjs  # regeneração de ícones da marca
```

## 3. Fluxo de dados

```
View ──> useData() (DataProvider) ──> Supabase (PostgreSQL + RLS)
                    │
                    └─ sem config ──> ListResult{ reason: 'not-configured' }
                                      → EmptyState honesto ("Conexão pendente")
Formulário ──> create*() ──> ok → toast + reload
                     └─ NotConfiguredError → toast "nada foi gravado" (sem sucesso falso)
```

Sessão: `AuthProvider` usa `supabase.auth` (PKCE + auto-refresh). O status é
derivado (`preview > verificando > autenticado > visitante`), sem estados
ambíguos. Pré-visualização é flag em `sessionStorage` — nunca uma sessão.

## 4. Identidade visual (tokens extraídos do site oficial)

Fonte: `framevision.vercel.app` (analisado ao vivo — CSS real da marca):

| Token | Valor | Uso |
|---|---|---|
| `--ink` | `#0a0a0a` | fundo principal |
| `--ink-2` | `#111111` | superfícies/sidebar/cards |
| `--paper` | `#f4f0e7` | branco quente (texto/acentos claros) |
| `--paper-2` | `#ece6da` | branco quente secundário |
| `--frame-red` | `#e10606` | destaque único (ativos, CTAs, marca) |
| `--muted` | `#8f8f8f` | texto secundário |
| `--line` | `rgba(255,255,255,.16)` | bordas |
| easing | `cubic-bezier(.2,.72,.2,1)` | assinatura de movimento |
| Raio | 4px máx. | cantos quase retos (editorial) |
| Display | caixa alta, tracking −0.045em | títulos `.ff-display` |
| Eyebrow | 10px, tracking .2em | rótulos `.ff-eyebrow` |

Motivos da marca: **frame corners** (canto superior direito vermelho —
`FrameMark`) e **redmark** (barra 42×3). Aplicados com parcimônia, sem
glassmorphism nem gradientes decorativos.

## 5. PWA

- `manifest.ts`: standalone, tema/preenchimento `#0a0a0a`, idioma pt-BR,
  ícones 192/512 + maskable (área segura de 24%).
- `sw.js`: precache do shell; navegação *network-first* com fallback offline;
  **auth/Supabase/API sempre rede** (nunca cacheados); stale-while-revalidate
  para chunks próprios.
- Instalação: botão `beforeinstallprompt` (Chrome/Edge/Android) + instrução
  "Adicionar à Tela de Início" nas Configurações (iOS).
- Registro apenas em produção (`NODE_ENV`), fail-silently.

## 6. Frame Flow Engine (preparação)

Fluxo alvo: `Lead → Proposta → Contrato → Cliente → Projeto → Produção →
Aprovação → Entrega`; eventos financeiros por **condições contratuais**.

Etapa 1 entrega: tabela `automacoes` com idempotência
(`unique(nome, entidade, entidade_id)`), gatilho piloto `venda_fechada`
(registra lead ganho, sem duplicar) e view `vencimentos_em_aberto`
(alimentará alertas). Materialização completa (criar/vincular cliente e
projeto automaticamente) entra com propostas/contratos na Fase 2.

## 7. Segurança

- Chaves: apenas `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  no cliente; validação de formato em `config.ts` (sem fallback).
- RLS em todas as tabelas; função `eh_interno()` (EXECUTE restrito a
  `authenticated`) separa sócios/colaboradores de futuros usuários do portal
  (role `cliente`).
- **Anti-elevação no banco** (Etapa 1.1): trigger `proteger_cargo` impede que
  qualquer sessão autenticada altere o próprio `role`; cargos nascem via
  SQL/dashboard/service_role (bloco SEED_SÓCIOS).
- `decisoes`: apenas sócios escrevem (policy por role); **votos em tabela
  relacional `decisao_votos`** onde cada sócio só insere/altera o PRÓPRIO voto
  (`socio_id = auth.uid()`), sem delete (voto é histórico); `historico` é
  append-only por trigger (`proteger_historico` bloqueia reescrita manual).
- View `vencimentos_em_aberto` com `security_invoker = true` (PG15+): a RLS da
  tabela base aplica-se a quem consulta — externos leem zero linhas; grants
  revogados de `anon`/`public`.
- Funções de trigger sem EXECUTE público; `search_path` fixo em todas.
- Sem persistência de senha em nenhum lugar; contas nascem no Supabase Auth.
- O SW nunca cacheia chamadas de autenticação/dados.
- Pré-visualização de layout: flag em `sessionStorage` que só existe SEM
  configuração — nunca é sessão e a camada de dados responde `not-configured`
  (logo, nunca alcança dados reais).

## 8. Roadmap de fases (registrado em código)

- **MVP (até 02/11/2026)**: login real, 3 contas, navegação/ambientes, leads,
  funil, clientes, projetos, tarefas, financeiro básico, decisões, agenda,
  Cap com resumos determinísticos, PWA instalável.
- **Fase 2**: propostas, metas/comissões, aprovações, custos, pessoas, DnD do
  funil, materialização das automações, LLM da Cap.
- **Fase 3**: Frame Portal do cliente, jurídico, planejamento estratégico,
  central de arquivos (Storage), Frame Content, Cap 3D/voz.
