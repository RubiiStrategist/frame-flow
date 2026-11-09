"use client";

/**
 * FRAME FLOW OS — Cap Executive Intelligence (Região B · assinatura visual).
 *
 * A Cap ocupa um palco próprio com moldura de "viewfinder" (cantos de frame
 * da marca) — nunca um ícone genérico. Resumos e recomendações são
 * DETERMINÍSTICOS, derivados de dados reais; sem inteligência artificial
 * antes da integração (Fase 2), nada é inventado. A arte atual é de
 * referência, rotulada — não define o personagem final.
 */

import { useMemo } from "react";
import { ArrowRight, Bot, CircleCheck, Info, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Cap } from "@/components/cap/cap";
import { Panel } from "./panel";
import { navigate } from "@/lib/frameflow/router";
import { cn } from "@/lib/utils";
import type { CapState, EnvironmentId } from "@/lib/frameflow/types";
import { useDadosCeo } from "./use-dados-ceo";

type SinalCap = {
  nivel: "info" | "sucesso" | "alerta";
  texto: string;
  acao?: { rotulo: string; env: EnvironmentId; modulo: string };
};

export function CapIntelligence({
  onAbrirComandos,
  style,
}: {
  onAbrirComandos(): void;
  style?: React.CSSProperties;
}) {
  const { configured, carregando, financeiro, operacional, decisoesAbertas } = useDadosCeo();

  const { sinais, estadoCap, statusRotulo, atencao } = useMemo(() => {
    // Estado: sincronizando > atenção > recomendação > em ordem
    if (carregando) {
      return {
        sinais: [{ nivel: "info", texto: "Sincronizando os indicadores da operação…" } as SinalCap],
        estadoCap: "wait" as CapState,
        statusRotulo: "SINCRONIZANDO",
        atencao: false,
      };
    }
    if (!configured) {
      return {
        sinais: [
          {
            nivel: "info",
            texto:
              "Central de inteligência pronta. Configure o Supabase e passo a resumir vencimentos, entregas e decisões com dados reais.",
            acao: { rotulo: "Configurar agora", env: "executivo", modulo: "configuracoes" },
          },
        ],
        estadoCap: "idle" as CapState,
        statusRotulo: "AGUARDANDO CONFIGURAÇÃO",
        atencao: false,
      };
    }

    const lista: SinalCap[] = [];
    const vencidas = financeiro.vencidas;
    const atrasadas = operacional.tarefasAtrasadas ?? 0;
    if (vencidas > 0) {
      lista.push({
        nivel: "alerta",
        texto: `${vencidas} movimentação(ões) financeira(s) vencida(s) exigem ação imediata.`,
        acao: { rotulo: "Abrir financeiro", env: "executivo", modulo: "financeiro" },
      });
    }
    if (atrasadas > 0) {
      lista.push({
        nivel: "alerta",
        texto: `${atrasadas} tarefa(s) atrasada(s) na operação.`,
        acao: { rotulo: "Ver tarefas", env: "operacional", modulo: "tarefas" },
      });
    }
    if (decisoesAbertas.length > 0) {
      lista.push({
        nivel: "info",
        texto: `${decisoesAbertas.length} decisão(ões) dos sócios aguardando voto.`,
        acao: { rotulo: "Votar agora", env: "executivo", modulo: "decisoes" },
      });
    }
    if (operacional.entregasProximas.length > 0) {
      lista.push({
        nivel: "info",
        texto: `${operacional.entregasProximas.length} entrega(s) nos próximos 14 dias.`,
      });
    }
    if (lista.length === 0) {
      lista.push({ nivel: "sucesso", texto: "Operação em ordem — nada exige atenção agora." });
    }

    const temAtencao = lista.some((s) => s.nivel === "alerta");
    const temAcao = lista.some((s) => s.acao);
    return {
      sinais: lista,
      estadoCap: (temAtencao ? "alert" : temAcao ? "point" : "idle") as CapState,
      statusRotulo: temAtencao ? "ATENÇÃO" : "EM ORDEM",
      atencao: temAtencao,
    };
  }, [carregando, configured, financeiro, operacional, decisoesAbertas]);

  return (
    <Panel
      indice="01"
      titulo="Cap Executive Intelligence"
      elevado
      style={style}
      acao={
        <Button
          variant="ghost"
          size="sm"
          className="ff-meta h-7 gap-1.5 rounded-lg px-2 text-[9px] text-muted-foreground hover:text-foreground"
          onClick={() => navigate("executivo", "cap")}
          aria-label="Abrir a Cap Executiva"
        >
          Abrir Cap <ArrowRight className="h-3 w-3" aria-hidden />
        </Button>
      }
      className={cn("ff-rise")}
    >
      <div className="grid items-center gap-5 md:grid-cols-[176px_1fr] md:gap-6 lg:grid-cols-[196px_1fr]">
        {/* ---------- Palco da Cap: moldura viewfinder ---------- */}
        <figure className="relative mx-auto w-full max-w-[196px]">
          <div
            className={cn(
              "relative flex aspect-square items-center justify-center border border-[var(--line-soft)] bg-[var(--ink-3)]",
              "transition-colors duration-500",
              atencao ? "border-[var(--frame-red)]/30" : "hover:border-white/[0.14]"
            )}
            style={{ background: "radial-gradient(circle at 50% 34%, rgba(255,255,255,0.05), transparent 62%), var(--ink-3)" }}
          >
            {/* Cantos de frame — assinatura da marca; canto superior direito em vermelho */}
            <span aria-hidden className={cn("absolute left-0 top-0 h-5 w-5 border-l-2 border-t-2 border-white/25", atencao && "border-[var(--frame-red)]/70")} />
            <span aria-hidden className="absolute right-0 top-0 h-5 w-5 border-r-2 border-t-2 border-[var(--frame-red)]/80" />
            <span aria-hidden className="absolute bottom-0 left-0 h-5 w-5 border-b-2 border-l-2 border-white/25" />
            <span aria-hidden className="absolute bottom-0 right-0 h-5 w-5 border-b-2 border-r-2 border-white/25" />

            {/* Varredura de sincronização */}
            {carregando && (
              <span aria-hidden className="ff-sync absolute inset-x-6 top-1/2 h-px bg-[var(--frame-red)]/50" />
            )}

            <Cap
              presentation="executiva"
              state={estadoCap}
              size={150}
              className="px-4"
            />
          </div>
          <figcaption className="ff-meta mt-2.5 text-center text-[8px] leading-relaxed text-muted-foreground/70">
            ARTE DE REFERÊNCIA — ASSETS OFICIAIS PENDENTES
          </figcaption>
        </figure>

        {/* ---------- Inteligência ---------- */}
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <p className="ff-display text-base md:text-lg">Cap Executiva</p>
            <span
              className={cn(
                "ff-meta rounded-lg border px-2 py-0.5 text-[8px]",
                atencao
                  ? "border-[var(--frame-red)]/50 text-[var(--frame-red)]"
                  : "border-border text-muted-foreground"
              )}
              role="status"
            >
              {statusRotulo}
            </span>
          </div>

          {/* Sinais determinísticos */}
          <ul className="mt-4 space-y-2.5" aria-label="Resumo da Cap com dados reais">
            {sinais.map((s, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm leading-relaxed">
                {s.nivel === "alerta" ? (
                  <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-[var(--frame-red)]" aria-hidden />
                ) : s.nivel === "sucesso" ? (
                  <CircleCheck className="mt-0.5 h-4 w-4 shrink-0 text-foreground/70" aria-hidden />
                ) : (
                  <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                )}
                <span className="min-w-0 flex-1 text-foreground/85">{s.texto}</span>
                {s.acao && (
                  <button
                    type="button"
                    onClick={() => navigate(s.acao!.env, s.acao!.modulo)}
                    className="ff-meta shrink-0 rounded-lg border border-border px-2 py-1 text-[8px] text-muted-foreground transition-colors ff-ease hover:border-[var(--frame-red)]/60 hover:text-foreground"
                  >
                    {s.acao.rotulo}
                  </button>
                )}
              </li>
            ))}
          </ul>

          {/* Campo de comandos da Cap */}
          <button
            type="button"
            onClick={onAbrirComandos}
            aria-label="Abrir a central de comandos da Cap"
            className="mt-5 flex h-10 w-full items-center gap-2.5 border border-[var(--line-soft)] bg-[var(--ink)] px-3.5 text-left transition-colors duration-300 ff-ease hover:border-white/20"
          >
            <Bot className="h-4 w-4 shrink-0 text-[var(--frame-red)]" aria-hidden />
            <span className="flex-1 truncate text-sm text-muted-foreground/80">
              Comando para a Cap — pesquisar, navegar, executar
            </span>
            <span aria-hidden className="ff-numeric text-[10px] text-muted-foreground">⌘K</span>
          </button>

          <p className="ff-meta mt-3 text-[8px] leading-relaxed text-muted-foreground/60">
            CONVERSAR COM A CAP · IA INTEGRADA NA FASE 2 — HOJE APENAS DADOS REAIS
          </p>
        </div>
      </div>
    </Panel>
  );
}
