"use client";

/**
 * Configurações e administração — estado real da conexão, PWA,
 * ambientes e roteiro. Nada aqui é decorativo: cada cartão reflete
 * um estado verificável da aplicação.
 */

import { Check, Download, Smartphone, X } from "lucide-react";
import { ModuleHeader } from "@/components/common/frame-primitives";
import { useAuth } from "@/lib/frameflow/auth";
import { useData } from "@/lib/frameflow/data";
import { VARIAVEIS_EXIGIDAS } from "@/lib/supabase/config";
import { ENVIRONMENTS } from "@/lib/frameflow/environments";

export function ConfiguracoesView() {
  const { configured, isPreview, profile, signOut } = useAuth();
  const { status } = useData();

  const roteiro = [
    { fase: "Gestão disponível", itens: "Login · comercial · clientes · projetos · tarefas · financeiro · decisões · agenda · OKRs · equipe · contratos · produção · custos · aprovações · qualidade · arquivos privados · calendário editorial." },
    { fase: "Cap e automações internas", itens: "Três mascotes animadas, conversa com histórico privado, análises locais e ações com confirmação. Aceitar uma proposta conecta cliente, venda e projeto. A conversa livre com IA depende da chave configurada no servidor." },
    { fase: "Integrações ainda não ativadas", itens: "Assinatura eletrônica certificada e publicação automática em canais externos ainda não estão integradas. Aceites, contatos e publicações são registrados pela equipe. Portal externo do cliente, voz e Cap 3D permanecem fora desta versão." },
  ];

  return (
    <div>
      <ModuleHeader
        eyebrow="Sistema · Administração"
        title="Configurações"
        description="Estado real da plataforma: conexão, instalação PWA, ambientes e recursos disponíveis."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Conexão */}
        <section aria-label="Conexão Supabase" className="ff-surface border border-border bg-card p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="ff-display text-sm">Conexão Supabase</h2>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Autenticação real, PostgreSQL com RLS e storage do ecossistema.
              </p>
            </div>
            <span
              className={`ff-meta flex items-center gap-1.5 rounded-lg border px-2 py-1 ${
                configured
                  ? "border-[var(--frame-red)]/50 text-[var(--frame-red)]"
                  : "border-border text-muted-foreground"
              }`}
            >
              {configured ? <Check className="h-3 w-3" aria-hidden /> : <X className="h-3 w-3" aria-hidden />}
              {configured ? "ATIVA" : "PENDENTE"}
            </span>
          </div>

          {configured ? (
            <p className="mt-4 border border-border bg-secondary p-3 text-xs leading-relaxed text-muted-foreground">
              Camada de dados operando ({status === "pronto" ? "cliente pronto" : "verifique as credenciais"}).
              Executando as migrations em <code className="px-1">supabase/migrations</code> você habilita tabelas,
              RLS e triggers.
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              <ol className="space-y-2 text-xs leading-relaxed text-muted-foreground">
                <li className="flex gap-2">
                  <span className="ff-numeric text-[var(--frame-red)]">01</span>
                  Crie um projeto em supabase.com/dashboard (região recomendada: mais próxima dos clientes).
                </li>
                <li className="flex gap-2">
                  <span className="ff-numeric text-[var(--frame-red)]">02</span>
                  Execute as SQL de <code className="px-1">supabase/migrations</code> no SQL Editor — na ordem numerada.
                </li>
                <li className="flex gap-2">
                  <span className="ff-numeric text-[var(--frame-red)]">03</span>
                  Crie os 3 usuários sócios em Authentication → Users (e-mails reais; o trigger cria o perfil).
                </li>
                <li className="flex gap-2">
                  <span className="ff-numeric text-[var(--frame-red)]">04</span>
                  Defina as variáveis abaixo e reinicie o servidor.
                </li>
              </ol>
              <div className="border border-border bg-secondary p-3">
                {VARIAVEIS_EXIGIDAS.map((v) => (
                  <p key={v} className="ff-numeric text-xs">
                    {v}
                  </p>
                ))}
              </div>
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                Guia completo: <code className="px-1">docs/SETUP-SUPABASE.md</code>. Nenhuma credencial é
                inventada pela plataforma.
              </p>
            </div>
          )}
        </section>

        {/* Sessão */}
        <section aria-label="Sessão atual" className="ff-surface border border-border bg-card p-5">
          <h2 className="ff-display text-sm">Sessão atual</h2>
          <div className="mt-3 space-y-2 text-sm">
            <p>
              <span className="ff-meta text-muted-foreground">Modo</span>
              <br />
              {isPreview ? "Pré-visualização de layout (rotulada)" : "Autenticação Supabase"}
            </p>
            <p>
              <span className="ff-meta text-muted-foreground">Usuário</span>
              <br />
              {isPreview ? "Explorador — sem sessão real" : profile?.fullName ?? profile?.email ?? "—"}
            </p>
          </div>
          {isPreview && (
            <button
              type="button"
              onClick={() => signOut()}
              className="ff-meta mt-4 rounded-lg border border-border px-3 py-2 text-[10px] transition-colors hover:border-[var(--frame-red)]/60"
            >
              Encerrar pré-visualização
            </button>
          )}
        </section>

        {/* PWA */}
        <section aria-label="Instalação PWA" className="ff-surface border border-border bg-card p-5">
          <h2 className="ff-display flex items-center gap-2 text-sm">
            <Smartphone className="h-4 w-4 text-[var(--frame-red)]" aria-hidden /> Instalação PWA
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            FRAME FLOW é instalável como aplicativo (Chrome/Edge/Android: botão{" "}
            <Download className="inline h-3 w-3" aria-hidden /> “Instalar app” no topo; iOS: Compartilhar →
            “Adicionar à Tela de Início”). Manifest e service worker já estão ativos.
          </p>
        </section>

        {/* Ambientes */}
        <section aria-label="Ambientes" className="ff-surface border border-border bg-card p-5">
          <h2 className="ff-display text-sm">Ambientes dos sócios</h2>
          <ul className="mt-3 space-y-3">
            {ENVIRONMENTS.map((env) => (
              <li key={env.id} className="border border-border p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm">
                    {env.label} <span className="text-muted-foreground">· {env.role}</span>
                  </p>
                  <span className="ff-meta text-[9px] text-muted-foreground">
                    {env.modules.length} módulos
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{env.partnerFullRole}</p>
                <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
                  Cargo define atalhos e experiência inicial — os três sócios acessam todos os
                  módulos internos e alternam sem novo login.
                </p>
              </li>
            ))}
          </ul>
        </section>

        {/* Roteiro */}
        <section aria-label="Roteiro" className="ff-surface border border-border bg-card p-5 lg:col-span-2">
          <h2 className="ff-display text-sm">Recursos desta versão</h2>
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            {roteiro.map((r) => (
              <div key={r.fase} className="border border-border p-4">
                <h3 className="text-sm font-medium">{r.fase}</h3>
                <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{r.itens}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">
            Os módulos de gestão salvam registros reais. Acesso, histórico e versões são verificados no banco.
            Integrações externas só ficam disponíveis após configuração e validação específicas.
          </p>
        </section>
      </div>
    </div>
  );
}
