-- ============================================================================
-- FRAME FLOW — Migration 0002 · Comercial (leads e clientes)
-- Valores monetários em CENTAVOS (bigint) — a UI converte para BRL.
-- ============================================================================

create type lead_stage as enum ('novo', 'contato', 'qualificado', 'proposta', 'negociacao', 'ganho', 'perdido');
create type lead_source as enum ('indicacao', 'site', 'instagram', 'linkedin', 'evento', 'outbound', 'outro');
create type client_segment as enum ('audiovisual', 'marketing', 'estrategia', 'influencia', 'outro');

-- Clientes --------------------------------------------------------------------
create table if not exists public.clientes (
  id uuid primary key default gen_random_uuid(),
  nome_fantasia text not null,
  razao_social text,
  documento text,
  segmento public.client_segment not null default 'outro',
  site text,
  contatos jsonb not null default '[]'::jsonb,
  responsavel_comercial_id uuid references public.profiles (id) on delete set null,
  observacoes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_clientes_responsavel on public.clientes (responsavel_comercial_id);

drop trigger if exists clientes_updated_at on public.clientes;
create trigger clientes_updated_at before update on public.clientes
  for each row execute function public.tocar_updated_at();

-- Leads -----------------------------------------------------------------------
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  empresa text not null,
  email text,
  telefone text,
  origem public.lead_source not null default 'site',
  etapa public.lead_stage not null default 'novo',
  valor_estimado bigint not null default 0,            -- centavos (BRL)
  responsavel_id uuid references public.profiles (id) on delete set null,
  observacoes text,
  proximo_contato timestamptz,
  cliente_id uuid references public.clientes (id) on delete set null,  -- quando convertido
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_leads_etapa on public.leads (etapa);
create index if not exists idx_leads_responsavel on public.leads (responsavel_id);

drop trigger if exists leads_updated_at on public.leads;
create trigger leads_updated_at before update on public.leads
  for each row execute function public.tocar_updated_at();

-- RLS: somente usuários internos operam o comercial ----------------------------
alter table public.clientes enable row level security;
alter table public.leads enable row level security;

create policy clientes_interno_crud on public.clientes
  for all to authenticated
  using (public.eh_interno())
  with check (public.eh_interno());

create policy leads_interno_crud on public.leads
  for all to authenticated
  using (public.eh_interno())
  with check (public.eh_interno());
