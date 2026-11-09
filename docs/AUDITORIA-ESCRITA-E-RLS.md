# FRAME FLOW — auditoria de escrita e RLS concluída

Atualização de 30/10/2026. Este relatório substitui as pendências de permissão e de histórico de migrations da entrega inicial. O usuário autorizou o uso do projeto atual para testes e confirmou que ainda não possui dados reais.

## Implementado e aplicado

- Migration remota `20261030120016_permissoes_operacionais`: cadastro e edição liberados em clientes, leads, projetos, tarefas, transações financeiras, decisões e votos, sujeitos às políticas RLS existentes.
- Perfis: edição limitada a nome, telefone e avatar. Cargo e identidade permanecem protegidos.
- Automações continuam sem escrita direta pelo cliente. DELETE e TRUNCATE não foram liberados. Permissões residuais de TRUNCATE, REFERENCES e TRIGGER foram removidas de anon/authenticated nas nove tabelas.
- RLS permanece ativo nas nove tabelas; as políticas não foram alteradas. Anon continua sem leitura dos dados.
- Frontend: cadastros financeiros e decisões passaram a enviar o autor da sessão validada, exigido pelo schema. Atualizações de etapa de lead e baixa financeira só informam sucesso quando o banco retorna a linha alterada. Zero linhas por RLS ou registro inexistente retorna falha.
- Acessibilidade: campo de vencimento financeiro associado corretamente ao rótulo e às mensagens do formulário.

## Histórico reconciliado

As oito migrations locais correspondem aos nomes, versões e SQL registrados no banco. Comparação normalizada concluída para as oito. As seis versões originais do kit estão preservadas em `docs/legacy-migrations/`, fora da pasta executável.

Além da migration de segurança ausente, havia uma diferença importante na migration de votos: a versão original local usava um trigger que escrevia `updated_at`, mas a tabela usa `atualizado_em`. O histórico remoto já tinha a função correta; ela foi recuperada localmente sem reaplicar migrations antigas no banco.

`docs/remote-migrations-audit.json` registra a fonte usada na comparação. O README do Supabase foi atualizado. Um replay completo em projeto novo não foi realizado; a migration histórica de onboarding depende da função de plataforma `rls_auto_enable()`. Não use reset ou push indiscriminadamente no projeto conectado.

## Verificação realizada

- TypeScript e lint: passaram.
- Vitest: 97 testes passaram; 7 testes HTTP de integração permaneceram ignorados por falta das contas dedicadas.
- Build de produção: passou com as correções de dados; build final inclui também o ajuste de acessibilidade.
- Integração SQL real: `tests/integration/rls-rollback.sql` passou usando SET LOCAL ROLE e quatro identidades temporárias. Verificou onboarding restrito, criação/edição de registros internos, edição de perfil, bloqueio de alteração de cargo, voto próprio, bloqueio de voto alheio e de voto em decisão encerrada, proteção do histórico, idempotência de automações, restrições de colaborador, isolamento de cliente externo, bloqueio anônimo e bloqueio de exclusão.
- Os testes SQL usaram transação com ROLLBACK, inclusive para usuários/perfis temporários. Não geraram senhas nem sessões de login para esses usuários.
- Navegador: cadastro financeiro de teste no valor de R$ 123,45 salvo pela sessão existente, autoria confirmada no banco, registro listado na tela e refletido nos indicadores do dashboard. O registro foi removido especificamente pelo seu ID após a captura.
- Consulta final confirmou zero usuários, clientes, leads, projetos, tarefas, transações e decisões remanescentes com os marcadores de teste.

A suíte SQL não substitui a cobertura HTTP de login dos quatro cargos. A suíte HTTP legada também precisa adaptar a limpeza de fixtures ao modelo sem DELETE de decisões. Não foi declarada como aprovada.

## Evidência visual

`outputs/screenshots/cadastro-financeiro-validado.jpg`: captura real da aplicação, com o registro temporário identificado. Esse registro já foi removido. Não representa receita real.

## Limites e próximos trabalhos

- Não foi feito deploy. A versão local mantém os demais módulos existentes; seu redesenho completo continua fora desta etapa.
- Alguns métodos de edição já existem na camada de dados, mas a interface ainda não oferece edição geral/exclusão em todos os módulos. A auditoria de banco não transforma esses fluxos em telas prontas.
- Replay em banco novo e suíte HTTP por cargo permanecem pendentes.
- Advisors continuam com dois avisos preexistentes: função `eh_interno()` SECURITY DEFINER acessível a authenticated, necessária às políticas atuais, e proteção de senhas vazadas desativada. Nenhum desses avisos foi ocultado ou anunciado como corrigido.

Referências:
- [Grants e RLS](https://supabase.com/docs/guides/api/securing-your-api)
- [Revisão de funções SECURITY DEFINER](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable)
- [Proteção contra senhas vazadas](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection)

## Pacote

`FRAME-FLOW-DASHBOARD-V2.zip` contém o código atualizado, migrations reconciliadas, testes e documentação. Não inclui `.env.local`, dependências instaladas nem build. O V1 fica preservado como entrega anterior.
