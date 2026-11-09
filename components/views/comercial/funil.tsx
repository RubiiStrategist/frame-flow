"use client";

/**
 * Funil de vendas — colunas por etapa com movimentação real de etapa.
 * MVP: avanço de etapa por menu (botão "avançar"); arrastar-e-soltar entra
 * com dados reais e mais volume na Fase 2.
 */

import { useMemo } from "react";
import { ArrowRight, ChevronRight } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState, IrParaConfiguracao, ModuleHeader } from "@/components/common/frame-primitives";
import { useAsyncList, useData } from "@/lib/frameflow/data";
import { useAuth } from "@/lib/frameflow/auth";
import { navigate } from "@/lib/frameflow/router";
import { formatarBRL } from "@/lib/frameflow/format";
import { NotConfiguredError, type Lead, type LeadStage } from "@/lib/frameflow/types";

const ETAPAS: { valor: LeadStage; rotulo: string }[] = [
  { valor: "novo", rotulo: "Novo" },
  { valor: "contato", rotulo: "Contato" },
  { valor: "qualificado", rotulo: "Qualificado" },
  { valor: "proposta", rotulo: "Proposta" },
  { valor: "negociacao", rotulo: "Negociação" },
  { valor: "ganho", rotulo: "Ganho" },
];

export function FunilView() {
  const { configured } = useAuth();
  const data = useData();
  const { result, loading, reload } = useAsyncList(data.listLeads);

  const colunas = useMemo(() => {
    return ETAPAS.map((etapa) => ({
      ...etapa,
      leads: result.data.filter((l) => l.etapa === etapa.valor),
      total: result.data
        .filter((l) => l.etapa === etapa.valor)
        .reduce((s, l) => s + l.valorEstimado, 0),
    }));
  }, [result.data]);

  async function moverEtapa(lead: Lead, etapa: LeadStage) {
    try {
      const ok = await data.updateLeadStage(lead.id, etapa);
      if (ok) {
        toast({
          title: "Etapa atualizada",
          description: `${lead.nome} → ${ETAPAS.find((e) => e.valor === etapa)?.rotulo}.`,
        });
        reload();
      }
    } catch (erro) {
      if (erro instanceof NotConfiguredError) {
        toast({
          title: "Persistência indisponível",
          description: "Configure o Supabase para movimentar o funil.",
          variant: "destructive",
        });
      } else {
        toast({ title: "Não foi possível mover", variant: "destructive" });
      }
    }
  }

  return (
    <div>
      <ModuleHeader
        eyebrow="Comercial · Pipeline"
        title="Funil de vendas"
        description="Acompanhe cada lead pela jornada: proposta, negociação e fechamento."
        actions={
          <Button size="sm" variant="outline" className="ff-meta rounded-lg" onClick={() => navigate("comercial", "leads")}>
            Novo lead <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Button>
        }
      />

      <EmptyState
        result={result}
        loading={loading}
        tituloVazio="Funil vazio"
        descricaoVazio="Cadastre leads para preencher as etapas — nenhuma simulação é exibida."
        action={
          <>
            <Button size="sm" variant="outline" className="ff-meta rounded-lg" onClick={() => navigate("comercial", "leads")}>
              Cadastrar lead
            </Button>
            {!configured && <IrParaConfiguracao rota="#/executivo/configuracoes" />}
          </>
        }
      />

      {result.data.length > 0 && (
        <div className="ff-scroll -mx-1 flex gap-3 overflow-x-auto px-1 pb-2 lg:gap-4">
          {colunas.map((col) => (
            <section
              key={col.valor}
              aria-label={`Etapa ${col.rotulo}`}
              className="w-[240px] shrink-0 md:w-[260px]"
            >
              <header className="mb-2 flex items-center justify-between border-b border-border pb-2">
                <div>
                  <p className="ff-display text-xs">{col.rotulo}</p>
                  <p className="ff-numeric text-[10px] text-muted-foreground">
                    {col.leads.length} · {formatarBRL(col.total, true)}
                  </p>
                </div>
                <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-[var(--frame-red)]" />
              </header>
              <div className="ff-scroll max-h-[60vh] space-y-2 overflow-y-auto pr-1">
                {col.leads.length === 0 ? (
                  <div className="border border-dashed border-border px-3 py-6 text-center">
                    <p className="ff-meta text-[9px] text-muted-foreground">vazio</p>
                  </div>
                ) : (
                  col.leads.map((lead) => (
                    <article
                      key={lead.id}
                      className="group ff-surface border border-border bg-card p-3 transition-colors ff-ease hover:border-white/25"
                    >
                      <p className="truncate text-sm font-medium">{lead.nome}</p>
                      <p className="truncate text-xs text-muted-foreground">{lead.empresa}</p>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="ff-numeric text-xs">{formatarBRL(lead.valorEstimado, true)}</span>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 gap-0.5 rounded-lg px-1.5 text-muted-foreground"
                              aria-label={`Mover ${lead.nome} de etapa`}
                            >
                              mover <ChevronRight className="h-3 w-3" aria-hidden />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="rounded-lg border-border bg-popover">
                            {ETAPIAS_SEGUINTES(col.valor).map((e) => (
                              <DropdownMenuItem key={e.valor} onClick={() => moverEtapa(lead, e.valor)}>
                                {e.rotulo}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </article>
                  ))
                )}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function ETAPIAS_SEGUINTES(atual: LeadStage) {
  const idx = ETAPAS.findIndex((e) => e.valor === atual);
  return ETAPAS.slice(idx + 1).concat(ETAPAS.slice(0, Math.max(idx, 0))).slice(0, ETAPAS.length - 1);
}
