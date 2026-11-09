# FRAME FLOW — entrega V5

Consolidada em 7 de novembro de 2026. Implementação local em `outputs/frame-flow/FRAME-FLOW-COMPLETO/01-aplicativo`. Nenhum deploy em produção foi realizado.

## O que foi implementado

Todos os módulos registrados que abriam a página “Funcionalidade futura” agora têm telas operacionais. O login existente foi preservado e as gravações usam a sessão do usuário e as políticas do Supabase.

| Área | Funções disponíveis nesta versão |
| --- | --- |
| Planejamento | Objetivos, ciclos, resultados-chave, pesos, medições, evidências e progresso calculado. |
| Pessoas e equipe | Diretório, responsabilidades, candidatos, onboarding, treinamentos e permissões de leitura/edição por módulo para colaboradores. Cadastrar uma pessoa não cria uma conta de autenticação. |
| Contratos | Biblioteca, conteúdo, versões, vigências, responsáveis, registro manual de assinatura e exportação imprimível. |
| Inteligência executiva | Funil, distribuição comercial, situação das propostas, capacidade operacional, atrasos e bloqueios com dados disponíveis à conta. |
| Prospecção | Contatos planejados, campanha/cadência, canal, lead, prazos e registro do resultado. |
| Propostas | Itens, quantidades, preços, descontos, condições, versões, documento para impressão/PDF e registro de aceite com evidência. O aceite conecta cliente, lead ganho e projeto de forma atômica e idempotente. Validade da proposta e entrega prevista são campos separados. |
| Metas e comissões | Metas por período/responsável, apuração sobre vendas ganhas com data de fechamento e cálculo de comissão prevista. Não efetua pagamentos. |
| Retenção | Saúde da carteira, receita recebida, ações de relacionamento, risco e oportunidades de expansão. |
| Produção | Quadro por status do projeto, etapas, entregáveis, responsáveis, prazos e bloqueios. |
| Custos | Previsão e realização de custos, quantidades, valores unitários, custos por projeto e margem sem somar novamente as mesmas transações financeiras. |
| Aprovações | Solicitação e registro manual do retorno do cliente, responsável, evidência e histórico. |
| Arquivos | Upload privado de até 50 MB, vínculo por projeto/registro, versões, download com URL temporária, arquivamento e restauração. |
| Qualidade | Modelos reutilizáveis, checklists copiados por projeto, itens concluídos com autoria/data e indicadores. Alterar um modelo não altera verificações já criadas. |
| Frame Content | Pautas, roteiro, canal, formato, calendário, revisão/aprovação, registro de publicação por URL e exportações CSV/ICS. |
| Cap | Três mascotes preservadas com animações distintas, histórico privado por conta e ambiente, resumos e prioridades locais, propostas de criação/conclusão de tarefas, contato comercial e conteúdo editorial. Toda ação exige confirmação. |

Os novos cadastros têm busca, filtros, mensagens de erro, histórico, controle de versão, arquivamento e restauração quando aplicável. Alterações concorrentes não sobrescrevem silenciosamente uma versão mais recente. Dados carregados de uma conta são descartados quando a identidade autenticada muda.

## Segurança e banco

Foram aplicadas três migrations aditivas, com os arquivos locais reconciliados com o histórico remoto:

- `20261104205313_workspace_modules.sql`
- `20261105111115_cap_assistant.sql`
- `20261107000223_proposal_delivery_date.sql`

As tabelas novas têm RLS. Usuários anônimos/externos não receberam acesso aos módulos internos. Histórico é protegido contra edição normal; arquivos são privados. A API da Cap valida sessão e cargo; não utiliza service role no navegador. Ações confirmadas têm verificação de autoria e execução idempotente.

Os dois avisos anteriores do Supabase continuam presentes: a função existente `public.eh_interno()` usa SECURITY DEFINER e a proteção contra senhas vazadas está desativada. Não foram introduzidos novos avisos na auditoria de segurança. Referências: [funções SECURITY DEFINER](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable) e [proteção de senhas](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).

## Validação executada

- ESLint: aprovado.
- TypeScript: aprovado na compilação do Next.js.
- Build otimizado e preparação standalone: aprovados após as últimas correções.
- Suíte completa: 185 testes aprovados; 7 testes HTTP antigos de integração foram ignorados por falta das quatro credenciais de teste exigidas por essa suíte.
- Após o último ajuste de datas, 20 testes direcionados passaram, incluindo 2 regressões novas. São 187 casos distintos verificados nesta entrega.
- Supabase remoto: 69 asserções aprovadas de CRUD, RLS, histórico imutável, versões, permissões, arquivamento, proposta/cliente/projeto, datas e metadados de arquivos. Todas essas fixtures foram revertidas com ROLLBACK.
- Supabase remoto, Cap: confirmação obrigatória, idempotência, cancelamento, autoria, histórico privado e bloqueio de conta externa aprovados, com ROLLBACK.
- API local `/api/cap` sem sessão: HTTP 401.
- Navegador com login real: criação/edição/histórico/arquivamento/restauração de objetivo; criação de lead e proposta; total de R$ 2.700 calculado de 2 × R$ 1.500 menos 10%; datas comercial e operacional independentes; Cap criando tarefa e pauta apenas após confirmação; edição da pauta e posicionamento no calendário no dia escolhido.
- Navegação pelos novos módulos sem alertas de erro; console sem erros/avisos na conferência final.
- Responsividade: telas representativas de planejamento, propostas, produção, arquivos, conteúdo e Cap sem overflow horizontal a 320 px; conteúdo também conferido a 390 px.

As capturas `outputs/screenshots/v5-*.jpg` são imagens reais do navegador. Os registros com prefixo `FF-QA-V5` visíveis nelas são fixtures de validação, não dados demonstrativos inseridos na interface. A limpeza foi concluída e confirmada no banco: zero registros, leads, tarefas, ações e mensagens de teste remanescentes. Os demais dados da conta foram preservados.

## Limites e trabalho que ainda falta

1. **IA generativa da Cap:** a integração com Responses está implementada, mas não foi ativada nem testada contra o provedor real porque `OPENAI_API_KEY` não está configurada. A assistência local funciona sem essa chave. Configurá-la somente no ambiente do servidor; nunca em variável `NEXT_PUBLIC_` ou no chat. O modelo é configurável por `OPENAI_MODEL`.
2. **Serviços externos:** ainda não há integração com assinatura eletrônica certificada, envio automático de prospecção ou publicação automática em redes sociais. Nesta versão, contatos, aceite/assinatura e publicação são registrados manualmente com evidência; não se deve tratar esses registros como ações executadas no canal externo.
3. **Portal externo, voz e Cap 3D:** itens do roteiro antigo de configurações ainda não implementados. As três Caps atuais são personagens 2D com animação de olhos, não vídeo/3D.
4. **Arquivos:** implementação, metadados, versões e permissões foram verificados, mas o fluxo de upload/download de um arquivo binário real no Storage ainda requer uma rodada ponta a ponta. Não foi declarado como validado no navegador.
5. **Homologação de operação:** a validação visual cobriu fluxos representativos e a suíte de regras; não substitui a homologação de todos os fluxos com cada cargo. A suíte HTTP antiga depende das credenciais específicas indicadas no arquivo de teste.

## Executar localmente

O pacote não contém `.env.local`, chaves secretas, `node_modules` ou `.next`. Preserve a configuração local existente ao atualizar. Para uma instalação nova, copie `.env.example` para `.env.local` e configure URL/chave pública do seu Supabase.

```powershell
npm.cmd install
npm.cmd run lint
npm.cmd test
npm.cmd run build
$env:PORT='3010'
$env:HOSTNAME='127.0.0.1'
npm.cmd start
```

Abra `http://127.0.0.1:3010/`. O build atual precisa acessar Google Fonts para obter a fonte Inter. A pasta `supabase/migrations` é o histórico de instalação; as migrations listadas acima já foram aplicadas ao projeto atual, não devem ser repetidas manualmente nele.
