-- ============================================================================
-- FRAME FLOW — Migration 0003 · Operacional (projetos e tarefas)
-- ============================================================================

create type project_status as enum ('briefing', 'planejamento', 'producao', 'revisao', 'aprovacao', 'entregue', 'pausado');
create type task_status as enum ('pendente', 'em_andamento', 'concluida', 'bloqueada');
create type task_priority as enum ('baixa', 'media', 'alta');

-- Projetos --------------------------------------------------------------------
create table if not exists public.projetos (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.clientes (id) on delete restrict,  -- integridade: projeto sempre tem cliente
  titulo text not null,
  tipo_servico text not null,
  status public.project_status not null default 'briefing',
  responsavel_id uuid references public.profiles (id) on delete set null,
  data_inicio timestamptz,
  data_entrega_prevista timestamptz,
  data_entrega_real timestamptz,
  orcamento bigint not null default 0,                 -- centavos (BRL)
  descricao text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_projetos_cliente on public.projetos (cliente_id);
create index if not exists idx_projetos_status on public.projetos (status);

drop trigger if exists projetos_updated_at on public.projetos;
create trigger projetos_updated_at before update on public.projetos
  for each row execute function public.tocar_updated_at();

-- Tarefas -----------------------------------------------------------------------
create table if not exists public.tarefas (
  id uuid primary key default gen_random_uuid(),
  projeto_id uuid references public.projetos (id) on delete cascade,
  titulo text not null,
  descricao text,
  status public.task_status not null default 'pendente',
  prioridade public.task_priority not null default 'media',
  responsavel_id uuid references public.profiles (id) on delete set null,
  prazo timestamptz,
  concluida_em timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_tarefas_projeto on public.tarefas (projeto_id);
create index if not exists idx_tarefas_responsavel on public.tarefas (responsavel_id);
create index if not exists idx_tarefas_prazo on public.tarefas (prazo);

drop trigger if exists tarefas_updated_at on public.tarefas;
create trigger tarefas_updated_at before update on public.tarefas
  for each row execute function public.tocar_updated_at();

-- RLS: interno opera; cliente do portal lê tarefas dos próprios projetos (futuro)
alter table public.projetos enable row level security;
alter table public.tarefas enable row level security;

create policy projetos_interno_crud on public.projetos
  for all to authenticated
  using (public.eh_interno())
  with check (public.eh_interno());

create policy tarefas_interno_crud on public.tarefas
  for all to authenticated
  using (public.eh_interno())
  with check (public.eh_interno());
