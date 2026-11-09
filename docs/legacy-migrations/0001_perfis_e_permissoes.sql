-- ============================================================================
-- FRAME FLOW — Migration 0001 · Perfis, papéis e permissões
-- ----------------------------------------------------------------------------
-- Princípios:
--   * Toda tabela de negócio nasce com Row Level Security habilitada.
--   * Usuários são criados no Supabase Auth (dashboard) — nunca por SQL com
--     senha em texto puro. O trigger abaixo cria o perfil automaticamente.
--   * Cargos dos sócios (ceo/cro/coo_cfo) são atribuídos após a criação das
--     contas reais (ver comentário SEED_SÓCIOS no final).
-- ============================================================================

create extension if not exists "pgcrypto";

-- Tipos de papel e ambiente ---------------------------------------------------
create type user_role as enum ('ceo', 'cro', 'coo_cfo', 'colaborador', 'cliente');
create type app_environment as enum ('executivo', 'comercial', 'operacional', 'portal');

-- Perfis ----------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text not null default '',
  role public.user_role not null default 'colaborador',
  phone text,
  avatar_url text,
  default_environment public.app_environment not null default 'executivo',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_profiles_role on public.profiles (role);

-- Helper de "é usuário interno" (sócios e colaboradores; clientes são portal) --
create or replace function public.eh_interno()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role in ('ceo', 'cro', 'coo_cfo', 'colaborador')
  );
$$;

-- Trigger: cria perfil automaticamente quando o usuário nasce no Auth --------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- updated_at ------------------------------------------------------------------
-- (search_path fixo em todas as funções de trigger — regra de segurança Supabase)
create or replace function public.tocar_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- RLS: perfis ------------------------------------------------------------------
alter table public.profiles enable row level security;

-- Internos veem perfis internos; cada usuário vê o próprio.
create policy profiles_select_interno on public.profiles
  for select to authenticated
  using (public.eh_interno() or id = auth.uid());

-- Apenas o próprio usuário altera dados básicos do perfil.
create policy profiles_update_proprio on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- Elevação de cargo NÃO acontece pelo cliente: apenas via SQL/dashboard
-- (nenhuma policy de update de role pelo frontend).

-- Proteção adicional no BANCO (defesa em profundidade): a policy de UPDATE
-- permite que cada usuário edite a própria linha — sem esta guarda, um
-- cliente comprometido poderia enviar `set role = 'ceo'`. O trigger abaixo
-- bloqueia qualquer mudança de cargo quando existe auth.uid() na sessão
-- (usuário autenticado comum). Atribuições legítimas ocorrem via SQL
-- Editor/dashboard (postgres, sem auth.uid()) ou service_role — exatamente
-- o fluxo do bloco SEED_SÓCIOS no final deste arquivo.
create or replace function public.proteger_cargo()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.role is distinct from old.role and auth.uid() is not null then
    raise exception 'Elevação de cargo não permitida pelo cliente — use o bloco SEED_SÓCIOS via SQL/dashboard.';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_protege_cargo on public.profiles;
create trigger profiles_protege_cargo
  before update on public.profiles
  for each row execute function public.proteger_cargo();

-- Higiene de execução de funções ---------------------------------------------
-- eh_interno() alimenta policies `to authenticated` — execução restrita a eles.
-- Funções de trigger são disparadas internamente e não precisam de EXECUTE
-- público (remover do PUBLIC/anon evita invocação direta fora de contexto).
revoke execute on function public.eh_interno() from public, anon;
grant execute on function public.eh_interno() to authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.tocar_updated_at() from public, anon, authenticated;
revoke execute on function public.proteger_cargo() from public, anon, authenticated;

-- ============================================================================
-- SEED_SÓCIOS (executar APÓS criar as contas reais no Supabase Auth):
--
--   update public.profiles
--      set role = 'ceo',    full_name = 'Rubian',  default_environment = 'executivo'
--    where email = 'email-real-do-rubian@framevision.com.br';
--
--   update public.profiles
--      set role = 'cro',    full_name = 'William', default_environment = 'comercial'
--    where email = 'email-real-do-william@framevision.com.br';
--
--   update public.profiles
--      set role = 'coo_cfo', full_name = 'Letícia', default_environment = 'operacional'
--    where email = 'email-real-da-leticia@framevision.com.br';
--
-- Substitua pelos e-mails oficiais. Nenhum e-mail é inventado por esta migration.
-- ============================================================================
