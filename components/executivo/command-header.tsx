"use client";

/**
 * FRAME FLOW OS — Command Header (Região A).
 *
 * Identidade, ambiente, saudação personalizada, data em pt-BR, status do
 * sistema e o campo de comandos. A data e a saudação são calculadas no
 * cliente (a tela só existe autenticada/preview) e nunca inventam dados.
 */

import { useMemo } from "react";
import { Search } from "lucide-react";
import { FrameMark } from "@/components/common/frame-primitives";
import { StatusDot } from "./panel";
import { useAuth } from "@/lib/frameflow/auth";
import { formatarData } from "@/lib/frameflow/format";
import { getEnvironment } from "@/lib/frameflow/environments";
import { cn } from "@/lib/utils";

export function CommandHeader({
  onAbrirComandos,
  style,
}: {
  onAbrirComandos(): void;
  style?: React.CSSProperties;
}) {
  const { configured, profile, isPreview } = useAuth();
  const env = getEnvironment("executivo");

  // Nome real da sessão; na pré-visualização, o sócio designado do ambiente
  // (rotulado como prévia) — nunca um usuário inventado.
  const nome = (profile?.fullName?.split(" ")[0] ?? env.partner).trim();

  const saudacao = useMemo(() => {
    const h = new Date().getHours();
    return h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite";
  }, []);

  const hoje = useMemo(() => formatarData(new Date().toISOString()), []);

  return (
    <header style={style} className="ff-rise">
      {/* Linha de identidade */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <FrameMark active size={9} className="shrink-0" />
          <p className="ff-eyebrow truncate text-muted-foreground">
            FRAME FLOW OS <span className="text-foreground/50">·</span>{" "}
            <span className="text-foreground/80">Ambiente Executivo</span>
          </p>
        </div>
        <StatusDot estado={configured ? "ativo" : "pendente"}>
          {configured ? "SISTEMA ATIVO" : "CONFIGURAÇÃO PENDENTE"}
        </StatusDot>
      </div>

      {/* Saudação editorial */}
      <div className="mt-5 flex flex-wrap items-end justify-between gap-x-8 gap-y-5 md:mt-7">
        <div className="min-w-0">
          <h1 className="ff-display text-[1.9rem] leading-[0.95] sm:text-4xl lg:text-5xl">
            {saudacao}, <span className="text-[var(--frame-red)]">{nome}</span>.
          </h1>
          <p className="mt-3 max-w-lg text-sm leading-relaxed text-muted-foreground">
            Bem-vindo de volta ao seu centro de comando —{" "}
            <span className="text-foreground/70">{hoje}</span>
            {isPreview && (
              <span className="ff-meta ml-2 align-middle text-[8px] text-[var(--frame-red)]">PRÉVIA</span>
            )}
          </p>
        </div>

        {/* Campo de comandos (desktop) */}
        <button
          type="button"
          onClick={onAbrirComandos}
          aria-label="Abrir a central de comandos (⌘K)"
          className="group hidden h-11 min-w-[300px] items-center gap-3 border border-[var(--line-soft)] bg-[#101010] px-4 text-left transition-colors duration-300 ff-ease hover:border-white/20 md:flex"
        >
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
          <span className="flex-1 text-sm text-muted-foreground/80">Pesquisar ou executar comando…</span>
          <span className="ff-numeric rounded-lg border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground">
            ⌘K
          </span>
        </button>
      </div>

      {/* Campo de comandos (mobile — alvo de toque confortável) */}
      <button
        type="button"
        onClick={onAbrirComandos}
        aria-label="Abrir a central de comandos"
        className={cn(
          "mt-6 flex h-12 w-full items-center gap-3 border border-[var(--line-soft)] bg-[#101010] px-4 text-left",
          "transition-colors duration-300 ff-ease hover:border-white/20 md:hidden"
        )}
      >
        <Search className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
        <span className="flex-1 text-sm text-muted-foreground/80">Pesquisar ou executar comando…</span>
        <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-[var(--frame-red)] ff-dot-pulse" />
      </button>
    </header>
  );
}
