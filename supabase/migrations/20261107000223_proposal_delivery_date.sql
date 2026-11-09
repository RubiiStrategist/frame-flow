-- Proposal validity is independent from the optional project delivery date.
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
  values(cid,p.title,coalesce(nullif(p.details->>'serviceType',''),'Produção audiovisual'),'briefing',p.owner_id,p.amount,coalesce(p.details->>'conditions',''),case when nullif(p.details->>'deliveryDate','') is null then null else ((p.details->>'deliveryDate')::date+time '12:00') at time zone 'America/Sao_Paulo' end) returning id into pid;
 end if;
 perform set_config('ff.accept_proposal','on',true);
 update public.ff_records set status='aceita',client_id=cid,project_id=pid,details=details||jsonb_build_object('acceptance',acceptance||jsonb_build_object('registeredBy',auth.uid()),'execution',jsonb_build_object('clientId',cid,'projectId',pid,'leadId',p.lead_id)) where id=p.id returning * into p;
 perform set_config('ff.accept_proposal','off',true);
 return to_jsonb(p);
end;$$;
revoke all on function public.ff_accept_proposal(uuid,integer,jsonb) from public,anon;
grant execute on function public.ff_accept_proposal(uuid,integer,jsonb) to authenticated;
