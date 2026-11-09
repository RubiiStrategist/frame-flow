"use client";

/**
 * FRAME FLOW — raiz da aplicação (SPA).
 *
 * Estrutura: providers → gate de autenticação → AppShell → view do módulo.
 * O roteamento é abstraído por hash (ver lib/frameflow/router.ts); a
 * publicação em Vercel pode migrar para rotas do App Router sem alterar views.
 */

import { AuthProvider, useAuth } from "@/lib/frameflow/auth";
import { DataProvider } from "@/lib/frameflow/data";
import { useRoute } from "@/lib/frameflow/router";
import { getModule } from "@/lib/frameflow/environments";
import { AppShell } from "@/components/shell/app-shell";
import { LoginView } from "@/components/views/login-view";
import { PlanejamentoView, EquipeView, ContratosView, InteligenciaComercialView, GestaoOperacionalView } from "@/components/views/executivo/gestao";
import { ProspeccaoView, PropostasView, MetasView, RetencaoView } from "@/components/views/comercial/gestao";
import { ProducaoView, CustosView, AprovacoesView, ArquivosView, QualidadeView, FrameContentView } from "@/components/views/operacional/gestao";
import { ExecutivoInicio } from "@/components/views/executivo/inicio";
import { IndicadoresView } from "@/components/views/executivo/indicadores";
import { DecisoesView } from "@/components/views/executivo/decisoes";
import { ComercialInicio } from "@/components/views/comercial/inicio";
import { LeadsView } from "@/components/views/comercial/leads";
import { FunilView } from "@/components/views/comercial/funil";
import { ClientesView } from "@/components/views/comercial/clientes";
import { OperacionalInicio } from "@/components/views/operacional/inicio";
import { ProjetosView } from "@/components/views/operacional/projetos";
import { TarefasView } from "@/components/views/operacional/tarefas";
import { AgendaView } from "@/components/views/operacional/agenda";
import { FinanceiroView } from "@/components/views/operacional/financeiro";
import { ConfiguracoesView } from "@/components/views/configuracoes";
import { CapView } from "@/components/views/cap-view";

function ViewAtual() {
  const { env, moduleId } = useRoute();
  const mod = getModule(env, moduleId);

  if (!mod) return <ExecutivoInicio />;

  // Todos os módulos registrados possuem uma implementação operacional.
  if (mod.id === "clientes") return <ClientesView />;
  if (mod.id === "equipe" || mod.id === "pessoas") return <EquipeView envId={env} />;
  if (mod.id === "cap") return <CapView envId={env} />;
  if (mod.id === "configuracoes") return <ConfiguracoesView />;
  if (mod.id === "financeiro") return <FinanceiroView lens={env === "executivo" ? "executivo" : "operacional"} />;

  switch (env) {
    case "executivo":
      if (mod.id === "indicadores") return <IndicadoresView />;
      if (mod.id === "decisoes") return <DecisoesView />;
      if (mod.id === "planejamento") return <PlanejamentoView />;
      if (mod.id === "juridico") return <ContratosView />;
      if (mod.id === "comercial") return <InteligenciaComercialView />;
      if (mod.id === "operacional") return <GestaoOperacionalView />;
      return <ExecutivoInicio />;
    case "comercial":
      if (mod.id === "leads") return <LeadsView />;
      if (mod.id === "funil") return <FunilView />;
      if (mod.id === "clientes") return <ClientesView />;
      if (mod.id === "prospeccao") return <ProspeccaoView />;
      if (mod.id === "propostas") return <PropostasView />;
      if (mod.id === "metas") return <MetasView />;
      if (mod.id === "retencao") return <RetencaoView />;
      return <ComercialInicio />;
    case "operacional":
      if (mod.id === "projetos") return <ProjetosView />;
      if (mod.id === "tarefas") return <TarefasView />;
      if (mod.id === "agenda") return <AgendaView />;
      if (mod.id === "producao") return <ProducaoView />;
      if (mod.id === "custos") return <CustosView />;
      if (mod.id === "aprovacoes") return <AprovacoesView />;
      if (mod.id === "arquivos") return <ArquivosView />;
      if (mod.id === "qualidade") return <QualidadeView />;
      if (mod.id === "frame-content") return <FrameContentView />;
      return <OperacionalInicio />;
    default:
      return <ExecutivoInicio />;
  }
}

function Aplicacao() {
  const { status } = useAuth();
  const { env, moduleId } = useRoute();

  if (status === "verificando") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M3 8 V3 H8" stroke="#f4f0e7" strokeWidth="2" className="animate-pulse" />
            <path d="M16 3 H21 V8" stroke="#e10606" strokeWidth="2" />
            <path d="M3 16 v5 h5" stroke="#f4f0e7" strokeWidth="2" />
            <path d="M21 16 v5 h-5" stroke="#f4f0e7" strokeWidth="2" />
          </svg>
          <p className="ff-eyebrow text-muted-foreground">Verificando sessão…</p>
        </div>
      </div>
    );
  }

  if (status === "visitante") {
    return <LoginView />;
  }

  return (
    <AppShell envId={env} currentModule={moduleId}>
      <ViewAtual />
    </AppShell>
  );
}

export default function Page() {
  return (
    <AuthProvider>
      <DataProvider>
        <Aplicacao />
      </DataProvider>
    </AuthProvider>
  );
}
