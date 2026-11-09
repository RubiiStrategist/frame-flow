create table public.automacoes(id uuid primary key default gen_random_uuid(),nome text not null,entidade text not null,entidade_id text not null,payload jsonb not null default '{}',resultado text,erro text,executada_em timestamptz not null default now(),constraint automacoes_unica unique(nome,entidade,entidade_id));
create index idx_automacoes_entidade on public.automacoes(entidade,entidade_id);
create function public.lead_ganho_registrar() returns trigger language plpgsql security definer set search_path=public as $$ begin if new.etapa='ganho' and (tg_op='INSERT' or old.etapa is distinct from 'ganho') then insert into public.automacoes(nome,entidade,entidade_id,payload,resultado) values('venda_fechada','lead',new.id::text,jsonb_build_object('lead',new.nome,'empresa',new.empresa,'valor_estimado',new.valor_estimado),'evento registrado — materialização do cliente/projeto na Fase 2') on conflict(nome,entidade,entidade_id) do nothing;end if;return new;end; $$;
create trigger lead_ganho_evento after insert or update on public.leads for each row execute function public.lead_ganho_registrar();
revoke execute on function public.lead_ganho_registrar() from public,anon,authenticated;
alter table public.automacoes enable row level security;
create policy automacoes_interno_select on public.automacoes for select to authenticated using(public.eh_interno());
