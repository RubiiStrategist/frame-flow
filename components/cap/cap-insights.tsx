"use client";

import { useCallback, useEffect } from "react";
import { CircleCheck, Info, TriangleAlert } from "lucide-react";
import { useAuth } from "@/lib/frameflow/auth";
import { useAsyncList, useData } from "@/lib/frameflow/data";
import type { CapPresentation, ListResult } from "@/lib/frameflow/types";

interface Insight { level: "info" | "alerta" | "sucesso"; text: string }

// Date-only deadlines are calendar days, not UTC timestamps.
export function radarDay(value: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : new Intl.DateTimeFormat("sv-SE", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}

function Radar({ insights, loading = false }: { insights: Insight[]; loading?: boolean }) {
  return <section className="ff-cap-radar" aria-label="Resumos da Cap" aria-busy={loading}>
    <header><h3>Seu radar</h3><p>Dados do ambiente</p></header>
    <ul>{insights.map((insight, index) => {
      const Icon = insight.level === "alerta" ? TriangleAlert : insight.level === "sucesso" ? CircleCheck : Info;
      return <li key={index} className="ff-cap-insight" data-level={insight.level}><Icon aria-hidden /><span>{insight.text}</span></li>;
    })}</ul>
  </section>;
}

function LiveRadar({ presentation }: { presentation: CapPresentation }) {
  const { listLeads, listClients, listTasks, listProjects, listTransactions, listDecisions } = useData();
  const loader = useCallback(async (): Promise<ListResult<Insight>> => {
    const today = radarDay(new Date().toISOString());
    const overdue = (date: string | null) => !!date && !!radarDay(date) && radarDay(date) < today;
    if (presentation === "comercial") {
      const [leads, clients] = await Promise.all([listLeads(), listClients()]);
      if ([leads, clients].some(result => result.reason === "erro" || result.reason === "not-configured")) return { data: [], reason: "erro" };
      const open = leads.data.filter(lead => !["ganho", "perdido"].includes(lead.etapa));
      const followups = open.filter(lead => lead.proximoContato && radarDay(lead.proximoContato) && radarDay(lead.proximoContato) <= today);
      return { reason: "vazio", data: [
        { level: "info", text: open.length ? `${open.length} oportunidade(s) em andamento no funil.` : "Nenhuma oportunidade em andamento no funil." },
        ...(followups.length ? [{ level: "alerta" as const, text: `${followups.length} retorno(s) comercial(is) para hoje ou atrasado(s).` }] : []),
        { level: "info", text: clients.data.length ? `${clients.data.length} cliente(s) na sua carteira.` : "Sua carteira ainda não tem clientes cadastrados." },
      ] };
    }
    if (presentation === "operacional") {
      const [tasks, projects] = await Promise.all([listTasks(), listProjects()]);
      if ([tasks, projects].some(result => result.reason === "erro" || result.reason === "not-configured")) return { data: [], reason: "erro" };
      const open = tasks.data.filter(task => task.status !== "concluida");
      const attention = open.filter(task => task.status === "bloqueada" || overdue(task.prazo));
      const active = projects.data.filter(project => !["entregue", "pausado"].includes(project.status));
      return { reason: "vazio", data: [
        { level: "info", text: open.length ? `${open.length} tarefa(s) aguardando conclusão.` : "Nenhuma tarefa pendente no momento." },
        ...(attention.length ? [{ level: "alerta" as const, text: `${attention.length} tarefa(s) bloqueada(s) ou com prazo vencido.` }] : []),
        { level: "info", text: active.length ? `${active.length} projeto(s) ativo(s) na produção.` : "Nenhum projeto ativo na produção." },
      ] };
    }
    const [transactions, decisions] = await Promise.all([listTransactions(), listDecisions()]);
    if ([transactions, decisions].some(result => result.reason === "erro" || result.reason === "not-configured")) return { data: [], reason: "erro" };
    const open = transactions.data.filter(transaction => !transaction.pago);
    const late = open.filter(transaction => overdue(transaction.vencimento));
    const weekEnd = new Date(`${today}T12:00:00Z`);
    weekEnd.setUTCDate(weekEnd.getUTCDate() + 6);
    const week = open.filter(transaction => radarDay(transaction.vencimento) >= today && radarDay(transaction.vencimento) <= radarDay(weekEnd.toISOString()));
    const pending = decisions.data.filter(decision => decision.status === "aberta");
    return { reason: "vazio", data: [
      { level: late.length ? "alerta" : "info", text: late.length ? `${late.length} movimentação(ões) financeira(s) vencida(s).` : open.length ? `${open.length} movimentação(ões) financeira(s) em aberto.` : transactions.data.length ? "Todas as movimentações estão quitadas." : "Nenhuma movimentação financeira registrada." },
      ...(week.length ? [{ level: "info" as const, text: `${week.length} vencimento(s) nos próximos 7 dias.` }] : []),
      { level: "info", text: pending.length ? `${pending.length} decisão(ões) aguardando votação.` : "Nenhuma decisão aberta para votação." },
    ] };
  }, [listLeads, listClients, listTasks, listProjects, listTransactions, listDecisions, presentation]);
  const { result, loading, reload } = useAsyncList(loader, [loader]);
  useEffect(() => {
    window.addEventListener("frameflow:workspace-changed", reload);
    return () => window.removeEventListener("frameflow:workspace-changed", reload);
  }, [reload]);
  return <Radar loading={loading} insights={loading ? [{ level: "info", text: "Consultando seus registros…" }] : result.reason === "erro" ? [{ level: "alerta", text: "Não foi possível atualizar o radar. Tente novamente em instantes." }] : result.data} />;
}

export function CapInsights({ presentation }: { presentation: CapPresentation }) {
  const { configured, isPreview, session } = useAuth();
  if (!configured || isPreview || !session) return <Radar insights={[{ level: "info", text: "Entre com sua conta para acompanhar os registros deste ambiente." }]} />;
  return <LiveRadar key={`${session.user.id}-${presentation}`} presentation={presentation} />;
}
