-- Segurança de onboarding: contas novas nunca recebem acesso interno automaticamente.
alter table public.profiles alter column role set default 'cliente';
-- Trigger de RLS automático não deve ser invocável por usuários da API.
revoke execute on function public.rls_auto_enable() from public,anon,authenticated;
-- Votos só podem ser alterados enquanto a decisão permanece aberta.
drop policy if exists decisao_votos_socio_update on public.decisao_votos;
create policy decisao_votos_socio_update on public.decisao_votos for update to authenticated
using(socio_id=auth.uid() and exists(select 1 from public.decisoes d where d.id=decisao_id and d.status='aberta'))
with check(socio_id=auth.uid() and exists(select 1 from public.decisoes d where d.id=decisao_id and d.status='aberta'));
-- Dados de identidade e metadados de auditoria devem ser imutáveis pelo usuário final.
create or replace function public.proteger_identidade_perfil() returns trigger language plpgsql set search_path=public as $$
begin
 if auth.uid() is not null and (
  new.id is distinct from old.id or new.email is distinct from old.email
  or new.role is distinct from old.role or new.default_environment is distinct from old.default_environment
  or new.created_at is distinct from old.created_at
 ) then raise exception 'Campos protegidos do perfil não podem ser alterados pelo cliente';
 end if;
 return new;
end;$$;
create trigger profiles_01_protege_identidade before update on public.profiles for each row execute function public.proteger_identidade_perfil();
revoke execute on function public.proteger_identidade_perfil() from public,anon,authenticated;
