"use client";

/**
 * FRAME FLOW OS — Painel cinematográfico.
 *
 * Superfícies em níveis de grafite com profundidade discreta (hairline
 * superior interno), bordas sutis e cabeçalho indexado estilo central de
 * comando. Índice numérico é a única concessão HUD — sem neon, sem glow.
 */

import { cn } from "@/lib/utils";
import { FrameMark } from "@/components/common/frame-primitives";

export function Panel({
  indice,
  titulo,
  acao,
  children,
  className,
  style,
  /** Nível de grafite mais elevado (usado pelo palco da Cap). */
  elevado = false,
}: {
  indice: string;
  titulo: string;
  acao?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  elevado?: boolean;
}) {
  return (
    <section
      style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)", ...style }}
      className={cn(
        "group/panel relative flex h-full flex-col border border-[var(--line-soft)] bg-[#101010] transition-colors duration-300 ff-ease hover:border-white/[0.12]",
        elevado && "bg-[#111111]",
        className
      )}
    >
      {/* Marca de cantos — revela no hover (assinatura discreta) */}
      <FrameMark className="pointer-events-none absolute right-2.5 top-3 z-10 opacity-0 transition-opacity duration-500 group-hover/panel:opacity-20" size={7} />

      <header className="flex min-h-[46px] items-center justify-between gap-3 border-b border-[var(--line-soft)] px-4 py-2.5 md:px-5">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="ff-eyebrow shrink-0 text-[var(--frame-red)]" aria-hidden>
            {indice}
          </span>
          <h2 className="ff-eyebrow truncate text-foreground/90">{titulo}</h2>
        </div>
        {acao && <div className="shrink-0">{acao}</div>}
      </header>

      <div className="flex-1 p-4 md:p-5">{children}</div>
    </section>
  );
}

/** Célula de indicador separada por hairlines (editorial, não cartão). */
export function PanelKpi({
  label,
  valor,
  hint,
  destaque = false,
  pronto = true,
  className,
}: {
  label: string;
  valor: string;
  hint?: string;
  destaque?: boolean;
  pronto?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("relative px-3 py-3.5 md:px-4", className)}>
      {destaque && (
        <span aria-hidden className="absolute left-0 top-3 h-[calc(100%-24px)] w-[2px] bg-[var(--frame-red)]" />
      )}
      <p className="ff-eyebrow text-[9px] text-muted-foreground">{label}</p>
      <p
        className={cn(
          "ff-numeric mt-1.5 text-lg font-semibold md:text-xl",
          !pronto && "text-muted-foreground/70"
        )}
      >
        {valor}
      </p>
      {hint && <p className="ff-meta mt-1 text-[8px] leading-relaxed text-muted-foreground/80">{hint}</p>}
    </div>
  );
}

/** Status com dot pulsante — online / atenção / pendência. */
export function StatusDot({
  estado,
  children,
}: {
  estado: "ativo" | "atencao" | "pendente";
  children: React.ReactNode;
}) {
  const cor =
    estado === "ativo"
      ? "bg-foreground"
      : estado === "atencao"
        ? "bg-[var(--frame-red)]"
        : "bg-muted-foreground";
  return (
    <span className="ff-meta inline-flex items-center gap-2 text-muted-foreground">
      <span aria-hidden className={cn("h-1.5 w-1.5 rounded-full", cor, "ff-dot-pulse")} />
      {children}
    </span>
  );
}
