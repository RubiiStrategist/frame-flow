BEGIN;
SET LOCAL statement_timeout='30s';
SELECT set_config('request.jwt.claim.sub','',true),set_config('request.jwt.claims','{}',true);
DO $$ DECLARE k text; BEGIN
 FOREACH k IN ARRAY ARRAY['owner','other','external','action','cancel','message'] LOOP PERFORM set_config('ff_cap_test.'||k,gen_random_uuid()::text,true);END LOOP;
 FOREACH k IN ARRAY ARRAY['owner','other','external'] LOOP INSERT INTO auth.users(id,email) VALUES(current_setting('ff_cap_test.'||k)::uuid,'cap-test-'||current_setting('ff_cap_test.'||k)||'@example.invalid');END LOOP;
 UPDATE public.profiles SET role='ceo' WHERE id IN(current_setting('ff_cap_test.owner')::uuid,current_setting('ff_cap_test.other')::uuid);
END $$;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub',current_setting('ff_cap_test.owner'),true);
DO $$ DECLARE r jsonb;r2 jsonb;denied boolean; BEGIN
 INSERT INTO public.ff_cap_messages(id,environment,role,content) VALUES(current_setting('ff_cap_test.message')::uuid,'executivo','user','FF CAP QA TEMP');
 INSERT INTO public.ff_cap_actions(id,environment,kind,label,payload) VALUES(current_setting('ff_cap_test.action')::uuid,'executivo','create_task','FF CAP QA TEMP',jsonb_build_object('title','FF CAP QA TEMP','priority','alta'));
 IF EXISTS(SELECT 1 FROM public.tarefas WHERE titulo='FF CAP QA TEMP') THEN RAISE EXCEPTION 'Ação executou antes da confirmação';END IF;
 r=public.ff_execute_cap_action(current_setting('ff_cap_test.action')::uuid);
 r2=public.ff_execute_cap_action(current_setting('ff_cap_test.action')::uuid);
 IF r<>r2 OR (SELECT count(*) FROM public.tarefas WHERE titulo='FF CAP QA TEMP')<>1 THEN RAISE EXCEPTION 'Execução não idempotente';END IF;
 IF NOT EXISTS(SELECT 1 FROM public.tarefas WHERE id=(r->>'id')::uuid AND responsavel_id=auth.uid() AND prioridade='alta') THEN RAISE EXCEPTION 'Tarefa não persistida corretamente';END IF;
 denied=false;BEGIN UPDATE public.ff_cap_actions SET status='pending' WHERE id=current_setting('ff_cap_test.action')::uuid;EXCEPTION WHEN raise_exception THEN denied=true;END;
 IF NOT denied THEN RAISE EXCEPTION 'Usuário reabriu ação concluída';END IF;
 INSERT INTO public.ff_cap_actions(id,environment,kind,label,payload) VALUES(current_setting('ff_cap_test.cancel')::uuid,'executivo','create_content','FF CAP CANCEL',jsonb_build_object('title','FF CAP CANCEL'));
 PERFORM public.ff_execute_cap_action(current_setting('ff_cap_test.cancel')::uuid,true);
 denied=false;BEGIN PERFORM public.ff_execute_cap_action(current_setting('ff_cap_test.cancel')::uuid);EXCEPTION WHEN raise_exception THEN denied=true;END;
 IF NOT denied OR EXISTS(SELECT 1 FROM public.ff_records WHERE title='FF CAP CANCEL') THEN RAISE EXCEPTION 'Ação cancelada criou dados';END IF;
END $$;
SELECT set_config('request.jwt.claim.sub',current_setting('ff_cap_test.other'),true);
DO $$ DECLARE denied boolean;BEGIN
 IF EXISTS(SELECT 1 FROM public.ff_cap_messages WHERE id=current_setting('ff_cap_test.message')::uuid) OR EXISTS(SELECT 1 FROM public.ff_cap_actions WHERE id=current_setting('ff_cap_test.action')::uuid) THEN RAISE EXCEPTION 'Outra conta leu histórico privado';END IF;
 denied=false;BEGIN PERFORM public.ff_execute_cap_action(current_setting('ff_cap_test.action')::uuid);EXCEPTION WHEN raise_exception THEN denied=true;END;
 IF NOT denied THEN RAISE EXCEPTION 'Outra conta executou ação alheia';END IF;
END $$;
SELECT set_config('request.jwt.claim.sub',current_setting('ff_cap_test.external'),true);
DO $$ DECLARE denied boolean;BEGIN
 denied=false;BEGIN INSERT INTO public.ff_cap_actions(environment,kind,label,payload) VALUES('executivo','create_task','FF CAP DENY','{"title":"FF CAP DENY"}');EXCEPTION WHEN insufficient_privilege THEN denied=true;END;
 IF NOT denied THEN RAISE EXCEPTION 'Conta externa criou ação';END IF;
END $$;
RESET ROLE;
SELECT 'PASSOU: confirmação obrigatória, idempotência, cancelamento, autoria, histórico privado e bloqueio de conta externa. Fixtures revertidas a seguir.' AS resultado;
ROLLBACK;
