# FRAME FLOW

Plataforma proprietária de gestão integrada da **FRAME VISION** — o sistema
operacional digital que conecta pessoas, clientes, vendas, produção, finanças,
documentos, decisões e automações.

PWA premium e cinematográfico · pt-BR · BRL · America/Sao_Paulo

## Stack

React 19 · TypeScript · Next.js 16 (App Router) · Tailwind CSS 4 · Supabase
(Auth + PostgreSQL com RLS + Storage) · Vercel

## Começo rápido

```bash
bun install
cp .env.example .env.local   # preencha com as chaves do seu projeto Supabase
bun run dev
```

Sem Supabase configurado, a plataforma opera em **modo de pré-visualização de
layout** (rotulado): navegação e responsividade completas, sem autenticação
fictícia e sem dados de demonstração.

## Documentação

| Documento | Conteúdo |
|---|---|
| `docs/ARQUITETURA.md` | Decisões de arquitetura, estrutura, fluxo de dados, segurança |
| `docs/STATUS.md` | Implementado × pendente × necessidades externas (etapa a etapa) |
| `docs/SETUP-SUPABASE.md` | Ativar autenticação real + banco em 15 min |
| `supabase/README.md` | Esquema SQL, RLS e mapa de tabelas |

## Estrutura essencial

```
src/app/            # raiz SPA + manifest PWA
src/components/     # shell (sidebar/bottom-nav/topbar), Cap, views por ambiente
src/lib/frameflow/  # registro de módulos, roteador, dados tipados, auth, formatação
supabase/migrations # SQL completo (perfis, comercial, operacional, financeiro,
                    # decisões, engine de automações — todos com RLS)
```

## Ambientes

- **Executivo** — Rubian (CEO)
- **Comercial** — William (CRO)
- **Operacional/Financeiro** — Letícia (COO + CFO)

Alternância livre entre ambientes, sem novo login. O cargo define atalhos e
experiência inicial, não limite de acesso entre sócios.
