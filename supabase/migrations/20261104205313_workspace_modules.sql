-- Additive workspace modules. Existing authentication, data and core policies are preserved.
create schema if not exists ff_private;
revoke all on schema ff_private from public, anon, authenticated;

create function public.ff_is_partner() returns boolean language sql stable security invoker set search_path='' as $$
 select exists(select 1 from public.profiles where id=(select auth.uid()) and role in ('ceo','cro','coo_cfo'));
$$;
revoke all on function public.ff_is_partner() from public,anon;
grant execute on function public.ff_is_partner() to authenticated;

create table public.ff_module_access(
 user_id uuid not null references public.profiles(id), kind text not null,
 can_read boolean not null default true,can_write boolean not null default true,
 updated_by uuid not null default auth.uid() references public.profiles(id),updated_at timestamptz not null default now(),
 primary key(user_id,kind),check(not can_write or can_read),
 check(kind in ('objective','key_result','team_member','team_activity','contract','outreach','proposal','sales_goal','retention','production_step','project_cost','approval','quality_template','quality_check','content','files'))
);
alter table public.ff_module_access enable row level security;
create policy ff_access_read on public.ff_module_access for select to authenticated using(user_id=(select auth.uid()) or public.ff_is_partner());
create policy ff_access_insert on public.ff_module_access for insert to authenticated with check(public.ff_is_partner() and exists(select 1 from public.profiles p where p.id=user_id and p.role<>'cliente'));
create policy ff_access_update on public.ff_module_access for update to authenticated using(public.ff_is_partner()) with check(public.ff_is_partner() and exists(select 1 from public.profiles p where p.id=user_id and p.role<>'cliente'));
grant select,insert,update on public.ff_module_access to authenticated;

create function public.ff_can_access(module_kind text,write_access boolean default false) returns boolean language sql stable security invoker set search_path='' as $$
 select case when public.ff_is_partner() then true when not public.eh_interno() then false
 else coalesce((select case when write_access then a.can_write else a.can_read end from public.ff_module_access a where a.user_id=(select auth.uid()) and a.kind=module_kind),module_kind<>'contract') end;
$$;
revoke all on function public.ff_can_access(text,boolean) from public,anon;
grant execute on function public.ff_can_access(text,boolean) to authenticated;

create table public.ff_records(
 id uuid primary key default gen_random_uuid(),kind text not null,title text not null,status text not null default 'ativo',amount bigint not null default 0,
 client_id uuid references public.clientes(id),project_id uuid references public.projetos(id),lead_id uuid references public.leads(id),owner_id uuid references public.profiles(id),parent_id uuid references public.ff_records(id),
 start_date date,due_date date,details jsonb not null default '{}'::jsonb,
 version integer not null default 1,created_by uuid not null default auth.uid() references public.profiles(id),created_at timestamptz not null default now(),updated_at timestamptz not null default now(),archived_at timestamptz,
 check(kind in ('objective','key_result','team_member','team_activity','contract','outreach','proposal','sales_goal','retention','production_step','project_cost','approval','quality_template','quality_check','content')),
 check(length(btrim(title)) between 2 and 240),check(length(status) between 1 and 50),check(amount between 0 and 10000000000),
 check(jsonb_typeof(details)='object' and octet_length(details::text)<=120000),check(start_date is null or due_date is null or start_date<=due_date),check(parent_id is distinct from id)
);
create index ff_records_kind_date on public.ff_records(kind,created_at desc,id);
create index ff_records_project on public.ff_records(project_id);
create index ff_records_client on public.ff_records(client_id);
create index ff_records_lead on public.ff_records(lead_id);
create index ff_records_owner on public.ff_records(owner_id);
create index ff_records_parent on public.ff_records(parent_id);
create index ff_records_creator on public.ff_records(created_by);
alter table public.ff_records enable row level security;
create policy ff_records_read on public.ff_records for select to authenticated using(public.ff_can_access(kind));
create policy ff_records_insert on public.ff_records for insert to authenticated with check(public.ff_can_access(kind,true) and created_by=(select auth.uid()));
create policy ff_records_update on public.ff_records for update to authenticated using(public.ff_can_access(kind,true)) with check(public.ff_can_access(kind,true));
grant select,insert,update on public.ff_records to authenticated;

create table public.ff_record_history(
 id uuid primary key default gen_random_uuid(),record_id uuid not null references public.ff_records(id),version integer not null,snapshot jsonb not null,
 actor_id uuid not null references public.profiles(id),created_at timestamptz not null default now(),unique(record_id,version)
);
create index ff_record_history_actor on public.ff_record_history(actor_id);
alter table public.ff_record_history enable row level security;
create policy ff_history_read on public.ff_record_history for select to authenticated using(exists(select 1 from public.ff_records r where r.id=record_id));
grant select on public.ff_record_history to authenticated;

create function ff_private.prepare_record() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 if auth.uid() is null then raise exception 'Sessão autenticada necessária';end if;
 if tg_op='INSERT' then new.created_by=auth.uid();new.created_at=now();new.version=1;
 else
  if new.id<>old.id or new.kind<>old.kind or new.created_by<>old.created_by or new.created_at<>old.created_at then raise exception 'Identidade do registro é imutável';end if;
  new.version=old.version+1;
 end if;
 new.title=btrim(new.title);new.updated_at=now();
 if new.kind='key_result' and not exists(select 1 from public.ff_records r where r.id=new.parent_id and r.kind='objective') then raise exception 'Resultado-chave exige objetivo válido';end if;
 if new.owner_id is not null and not exists(select 1 from public.profiles where id=new.owner_id and role<>'cliente') then raise exception 'Responsável deve pertencer à equipe interna';end if;
 if new.kind='proposal' then
  if new.status='aceita' and (tg_op='INSERT' or old.status<>'aceita') and coalesce(current_setting('ff.accept_proposal',true),'')<>'on' then raise exception 'Use Registrar aceite para confirmar uma proposta';end if;
  if tg_op='UPDATE' and old.status='aceita' and (new.title<>old.title or new.status<>old.status or new.amount<>old.amount or new.details<>old.details or new.lead_id is distinct from old.lead_id or new.client_id is distinct from old.client_id or new.project_id is distinct from old.project_id) then raise exception 'Proposta aceita é imutável; crie uma nova proposta para renegociar';end if;
  if coalesce(current_setting('ff.accept_proposal',true),'')<>'on' then
   if tg_op='INSERT' then new.details=new.details-'execution';
   elsif new.details->'execution' is distinct from old.details->'execution' then raise exception 'Execução da proposta é protegida';end if;
  end if;
 end if;
 return new;
end;$$;
create trigger ff_record_prepare before insert or update on public.ff_records for each row execute function ff_private.prepare_record();
-- The only elevated function is a trigger in a non-exposed schema. Clients cannot forge audit rows.
create function ff_private.audit_record() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null then raise exception 'Autor da alteração ausente';end if;
 insert into public.ff_record_history(record_id,version,snapshot,actor_id) values(new.id,new.version,to_jsonb(new),auth.uid());
 return new;
end;$$;
create trigger ff_record_audit after insert or update on public.ff_records for each row execute function ff_private.audit_record();
revoke all on function ff_private.prepare_record(),ff_private.audit_record() from public,anon,authenticated;

alter table public.leads add column closed_at timestamptz;
create function ff_private.lead_closed_at() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 if new.etapa in ('ganho','perdido') then
  if tg_op='INSERT' or old.etapa not in ('ganho','perdido') or old.etapa<>new.etapa then new.closed_at=now();else new.closed_at=old.closed_at;end if;
 else new.closed_at=null;end if;
 return new;
end;$$;
create trigger leads_closed_at before insert or update on public.leads for each row execute function ff_private.lead_closed_at();
revoke all on function ff_private.lead_closed_at() from public,anon,authenticated;

create function public.ff_accept_proposal(proposal_id uuid,expected_version integer,acceptance jsonb) returns jsonb language plpgsql security invoker set search_path='' as $$
declare p public.ff_records;l public.leads;cid uuid;pid uuid;total numeric;discount numeric;item jsonb;
begin
 select * into p from public.ff_records where id=proposal_id and kind='proposal' for update;
 if not found or not public.ff_can_access('proposal',true) then raise exception 'Proposta não encontrada ou sem acesso';end if;
 if p.status='aceita' then return to_jsonb(p);end if;
 if p.archived_at is not null or p.version<>expected_version then raise exception 'Proposta alterada ou arquivada. Atualize antes de confirmar';end if;
 if length(btrim(coalesce(acceptance->>'name','')))<2 or length(btrim(coalesce(acceptance->>'evidence','')))<5 or coalesce(acceptance->>'email','') !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then raise exception 'Informe nome, e-mail e evidência do aceite';end if;
 if (acceptance->>'acceptedAt')::timestamptz is null or (acceptance->>'acceptedAt')::timestamptz > now()+interval '5 minutes' then raise exception 'Data de aceite inválida';end if;
 if jsonb_typeof(p.details->'items') is distinct from 'array' or jsonb_array_length(p.details->'items') not between 1 and 100 then raise exception 'Inclua os itens da proposta';end if;
 total=0;
 for item in select * from jsonb_array_elements(p.details->'items') loop
  if length(btrim(coalesce(item->>'description','')))=0 or (item->>'quantity')::numeric<=0 or (item->>'unitPrice')::numeric<0 then raise exception 'Item de proposta inválido';end if;
  total=total+round((item->>'quantity')::numeric*round((item->>'unitPrice')::numeric*100));
 end loop;
 discount=coalesce((p.details->>'discountPercent')::numeric,0);
 if discount not between 0 and 100 then raise exception 'Desconto inválido';end if;
 total=total-round(total*discount/100);
 if total is null or total<>p.amount then raise exception 'Total divergente dos itens. Revise e salve a proposta';end if;
 cid=p.client_id;
 if p.lead_id is not null then
  select * into l from public.leads where id=p.lead_id for update;
  if not found then raise exception 'Lead não encontrado';end if;
  cid=coalesce(cid,l.cliente_id);
  if cid is null then insert into public.clientes(nome_fantasia,contatos,responsavel_comercial_id) values(l.empresa,jsonb_build_array(jsonb_build_object('nome',l.nome,'email',l.email,'telefone',l.telefone)),l.responsavel_id) returning id into cid;end if;
  update public.leads set etapa='ganho',valor_estimado=p.amount,cliente_id=cid where id=l.id;
 end if;
 if cid is null then raise exception 'Vincule um cliente ou lead antes do aceite';end if;
 pid=p.project_id;
 if pid is null then
  insert into public.projetos(cliente_id,titulo,tipo_servico,status,responsavel_id,orcamento,descricao,data_entrega_prevista)
  values(cid,p.title,coalesce(nullif(p.details->>'serviceType',''),'Produção audiovisual'),'briefing',p.owner_id,p.amount,coalesce(p.details->>'conditions',''),case when p.due_date is null then null else (p.due_date+time '12:00') at time zone 'America/Sao_Paulo' end) returning id into pid;
 end if;
 perform set_config('ff.accept_proposal','on',true);
 update public.ff_records set status='aceita',client_id=cid,project_id=pid,details=details||jsonb_build_object('acceptance',acceptance||jsonb_build_object('registeredBy',auth.uid()),'execution',jsonb_build_object('clientId',cid,'projectId',pid,'leadId',p.lead_id)) where id=p.id returning * into p;
 perform set_config('ff.accept_proposal','off',true);
 return to_jsonb(p);
end;$$;
revoke all on function public.ff_accept_proposal(uuid,integer,jsonb) from public,anon;
grant execute on function public.ff_accept_proposal(uuid,integer,jsonb) to authenticated;

create table public.ff_files(
 id uuid primary key default gen_random_uuid(),name text not null,project_id uuid not null references public.projetos(id),client_id uuid references public.clientes(id),record_id uuid references public.ff_records(id),
 path text not null unique,mime text not null,size bigint not null,version integer not null default 1,created_by uuid not null default auth.uid() references public.profiles(id),created_at timestamptz not null default now(),archived_at timestamptz,
 unique(project_id,name,version),check(size between 1 and 52428800),check(length(name) between 1 and 255)
);
create index ff_files_client on public.ff_files(client_id);
create index ff_files_record on public.ff_files(record_id);
create index ff_files_creator on public.ff_files(created_by);
alter table public.ff_files enable row level security;
create policy ff_files_read on public.ff_files for select to authenticated using(public.ff_can_access('files') and (record_id is null or exists(select 1 from public.ff_records r where r.id=record_id)));
create policy ff_files_insert on public.ff_files for insert to authenticated with check(public.ff_can_access('files',true) and created_by=(select auth.uid()) and (record_id is null or exists(select 1 from public.ff_records r where r.id=record_id and public.ff_can_access(r.kind,true))));
create policy ff_files_update on public.ff_files for update to authenticated using(public.ff_can_access('files',true)) with check(public.ff_can_access('files',true) and (record_id is null or exists(select 1 from public.ff_records r where r.id=record_id and public.ff_can_access(r.kind,true))));
grant select,insert on public.ff_files to authenticated;
grant update(archived_at) on public.ff_files to authenticated;
create function ff_private.prepare_file() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 if new.path not like new.project_id::text||'/'||auth.uid()::text||'/'||new.id::text||'/%' then raise exception 'Caminho de arquivo inválido';end if;
 perform pg_advisory_xact_lock(hashtextextended(new.project_id::text||'/'||new.name,0));
 select coalesce(max(version),0)+1 into new.version from public.ff_files where project_id=new.project_id and name=new.name;
 new.created_by=auth.uid();new.created_at=now();return new;
end;$$;
create trigger ff_file_prepare before insert on public.ff_files for each row execute function ff_private.prepare_file();
revoke all on function ff_private.prepare_file() from public,anon,authenticated;
insert into storage.buckets(id,name,public,file_size_limit) values('frameflow-files','frameflow-files',false,52428800);
create policy ff_storage_read on storage.objects for select to authenticated using(bucket_id='frameflow-files' and exists(select 1 from public.ff_files f where f.path=storage.objects.name and f.archived_at is null));
create policy ff_storage_insert on storage.objects for insert to authenticated with check(bucket_id='frameflow-files' and public.ff_can_access('files',true) and (storage.foldername(name))[2]=(select auth.uid())::text and exists(select 1 from public.projetos p where p.id::text=(storage.foldername(name))[1]));
-- Cleanup only for the caller's uncommitted upload; registered versions cannot be deleted.
create policy ff_storage_cleanup on storage.objects for delete to authenticated using(bucket_id='frameflow-files' and public.ff_can_access('files',true) and (storage.foldername(name))[2]=(select auth.uid())::text and not exists(select 1 from public.ff_files f where f.path=storage.objects.name));
create policy ff_storage_pending_read on storage.objects for select to authenticated using(bucket_id='frameflow-files' and public.ff_can_access('files',true) and (storage.foldername(name))[2]=(select auth.uid())::text and not exists(select 1 from public.ff_files f where f.path=storage.objects.name));
revoke all on public.ff_records,public.ff_record_history,public.ff_module_access,public.ff_files from anon;
revoke delete,truncate,references,trigger on public.ff_records,public.ff_record_history,public.ff_module_access,public.ff_files from authenticated;
