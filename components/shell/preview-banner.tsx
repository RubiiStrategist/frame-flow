"use client";

/**
 * Banner de honestidade — presente em TODAS as telas enquanto a plataforma
 * estiver em modo de pré-visualização de layout (sem Supabase configurado).
 * Não é decoração: garante que nenhuma tela seja confundida com operação real.
 */

import { AlertTriangle } from "lucide-react";
import { navigate } from "@/lib/frameflow/router";

export function PreviewBanner() {
  return (
    <div
      role="status"
      className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-[var(--frame-red)]/40 bg-[var(--frame-red)]/[0.07] px-4 py-2 md:px-6"
    >
      <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-[var(--frame-red)]" aria-hidden />
      <p className="ff-meta text-[10px] leading-relaxed text-[#ffb3b3]">
        Pré-visualização de layout — autenticação e persistência exigem a configuração do Supabase.
      </p>
      <button
        type="button"
        onClick={() => navigate("executivo", "configuracoes")}
        className="ff-meta ml-auto text-[10px] text-[var(--frame-red)] underline underline-offset-4"
      >
        Configurar agora
      </button>
    </div>
  );
}
