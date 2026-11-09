-- ============================================================================
-- FRAME FLOW — Migration 0004 · Financeiro empresarial
-- Exclusivamente finanças da empresa — inclui movimentações legítimas com
-- sócios: pró-labore, reembolsos e distribuição de lucros.
-- Eventos financeiros seguem condições contratuais (vencimento próprio),
-- não dependem da conclusão da entrega.
-- ============================================================================

create type transaction_kind as enum ('entrada', 'saida');

create type finance_category as enum (
  'projeto', 'servico', 'produto',
  'prazo_labore',           -- pró-labore (sócios)
  'reembolso',              -- reembolsos (sócios)
  'distribuicao_lucros',    -- distribuição de lucros (sócios)
  'imposto', 'equipe', 'ferramenta', 'infraestrutura', 'marketing', 'outro'
);

-- Transações --------------------------------------------------------------------
create table if not exists public.transacoes_financeiras (
  id uuid primary key default gen_random_uuid(),
  tipo public.transaction_kind not null,
  categoria public.finance_category not null default 'outro',
  descricao text not null,
  valor bigint not null check (valor >= 0),            -- centavos (BRL), sempre positivo
  projeto_id uuid references public.projetos (id) on delete set null,
  cliente_id uuid references public.clientes (id) on delete set null,
  vencimento timestamptz not null,
  pago boolean not null default false,
  pago_em timestamptz,
  metodo_pagamento text,
  criado_por uuid not null references public.profiles (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_transacoes_vencimento on public.transacoes_financeiras (vencimento);
create index if not exists idx_transacoes_pago on public.transacoes_financeiras (pago);
create index if not exists idx_transacoes_projeto on public.transacoes_financeiras (projeto_id);

drop trigger if exists transacoes_updated_at on public.transacoes_financeiras;
create trigger transacoes_updated_at before update on public.transacoes_financeiras
  for each row execute function public.tocar_updated_at();

-- View: vencimentos em aberto (base dos alertas da Cap e do engine) -----------
-- SECURITY INVOKER (PostgreSQL 15+, padrão nos projetos Supabase atuais):
-- a view executa com os privilégios DE QUEM consulta, e as policies RLS da
-- tabela base aplicam-se integralmente. Sem isso, a view herdaria os direitos
-- do dono (postgres, que ignora RLS) e vazaria vencimentos para qualquer
-- usuário autenticado — inclusive futuros clientes externos do portal.
-- Com security_invoker: internos veem o que a RLS permite; `cliente`/anon
-- consultam ZERO linhas mesmo tendo o grant abaixo.
create or replace view public.vencimentos_em_aberto
  with (security_invoker = true)
  as
  select
    id, tipo, categoria, descricao, valor, vencimento, projeto_id, cliente_id,
    (vencimento < now()) as vencida
  from public.transacoes_financeiras
  where not pago
  order by vencimento asc;

-- RLS: apenas internos; financeiro é interno por natureza no MVP ----------------
alter table public.transacoes_financeiras enable row level security;

create policy transacoes_interno_crud on public.transacoes_financeiras
  for all to authenticated
  using (public.eh_interno())
  with check (public.eh_interno());

-- A view invoca como o usuário: RLS da tabela base é aplicada; acesso explícito
-- apenas para autenticados (anon/public nada leem).
revoke select on public.vencimentos_em_aberto from public, anon;
grant select on public.vencimentos_em_aberto to authenticated;

-- ============================================================================
-- ALERTA DIÁRIO (opcional, sugerido): com pg_cron ativo no projeto:
--
--   select cron.schedule('frameflow-alerta-vencimentos', '0 8 * * *', $$
--     insert into public.automacoes (nome, entidade, entidade_id, payload)
--     select distinct 'alerta_vencimento', 'transacao', t.id::text,
--            jsonb_build_object('vencida', true, 'vencimento', t.vencimento)
--       from public.transacoes_financeiras t
--      where not t.pago and t.vencimento::date = current_date
--      on conflict (nome, entidade_id) do nothing;
--   $$);
--
-- Depende da migration 0006 (tabela automacoes) — executar após.
-- ============================================================================
