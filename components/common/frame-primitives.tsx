"use client";

/**
 * Primitivos visuais da FRAME FLOW — derivados da identidade FRAME VISION:
 * marca de cantos (canto superior direito em vermelho), eyebrow em caixa
 * alta, redmark (barra 42×3) e estados vazios honestos.
 */

import type { LucideIcon } from "lucide-react";
import { Inbox, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PHASE_LABEL } from "@/lib/frameflow/environments";
import type { ListResult, ModulePhase } from "@/lib/frameflow/types";

/* ---------- FrameMark: cantos de frame, assinatura da marca ---------- */

export function FrameMark({
  className,
  size = 12,
  stroke = 2,
  active = false,
}: {
  className?: string;
  size?: number;
  stroke?: number;
  /** Estado ativo: cantos em branco quente + canto vermelho. */
  active?: boolean;
}) {
  const c = size * 0.42;
  const color = active ? "var(--frame-red)" : "currentColor";
  return (
    <span
      aria-hidden
      className={cn("pointer-events-none inline-block relative", className)}
      style={{ width: size * 2.4, height: size * 2.4 }}
    >
      <svg width={size * 2.4} height={size * 2.4} viewBox="0 0 24 24" fill="none">
        <path d={`M2 ${2 + c} V2 H${2 + c}`} stroke="currentColor" strokeWidth={stroke} />
        <path d={`M${22 - c} 2 H22 V${2 + c}`} stroke={color} strokeWidth={stroke} />
        <path d={`M2 ${22 - c} V22 H${2 + c}`} stroke="currentColor" strokeWidth={stroke} />
        <path d={`M${22 - c} 22 H22 V${22 - c}`} stroke="currentColor" strokeWidth={stroke} />
      </svg>
    </span>
  );
}

/* ---------- Redmark: barra vermelha de seção (42×3) ---------- */

export function Redmark({ className }: { className?: string }) {
  return <span aria-hidden className={cn("inline-block h-[3px] w-[42px] bg-[var(--frame-red)]", className)} />;
}

/* ---------- Eyebrow: rótulo editorial em caixa alta ---------- */

export function Eyebrow({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={cn("ff-eyebrow text-muted-foreground", className)}>{children}</p>;
}

/* ---------- Chip de fase ---------- */

export function PhaseChip({ phase, className }: { phase: ModulePhase; className?: string }) {
  const mvp = phase === "mvp";
  return (
    <span
      className={cn(
        "ff-meta inline-flex items-center rounded-lg border px-2 py-0.5",
        mvp
          ? "border-[var(--frame-red)]/40 text-[var(--frame-red)]"
          : "border-border text-muted-foreground",
        className
      )}
    >
      {PHASE_LABEL[phase]}
    </span>
  );
}

/* ---------- Cabeçalho de módulo ---------- */

export function ModuleHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <header className="ff-module-header mb-6 md:mb-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <Eyebrow className="mb-2 flex items-center gap-2">
            <span className="inline-block h-[3px] w-[14px] bg-[var(--frame-red)]" />
            {eyebrow}
          </Eyebrow>
          <h1 className="ff-display text-2xl md:text-4xl">{title}</h1>
          {description && (
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
              {description}
            </p>
          )}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </header>
  );
}

/* ---------- EmptyState: estado vazio honesto ----------
 * `reason` determina a mensagem — jamais inventamos dados.
 */

export function EmptyState<T = unknown>({
  result,
  loading,
  icon: Icon = Inbox,
  tituloVazio,
  descricaoVazio,
  action,
  useSkeletonRows,
  skeletonRows = 4,
}: {
  result: ListResult<T>;
  loading?: boolean;
  icon?: LucideIcon;
  tituloVazio: string;
  descricaoVazio?: string;
  action?: React.ReactNode;
  useSkeletonRows?: boolean;
  skeletonRows?: number;
}) {
  if (loading && result.reason === "carregando") {
    return (
      <div className="space-y-2">
        {useSkeletonRows
          ? Array.from({ length: skeletonRows }).map((_, i) => (
              <div key={i} className="h-12 animate-pulse rounded-lg bg-secondary" />
            ))
          : Array.from({ length: skeletonRows }).map((_, i) => (
              <div key={i} className="h-20 animate-pulse rounded-lg bg-secondary" />
            ))}
      </div>
    );
  }

  if (result.reason === "not-configured") {
    return (
      <div className="ff-empty-state relative flex flex-col items-center justify-center gap-3 border border-dashed border-border px-6 py-12 text-center">
        <FrameMark className="absolute left-3 top-3 opacity-30" size={8} />
        <FrameMark className="absolute right-3 top-3 opacity-30" size={8} />
        <Settings2 className="h-8 w-8 text-muted-foreground" aria-hidden />
        <p className="ff-display text-base">Conexão pendente</p>
        <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
          Configure o Supabase para operar com dados reais. Nenhum dado de
          demonstração é exibido — a plataforma trabalha apenas com registros
          legítimos.
        </p>
        {action}
      </div>
    );
  }

  if (result.reason === "erro") {
    return (
      <div className="ff-empty-state relative flex flex-col items-center justify-center gap-3 border border-dashed border-[var(--frame-red)]/40 px-6 py-12 text-center">
        <p className="ff-display text-base text-[var(--frame-red)]">Falha ao carregar</p>
        <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
          {result.error ?? "Não foi possível ler os registros agora."}
        </p>
        {action}
      </div>
    );
  }

  return (
    <div className="ff-empty-state relative flex flex-col items-center justify-center gap-3 border border-dashed border-border px-6 py-12 text-center">
      <FrameMark className="absolute left-3 top-3 opacity-30" size={8} />
      <FrameMark className="absolute right-3 top-3 opacity-30" size={8} />
      <Icon className="h-8 w-8 text-muted-foreground" aria-hidden />
      <p className="ff-display text-base">{tituloVazio}</p>
      {descricaoVazio && (
        <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">{descricaoVazio}</p>
      )}
      {action}
    </div>
  );
}

/* ---------- Ação padrão para estados "configuração pendente" ---------- */

export function IrParaConfiguracao({ rota }: { rota: string }) {
  return (
    <Button
      size="sm"
      variant="outline"
      className="ff-meta rounded-lg border-border"
      onClick={() => {
        window.location.hash = rota; // ex.: #/executivo/configuracoes
      }}
    >
      Abrir configurações
    </Button>
  );
}

/* ---------- KPI: cartão de indicador (vazio honesto) ---------- */

export function Kpi({
  label,
  valor,
  hint,
  destaque = false,
  pronto = true,
}: {
  label: string;
  /** Valor exibido; "—" quando não há dados reais. */
  valor: string;
  hint?: string;
  destaque?: boolean;
  pronto?: boolean;
}) {
  return (
    <div
      className={cn(
        "ff-kpi relative group border border-border bg-card p-4 md:p-5 transition-colors ff-ease hover:border-white/25",
        destaque && "border-[var(--frame-red)]/45"
      )}
    >
      <FrameMark className="absolute right-2.5 top-2.5 opacity-0 transition-opacity ff-ease group-hover:opacity-25" size={7} />
      <Eyebrow className="!text-[11px]">{label}</Eyebrow>
      <p
        className={cn(
          "ff-numeric mt-2 text-xl md:text-2xl font-semibold",
          !pronto && "text-muted-foreground"
        )}
      >
        {valor}
      </p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
