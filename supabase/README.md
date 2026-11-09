# Supabase — FRAME FLOW

## Estado reconciliado em 30/10/2026

`migrations/` contém as oito migrations que constam no histórico do projeto conectado, com os mesmos identificadores e SQL. As seis versões comentadas originais do ZIP estão preservadas em `docs/legacy-migrations/`; não devem ser aplicadas novamente. A fonte de comparação está em `docs/remote-migrations-audit.json`.

A reconciliação recuperou também a migration de segurança de onboarding/perfis/votos e a implementação correta de `tocar_voto_atualizado_em()`: a versão antiga local tentava atualizar uma coluna inexistente nos votos. Nenhuma migration histórica foi reaplicada no projeto atual.

A migration `permissoes_operacionais` foi aplicada com autorização do usuário:
- SELECT nas nove tabelas para authenticated.
- INSERT e UPDATE em clientes, leads, projetos, tarefas, transações, decisões e votos.
- UPDATE somente em full_name, phone e avatar_url do perfil.
- Sem DELETE, sem escrita direta em automações e sem acesso anônimo aos dados.
- Removidos TRUNCATE, REFERENCES e TRIGGER de anon/authenticated nas nove tabelas.
- Políticas RLS existentes preservadas.

## Testes

`tests/integration/rls-rollback.sql` executa testes de banco com quatro identidades temporárias, SET LOCAL ROLE, regras RLS e triggers reais. Tudo é revertido por ROLLBACK, incluindo usuários/perfis. Rodado com sucesso no projeto atual após autorização explícita. Não testa login HTTP; não é teste E2E do navegador.

A suíte Vitest `rls-supabase.test.ts` exige contas de teste e permanece separada. Use somente um banco descartável: decisões e eventos não são removidos por clientes comuns. Não confunda testes unitários/mock com integração real.

## Novos ambientes

Não execute `db push` ou reset no projeto atual sem conferir o histórico. Um replay completo em banco novo ainda não foi validado. A migration histórica de onboarding referencia a função de plataforma `public.rls_auto_enable()`; sua existência depende da preparação do projeto. Não foi inventada uma substituição para essa função nem alterado o SQL histórico.

Valores monetários: centavos no banco. Novas contas: cargo cliente; cargos internos devem ser atribuídos pelo administrador. RLS e triggers continuam sendo a autoridade de acesso.
