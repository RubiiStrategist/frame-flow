"use client";

/**
 * FRAME FLOW OS — Dados do Centro de Comando do CEO.
 *
 * Regra inegociável: TODOS os indicadores derivam exclusivamente de dados
 * reais (`DataProvider`). Sem configuração Supabase, cada métrica declara
 * `pronto: false` e a interface exibe estados honestos — nunca números
 * fictícios apresentados como resultado da empresa.
 */

import { useMemo } from "react";
import { useAsyncList, useData } from "@/lib/frameflow/data";
import { useAuth } from "@/lib/frameflow/auth";
import { TZ_PADRAO } from "@/lib/frameflow/format";
import type { DecisionRequest, FinanceTransaction, Project, Task } from "@/lib/frameflow/types";

const DIA_MS = 86_400_000;

/** Uma lista só é utilizável quando há configuração e leitura bem-sucedida. */
function leOk<T>(configured: boolean, lista: { result: { reason: string } }): lista is { result: { reason: string; data: T[] } } {
  return configured && lista.result.reason === "vazio";
}

export interface MesFinanceiro {
  rotulo: string;
  entradas: number; // BRL
  saidas: number; // BRL
}

export interface FinanceiroCeo {
  pronto: boolean;
  receitaMes: number | null;
  contasReceber: number | null;
  despesasMes: number | null;
  resultadoOperacional: number | null;
  vencidas: number;
  serieMensal: MesFinanceiro[];
}

export interface EntregaProxima {
  id: string;
  titulo: string;
  data: string;
}

export interface OperacionalCeo {
  pronto: boolean;
  projetosAtivos: number | null;
  topProjetos: { id: string; titulo: string; status: Project["status"] }[];
  entregasProximas: EntregaProxima[];
  aprovacoesPendentes: number | null;
  tarefasAtrasadas: number | null;
  tarefasEmAndamento: number | null;
  tarefasConcluidas: number | null;
}

export type PrioridadeDecisao = "alta" | "media" | "padrao";

export interface DecisaoCeo {
  id: string;
  titulo: string;
  descricao: string;
  impactoFinanceiro: number | null;
  regraAprovacao: DecisionRequest["regraAprovacao"];
  prazo: string | null;
  votos: number;
  prioridade: PrioridadeDecisao;
}

/** Prioridade determinística: prazo vencido > urgência de prazo/impacto > padrão. */
export function prioridadeDaDecisao(d: DecisionRequest, hoje: Date): PrioridadeDecisao {
  if (d.prazo && new Date(d.prazo) < hoje) return "alta";
  if (d.prazo && new Date(d.prazo).getTime() - hoje.getTime() <= 7 * DIA_MS) return "media";
  if (d.impactoFinanceiro != null && d.impactoFinanceiro >= 10_000) return "media";
  return "padrao";
}

export function useDadosCeo() {
  const { configured } = useAuth();
  const data = useData();
  const transacoes = useAsyncList(data.listTransactions);
  const projetos = useAsyncList(data.listProjects);
  const tarefas = useAsyncList(data.listTasks);
  const decisoes = useAsyncList(data.listDecisions);

  const carregando = useMemo(
    () =>
      configured &&
      [transacoes, projetos, tarefas, decisoes].some((l) => l.loading),
    [configured, transacoes, projetos, tarefas, decisoes]
  );

  const hoje = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  /* ---------- A · Financial Intelligence ---------- */

  const financeiro = useMemo<FinanceiroCeo>(() => {
    if (!leOk<FinanceTransaction>(configured, transacoes)) {
      return {
        pronto: false,
        receitaMes: null,
        contasReceber: null,
        despesasMes: null,
        resultadoOperacional: null,
        vencidas: 0,
        serieMensal: [],
      };
    }
    const lista = transacoes.result.data;
    const agora = new Date();
    const mesAtual = agora.getMonth();
    const anoAtual = agora.getFullYear();

    const doMes = (t: FinanceTransaction) => {
      const v = new Date(t.vencimento);
      return v.getMonth() === mesAtual && v.getFullYear() === anoAtual;
    };

    const entradasMes = lista.filter((t) => t.tipo === "entrada" && doMes(t));
    const saidasMes = lista.filter((t) => t.tipo === "saida" && doMes(t));
    const abertas = lista.filter((t) => !t.pago);
    const vencidas = abertas.filter((t) => new Date(t.vencimento) < hoje);

    const receitaMes = entradasMes.reduce((s, t) => s + t.valor, 0);
    const despesasMes = saidasMes.reduce((s, t) => s + t.valor, 0);
    const contasReceber = abertas.filter((t) => t.tipo === "entrada").reduce((s, t) => s + t.valor, 0);

    // Série dos últimos 6 meses por vencimento (condições contratuais).
    const rotuloMes = new Intl.DateTimeFormat("pt-BR", { month: "short", timeZone: TZ_PADRAO });
    const serie: MesFinanceiro[] = [];
    for (let i = 5; i >= 0; i--) {
      const ref = new Date(anoAtual, mesAtual - i, 1);
      const ini = ref.getTime();
      const fim = new Date(anoAtual, mesAtual - i + 1, 1).getTime();
      const noMes = lista.filter((t) => {
        const v = new Date(t.vencimento).getTime();
        return v >= ini && v < fim;
      });
      serie.push({
        rotulo: rotuloMes.format(ref).replace(".", ""),
        entradas: noMes.filter((t) => t.tipo === "entrada").reduce((s, t) => s + t.valor, 0),
        saidas: noMes.filter((t) => t.tipo === "saida").reduce((s, t) => s + t.valor, 0),
      });
    }

    return {
      pronto: true,
      receitaMes,
      contasReceber,
      despesasMes,
      resultadoOperacional: receitaMes - despesasMes,
      vencidas: vencidas.length,
      serieMensal: serie,
    };
  }, [configured, transacoes, hoje]);

  /* ---------- B · Operational Pulse ---------- */

  const operacional = useMemo<OperacionalCeo>(() => {
    const vazio: OperacionalCeo = {
      pronto: false,
      projetosAtivos: null,
      topProjetos: [],
      entregasProximas: [],
      aprovacoesPendentes: null,
      tarefasAtrasadas: null,
      tarefasEmAndamento: null,
      tarefasConcluidas: null,
    };
    if (!leOk<Project>(configured, projetos)) return vazio;
    const listaProjetos = projetos.result.data;
    const listaTarefas = leOk<Task>(configured, tarefas) ? tarefas.result.data : [];

    const ativos = listaProjetos.filter((p) => !["entregue", "pausado"].includes(p.status));
    const limite = hoje.getTime() + 14 * DIA_MS;
    const entregas = listaProjetos
      .filter((p) => p.dataEntregaPrevista)
      .filter((p) => {
        const d = new Date(p.dataEntregaPrevista!).getTime();
        return d >= hoje.getTime() && d <= limite;
      })
      .sort((a, b) => new Date(a.dataEntregaPrevista!).getTime() - new Date(b.dataEntregaPrevista!).getTime())
      .slice(0, 3)
      .map((p) => ({ id: p.id, titulo: p.titulo, data: p.dataEntregaPrevista! }));

    const atrasadas = listaTarefas.filter(
      (t) => t.status !== "concluida" && t.prazo && new Date(t.prazo) < hoje
    );

    return {
      pronto: true,
      projetosAtivos: ativos.length,
      topProjetos: ativos.slice(0, 3).map((p) => ({ id: p.id, titulo: p.titulo, status: p.status })),
      entregasProximas: entregas,
      aprovacoesPendentes: listaProjetos.filter((p) => p.status === "aprovacao").length,
      tarefasAtrasadas: atrasadas.length,
      tarefasEmAndamento: listaTarefas.filter((t) => t.status === "em_andamento").length,
      tarefasConcluidas: listaTarefas.filter((t) => t.status === "concluida").length,
    };
  }, [configured, projetos, tarefas, hoje]);

  /* ---------- C · Decision Center ---------- */

  const decisoesAbertas = useMemo<DecisaoCeo[]>(() => {
    if (!leOk<DecisionRequest>(configured, decisoes)) return [];
    return decisoes.result
      ? decisoes.result.data
          .filter((d) => d.status === "aberta")
          .map((d) => ({
            id: d.id,
            titulo: d.titulo,
            descricao: d.descricao,
            impactoFinanceiro: d.impactoFinanceiro,
            regraAprovacao: d.regraAprovacao,
            prazo: d.prazo,
            votos: d.votos.length,
            prioridade: prioridadeDaDecisao(d, hoje),
          }))
      : [];
  }, [configured, decisoes, hoje]);

  return {
    configured,
    carregando,
    financeiro,
    operacional,
    decisoesAbertas,
  };
}
