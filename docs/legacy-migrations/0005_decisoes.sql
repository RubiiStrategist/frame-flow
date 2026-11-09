-- ============================================================================
-- FRAME FLOW — Migration 0005 · Central de decisões dos sócios
-- Regras de aprovação CONFIGURÁVEIS — a plataforma não pressupõe unanimidade.
-- ============================================================================

create type decision_status as enum ('rascunho', 'aberta', 'aprovada', 'reprovada', 'cancelada');
create type approval_rule as enum ('unanimidade', 'maioria', 'socio_presente', 'livre');
create type vote_choice as enum ('favor', 'contra', 'abstencao');

-- Decisões ----------------------------------------------------------------------
create table if not exists public.decisoes (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  descricao text not null,
  solicitante_id uuid not null references public.profiles (id) on delete restrict,
  justificativa text,
  impacto_financeiro bigint,                            -- centavos (BRL); null = sem impacto direto
  participantes uuid[] not null default '{}',
  regra_aprovacao public.approval_rule not null default 'maioria',
  status public.decision_status not null default 'aberta',
  prazo timestamptz,
  historico jsonb not null default '[]'::jsonb,         -- [{evento, usuarioId, detalhe, em}]
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
-- Nota: o antigo campo `votos jsonb` foi substituído pela tabela relacional
-- `decisao_votos` abaixo — votos editáveis em JSONB permitiam que qualquer
-- sócio reescrevesse o voto de outro; a estrutura relacional com RLS garante
-- que cada sócio só registra/altera o PRÓPRIO voto (validação no banco).

create index if not exists idx_decisoes_status on public.decisoes (status);
create index if not exists idx_decisoes_solicitante on public.decisoes (solicitante_id);

drop trigger if exists decisoes_updated_at on public.decisoes;
create trigger decisoes_updated_at before update on public.decisoes
  for each row execute function public.tocar_updated_at();

-- Histórico automático: criação e mudança de status -----------------------------
create or replace function public.decisao_registrar_evento()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  evento jsonb;
begin
  if tg_op = 'INSERT' then
    evento = jsonb_build_object(
      'evento', 'criada', 'usuarioId', new.solicitante_id,
      'detalhe', 'Solicitação aberta', 'em', now()
    );
    new.historico = new.historico || jsonb_build_array(evento);
  elsif tg_op = 'UPDATE' and new.status is distinct from old.status then
    evento = jsonb_build_object(
      'evento', new.status, 'usuarioId', auth.uid(),
      'detalhe', concat('Status: ', old.status, ' → ', new.status), 'em', now()
    );
    new.historico = new.historico || jsonb_build_array(evento);
  end if;
  return new;
end;
$$;

drop trigger if exists decisoes_evento on public.decisoes;
create trigger decisoes_evento
  before insert or update on public.decisoes
  for each row execute function public.decisao_registrar_evento();

-- Guarda do histórico: coluna gerenciada APENAS pelo trigger acima ---------------
-- A policy de UPDATE permite que sócios editem a decisão (título, status…);
-- sem esta guarda, um cliente comprometido poderia reescrever o histórico de
-- auditoria por UPDATE direto. O trigger bloqueia qualquer UPDATE que tente
-- alterar `historico` manualmente. Dispara ANTES de `decisoes_evento`
-- (triggers de mesmo evento executam em ordem alfabética: '0' < 'e').
create or replace function public.proteger_historico()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.historico is distinct from old.historico then
    raise exception 'O histórico da decisão é gerenciado pelo sistema e não pode ser editado manualmente.';
  end if;
  return new;
end;
$$;

drop trigger if exists decisoes_01_protege_historico on public.decisoes;
create trigger decisoes_01_protege_historico
  before update on public.decisoes
  for each row execute function public.proteger_historico();

-- Votos relacionais (substituem o antigo `votos` jsonb editável) ----------------
-- Cada voto é uma linha com identidade verificada por RLS: um sócio não pode
-- registrar nem alterar o voto de outro. Sem policy de delete — voto é parte
-- do histórico (corrigir voto = UPDATE da própria linha, permitido enquanto
-- a decisão estiver aberta).
create table if not exists public.decisao_votos (
  decisao_id uuid not null references public.decisoes (id) on delete cascade,
  socio_id uuid not null references public.profiles (id) on delete cascade,
  voto public.vote_choice not null,
  comentario text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  primary key (decisao_id, socio_id)
);

create index if not exists idx_decisao_votos_socio on public.decisao_votos (socio_id);

drop trigger if exists decisao_votos_updated_at on public.decisao_votos;
create trigger decisao_votos_updated_at before update on public.decisao_votos
  for each row execute function public.tocar_updated_at();

alter table public.decisao_votos enable row level security;

-- Internos leem todos os votos (trilha de auditoria).
create policy decisao_votos_interno_select on public.decisao_votos
  for select to authenticated
  using (public.eh_interno());

-- Sócio registra o PRÓPRIO voto (socio_id = auth.uid()), em decisão aberta.
create policy decisao_votos_socio_insert on public.decisao_votos
  for insert to authenticated
  with check (
    socio_id = auth.uid()
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('ceo', 'cro', 'coo_cfo')
    )
    and exists (
      select 1 from public.decisoes d
      where d.id = decisao_id and d.status = 'aberta'
    )
  );

-- Sócio altera APENAS o próprio voto, apenas em decisão aberta.
create policy decisao_votos_socio_update on public.decisao_votos
  for update to authenticated
  using (socio_id = auth.uid())
  with check (
    socio_id = auth.uid()
    and exists (
      select 1 from public.decisoes d
      where d.id = decisao_id and d.status = 'aberta'
    )
  );

-- Votos: tabela própria com RLS por identidade; contagem por regra de aprovação
-- (unanimidade/maioria/socio_presente/livre) é aplicada pela aplicação na Fase 2,
-- sobre estes dados íntegros.

revoke execute on function public.decisao_registrar_evento() from public, anon, authenticated;
revoke execute on function public.proteger_historico() from public, anon, authenticated;

-- RLS: sócios (ceo/cro/coo_cfo) decidem; colaboradores leem. ---------------------
-- UPDATE de decisão continua permitido a sócios (título, status…) — mas o
-- histórico é blindado pelo trigger acima e os votos vivem na tabela própria.
alter table public.decisoes enable row level security;

create policy decisoes_interno_select on public.decisoes
  for select to authenticated
  using (public.eh_interno());

create policy decisoes_socio_insert on public.decisoes
  for insert to authenticated
  with check (exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role in ('ceo', 'cro', 'coo_cfo')
  ));

create policy decisoes_socio_update on public.decisoes
  for update to authenticated
  using (exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role in ('ceo', 'cro', 'coo_cfo')
  ))
  with check (exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role in ('ceo', 'cro', 'coo_cfo')
  ));
