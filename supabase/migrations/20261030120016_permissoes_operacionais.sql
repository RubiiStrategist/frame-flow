-- Permissões explícitas; políticas RLS existentes permanecem intactas.
DO $$ BEGIN
 IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relname IN ('profiles','clientes','leads','projetos','tarefas','transacoes_financeiras','decisoes','decisao_votos','automacoes') AND NOT c.relrowsecurity) THEN RAISE EXCEPTION 'RLS deve estar habilitado'; END IF;
END $$;
GRANT SELECT ON public.profiles,public.clientes,public.leads,public.projetos,public.tarefas,public.transacoes_financeiras,public.decisoes,public.decisao_votos,public.automacoes TO authenticated;
GRANT INSERT, UPDATE ON public.clientes,public.leads,public.projetos,public.tarefas,public.transacoes_financeiras,public.decisoes,public.decisao_votos TO authenticated;
GRANT UPDATE(full_name,phone,avatar_url) ON public.profiles TO authenticated;
REVOKE TRUNCATE, REFERENCES, TRIGGER ON public.profiles,public.clientes,public.leads,public.projetos,public.tarefas,public.transacoes_financeiras,public.decisoes,public.decisao_votos,public.automacoes FROM anon,authenticated;

