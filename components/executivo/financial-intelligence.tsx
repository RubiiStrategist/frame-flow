"use client";

/**
 * FRAME FLOW OS — Financial Intelligence (Região C).
 *
 * Composição editorial: indicadores separados por hairlines (não cartões
 * iguais), evolução mensal em barras próprias (SVG-free, transform/opacity)
 * e slots honestos para recorrência e metas — nada de números fictícios.
 */

import { useMemo } from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Panel, PanelKpi } from "./panel";
import { navigate } from "@/lib/frameflow/router";
import { formatarBRL } from "@/lib/frameflow/format";
import { cn } from "@/lib/utils";
import { useDadosCeo } from "./use-dados-ceo";

export function FinancialIntelligence({ style }: { style?: React.CSSProperties }) {
  const { financeiro } = useDadosCeo();
  const { pronto } = financeiro;

  // Normalização das barras: altura proporcional ao pico do semestre.
  const maximo = useMemo(() => {
    if (!pronto) return 0;
    return Math.max(
      1,
      ...financeiro.serieMensal.map((m) => Math.max(m.entradas, m.saidas))
    );
  }, [pronto, financeiro.serieMensal]);

  const resultado = financeiro.resultadoOperacional;

  return (
    <Panel
      indice="02"
      titulo="Financial Intelligence"
      style={style}
      className="ff-rise"
      acao={
        <Button
          variant="ghost"
          size="sm"
          className="ff-meta h-7 gap-1.5 rounded-lg px-2 text-[9px] text-muted-foreground hover:text-foreground"
          onClick={() => navigate("executivo", "financeiro")}
          aria-label="Abrir o financeiro completo"
        >
          Abrir financeiro <ArrowRight className="h-3 w-3" aria-hidden />
        </Button>
      }
    >
      {/* Faixa de indicadores — hairlines verticais, editorial */}
      <div className="grid grid-cols-2 border-b border-[var(--line-soft)] lg:grid-cols-4">
        <PanelKpi
          label="Receita do mês"
          valor={pronto ? formatarBRL(financeiro.receitaMes ?? 0, true) : "—"}
          hint={pronto ? "entradas do mês" : "aguarda dados reais"}
          destaque
          pronto={pronto}
          className="border-b border-r border-[var(--line-soft)] lg:border-b-0"
        />
        <PanelKpi
          label="Contas a receber"
          valor={pronto ? formatarBRL(financeiro.contasReceber ?? 0, true) : "—"}
          hint={pronto ? (financeiro.vencidas > 0 ? `${financeiro.vencidas} vencida(s)` : "nenhuma vencida") : "aguarda dados reais"}
          pronto={pronto}
          className="border-b border-[var(--line-soft)] lg:border-b-0 lg:border-r"
        />
        <PanelKpi
          label="Despesas do mês"
          valor={pronto ? formatarBRL(financeiro.despesasMes ?? 0, true) : "—"}
          hint={pronto ? "saídas do mês" : "aguarda dados reais"}
          pronto={pronto}
          className="border-r border-[var(--line-soft)]"
        />
        <PanelKpi
          label="Resultado operacional"
          valor={pronto && resultado != null ? `${resultado < 0 ? "−" : "+"}${formatarBRL(Math.abs(resultado), true)}` : "—"}
          hint={pronto ? "receitas − despesas" : "aguarda dados reais"}
          pronto={pronto}
        />
      </div>

      {/* Evolução + slots de recorrência/metas */}
      <div className="mt-5 grid gap-6 lg:grid-cols-[1fr_212px]">
        {/* Evolução financeira — barras dos últimos 6 meses */}
        <div>
          <div className="flex items-baseline justify-between">
            <p className="ff-eyebrow text-[9px] text-muted-foreground">Evolução · últimos 6 meses</p>
            <p className="ff-meta text-[8px] text-muted-foreground/70">
              <span className="mr-1 inline-block h-2 w-2 translate-y-px bg-foreground/85" aria-hidden /> entradas
              <span className="ml-3 mr-1 inline-block h-2 w-2 translate-y-px bg-muted-foreground/50" aria-hidden /> saídas
            </p>
          </div>

          <div className="mt-4 flex h-[128px] items-end gap-2 md:gap-3" role="img" aria-label="Evolução financeira mensal">
            {(pronto ? financeiro.serieMensal : Array.from({ length: 6 }).map(() => null)).map(
              (mes, i) => (
                <div key={i} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1.5">
                  {mes ? (
                    <div className="flex h-full w-full items-end justify-center gap-[3px] md:gap-1">
                      <span
                        className="ff-bar w-[34%] max-w-[14px] bg-foreground/85"
                        style={{ height: `${Math.max(4, (mes.entradas / maximo) * 100)}%`, animationDelay: `${120 + i * 60}ms` }}
                        aria-hidden
                      />
                      <span
                        className="ff-bar w-[34%] max-w-[14px] bg-muted-foreground/45"
                        style={{ height: `${Math.max(4, (mes.saidas / maximo) * 100)}%`, animationDelay: `${150 + i * 60}ms` }}
                        aria-hidden
                      />
                    </div>
                  ) : (
                    /* Slot fantasma: estado pendente desenhado, não vazio */
                    <span
                      aria-hidden
                      className="h-full w-full border border-dashed border-[var(--line-soft)] bg-white/[0.012]"
                      style={{ clipPath: "polygon(0 62%, 100% 40%, 100% 100%, 0 100%)" }}
                    />
                  )}
                  <p className={cn("ff-meta text-[8px]", mes ? "text-muted-foreground" : "text-muted-foreground/40")}>
                    {mes?.rotulo ?? "·"}
                  </p>
                </div>
              )
            )}
          </div>

          {!pronto && (
            <p className="ff-meta mt-3 text-[8px] leading-relaxed text-muted-foreground/70">
              AGUARDANDO DADOS CONECTADOS — NENHUM VALOR É SIMULADO
            </p>
          )}
          {pronto && financeiro.serieMensal.every((m) => m.entradas === 0 && m.saidas === 0) && (
            <p className="ff-meta mt-3 text-[8px] text-muted-foreground/70">
              SEM MOVIMENTAÇÕES NO PERÍODO
            </p>
          )}
        </div>

        {/* Slots honestos: recorrência e metas (Fase 2) */}
        <div className="flex flex-col gap-4">
          <div className="border border-dashed border-[var(--line-soft)] p-3.5">
            <p className="ff-eyebrow text-[9px] text-muted-foreground">Receita recorrente</p>
            <p className="ff-numeric mt-1.5 text-lg font-semibold text-muted-foreground/60">—</p>
            <p className="ff-meta mt-1.5 text-[8px] leading-relaxed text-muted-foreground/70">
              MAPEADA COM O MÓDULO RETENÇÃO · FASE 2
            </p>
          </div>
          <div className="border border-dashed border-[var(--line-soft)] p-3.5">
            <p className="ff-eyebrow text-[9px] text-muted-foreground">Progresso das metas</p>
            <span aria-hidden className="mt-2.5 block h-[3px] w-full bg-white/[0.06]">
              <span className="block h-full w-0 bg-[var(--frame-red)]" />
            </span>
            <p className="ff-meta mt-1.5 text-[8px] leading-relaxed text-muted-foreground/70">
              METAS E COMISSÕES · FASE 2
            </p>
          </div>
        </div>
      </div>
    </Panel>
  );
}
