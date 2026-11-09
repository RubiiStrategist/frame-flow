-- Storage orphan checks must not confuse a row hidden by RLS with an absent row.
create function ff_private.is_pending_upload(object_path text) returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and public.ff_can_access('files',true)
 and split_part(object_path,'/',2)=auth.uid()::text
 and not exists(select 1 from public.ff_files where path=object_path);
$$;
revoke all on function ff_private.is_pending_upload(text) from public,anon;
grant usage on schema ff_private to authenticated;
grant execute on function ff_private.is_pending_upload(text) to authenticated;
drop policy ff_storage_cleanup on storage.objects;
drop policy ff_storage_pending_read on storage.objects;
create policy ff_storage_cleanup on storage.objects for delete to authenticated using(bucket_id='frameflow-files' and ff_private.is_pending_upload(name));
create policy ff_storage_pending_read on storage.objects for select to authenticated using(bucket_id='frameflow-files' and ff_private.is_pending_upload(name));
create function ff_private.access_audit() returns trigger language plpgsql security invoker set search_path='' as $$
begin new.updated_by=auth.uid();new.updated_at=now();return new;end;$$;
create trigger ff_access_audit before insert or update on public.ff_module_access for each row execute function ff_private.access_audit();
revoke all on function ff_private.access_audit() from public,anon,authenticated;

create table public.ff_cap_messages(
 id uuid primary key default gen_random_uuid(),user_id uuid not null default auth.uid() references public.profiles(id),
 environment text not null check(environment in ('executivo','comercial','operacional')),
 role text not null check(role in ('user','assistant')),content text not null check(length(content) between 1 and 12000),created_at timestamptz not null default now()
);
create index ff_cap_messages_user on public.ff_cap_messages(user_id,environment,created_at desc);
alter table public.ff_cap_messages enable row level security;
create policy ff_cap_messages_read on public.ff_cap_messages for select to authenticated using(user_id=(select auth.uid()) and public.eh_interno());
create policy ff_cap_messages_insert on public.ff_cap_messages for insert to authenticated with check(user_id=(select auth.uid()) and public.eh_interno());
grant select,insert on public.ff_cap_messages to authenticated;
create function ff_private.cap_message_guard() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 new.user_id=auth.uid();new.created_at=now();
 perform pg_advisory_xact_lock(hashtextextended('cap-message:'||auth.uid()::text,0));
 if (select count(*) from public.ff_cap_messages where user_id=auth.uid() and created_at>now()-interval '1 minute')>=30 then raise exception 'Muitas mensagens. Aguarde um minuto para continuar';end if;
 return new;
end;$$;
create trigger ff_cap_message_guard before insert on public.ff_cap_messages for each row execute function ff_private.cap_message_guard();
revoke all on function ff_private.cap_message_guard() from public,anon,authenticated;

create table public.ff_cap_actions(
 id uuid primary key default gen_random_uuid(),user_id uuid not null default auth.uid() references public.profiles(id),
 environment text not null check(environment in ('executivo','comercial','operacional')),
 kind text not null check(kind in ('create_task','complete_task','create_outreach','create_content')),
 label text not null check(length(label) between 2 and 240),payload jsonb not null check(jsonb_typeof(payload)='object' and octet_length(payload::text)<16000),
 status text not null default 'pending' check(status in ('pending','completed','cancelled')),result jsonb,
 created_at timestamptz not null default now(),expires_at timestamptz not null default now()+interval '24 hours',executed_at timestamptz
);
create index ff_cap_actions_user on public.ff_cap_actions(user_id,environment,created_at desc);
alter table public.ff_cap_actions enable row level security;
create policy ff_cap_actions_read on public.ff_cap_actions for select to authenticated using(user_id=(select auth.uid()) and public.eh_interno());
create policy ff_cap_actions_insert on public.ff_cap_actions for insert to authenticated with check(user_id=(select auth.uid()) and public.eh_interno() and status='pending');
create policy ff_cap_actions_update on public.ff_cap_actions for update to authenticated using(user_id=(select auth.uid()) and public.eh_interno()) with check(user_id=(select auth.uid()) and public.eh_interno());
grant select,insert on public.ff_cap_actions to authenticated;
grant update(status,result,executed_at) on public.ff_cap_actions to authenticated;
create function ff_private.cap_action_guard() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 if tg_op='INSERT' then new.user_id=auth.uid();new.status='pending';new.result=null;new.executed_at=null;new.created_at=now();new.expires_at=now()+interval '24 hours';
 elsif coalesce(current_setting('ff.execute_action',true),'')<>'on' then raise exception 'Confirme ou cancele a ação pela Cap';end if;
 return new;
end;$$;
create trigger ff_cap_action_guard before insert or update on public.ff_cap_actions for each row execute function ff_private.cap_action_guard();
revoke all on function ff_private.cap_action_guard() from public,anon,authenticated;

create function public.ff_execute_cap_action(action_id uuid,cancel boolean default false) returns jsonb language plpgsql security invoker set search_path='' as $$
declare a public.ff_cap_actions;target_id uuid;outcome jsonb;
begin
 select * into a from public.ff_cap_actions where id=action_id and user_id=auth.uid() for update;
 if not found then raise exception 'Ação não encontrada ou sem permissão';end if;
 if a.status='completed' then return a.result;end if;
 if a.status='cancelled' then raise exception 'Ação já cancelada';end if;
 if a.expires_at<now() then raise exception 'Ação expirada. Peça uma nova sugestão';end if;
 if cancel then
  perform set_config('ff.execute_action','on',true);
  update public.ff_cap_actions set status='cancelled' where id=a.id;
  perform set_config('ff.execute_action','off',true);
  return jsonb_build_object('message','Ação cancelada. Nenhum registro foi alterado.');
 end if;
 if a.kind='create_task' then
  if length(btrim(coalesce(a.payload->>'title','')))<2 then raise exception 'Título da tarefa inválido';end if;
  insert into public.tarefas(titulo,descricao,prioridade,projeto_id,responsavel_id,prazo)
  values(left(a.payload->>'title',240),left(coalesce(a.payload->>'description',''),4000),coalesce(a.payload->>'priority','media')::public.task_priority,nullif(a.payload->>'projectId','')::uuid,auth.uid(),case when nullif(a.payload->>'dueDate','') is null then null else ((a.payload->>'dueDate')::date+time '12:00') at time zone 'America/Sao_Paulo' end) returning id into target_id;
  outcome=jsonb_build_object('id',target_id,'message','Tarefa criada e atribuída a você.','route','/#/operacional/tarefas');
 elsif a.kind='complete_task' then
  update public.tarefas set status='concluida',concluida_em=now() where id=(a.payload->>'id')::uuid and status::text=a.payload->>'expectedStatus' returning id into target_id;
  if target_id is null then raise exception 'A tarefa mudou desde a sugestão. Atualize o contexto antes de confirmar';end if;
  outcome=jsonb_build_object('id',target_id,'message','Tarefa concluída.','route','/#/operacional/tarefas');
 elsif a.kind='create_outreach' then
  if not exists(select 1 from public.leads where id=(a.payload->>'leadId')::uuid) then raise exception 'Lead indisponível';end if;
  insert into public.ff_records(kind,title,status,lead_id,owner_id,due_date,details) values('outreach',a.payload->>'title','planejado',(a.payload->>'leadId')::uuid,auth.uid(),(a.payload->>'dueDate')::date,jsonb_build_object('channel',coalesce(a.payload->>'channel','email'),'notes',coalesce(a.payload->>'notes',''))) returning id into target_id;
  outcome=jsonb_build_object('id',target_id,'message','Contato de prospecção agendado.','route','/#/comercial/prospeccao');
 elsif a.kind='create_content' then
  insert into public.ff_records(kind,title,status,owner_id,due_date,details) values('content',a.payload->>'title','ideia',auth.uid(),nullif(a.payload->>'dueDate','')::date,jsonb_build_object('channel',coalesce(a.payload->>'channel','Instagram'),'brief',coalesce(a.payload->>'brief',''))) returning id into target_id;
  outcome=jsonb_build_object('id',target_id,'message','Ideia adicionada ao calendário editorial.','route','/#/operacional/frame-content');
 end if;
 perform set_config('ff.execute_action','on',true);
 update public.ff_cap_actions set status='completed',result=outcome,executed_at=now() where id=a.id;
 perform set_config('ff.execute_action','off',true);
 return outcome;
end;$$;
revoke all on function public.ff_execute_cap_action(uuid,boolean) from public,anon;
grant execute on function public.ff_execute_cap_action(uuid,boolean) to authenticated;
revoke all on public.ff_cap_messages,public.ff_cap_actions from anon;
revoke delete,truncate,references,trigger on public.ff_cap_messages,public.ff_cap_actions from authenticated;
create or replace function public.ff_accept_proposal(proposal_id uuid,expected_version integer,acceptance jsonb) returns jsonb language plpgsql security invoker set search_path='' as $$
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
 if pid is not null and not exists(select 1 from public.projetos where id=pid and cliente_id=cid) then raise exception 'Projeto pertence a outro cliente';end if;
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


