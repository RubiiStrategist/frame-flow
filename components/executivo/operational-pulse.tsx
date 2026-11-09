"use client";

/**
 * FRAME FLOW OS — Operational Pulse (Região D).
 *
 * Visão dinâmica com hierarquia real: número editorial, listas contextuais,
 * contadores e uma barra de capacidade — cada informação no formato certo
 * para o seu tipo (não uma fileira de cartões idênticos).
 */

import { ArrowRight, CalendarClock, CheckSquare, Clapperboard, ListChecks } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Panel } from "./panel";
import { navigate } from "@/lib/frameflow/router";
import { descreverPrazo } from "@/lib/frameflow/format";
import { cn } from "@/lib/utils";
import { useDadosCeo } from "./use-dados-ceo";

export function OperationalPulse({ style }: { style?: React.CSSProperties }) {
  const { operacional } = useDadosCeo();
  const pronto = operacional.pronto;

  const capacidade =
    pronto &&
    operacional.tarefasEmAndamento != null &&
    operacional.tarefasConcluidas != null
      ? (operacional.tarefasEmAndamento + operacional.tarefasConcluidas) || 0
      : null;
  const andando = operacional.tarefasEmAndamento ?? 0;
  const pctCapacidade = capacidade && capacidade > 0 ? Math.round((andando / capacidade) * 100) : null;

  return (
    <Panel
      indice="03"
      titulo="Operational Pulse"
      style={style}
      className="ff-rise"
      acao={
        <Button
          variant="ghost"
          size="sm"
          className="ff-meta h-7 gap-1.5 rounded-lg px-2 text-[9px] text-muted-foreground hover:text-foreground"
          onClick={() => navigate("operacional", "projetos")}
          aria-label="Abrir a gestão de projetos"
        >
          Projetos <ArrowRight className="h-3 w-3" aria-hidden />
        </Button>
      }
    >
      <div className="grid gap-6 md:grid-cols-[1fr_200px]">
        {/* Coluna principal — projetos ativos com lista real */}
        <div className="min-w-0">
          <div className="flex items-baseline gap-3">
            <p className="ff-display text-4xl md:text-5xl">
              {pronto ? operacional.projetosAtivos : "—"}
            </p>
            <p className="ff-eyebrow text-[9px] text-muted-foreground">
              projetos ativos
              {!pronto && <span className="ml-1.5 text-muted-foreground/60">· aguarda dados</span>}
            </p>
          </div>

          {pronto && operacional.topProjetos.length > 0 && (
            <ul className="mt-4 divide-y divide-[var(--line-soft)] border-t border-[var(--line-soft)]" aria-label="Projetos em andamento">
              {operacional.topProjetos.map((p) => (
                <li key={p.id} className="flex items-center gap-3 py-2.5">
                  <Clapperboard className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                  <span className="min-w-0 flex-1 truncate text-sm">{p.titulo}</span>
                  <span className="ff-meta shrink-0 rounded-lg border border-border px-1.5 py-0.5 text-[8px] text-muted-foreground">
                    {p.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
          {pronto && operacional.topProjetos.length === 0 && (
            <p className="ff-meta mt-4 text-[8px] text-muted-foreground/70">
              NENHUM PROJETO ATIVO NO MOMENTO
            </p>
          )}
        </div>

        {/* Coluna de pulso — contadores com indicadores */}
        <div className="flex flex-col justify-between gap-3 md:border-l md:border-[var(--line-soft)] md:pl-5">
          <Pulso
            icone={CalendarClock}
            rotulo="Entregas · 14 dias"
            valor={pronto ? String(operacional.entregasProximas.length) : "—"}
            detalhe={pronto && operacional.entregasProximas[0] ? operacional.entregasProximas[0].titulo : pronto ? "nenhuma agendada" : "aguarda dados"}
            ativo={pronto && operacional.entregasProximas.length > 0}
          />
          <Pulso
            icone={CheckSquare}
            rotulo="Aprovações pendentes"
            valor={pronto ? String(operacional.aprovacoesPendentes) : "—"}
            detalhe={pronto ? (operacional.aprovacoesPendentes ?? 0) > 0 ? "aguardando cliente" : "nada pendente" : "aguarda dados"}
            ativo={pronto && (operacional.aprovacoesPendentes ?? 0) > 0}
          />
          <Pulso
            icone={ListChecks}
            rotulo="Tarefas atrasadas"
            valor={pronto ? String(operacional.tarefasAtrasadas) : "—"}
            detalhe={pronto ? ((operacional.tarefasAtrasadas ?? 0) > 0 ? "exigem ação hoje" : "nenhuma atrasada") : "aguarda dados"}
            ativo={pronto && (operacional.tarefasAtrasadas ?? 0) > 0}
            alerta
          />
        </div>
      </div>

      {/* Capacidade operacional — barra fina e honesta */}
      <div className="mt-6 border-t border-[var(--line-soft)] pt-4">
        <div className="flex items-baseline justify-between gap-3">
          <p className="ff-eyebrow text-[9px] text-muted-foreground">Capacidade operacional</p>
          <p className="ff-meta text-[8px] text-muted-foreground/70">
            {pctCapacidade != null
              ? `${andando} em andamento · ${legendaCapacidade(pctCapacidade)}`
              : "GESTÃO DE PESSOAS · FASE 2"}
          </p>
        </div>
        <span aria-hidden className="mt-2.5 block h-[3px] w-full overflow-hidden bg-white/[0.06]">
          <span
            className={cn(
              "block h-full bg-[var(--frame-red)] transition-[width] duration-700 ff-ease",
              !pronto && "w-0"
            )}
            style={{ width: pctCapacidade != null ? `${Math.min(100, pctCapacidade)}%` : undefined }}
          />
        </span>
        <p className="ff-meta mt-2 text-[8px] leading-relaxed text-muted-foreground/60">
          RITMO ATUAL = TAREFAS EM ANDAMENTO NO CICLO (EM ANDAMENTO + CONCLUÍDAS) — CAPACIDADE POR SÓCIO CHEGA COM O MÓDULO PESSOAS (FASE 2)
        </p>
      </div>
    </Panel>
  );
}

function legendaCapacidade(pct: number): string {
  return `${pct}% DO CICLO EM EXECUÇÃO`;
}

function Pulso({
  icone: Icone,
  rotulo,
  valor,
  detalhe,
  ativo,
  alerta = false,
}: {
  icone: typeof CalendarClock;
  rotulo: string;
  valor: string;
  detalhe: string;
  ativo: boolean;
  alerta?: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <Icone
        className={cn(
          "h-4 w-4 shrink-0",
          alerta && ativo ? "text-[var(--frame-red)]" : "text-muted-foreground"
        )}
        aria-hidden
      />
      <div className="min-w-0 flex-1">
        <p className="ff-meta truncate text-[8px] text-muted-foreground">{rotulo}</p>
        <p className={cn("ff-numeric text-base font-semibold leading-tight", valor === "—" && "text-muted-foreground/60")}>
          {valor}
        </p>
        <p className="ff-meta truncate text-[7.5px] text-muted-foreground/60">{detalhe}</p>
      </div>
      {(alerta || ativo) && (
        <span
          aria-hidden
          className={cn(
            "h-1.5 w-1.5 shrink-0 rounded-full",
            alerta && ativo ? "bg-[var(--frame-red)] ff-dot-pulse" : ativo ? "bg-foreground/70" : "bg-white/10"
          )}
        />
      )}
    </div>
  );
}
