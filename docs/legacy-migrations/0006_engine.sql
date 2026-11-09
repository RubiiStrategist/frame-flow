-- ============================================================================
-- FRAME FLOW — Migration 0006 · Frame Flow Engine (automações)
-- Arquitetura do motor central: log idempotente de eventos com gatilhos.
--
-- Fluxo empresarial alvo:
--   Lead → Proposta → Contrato → Cliente → Projeto → Produção
--        → Aprovação → Entrega
-- Eventos financeiros seguem condições contratuais.
--
-- Automação piloto já ativa aqui: "venda fechada" registra o evento (sem
-- duplicações). A materialização completa (criar/vincular cliente e projeto)
-- entra na Fase 2 junto com propostas/contratos.
-- ============================================================================

-- Log idempotente de automações ---------------------------------------------------
create table if not exists public.automacoes (
  id uuid primary key default gen_random_uuid(),
  nome text not null,                                  -- chave de idempotência (ex.: 'venda_fechada')
  entidade text not null,                              -- 'lead', 'transacao', 'decisao'...
  entidade_id text not null,                           -- id da entidade (como texto)
  payload jsonb not null default '{}'::jsonb,
  resultado text,                                      -- 'ok' | descrição do resultado
  erro text,
  executada_em timestamptz not null default now(),
  constraint automacoes_unica unique (nome, entidade, entidade_id)
);

create index if not exists idx_automacoes_entidade on public.automacoes (entidade, entidade_id);

-- Gatilho: venda fechada (lead entra em 'ganho') registra evento único ------------
create or replace function public.lead_ganho_registrar()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.etapa = 'ganho' and (tg_op = 'INSERT' or old.etapa is distinct from 'ganho') then
    insert into public.automacoes (nome, entidade, entidade_id, payload, resultado)
    values ('venda_fechada', 'lead', new.id::text,
            jsonb_build_object('lead', new.nome, 'empresa', new.empresa,
                               'valor_estimado', new.valor_estimado),
            'evento registrado — materialização do cliente/projeto na Fase 2')
    on conflict (nome, entidade, entidade_id) do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists lead_ganho_evento on public.leads;
create trigger lead_ganho_evento
  after insert or update on public.leads
  for each row execute function public.lead_ganho_registrar();

-- Higiene: função de trigger sem EXECUTE público (disparo é interno).
revoke execute on function public.lead_ganho_registrar() from public, anon, authenticated;

-- RLS: automações são auditoria — somente leitura para internos -------------------
alter table public.automacoes enable row level security;

create policy automacoes_interno_select on public.automacoes
  for select to authenticated
  using (public.eh_interno());
