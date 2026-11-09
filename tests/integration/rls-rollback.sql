-- Testes de banco autorizados; tudo é desfeito por ROLLBACK.
-- Não testa login HTTP nem substitui testes E2E do navegador.
BEGIN;
SET LOCAL statement_timeout = '30s';
SELECT set_config('request.jwt.claim.sub','',true), set_config('request.jwt.claims','{}',true);
DO $$
DECLARE k text;
BEGIN
 FOREACH k IN ARRAY ARRAY['ceo','cro','staff','external','client','lead','project','task','finance','decision'] LOOP
  PERFORM set_config('ff_audit.' || k,gen_random_uuid()::text,true);
 END LOOP;
 FOREACH k IN ARRAY ARRAY['ceo','cro','staff','external'] LOOP
  INSERT INTO auth.users(id,email) VALUES(current_setting('ff_audit.'||k)::uuid,'ff-audit-'||current_setting('ff_audit.'||k)||'@example.invalid');
 END LOOP;
 IF (SELECT count(*) FROM public.profiles WHERE id IN (current_setting('ff_audit.ceo')::uuid,current_setting('ff_audit.cro')::uuid,current_setting('ff_audit.staff')::uuid,current_setting('ff_audit.external')::uuid) AND role='cliente') <> 4 THEN RAISE EXCEPTION 'Onboarding não restringiu novas contas'; END IF;
 UPDATE public.profiles SET role='ceo' WHERE id=current_setting('ff_audit.ceo')::uuid;
 UPDATE public.profiles SET role='cro' WHERE id=current_setting('ff_audit.cro')::uuid;
 UPDATE public.profiles SET role='colaborador' WHERE id=current_setting('ff_audit.staff')::uuid;
END $$;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub',current_setting('ff_audit.ceo'),true);
DO $$
DECLARE changed integer; denied boolean;
BEGIN
 INSERT INTO public.clientes(id,nome_fantasia) VALUES(current_setting('ff_audit.client')::uuid,'FF AUDIT temporário');
 INSERT INTO public.leads(id,nome,empresa,etapa) VALUES(current_setting('ff_audit.lead')::uuid,'FF AUDIT temporário','Teste','ganho');
 INSERT INTO public.projetos(id,cliente_id,titulo,tipo_servico) VALUES(current_setting('ff_audit.project')::uuid,current_setting('ff_audit.client')::uuid,'FF AUDIT temporário','Teste');
 INSERT INTO public.tarefas(id,projeto_id,titulo) VALUES(current_setting('ff_audit.task')::uuid,current_setting('ff_audit.project')::uuid,'FF AUDIT temporário');
 INSERT INTO public.transacoes_financeiras(id,tipo,descricao,valor,vencimento,criado_por) VALUES(current_setting('ff_audit.finance')::uuid,'entrada','FF AUDIT temporário',12345,now(),auth.uid());
 INSERT INTO public.decisoes(id,titulo,descricao,solicitante_id) VALUES(current_setting('ff_audit.decision')::uuid,'FF AUDIT temporário','Teste transacional',auth.uid());
 UPDATE public.clientes SET nome_fantasia='FF AUDIT editado' WHERE id=current_setting('ff_audit.client')::uuid;
 IF NOT EXISTS(SELECT 1 FROM public.clientes WHERE id=current_setting('ff_audit.client')::uuid AND nome_fantasia='FF AUDIT editado') THEN RAISE EXCEPTION 'Edição de cliente falhou'; END IF;
 UPDATE public.projetos SET status='producao' WHERE id=current_setting('ff_audit.project')::uuid;
 IF NOT EXISTS(SELECT 1 FROM public.projetos WHERE id=current_setting('ff_audit.project')::uuid AND status='producao') THEN RAISE EXCEPTION 'Edição de projeto falhou'; END IF;
 UPDATE public.tarefas SET status='concluida' WHERE id=current_setting('ff_audit.task')::uuid;
 IF NOT EXISTS(SELECT 1 FROM public.tarefas WHERE id=current_setting('ff_audit.task')::uuid AND status='concluida') THEN RAISE EXCEPTION 'Edição de tarefa falhou'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.vencimentos_em_aberto WHERE id=current_setting('ff_audit.finance')::uuid) THEN RAISE EXCEPTION 'View financeira não retornou registro'; END IF;
 UPDATE public.transacoes_financeiras SET pago=true,pago_em=now() WHERE id=current_setting('ff_audit.finance')::uuid;
 IF NOT EXISTS(SELECT 1 FROM public.transacoes_financeiras WHERE id=current_setting('ff_audit.finance')::uuid AND pago) THEN RAISE EXCEPTION 'Baixa financeira falhou'; END IF;
 UPDATE public.leads SET etapa='contato' WHERE id=current_setting('ff_audit.lead')::uuid;
 UPDATE public.leads SET etapa='ganho' WHERE id=current_setting('ff_audit.lead')::uuid;
 IF (SELECT count(*) FROM public.automacoes WHERE entidade_id=current_setting('ff_audit.lead')) <> 1 THEN RAISE EXCEPTION 'Automação não idempotente'; END IF;
 INSERT INTO public.decisao_votos(decisao_id,socio_id,voto) VALUES(current_setting('ff_audit.decision')::uuid,auth.uid(),'favor');
 UPDATE public.decisao_votos SET voto='abstencao' WHERE decisao_id=current_setting('ff_audit.decision')::uuid AND socio_id=auth.uid();
 IF NOT EXISTS(SELECT 1 FROM public.decisao_votos WHERE decisao_id=current_setting('ff_audit.decision')::uuid AND socio_id=auth.uid() AND voto='abstencao') THEN RAISE EXCEPTION 'Edição do próprio voto falhou'; END IF;
 UPDATE public.profiles SET full_name='FF AUDIT editado' WHERE id=auth.uid();
 IF NOT EXISTS(SELECT 1 FROM public.profiles WHERE id=auth.uid() AND full_name='FF AUDIT editado') THEN RAISE EXCEPTION 'Edição de perfil falhou'; END IF;
 denied=false; BEGIN UPDATE public.profiles SET role='cro' WHERE id=auth.uid(); EXCEPTION WHEN insufficient_privilege THEN denied=true; END;
 IF NOT denied THEN RAISE EXCEPTION 'Alteração de cargo permitida'; END IF;
 denied=false; BEGIN UPDATE public.decisoes SET historico='[]'::jsonb WHERE id=current_setting('ff_audit.decision')::uuid; EXCEPTION WHEN raise_exception THEN denied=true; END;
 IF NOT denied THEN RAISE EXCEPTION 'Reescrita do histórico permitida'; END IF;
 denied=false; BEGIN DELETE FROM public.leads WHERE id=current_setting('ff_audit.lead')::uuid; EXCEPTION WHEN insufficient_privilege THEN denied=true; END;
 IF NOT denied THEN RAISE EXCEPTION 'DELETE geral indevidamente liberado'; END IF;
END $$;
SELECT set_config('request.jwt.claim.sub',current_setting('ff_audit.cro'),true);
DO $$
DECLARE changed integer; denied boolean;
BEGIN
 UPDATE public.decisao_votos SET voto='contra' WHERE decisao_id=current_setting('ff_audit.decision')::uuid AND socio_id=current_setting('ff_audit.ceo')::uuid;
 GET DIAGNOSTICS changed=ROW_COUNT;
 IF changed <> 0 THEN RAISE EXCEPTION 'Sócio alterou voto alheio'; END IF;
 denied=false; BEGIN INSERT INTO public.decisao_votos(decisao_id,socio_id,voto) VALUES(current_setting('ff_audit.decision')::uuid,current_setting('ff_audit.staff')::uuid,'favor'); EXCEPTION WHEN insufficient_privilege THEN denied=true; END;
 IF NOT denied THEN RAISE EXCEPTION 'Voto em nome alheio permitido'; END IF;
 INSERT INTO public.decisao_votos(decisao_id,socio_id,voto) VALUES(current_setting('ff_audit.decision')::uuid,auth.uid(),'favor');
 UPDATE public.decisoes SET status='cancelada' WHERE id=current_setting('ff_audit.decision')::uuid;
 UPDATE public.decisao_votos SET voto='contra' WHERE decisao_id=current_setting('ff_audit.decision')::uuid AND socio_id=auth.uid();
 GET DIAGNOSTICS changed=ROW_COUNT;
 IF changed <> 0 THEN RAISE EXCEPTION 'Voto alterado após encerramento'; END IF;
END $$;
SELECT set_config('request.jwt.claim.sub',current_setting('ff_audit.staff'),true);
DO $$
DECLARE denied boolean;
BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.decisoes WHERE id=current_setting('ff_audit.decision')::uuid) THEN RAISE EXCEPTION 'Colaborador não lê decisão'; END IF;
 denied=false; BEGIN INSERT INTO public.decisoes(titulo,descricao,solicitante_id) VALUES('FF AUDIT bloqueado','Teste',auth.uid()); EXCEPTION WHEN insufficient_privilege THEN denied=true; END;
 IF NOT denied THEN RAISE EXCEPTION 'Colaborador criou decisão societária'; END IF;
 UPDATE public.leads SET etapa='contato' WHERE id=current_setting('ff_audit.lead')::uuid;
 IF NOT EXISTS(SELECT 1 FROM public.leads WHERE id=current_setting('ff_audit.lead')::uuid AND etapa='contato') THEN RAISE EXCEPTION 'Colaborador não edita lead'; END IF;
END $$;
SELECT set_config('request.jwt.claim.sub',current_setting('ff_audit.external'),true);
DO $$
DECLARE denied boolean; changed integer;
BEGIN
 IF EXISTS(SELECT 1 FROM public.leads WHERE id=current_setting('ff_audit.lead')::uuid) OR EXISTS(SELECT 1 FROM public.transacoes_financeiras WHERE id=current_setting('ff_audit.finance')::uuid) OR EXISTS(SELECT 1 FROM public.decisoes WHERE id=current_setting('ff_audit.decision')::uuid) THEN RAISE EXCEPTION 'Cliente externo visualizou dados internos'; END IF;
 denied=false; BEGIN INSERT INTO public.leads(nome,empresa) VALUES('FF AUDIT bloqueado','Teste'); EXCEPTION WHEN insufficient_privilege THEN denied=true; END;
 IF NOT denied THEN RAISE EXCEPTION 'Cliente externo criou lead'; END IF;
 UPDATE public.leads SET etapa='perdido' WHERE id=current_setting('ff_audit.lead')::uuid;
 GET DIAGNOSTICS changed=ROW_COUNT;
 IF changed <> 0 THEN RAISE EXCEPTION 'Cliente externo editou lead'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.profiles WHERE id=auth.uid()) THEN RAISE EXCEPTION 'Cliente não lê próprio perfil'; END IF;
END $$;
RESET ROLE;
SELECT set_config('request.jwt.claim.sub','',true);
SET LOCAL ROLE anon;
DO $$ DECLARE denied boolean; BEGIN
 denied=false; BEGIN PERFORM 1 FROM public.leads LIMIT 1; EXCEPTION WHEN insufficient_privilege THEN denied=true; END;
 IF NOT denied THEN RAISE EXCEPTION 'Anon leu leads'; END IF;
END $$;
RESET ROLE;
ROLLBACK;
SELECT 'PASSOU: onboarding, criação/edição interna, autoria, perfil, voto próprio, bloqueio de voto alheio e fechado, histórico, idempotência, externo, anon e exclusão bloqueada; fixtures revertidas' AS resultado;

