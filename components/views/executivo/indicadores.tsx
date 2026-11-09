"use client";

/**
 * Indicadores — inteligência de negócios (MVP: leitura real essencial).
 * Evolui na Fase 2 com séries históricas e projeções.
 */

import { useMemo } from "react";
import { LineChart } from "lucide-react";
import { EmptyState, IrParaConfiguracao, Kpi, ModuleHeader } from "@/components/common/frame-primitives";
import { useAsyncList, useData } from "@/lib/frameflow/data";
import { useAuth } from "@/lib/frameflow/auth";
import { formatarBRL } from "@/lib/frameflow/format";

export function IndicadoresView() {
  const { configured } = useAuth();
  const data = useData();
  const leads = useAsyncList(data.listLeads);
  const transacoes = useAsyncList(data.listTransactions);
  const projetos = useAsyncList(data.listProjects);

  const leitura = useMemo(() => {
    const semDados =
      !configured ||
      leads.result.reason === "not-configured" ||
      leads.result.reason === "erro";
    if (semDados) return { pronto: false };
    const lista = leads.result.data;
    const ganhos = lista.filter((l) => l.etapa === "ganho");
    const receitaGanha = ganhos.reduce((s, l) => s + l.valorEstimado, 0);
    const pipeline = lista
      .filter((l) => !["ganho", "perdido"].includes(l.etapa))
      .reduce((s, l) => s + l.valorEstimado, 0);
    return { pronto: true, ganhos: ganhos.length, receitaGanha, pipeline };
  }, [configured, leads.result]);

  const pagamentos = useMemo(() => {
    if (!configured || transacoes.result.reason !== "vazio") return { pronto: false };
    const recebido = transacoes.result.data
      .filter((t) => t.tipo === "entrada" && t.pago)
      .reduce((s, t) => s + t.valor, 0);
    const pago = transacoes.result.data
      .filter((t) => t.tipo === "saida" && t.pago)
      .reduce((s, t) => s + t.valor, 0);
    return { pronto: true, recebido, pago, saldo: recebido - pago };
  }, [configured, transacoes.result]);

  const projetosEntregues = useMemo(() => {
    if (!configured || projetos.result.reason !== "vazio") return null;
    return projetos.result.data.filter((p) => p.status === "entregue").length;
  }, [configured, projetos.result]);

  const pronto = leitura.pronto && pagamentos.pronto;

  return (
    <div>
      <ModuleHeader
        eyebrow="Executivo · Visão geral"
        title="Indicadores"
        description="Leitura executiva com dados reais — séries históricas e projeções chegam na Fase 2."
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 md:gap-4">
        <Kpi label="Receita ganha" valor={pronto ? formatarBRL(leitura.receitaGanha ?? 0, true) : "—"} hint={pronto ? "leads fechados" : "aguarda conexão"} pronto={pronto} destaque />
        <Kpi label="Pipeline ativo" valor={pronto ? formatarBRL(leitura.pipeline ?? 0, true) : "—"} hint={pronto ? "em negociação" : "aguarda conexão"} pronto={pronto} />
        <Kpi label="Saldo realizado" valor={pagamentos.pronto ? formatarBRL(pagamentos.saldo ?? 0, true) : "—"} hint={pagamentos.pronto ? "recebido − pago" : "aguarda conexão"} pronto={pagamentos.pronto} />
        <Kpi label="Projetos entregues" valor={projetosEntregues != null ? String(projetosEntregues) : "—"} hint={projetosEntregues != null ? "concluídos" : "aguarda conexão"} pronto={projetosEntregues != null} />
      </div>

      <div className="mt-6">
        <EmptyState
          result={leads.result}
          loading={leads.loading && configured}
          icon={LineChart}
          tituloVazio="Séries históricas chegam na Fase 2"
          descricaoVazio="Gráficos de evolução mensal, projeção de receita e cohort de clientes exigirão volume real de dados — nada é simulado aqui."
          action={!configured ? <IrParaConfiguracao rota="#/executivo/configuracoes" /> : undefined}
        />
      </div>
    </div>
  );
}
