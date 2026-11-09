-- Auditoria transacional dos módulos V5. Execute o arquivo inteiro em uma conexão.
-- Requer workspace_modules, cap_assistant e proposal_delivery_date. Não cria contas ou registros permanentes.
-- Auth é simulada no PostgreSQL: isto não substitui testes HTTP de autenticação.
BEGIN;
SET TRANSACTION ISOLATION LEVEL REPEATABLE READ;
SET LOCAL statement_timeout = '45s';
SELECT set_config('request.jwt.claim.sub','',true), set_config('request.jwt.claims','{}',true), set_config('ff_workspace_audit.assertions','0',true);

DO $$
DECLARE k text;
BEGIN
 FOREACH k IN ARRAY ARRAY['ceo','cro','staff','external','client','project','objective','key_result','contract','staff_contract','lead','proposal','bad_lead','bad_proposal','wrong_client_proposal','file1','file2','bad_file'] LOOP
  PERFORM set_config('ff_workspace_audit.'||k,gen_random_uuid()::text,true);
 END LOOP;
 FOREACH k IN ARRAY ARRAY['ceo','cro','staff','external'] LOOP
  INSERT INTO auth.users(id,email) VALUES(current_setting('ff_workspace_audit.'||k)::uuid,'ff-workspace-audit-'||current_setting('ff_workspace_audit.'||k)||'@example.invalid');
 END LOOP;
 IF (SELECT count(*) FROM public.profiles WHERE id IN (current_setting('ff_workspace_audit.ceo')::uuid,current_setting('ff_workspace_audit.cro')::uuid,current_setting('ff_workspace_audit.staff')::uuid,current_setting('ff_workspace_audit.external')::uuid) AND role='cliente')<>4 THEN RAISE EXCEPTION 'Onboarding concedeu acesso interno'; END IF;
 PERFORM set_config('ff_workspace_audit.assertions','1',true);
 UPDATE public.profiles SET role='ceo' WHERE id=current_setting('ff_workspace_audit.ceo')::uuid;
 UPDATE public.profiles SET role='cro' WHERE id=current_setting('ff_workspace_audit.cro')::uuid;
 UPDATE public.profiles SET role='colaborador' WHERE id=current_setting('ff_workspace_audit.staff')::uuid;
END $$;

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub',current_setting('ff_workspace_audit.ceo'),true);
DO $$
DECLARE n integer:=current_setting('ff_workspace_audit.assertions')::integer; changed integer; denied boolean;
BEGIN
 INSERT INTO public.clientes(id,nome_fantasia) VALUES(current_setting('ff_workspace_audit.client')::uuid,'FF WORKSPACE AUDIT arquivo '||current_setting('ff_workspace_audit.client'));
 INSERT INTO public.projetos(id,cliente_id,titulo,tipo_servico) VALUES(current_setting('ff_workspace_audit.project')::uuid,current_setting('ff_workspace_audit.client')::uuid,'FF WORKSPACE AUDIT projeto','Auditoria');
 INSERT INTO public.ff_records(id,kind,title,status,created_by,version) VALUES(current_setting('ff_workspace_audit.objective')::uuid,'objective','FF WORKSPACE AUDIT objetivo','ativo',current_setting('ff_workspace_audit.cro')::uuid,999);
 IF NOT EXISTS(SELECT 1 FROM public.ff_records WHERE id=current_setting('ff_workspace_audit.objective')::uuid AND version=1 AND created_by=auth.uid()) THEN RAISE EXCEPTION 'Autoria ou versão inicial falsificável'; END IF; n:=n+1;
 IF NOT EXISTS(SELECT 1 FROM public.ff_record_history WHERE record_id=current_setting('ff_workspace_audit.objective')::uuid AND version=1 AND actor_id=auth.uid() AND snapshot->>'title'='FF WORKSPACE AUDIT objetivo') THEN RAISE EXCEPTION 'Histórico inicial ausente'; END IF; n:=n+1;
 INSERT INTO public.ff_records(id,kind,title,parent_id,details) VALUES(current_setting('ff_workspace_audit.key_result')::uuid,'key_result','FF WORKSPACE AUDIT resultado',current_setting('ff_workspace_audit.objective')::uuid,'{"target":100,"current":10}');
 IF NOT EXISTS(SELECT 1 FROM public.ff_records WHERE id=current_setting('ff_workspace_audit.key_result')::uuid AND parent_id=current_setting('ff_workspace_audit.objective')::uuid) THEN RAISE EXCEPTION 'Vínculo do resultado-chave ausente'; END IF; n:=n+1;
 denied:=false; BEGIN INSERT INTO public.ff_records(kind,title,parent_id) VALUES('key_result','FF WORKSPACE AUDIT inválido',current_setting('ff_workspace_audit.key_result')::uuid); EXCEPTION WHEN raise_exception THEN denied:=true; END;
 IF NOT denied THEN RAISE EXCEPTION 'Resultado-chave aceitou pai que não é objetivo'; END IF; n:=n+1;
 UPDATE public.ff_records SET title='FF WORKSPACE AUDIT objetivo revisado',version=999 WHERE id=current_setting('ff_workspace_audit.objective')::uuid AND version=1;
 GET DIAGNOSTICS changed=ROW_COUNT;
 IF changed<>1 OR NOT EXISTS(SELECT 1 FROM public.ff_records WHERE id=current_setting('ff_workspace_audit.objective')::uuid AND version=2) THEN RAISE EXCEPTION 'Versão de edição incorreta'; END IF; n:=n+1;
 IF (SELECT count(*) FROM public.ff_record_history WHERE record_id=current_setting('ff_workspace_audit.objective')::uuid)<>2 OR NOT EXISTS(SELECT 1 FROM public.ff_record_history WHERE record_id=current_setting('ff_workspace_audit.objective')::uuid AND version=1 AND snapshot->>'title'='FF WORKSPACE AUDIT objetivo') THEN RAISE EXCEPTION 'Histórico anterior reescrito ou versão ausente'; END IF; n:=n+1;
 UPDATE public.ff_records SET title='FF WORKSPACE AUDIT atualização obsoleta' WHERE id=current_setting('ff_workspace_audit.objective')::uuid AND version=1;
 GET DIAGNOSTICS changed=ROW_COUNT;
 IF changed<>0 THEN RAISE EXCEPTION 'Filtro de versão obsoleta sobrescreveu registro'; END IF; n:=n+1;
 IF (SELECT count(*) FROM public.ff_record_history WHERE record_id=current_setting('ff_workspace_audit.objective')::uuid)<>2 THEN RAISE EXCEPTION 'Atualização sem linha gerou histórico'; END IF; n:=n+1;
 UPDATE public.ff_records SET archived_at=now() WHERE id=current_setting('ff_workspace_audit.objective')::uuid AND version=2;
 IF NOT EXISTS(SELECT 1 FROM public.ff_records WHERE id=current_setting('ff_workspace_audit.objective')::uuid AND version=3 AND archived_at IS NOT NULL) THEN RAISE EXCEPTION 'Arquivamento falhou'; END IF; n:=n+1;
 UPDATE public.ff_records SET archived_at=null WHERE id=current_setting('ff_workspace_audit.objective')::uuid AND version=3;
 IF NOT EXISTS(SELECT 1 FROM public.ff_records WHERE id=current_setting('ff_workspace_audit.objective')::uuid AND version=4 AND archived_at IS NULL) THEN RAISE EXCEPTION 'Restauração falhou'; END IF; n:=n+1;
 IF (SELECT count(*) FROM public.ff_record_history WHERE record_id=current_setting('ff_workspace_audit.objective')::uuid)<>4 THEN RAISE EXCEPTION 'Arquivamento/restauração sem auditoria'; END IF; n:=n+1;
 denied:=false; BEGIN UPDATE public.ff_records SET kind='outreach' WHERE id=current_setting('ff_workspace_audit.objective')::uuid; EXCEPTION WHEN raise_exception THEN denied:=true; END;
 IF NOT denied THEN RAISE EXCEPTION 'Tipo do registro foi alterado'; END IF; n:=n+1;
 denied:=false; BEGIN INSERT INTO public.ff_record_history(record_id,version,snapshot,actor_id) VALUES(current_setting('ff_workspace_audit.objective')::uuid,55,'{}',auth.uid()); EXCEPTION WHEN insufficient_privilege THEN denied:=true; END;
 IF NOT denied THEN RAISE EXCEPTION 'Cliente inseriu auditoria falsa'; END IF; n:=n+1;
 denied:=false; BEGIN UPDATE public.ff_record_history SET snapshot='{}' WHERE record_id=current_setting('ff_workspace_audit.objective')::uuid; EXCEPTION WHEN insufficient_privilege THEN denied:=true; END;
 IF NOT denied THEN RAISE EXCEPTION 'Cliente editou auditoria'; END IF; n:=n+1;
 denied:=false; BEGIN DELETE FROM public.ff_record_history WHERE record_id=current_setting('ff_workspace_audit.objective')::uuid; EXCEPTION WHEN insufficient_privilege THEN denied:=true; END;
 IF NOT denied THEN RAISE EXCEPTION 'Cliente apagou auditoria'; END IF; n:=n+1;
 denied:=false; BEGIN DELETE FROM public.ff_records WHERE id=current_setting('ff_workspace_audit.objective')::uuid; EXCEPTION WHEN insufficient_privilege THEN denied:=true; END;
 IF NOT denied THEN RAISE EXCEPTION 'DELETE de registros foi liberado'; END IF; n:=n+1;
 INSERT INTO public.ff_records(id,kind,title) VALUES(current_setting('ff_workspace_audit.contract')::uuid,'contract','FF WORKSPACE AUDIT contrato restrito');
 PERFORM set_config('ff_workspace_audit.assertions',n::text,true);
END $$;

-- Aceite transacional, repetição idempotente e proteção da data de fechamento.
DO $$
DECLARE n integer:=current_setting('ff_workspace_audit.assertions')::integer; denied boolean; accepted jsonb; repeated jsonb; cid uuid; pid uuid; dated_proposal uuid:=gen_random_uuid(); invalid_date_proposal uuid:=gen_random_uuid(); closed_at_before timestamptz; clients_before bigint; projects_before bigint;
        proof jsonb:=jsonb_build_object('name','Cliente de teste','email','cliente@example.invalid','acceptedAt',now(),'evidence','Aceite temporário da auditoria transacional.');
BEGIN
 INSERT INTO public.leads(id,nome,empresa,etapa,valor_estimado,responsavel_id) VALUES(current_setting('ff_workspace_audit.lead')::uuid,'FF WORKSPACE AUDIT contato','FF WORKSPACE AUDIT empresa '||current_setting('ff_workspace_audit.lead'),'qualificado',1,auth.uid());
 INSERT INTO public.ff_records(id,kind,title,status,lead_id,amount,due_date,details) VALUES(current_setting('ff_workspace_audit.proposal')::uuid,'proposal','FF WORKSPACE AUDIT proposta','enviada',current_setting('ff_workspace_audit.lead')::uuid,90000,'2030-06-01','{"items":[{"description":"Captação","quantity":2,"unitPrice":500}],"discountPercent":10,"conditions":"Condição de teste"}');
 accepted:=public.ff_accept_proposal(current_setting('ff_workspace_audit.proposal')::uuid,1,proof);
 cid:=(accepted->>'client_id')::uuid;pid:=(accepted->>'project_id')::uuid;
 IF accepted->>'status'<>'aceita' OR (accepted->>'version')::integer<>2 OR cid IS NULL OR pid IS NULL THEN RAISE EXCEPTION 'Aceite não materializou os vínculos'; END IF; n:=n+1;
 IF NOT EXISTS(SELECT 1 FROM public.leads WHERE id=current_setting('ff_workspace_audit.lead')::uuid AND etapa='ganho' AND cliente_id=cid AND valor_estimado=90000 AND closed_at IS NOT NULL) THEN RAISE EXCEPTION 'Lead não convertido atomicamente'; END IF; n:=n+1;
 IF NOT EXISTS(SELECT 1 FROM public.projetos WHERE id=pid AND cliente_id=cid AND orcamento=90000 AND status='briefing') OR NOT EXISTS(SELECT 1 FROM public.clientes WHERE id=cid) THEN RAISE EXCEPTION 'Cliente ou projeto do aceite inconsistente'; END IF; n:=n+1;
 IF NOT EXISTS(SELECT 1 FROM public.projetos WHERE id=pid AND data_entrega_prevista IS NULL) THEN RAISE EXCEPTION 'Validade da proposta virou prazo do projeto sem entrega definida'; END IF; n:=n+1;
 IF NOT EXISTS(SELECT 1 FROM public.ff_record_history WHERE record_id=current_setting('ff_workspace_audit.proposal')::uuid AND version=2 AND snapshot->'details'->'acceptance'->>'registeredBy'=auth.uid()::text) THEN RAISE EXCEPTION 'Aceite sem autor auditado'; END IF; n:=n+1;
 SELECT count(*) INTO clients_before FROM public.clientes;SELECT count(*) INTO projects_before FROM public.projetos;
 repeated:=public.ff_accept_proposal(current_setting('ff_workspace_audit.proposal')::uuid,1,proof);
 IF repeated->>'client_id'<>cid::text OR repeated->>'project_id'<>pid::text OR (repeated->>'version')::integer<>2 THEN RAISE EXCEPTION 'Repetição do aceite não idempotente'; END IF; n:=n+1;
 IF (SELECT count(*) FROM public.clientes)<>clients_before OR (SELECT count(*) FROM public.projetos)<>projects_before OR (SELECT count(*) FROM public.ff_record_history WHERE record_id=current_setting('ff_workspace_audit.proposal')::uuid)<>2 THEN RAISE EXCEPTION 'Aceite duplicou cliente, projeto ou histórico'; END IF; n:=n+1;
 SELECT closed_at INTO closed_at_before FROM public.leads WHERE id=current_setting('ff_workspace_audit.lead')::uuid;
 UPDATE public.leads SET observacoes='Edição posterior ao fechamento',closed_at=now()-interval '10 days' WHERE id=current_setting('ff_workspace_audit.lead')::uuid;
 IF (SELECT closed_at FROM public.leads WHERE id=current_setting('ff_workspace_audit.lead')::uuid) IS DISTINCT FROM closed_at_before THEN RAISE EXCEPTION 'Data de fechamento alterada por edição do lead'; END IF; n:=n+1;
 denied:=false; BEGIN UPDATE public.ff_records SET amount=1 WHERE id=current_setting('ff_workspace_audit.proposal')::uuid; EXCEPTION WHEN raise_exception THEN denied:=true; END;
 IF NOT denied THEN RAISE EXCEPTION 'Valor de proposta aceita foi alterado'; END IF; n:=n+1;
 INSERT INTO public.leads(id,nome,empresa,etapa,valor_estimado) VALUES(current_setting('ff_workspace_audit.bad_lead')::uuid,'FF WORKSPACE AUDIT inválido','FF WORKSPACE AUDIT divergente '||current_setting('ff_workspace_audit.bad_lead'),'qualificado',77);
 INSERT INTO public.ff_records(id,kind,title,status,lead_id,amount,details) VALUES(current_setting('ff_workspace_audit.bad_proposal')::uuid,'proposal','FF WORKSPACE AUDIT total divergente','enviada',current_setting('ff_workspace_audit.bad_lead')::uuid,999,'{"items":[{"description":"Entrega","quantity":1,"unitPrice":100}],"discountPercent":0}');
 denied:=false; BEGIN PERFORM public.ff_accept_proposal(current_setting('ff_workspace_audit.bad_proposal')::uuid,1,proof); EXCEPTION WHEN raise_exception THEN denied:=true; END;
 IF NOT denied THEN RAISE EXCEPTION 'Proposta de total divergente foi aceita'; END IF; n:=n+1;
 IF NOT EXISTS(SELECT 1 FROM public.leads WHERE id=current_setting('ff_workspace_audit.bad_lead')::uuid AND etapa='qualificado' AND cliente_id IS NULL AND valor_estimado=77 AND closed_at IS NULL) OR NOT EXISTS(SELECT 1 FROM public.ff_records WHERE id=current_setting('ff_workspace_audit.bad_proposal')::uuid AND status='enviada' AND version=1) THEN RAISE EXCEPTION 'Aceite inválido deixou mutação parcial'; END IF; n:=n+1;
 IF (SELECT count(*) FROM public.clientes)<>clients_before OR (SELECT count(*) FROM public.projetos)<>projects_before THEN RAISE EXCEPTION 'Aceite inválido deixou cliente/projeto'; END IF; n:=n+1;
 -- A incompatibilidade de cliente falha depois da tentativa de conversão; tudo deve voltar.
 INSERT INTO public.ff_records(id,kind,title,status,lead_id,project_id,amount,details) VALUES(current_setting('ff_workspace_audit.wrong_client_proposal')::uuid,'proposal','FF WORKSPACE AUDIT cliente incompatível','enviada',current_setting('ff_workspace_audit.bad_lead')::uuid,current_setting('ff_workspace_audit.project')::uuid,10000,'{"items":[{"description":"Entrega","quantity":1,"unitPrice":100}],"discountPercent":0}');
 denied:=false; BEGIN PERFORM public.ff_accept_proposal(current_setting('ff_workspace_audit.wrong_client_proposal')::uuid,1,proof); EXCEPTION WHEN raise_exception THEN denied:=true; END;
 IF NOT denied THEN RAISE EXCEPTION 'Proposta aceitou projeto de outro cliente'; END IF; n:=n+1;
 IF (SELECT count(*) FROM public.clientes)<>clients_before OR (SELECT count(*) FROM public.projetos)<>projects_before OR NOT EXISTS(SELECT 1 FROM public.leads WHERE id=current_setting('ff_workspace_audit.bad_lead')::uuid AND etapa='qualificado' AND cliente_id IS NULL AND closed_at IS NULL) THEN RAISE EXCEPTION 'Falha após conversão não reverteu cliente/lead/projeto'; END IF; n:=n+1;
 -- A validade comercial e o prazo operacional devem permanecer independentes.
 INSERT INTO public.ff_records(id,kind,title,status,client_id,amount,due_date,details) VALUES(dated_proposal,'proposal','FF WORKSPACE AUDIT entrega independente','enviada',cid,10000,'2030-06-01','{"items":[{"description":"Entrega","quantity":1,"unitPrice":100}],"deliveryDate":"2030-07-15"}');
 accepted:=public.ff_accept_proposal(dated_proposal,1,proof);
 IF NOT EXISTS(SELECT 1 FROM public.projetos WHERE id=(accepted->>'project_id')::uuid AND (data_entrega_prevista AT TIME ZONE 'America/Sao_Paulo')::date='2030-07-15') OR (SELECT due_date FROM public.ff_records WHERE id=dated_proposal)<>'2030-06-01'::date THEN RAISE EXCEPTION 'Prazo do projeto não preservou a entrega independente da validade'; END IF; n:=n+1;
 INSERT INTO public.ff_records(id,kind,title,status,client_id,amount,due_date,details) VALUES(invalid_date_proposal,'proposal','FF WORKSPACE AUDIT entrega inválida','enviada',cid,10000,'2030-06-01','{"items":[{"description":"Entrega","quantity":1,"unitPrice":100}],"deliveryDate":"2030-02-31"}');
 SELECT count(*) INTO projects_before FROM public.projetos;
 denied:=false; BEGIN PERFORM public.ff_accept_proposal(invalid_date_proposal,1,proof); EXCEPTION WHEN datetime_field_overflow OR invalid_datetime_format THEN denied:=true; END;
 IF NOT denied THEN RAISE EXCEPTION 'Aceite permitiu data de entrega inexistente'; END IF; n:=n+1;
 IF (SELECT count(*) FROM public.projetos)<>projects_before OR NOT EXISTS(SELECT 1 FROM public.ff_records WHERE id=invalid_date_proposal AND status='enviada' AND version=1) THEN RAISE EXCEPTION 'Data inválida deixou projeto ou aceite parcial'; END IF; n:=n+1;
 PERFORM set_config('ff_workspace_audit.assertions',n::text,true);
END $$;

-- Apenas metadados: a auditoria não envia bytes ao Storage.
DO $$
DECLARE n integer:=current_setting('ff_workspace_audit.assertions')::integer; denied boolean; file_name text:='ff-workspace-audit-'||current_setting('ff_workspace_audit.project')||'.txt';
BEGIN
 INSERT INTO public.ff_files(id,name,project_id,client_id,record_id,path,mime,size,version) VALUES(current_setting('ff_workspace_audit.file1')::uuid,file_name,current_setting('ff_workspace_audit.project')::uuid,current_setting('ff_workspace_audit.client')::uuid,current_setting('ff_workspace_audit.objective')::uuid,current_setting('ff_workspace_audit.project')||'/'||auth.uid()||'/'||current_setting('ff_workspace_audit.file1')||'/proof.txt','text/plain',10,999);
 INSERT INTO public.ff_files(id,name,project_id,client_id,path,mime,size,version) VALUES(current_setting('ff_workspace_audit.file2')::uuid,file_name,current_setting('ff_workspace_audit.project')::uuid,current_setting('ff_workspace_audit.client')::uuid,current_setting('ff_workspace_audit.project')||'/'||auth.uid()||'/'||current_setting('ff_workspace_audit.file2')||'/proof.txt','text/plain',20,1);
 IF NOT EXISTS(SELECT 1 FROM public.ff_files WHERE id=current_setting('ff_workspace_audit.file1')::uuid AND version=1 AND created_by=auth.uid()) THEN RAISE EXCEPTION 'Primeira versão de arquivo não atribuída pelo servidor'; END IF; n:=n+1;
 IF NOT EXISTS(SELECT 1 FROM public.ff_files WHERE id=current_setting('ff_workspace_audit.file2')::uuid AND version=2) OR (SELECT count(DISTINCT version) FROM public.ff_files WHERE project_id=current_setting('ff_workspace_audit.project')::uuid AND name=file_name)<>2 THEN RAISE EXCEPTION 'Versões de arquivo não são sequenciais e únicas'; END IF; n:=n+1;
 denied:=false; BEGIN UPDATE public.ff_files SET path='outro/projeto/arquivo' WHERE id=current_setting('ff_workspace_audit.file1')::uuid; EXCEPTION WHEN insufficient_privilege THEN denied:=true; END;
 IF NOT denied THEN RAISE EXCEPTION 'Caminho de arquivo mutável pelo cliente'; END IF; n:=n+1;
 denied:=false; BEGIN INSERT INTO public.ff_files(id,name,project_id,path,mime,size) VALUES(current_setting('ff_workspace_audit.file1')::uuid,file_name,current_setting('ff_workspace_audit.project')::uuid,current_setting('ff_workspace_audit.project')||'/'||auth.uid()||'/'||current_setting('ff_workspace_audit.file1')||'/proof.txt','text/plain',10); EXCEPTION WHEN unique_violation THEN denied:=true; END;
 IF NOT denied THEN RAISE EXCEPTION 'Identidade/caminho duplicado de arquivo aceito'; END IF; n:=n+1;
 denied:=false; BEGIN INSERT INTO public.ff_files(id,name,project_id,path,mime,size) VALUES(current_setting('ff_workspace_audit.bad_file')::uuid,'inválido.txt',current_setting('ff_workspace_audit.project')::uuid,current_setting('ff_workspace_audit.project')||'/'||current_setting('ff_workspace_audit.cro')||'/'||current_setting('ff_workspace_audit.bad_file')||'/proof.txt','text/plain',10); EXCEPTION WHEN raise_exception THEN denied:=true; END;
 IF NOT denied THEN RAISE EXCEPTION 'Upload pôde usar pasta de outra identidade'; END IF; n:=n+1;
 UPDATE public.ff_files SET archived_at=now() WHERE id=current_setting('ff_workspace_audit.file1')::uuid;
 IF NOT EXISTS(SELECT 1 FROM public.ff_files WHERE id=current_setting('ff_workspace_audit.file1')::uuid AND archived_at IS NOT NULL) THEN RAISE EXCEPTION 'Arquivo não foi arquivado'; END IF; n:=n+1;
 UPDATE public.ff_files SET archived_at=null WHERE id=current_setting('ff_workspace_audit.file1')::uuid;
 IF NOT EXISTS(SELECT 1 FROM public.ff_files WHERE id=current_setting('ff_workspace_audit.file1')::uuid AND archived_at IS NULL AND version=1) THEN RAISE EXCEPTION 'Arquivo não foi restaurado preservando versão'; END IF; n:=n+1;
 denied:=false; BEGIN DELETE FROM public.ff_files WHERE id=current_setting('ff_workspace_audit.file1')::uuid; EXCEPTION WHEN insufficient_privilege THEN denied:=true; END;
 IF NOT denied THEN RAISE EXCEPTION 'Metadados de arquivo foram apagados'; END IF; n:=n+1;
 PERFORM set_config('ff_workspace_audit.assertions',n::text,true);
END $$;

SELECT set_config('request.jwt.claim.sub',current_setting('ff_workspace_audit.staff'),true);
DO $$
DECLARE n integer:=current_setting('ff_workspace_audit.assertions')::integer; denied boolean; changed integer;
BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.ff_records WHERE id=current_setting('ff_workspace_audit.objective')::uuid) THEN RAISE EXCEPTION 'Colaborador não lê módulo permitido'; END IF; n:=n+1;
 IF EXISTS(SELECT 1 FROM public.ff_records WHERE id=current_setting('ff_workspace_audit.contract')::uuid) THEN RAISE EXCEPTION 'Contrato exposto ao colaborador por padrão'; END IF; n:=n+1;
 IF EXISTS(SELECT 1 FROM public.ff_record_history WHERE record_id=current_setting('ff_workspace_audit.contract')::uuid) THEN RAISE EXCEPTION 'Histórico de contrato exposto por padrão'; END IF; n:=n+1;
 denied:=false; BEGIN INSERT INTO public.ff_records(kind,title) VALUES('contract','FF WORKSPACE AUDIT contrato proibido'); EXCEPTION WHEN insufficient_privilege THEN denied:=true; END;
 IF NOT denied THEN RAISE EXCEPTION 'Colaborador inseriu contrato sem autorização'; END IF; n:=n+1;
 UPDATE public.ff_records SET title='FF WORKSPACE AUDIT alteração proibida' WHERE id=current_setting('ff_workspace_audit.contract')::uuid;
 GET DIAGNOSTICS changed=ROW_COUNT;
 IF changed<>0 THEN RAISE EXCEPTION 'Colaborador editou contrato sem autorização'; END IF; n:=n+1;
 denied:=false; BEGIN INSERT INTO public.ff_module_access(user_id,kind,can_read,can_write) VALUES(auth.uid(),'contract',true,true); EXCEPTION WHEN insufficient_privilege THEN denied:=true; END;
 IF NOT denied THEN RAISE EXCEPTION 'Colaborador concedeu acesso a si próprio'; END IF; n:=n+1;
 PERFORM set_config('ff_workspace_audit.assertions',n::text,true);
END $$;

-- Sócio concede primeiro leitura, depois escrita; a autorização volta a ser revogada.
SELECT set_config('request.jwt.claim.sub',current_setting('ff_workspace_audit.cro'),true);
INSERT INTO public.ff_module_access(user_id,kind,can_read,can_write) VALUES(current_setting('ff_workspace_audit.staff')::uuid,'contract',true,false);
SELECT set_config('request.jwt.claim.sub',current_setting('ff_workspace_audit.staff'),true);
DO $$
DECLARE n integer:=current_setting('ff_workspace_audit.assertions')::integer; denied boolean; changed integer;
BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.ff_records WHERE id=current_setting('ff_workspace_audit.contract')::uuid) THEN RAISE EXCEPTION 'Concessão de leitura não funcionou'; END IF; n:=n+1;
 UPDATE public.ff_records SET title='FF WORKSPACE AUDIT escrita sem concessão' WHERE id=current_setting('ff_workspace_audit.contract')::uuid;
 GET DIAGNOSTICS changed=ROW_COUNT;
 IF changed<>0 THEN RAISE EXCEPTION 'Concessão somente leitura permitiu escrita'; END IF; n:=n+1;
 UPDATE public.ff_module_access SET can_write=true WHERE user_id=auth.uid() AND kind='contract';
 GET DIAGNOSTICS changed=ROW_COUNT;
 IF changed<>0 THEN RAISE EXCEPTION 'Colaborador ampliou sua permissão existente'; END IF; n:=n+1;
 denied:=false; BEGIN INSERT INTO public.ff_records(kind,title) VALUES('contract','FF WORKSPACE AUDIT inserção sem concessão'); EXCEPTION WHEN insufficient_privilege THEN denied:=true; END;
 IF NOT denied THEN RAISE EXCEPTION 'Concessão somente leitura permitiu inserir contrato'; END IF; n:=n+1;
 PERFORM set_config('ff_workspace_audit.assertions',n::text,true);
END $$;
SELECT set_config('request.jwt.claim.sub',current_setting('ff_workspace_audit.cro'),true);
UPDATE public.ff_module_access SET can_write=true WHERE user_id=current_setting('ff_workspace_audit.staff')::uuid AND kind='contract';
SELECT set_config('request.jwt.claim.sub',current_setting('ff_workspace_audit.staff'),true);
DO $$
DECLARE n integer:=current_setting('ff_workspace_audit.assertions')::integer;
BEGIN
 UPDATE public.ff_records SET title='FF WORKSPACE AUDIT contrato autorizado' WHERE id=current_setting('ff_workspace_audit.contract')::uuid AND version=1;
 IF NOT EXISTS(SELECT 1 FROM public.ff_records WHERE id=current_setting('ff_workspace_audit.contract')::uuid AND version=2 AND title='FF WORKSPACE AUDIT contrato autorizado') THEN RAISE EXCEPTION 'Concessão de escrita não funcionou'; END IF; n:=n+1;
 IF NOT EXISTS(SELECT 1 FROM public.ff_record_history WHERE record_id=current_setting('ff_workspace_audit.contract')::uuid AND version=2 AND actor_id=auth.uid()) THEN RAISE EXCEPTION 'Edição delegada perdeu autoria'; END IF; n:=n+1;
 INSERT INTO public.ff_records(id,kind,title) VALUES(current_setting('ff_workspace_audit.staff_contract')::uuid,'contract','FF WORKSPACE AUDIT contrato da equipe');
 IF NOT EXISTS(SELECT 1 FROM public.ff_records WHERE id=current_setting('ff_workspace_audit.staff_contract')::uuid AND created_by=auth.uid()) THEN RAISE EXCEPTION 'Concessão de escrita não permitiu cadastro'; END IF; n:=n+1;
 PERFORM set_config('ff_workspace_audit.assertions',n::text,true);
END $$;
SELECT set_config('request.jwt.claim.sub',current_setting('ff_workspace_audit.cro'),true);
UPDATE public.ff_module_access SET can_read=false,can_write=false WHERE user_id=current_setting('ff_workspace_audit.staff')::uuid AND kind='contract';
SELECT set_config('request.jwt.claim.sub',current_setting('ff_workspace_audit.staff'),true);
DO $$
DECLARE n integer:=current_setting('ff_workspace_audit.assertions')::integer;
BEGIN
 IF EXISTS(SELECT 1 FROM public.ff_records WHERE id IN (current_setting('ff_workspace_audit.contract')::uuid,current_setting('ff_workspace_audit.staff_contract')::uuid)) THEN RAISE EXCEPTION 'Revogação não ocultou contratos'; END IF; n:=n+1;
 IF EXISTS(SELECT 1 FROM public.ff_record_history WHERE record_id=current_setting('ff_workspace_audit.contract')::uuid) THEN RAISE EXCEPTION 'Revogação não ocultou histórico'; END IF; n:=n+1;
 IF NOT EXISTS(SELECT 1 FROM public.ff_module_access WHERE user_id=auth.uid() AND kind='contract' AND NOT can_read AND NOT can_write) THEN RAISE EXCEPTION 'Colaborador não vê sua permissão efetiva'; END IF; n:=n+1;
 PERFORM set_config('ff_workspace_audit.assertions',n::text,true);
END $$;

SELECT set_config('request.jwt.claim.sub',current_setting('ff_workspace_audit.external'),true);
DO $$
DECLARE n integer:=current_setting('ff_workspace_audit.assertions')::integer; denied boolean; changed integer;
BEGIN
 IF EXISTS(SELECT 1 FROM public.ff_records LIMIT 1) THEN RAISE EXCEPTION 'Cliente externo leu registros internos'; END IF; n:=n+1;
 IF EXISTS(SELECT 1 FROM public.ff_record_history LIMIT 1) THEN RAISE EXCEPTION 'Cliente externo leu auditoria interna'; END IF; n:=n+1;
 IF EXISTS(SELECT 1 FROM public.ff_files LIMIT 1) THEN RAISE EXCEPTION 'Cliente externo leu metadados de arquivos'; END IF; n:=n+1;
 denied:=false; BEGIN INSERT INTO public.ff_records(kind,title) VALUES('objective','FF WORKSPACE AUDIT externo'); EXCEPTION WHEN insufficient_privilege THEN denied:=true; END;
 IF NOT denied THEN RAISE EXCEPTION 'Cliente externo criou registro interno'; END IF; n:=n+1;
 UPDATE public.ff_records SET title='FF WORKSPACE AUDIT externo editou' WHERE id=current_setting('ff_workspace_audit.objective')::uuid;
 GET DIAGNOSTICS changed=ROW_COUNT;
 IF changed<>0 THEN RAISE EXCEPTION 'Cliente externo editou registro interno'; END IF; n:=n+1;
 denied:=false; BEGIN PERFORM public.ff_accept_proposal(current_setting('ff_workspace_audit.proposal')::uuid,2,'{}'); EXCEPTION WHEN raise_exception THEN denied:=true; END;
 IF NOT denied THEN RAISE EXCEPTION 'RPC de aceite expôs proposta ao cliente externo'; END IF; n:=n+1;
 PERFORM set_config('ff_workspace_audit.assertions',n::text,true);
END $$;

RESET ROLE;
SELECT set_config('request.jwt.claim.sub','',true);
SET LOCAL ROLE anon;
DO $$
DECLARE n integer:=current_setting('ff_workspace_audit.assertions')::integer; denied boolean; table_name text;
BEGIN
 FOREACH table_name IN ARRAY ARRAY['ff_records','ff_record_history','ff_files','ff_module_access'] LOOP
  denied:=false; BEGIN EXECUTE format('SELECT 1 FROM public.%I LIMIT 1',table_name); EXCEPTION WHEN insufficient_privilege THEN denied:=true; END;
  IF NOT denied THEN RAISE EXCEPTION 'Anon leu tabela %',table_name; END IF; n:=n+1;
 END LOOP;
 denied:=false; BEGIN PERFORM public.ff_accept_proposal(current_setting('ff_workspace_audit.proposal')::uuid,2,'{}'); EXCEPTION WHEN insufficient_privilege THEN denied:=true; END;
 IF NOT denied THEN RAISE EXCEPTION 'Anon executou RPC de aceite'; END IF; n:=n+1;
 PERFORM set_config('ff_workspace_audit.assertions',n::text,true);
END $$;
RESET ROLE;
SELECT current_setting('ff_workspace_audit.assertions')::integer AS assertions,
 'PASSOU: registros, resultados-chave, auditoria imutável, versões, arquivamento, aceite atômico/idempotente, data de fechamento, arquivos, permissões granulares, externo e anon. Todas as fixtures estão nesta transação e serão revertidas pelo ROLLBACK a seguir.' AS resultado;
ROLLBACK;
