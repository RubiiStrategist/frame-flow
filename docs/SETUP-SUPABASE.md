# Guia de configuração do Supabase — FRAME FLOW

Objetivo: ativar autenticação real e persistência de dados legítimos.
Tempo estimado: 15–20 minutos.

---

## 1. Criar o projeto

1. Acesse <https://supabase.com/dashboard> e crie um novo projeto.
2. Nome sugerido: `frame-flow`.
3. Região: a mais próxima dos clientes (ex.: **South America (São Paulo)**).
4. Guarde a senha do banco (não é usada pelo app — apenas infraestrutura).

## 2. Executar as migrations

No Supabase, abra **SQL Editor → New query** e execute, uma por vez, **na
ordem**, os arquivos da pasta `supabase/migrations/`:

```
0001_perfis_e_permissoes.sql
0002_comercial.sql
0003_operacional.sql
0004_financeiro.sql
0005_decisoes.sql
0006_engine.sql
```

Ao final, confira em **Table Editor** que existem as tabelas:
`profiles`, `clientes`, `leads`, `projetos`, `tarefas`,
`transacoes_financeiras`, `decisoes`, `decisao_votos`, `automacoes`
(+ a view `vencimentos_em_aberto`).

> Requisito de versão: PostgreSQL **15+** (padrão nos projetos Supabase atuais),
> necessário para a view `vencimentos_em_aberto` com `security_invoker = true`.

## 3. Criar as contas dos três sócios

**Authentication → Users → Add user → Create user.**

- Rubian (CEO), William (CRO), Letícia (COO + CFO), cada um com o **e-mail real**.
- Recomendado: marcar **Auto Generate Password** + **Send Invite Wizard** —
  cada sócio define a própria senha por convite. Nenhuma senha transita pela
  plataforma em texto puro.

O trigger `handle_new_user` cria o perfil automaticamente em `profiles`.

## 4. Atribuir os cargos

Volte ao **SQL Editor** e execute (substituindo pelos e-mails reais usados no
passo 3):

```sql
update public.profiles
   set role = 'ceo',     full_name = 'Rubian',  default_environment = 'executivo'
 where email = 'rubian@DOMINIO-REAL.com';

update public.profiles
   set role = 'cro',     full_name = 'William', default_environment = 'comercial'
 where email = 'william@DOMINIO-REAL.com';

update public.profiles
   set role = 'coo_cfo', full_name = 'Letícia', default_environment = 'operacional'
 where email = 'leticia@DOMINIO-REAL.com';
```

## 5. Configurar a autenticação

Em **Authentication → Providers → Email**: mantenha *Email* habilitado.
Desaconselha-se "Confirm email" apenas em produção estrita — para uso interno
dos sócios, o convite por e-mail já cobre isso.

Em **Authentication → URL Configuration**:
- **Site URL**: `https://frameflow.vercel.app` (ou o domínio final)
- **Redirect URLs**: adicione `https://frameflow.vercel.app/**` e `http://localhost:3000/**`

## 6. Conectar a aplicação

Copie de **Settings → API**:
- `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
- `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Desenvolvimento (local):

```bash
cp .env.example .env.local   # e preencha os valores reais
# reinicie o servidor de desenvolvimento
```

Produção (Vercel): **Project → Settings → Environment Variables** — cadastre as
mesmas duas variáveis em Production/Preview, e faça o deploy.

## 7. Validação (checklist)

- [ ] Login com e-mail/senha real de um sócio entra no ambiente do cargo.
- [ ] Logout encerra a sessão; rotas internas não vazam sem sessão.
- [ ] "Novo lead" grava e aparece na listagem e no funil.
- [ ] "Nova movimentação" grava; vencimentos alimentam a Cap.
- [ ] `leads` alterado para etapa `ganho` gera registro em `automacoes` (sem duplicar ao repetir).
- [ ] Colaborador de teste (role `colaborador`) lê dados, mas não abre decisões (insert/update bloqueados por RLS).
- [ ] **Anti-elevação**: tentar `update profiles set role = 'ceo'` pela sessão autenticada retorna o erro do trigger `proteger_cargo`.
- [ ] **Votos**: cada sócio grava apenas o próprio voto em `decisao_votos` (tentativa em nome de outro falha por RLS); UPDATE manual de `decisoes.historico` falha (trigger `proteger_historico`).
- [ ] **View financeira**: usuário de teste com role `cliente` consulta `vencimentos_em_aberto` e `transacoes_financeiras` → **zero linhas**.

## 8. Testes automatizados de integração (opcional, recomendado)

A suíte `tests/integration/rls-supabase.test.ts` verifica automaticamente
todo o checklist acima contra um banco de TESTE (nunca produção):

1. Crie um projeto Supabase de teste e execute as migrations (passo 2).
2. Crie 4 usuários de teste no Auth (sócio A `ceo`, sócio B `cro`, um
   `colaborador`, um `cliente`) e atribua os cargos via SQL (passo 4).
3. Exporte as variáveis e rode:

```bash
export SUPABASE_TEST_URL="https://<projeto-teste>.supabase.co"
export SUPABASE_TEST_ANON_KEY="<anon key do projeto de TESTE>"
export TEST_SOCIO_A_EMAIL=... TEST_SOCIO_A_PASSWORD=...
export TEST_SOCIO_B_EMAIL=... TEST_SOCIO_B_PASSWORD=...
export TEST_COLABORADOR_EMAIL=... TEST_COLABORADOR_PASSWORD=...
export TEST_CLIENTE_EMAIL=... TEST_CLIENTE_PASSWORD=...

bun run test   # a suíte de integração pula sozinha sem essas variáveis
```

> Nota: eventos em `automacoes` são append-only (sem policy de delete, por
> design de auditoria) — use um banco de teste descartável.

## O que NÃO fazer

- ❌ Não coloque `SUPABASE_SERVICE_ROLE_KEY` no frontend (nem com prefixo NEXT_PUBLIC).
- ❌ Não desative RLS para "simplificar" testes.
- ❌ Não insira usuários/senhas por INSERT — contas nascem no Auth, e o trigger cuida do perfil.
