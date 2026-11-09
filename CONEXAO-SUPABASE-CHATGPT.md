# FRAME FLOW — Conexão Supabase (30/10/2026)

Projeto: `frame-flow` — `sa-east-1` (São Paulo).

## O que foi feito
- Arquivo `.env.local` preparado com **somente** URL e chave **publishable** pública (não é service_role). O `.gitignore` já ignora `.env*`.
- Validador de configuração atualizado para aceitar `sb_publishable_...` além da chave JWT anon legada.
- Teste unitário acrescentado para o formato de chave moderna.
- Login já existente via `signInWithPassword` permanece, sem senha embutida.
- Conta existente confirmada no banco: `thebalaschannel@gmail.com`, cargo `ceo`, ambiente `executivo`.
- 7 migrations já aplicadas diretamente no Supabase, não reaplicar as migrations locais sem reconciliar histórico e divergências.

## Como iniciar
Na pasta `01-aplicativo`, instalar dependências (`npm install` ou gerenciador de pacotes compatível) e executar `npm run dev`. Abrir `http://localhost:3000`, fazer login com e-mail e senha definidos no Supabase.

## Pendente
- Rodar build, testes e navegador em ambiente com dependências.
- Validar login end-to-end e leitura/escrita com sessão real.
- Configurar as mesmas duas variáveis públicas no deploy Vercel (não copiar service_role).
- Revisar migrations locais vs banco, RLS com usuários distintos, e avisos do Security Advisor antes de produção.
- Não inserir credenciais secretas em repositórios, ZIPs ou mensagens.
