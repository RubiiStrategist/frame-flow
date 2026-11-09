"use client";

/**
 * Início — Ambiente Operacional e Financeiro (COO + CFO).
 */

import { useMemo } from "react";
import { ArrowRight, CalendarDays, CheckSquare, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState, IrParaConfiguracao, Kpi, ModuleHeader } from "@/components/common/frame-primitives";
import { useAsyncList, useData } from "@/lib/frameflow/data";
import { useAuth } from "@/lib/frameflow/auth";
import { navigate } from "@/lib/frameflow/router";
import { descreverPrazo, formatarBRL } from "@/lib/frameflow/format";
import { Cap } from "@/components/cap/cap";
import { getEnvironment } from "@/lib/frameflow/environments";

export function OperacionalInicio() {
  const { configured } = useAuth();
  const data = useData();
  const projetos = useAsyncList(data.listProjects);
  const tarefas = useAsyncList(data.listTasks);
  const transacoes = useAsyncList(data.listTransactions);
  const env = getEnvironment("operacional");

  const hoje = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const kpis = useMemo(() => {
    const semProjetos = !configured || projetos.result.reason === "not-configured" || projetos.result.reason === "erro";
    const emProducao = !semProjetos
      ? projetos.result.data.filter((p) => !["entregue", "pausado", "aprovacao"].includes(p.status)).length
      : null;
    const semTarefas = !configured || tarefas.result.reason === "not-configured" || tarefas.result.reason === "erro";
    const tarefasPendentes = !semTarefas
      ? tarefas.result.data.filter((t) => t.status !== "concluida").length
      : null;
    const semFin = !configured || transacoes.result.reason === "not-configured" || transacoes.result.reason === "erro";
    let vencSemana: number | null = null;
    if (!semFin) {
      vencSemana = transacoes.result.data.filter((t) => {
        if (t.pago) return false;
        const v = new Date(t.vencimento);
        return v >= hoje && v.getTime() - hoje.getTime() < 7 * 86_400_000;
      }).length;
    }
    return { emProducao, tarefasPendentes, vencSemana };
  }, [configured, projetos.result, tarefas.result, transacoes.result, hoje]);

  const tarefasProximas = useMemo(() => {
    if (kpis.tarefasPendentes == null) return [];
    return tarefas.result.data.filter((t) => t.status !== "concluida").slice(0, 5);
  }, [kpis.tarefasPendentes, tarefas.result]);

  const projetosAtivos = useMemo(() => {
    if (kpis.emProducao == null) return [];
    return projetos.result.data.filter((p) => !["entregue", "pausado", "aprovacao"].includes(p.status)).slice(0, 5);
  }, [kpis.emProducao, projetos.result]);

  return (
    <div>
      <ModuleHeader
        eyebrow="Ambiente Operacional · COO + CFO"
        title="Início"
        description="Produção, agenda e finanças empresariais em um só painel."
      />

      <div className="mb-6 flex items-center gap-4 ff-surface border border-border bg-card p-4 md:p-5">
        <Cap presentation="operacional" state="idle" size={72} className="shrink-0" />
        <div className="min-w-0">
          <p className="ff-eyebrow text-muted-foreground">Cap Operacional</p>
          <p className="mt-1 text-sm leading-relaxed">
            {configured
              ? "Prazos, tarefas e vencimentos abaixo vêm da operação real."
              : "Pré-visualização ativa. Configure o Supabase para operar projetos e finanças com dados reais."}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 md:gap-4">
        <Kpi label="Projetos em produção" valor={kpis.emProducao != null ? String(kpis.emProducao) : "—"} hint={kpis.emProducao != null ? "briefing→revisão" : "aguarda conexão"} pronto={kpis.emProducao != null} destaque />
        <Kpi label="Tarefas pendentes" valor={kpis.tarefasPendentes != null ? String(kpis.tarefasPendentes) : "—"} hint={kpis.tarefasPendentes != null ? "com responsáveis" : "aguarda conexão"} pronto={kpis.tarefasPendentes != null} />
        <Kpi label="Vencimentos na semana" valor={kpis.vencSemana != null ? String(kpis.vencSemana) : "—"} hint={kpis.vencSemana != null ? "entradas e saídas" : "aguarda conexão"} pronto={kpis.vencSemana != null} />
        <Kpi label="Foco do dia" valor={configured ? "Operar" : "—"} hint={configured ? "agenda e aprovações" : "aguarda conexão"} pronto={configured} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section aria-label="Projetos ativos">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="ff-display text-sm md:text-base">Projetos ativos</h2>
            <Button variant="link" size="sm" className="ff-meta gap-1 p-0 text-muted-foreground" onClick={() => navigate("operacional", "projetos")}>
              Todos os projetos <ArrowRight className="h-3 w-3" aria-hidden />
            </Button>
          </div>
          <EmptyState
            result={projetos.result}
            loading={projetos.loading && configured}
            icon={CheckSquare}
            tituloVazio="Nenhum projeto em andamento"
            descricaoVazio="Crie projetos vinculados a clientes para acompanhar a produção."
            action={<IrParaConfiguracao rota="#/executivo/configuracoes" />}
          />
          {projetosAtivos.length > 0 && (
            <ul className="ff-data-list divide-y divide-border border border-border">
              {projetosAtivos.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 p-3.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm">{p.titulo}</p>
                    <p className="ff-meta text-[9px] text-muted-foreground">{p.status} · {p.tipoServico}</p>
                  </div>
                  <span className="ff-numeric shrink-0 text-sm">{formatarBRL(p.orcamento, true)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-label="Tarefas próximas">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="ff-display text-sm md:text-base">Tarefas e vencimentos</h2>
            <Button variant="link" size="sm" className="ff-meta gap-1 p-0 text-muted-foreground" onClick={() => navigate("operacional", "agenda")}>
              Agenda <ArrowRight className="h-3 w-3" aria-hidden />
            </Button>
          </div>
          <EmptyState
            result={tarefas.result}
            loading={tarefas.loading && configured}
            icon={CalendarDays}
            tituloVazio="Nenhuma tarefa pendente"
            descricaoVazio="Tarefas com responsáveis e prazos aparecem aqui e na agenda."
            action={<IrParaConfiguracao rota="#/executivo/configuracoes" />}
          />
          {kpis.vencSemana != null && kpis.vencSemana > 0 && (
            <div className="mb-2 flex items-center gap-2.5 border border-[var(--frame-red)]/40 bg-[var(--frame-red)]/[0.06] p-3">
              <Wallet className="h-4 w-4 shrink-0 text-[var(--frame-red)]" aria-hidden />
              <p className="text-xs leading-relaxed">
                {kpis.vencSemana} vencimento(s) financeiro(s) nesta semana — acompanhe no módulo Financeiro.
              </p>
            </div>
          )}
          {tarefasProximas.length > 0 && (
            <ul className="ff-data-list divide-y divide-border border border-border">
              {tarefasProximas.map((t) => (
                <li key={t.id} className="flex items-center justify-between gap-3 p-3.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm">{t.titulo}</p>
                    <p className="ff-meta text-[9px] text-muted-foreground">
                      {t.status.replace("_", " ")} {t.prazo ? `· ${descreverPrazo(t.prazo)}` : ""}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section aria-label="Atalhos do ambiente" className="mt-8">
        <h2 className="ff-display mb-3 text-sm md:text-base">Atalhos</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {env.modules
            .filter((m) => ["projetos", "tarefas", "agenda", "financeiro"].includes(m.id))
            .map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => navigate("operacional", m.id)}
                className="group ff-surface border border-border bg-card p-4 text-left transition-colors ff-ease hover:border-white/25"
              >
                <m.icon className="h-5 w-5 text-[var(--frame-red)]" aria-hidden />
                <p className="mt-3 text-sm">{m.title}</p>
                <p className="ff-meta mt-1 text-[9px] text-muted-foreground">abrir módulo</p>
              </button>
            ))}
        </div>
      </section>
    </div>
  );
}
