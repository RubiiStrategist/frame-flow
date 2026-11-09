"use client";

/**
 * Início — Ambiente Comercial (CRO).
 * Pipeline, metas e ritmo calculados de dados reais do funil.
 */

import { useMemo } from "react";
import { ArrowRight, Filter, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState, IrParaConfiguracao, Kpi, ModuleHeader } from "@/components/common/frame-primitives";
import { useAsyncList, useData } from "@/lib/frameflow/data";
import { useAuth } from "@/lib/frameflow/auth";
import { navigate } from "@/lib/frameflow/router";
import { formatarBRL } from "@/lib/frameflow/format";
import { Cap } from "@/components/cap/cap";
import { getEnvironment } from "@/lib/frameflow/environments";

export function ComercialInicio() {
  const { configured } = useAuth();
  const data = useData();
  const leads = useAsyncList(data.listLeads);
  const clientes = useAsyncList(data.listClients);
  const env = getEnvironment("comercial");

  const kpis = useMemo(() => {
    const semDados = !configured || leads.result.reason === "not-configured" || leads.result.reason === "erro";
    if (semDados) return { pronto: false, ativos: null, previsao: null, ganhos: null, taxa: null };
    const lista = leads.result.data;
    const ativos = lista.filter((l) => !["ganho", "perdido"].includes(l.etapa)).length;
    const previsao = lista
      .filter((l) => !["ganho", "perdido"].includes(l.etapa))
      .reduce((s, l) => s + l.valorEstimado, 0);
    const ganhos = lista.filter((l) => l.etapa === "ganho").length;
    const fechados = lista.filter((l) => ["ganho", "perdido"].includes(l.etapa)).length;
    const taxa = fechados > 0 ? Math.round((ganhos / fechados) * 100) : null;
    return { pronto: true, ativos, previsao, ganhos, taxa };
  }, [configured, leads.result]);

  const totalClientes = useMemo(() => {
    if (!configured || clientes.result.reason === "not-configured" || clientes.result.reason === "erro") return null;
    return clientes.result.data.length;
  }, [configured, clientes.result]);

  const leadsRecentes = useMemo(() => {
    if (!kpis.pronto) return [];
    return leads.result.data.slice(0, 5);
  }, [kpis.pronto, leads.result]);

  return (
    <div>
      <ModuleHeader
        eyebrow="Ambiente Comercial · CRO"
        title="Início"
        description="Ritmo comercial da FRAME VISION: pipeline, conversão e carteira de clientes."
      />

      <div className="mb-6 flex items-center gap-4 ff-surface border border-border bg-card p-4 md:p-5">
        <Cap presentation="comercial" state="point" size={72} className="shrink-0" />
        <div className="min-w-0">
          <p className="ff-eyebrow text-muted-foreground">Cap Comercial</p>
          <p className="mt-1 text-sm leading-relaxed">
            {configured
              ? "Os números abaixo vêm direto do funil — nada estimado pela assistente."
              : "Pré-visualização ativa. Configure o Supabase para operar o funil com dados reais."}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        <Kpi label="Leads ativos" valor={kpis.pronto ? String(kpis.ativos ?? 0) : "—"} hint={kpis.pronto ? "em negociação" : "aguarda conexão"} pronto={kpis.pronto} destaque />
        <Kpi label="Receita prevista" valor={kpis.pronto ? formatarBRL(kpis.previsao ?? 0, true) : "—"} hint={kpis.pronto ? "soma do pipeline" : "aguarda conexão"} pronto={kpis.pronto} />
        <Kpi label="Conversão" valor={kpis.pronto && kpis.taxa != null ? `${kpis.taxa}%` : "—"} hint={kpis.pronto ? "leads fechados" : "aguarda conexão"} pronto={kpis.pronto} />
        <Kpi label="Clientes" valor={totalClientes != null ? String(totalClientes) : "—"} hint={totalClientes != null ? "carteira ativa" : "aguarda conexão"} pronto={totalClientes != null} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section aria-label="Leads recentes">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="ff-display text-sm md:text-base">Leads recentes</h2>
            <Button variant="link" size="sm" className="ff-meta gap-1 p-0 text-muted-foreground" onClick={() => navigate("comercial", "leads")}>
              Ver todos <ArrowRight className="h-3 w-3" aria-hidden />
            </Button>
          </div>
          <EmptyState
            result={leads.result}
            loading={leads.loading && configured}
            icon={Search}
            tituloVazio="Nenhum lead cadastrado"
            descricaoVazio="Cadastre o primeiro lead para iniciar o funil comercial."
            action={<IrParaConfiguracao rota="#/executivo/configuracoes" />}
          />
          {kpis.pronto && leadsRecentes.length > 0 && (
            <ul className="ff-data-list divide-y divide-border border border-border">
              {leadsRecentes.map((l) => (
                <li key={l.id} className="flex items-center justify-between gap-3 p-3.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm">{l.nome} {l.empresa && <span className="text-muted-foreground">· {l.empresa}</span>}</p>
                    <p className="ff-meta text-[9px] text-muted-foreground">etapa: {l.etapa} · origem: {l.origem}</p>
                  </div>
                  <span className="ff-numeric shrink-0 text-sm">{formatarBRL(l.valorEstimado, true)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-label="Funil resumido">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="ff-display text-sm md:text-base">Funil</h2>
            <Button variant="link" size="sm" className="ff-meta gap-1 p-0 text-muted-foreground" onClick={() => navigate("comercial", "funil")}>
              Abrir funil <ArrowRight className="h-3 w-3" aria-hidden />
            </Button>
          </div>
          <EmptyState
            result={leads.result}
            loading={leads.loading && configured}
            icon={Filter}
            tituloVazio="Funil aguardando dados"
            descricaoVazio="As colunas do funil preenchem automaticamente conforme os leads avançam de etapa."
            action={<IrParaConfiguracao rota="#/executivo/configuracoes" />}
          />
        </section>
      </div>

      <section aria-label="Atalhos do ambiente" className="mt-8">
        <h2 className="ff-display mb-3 text-sm md:text-base">Atalhos</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {env.modules
            .filter((m) => ["leads", "funil", "clientes", "cap"].includes(m.id))
            .map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => navigate("comercial", m.id)}
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
