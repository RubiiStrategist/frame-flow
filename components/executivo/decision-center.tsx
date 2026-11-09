"use client";

/**
 * FRAME FLOW OS — Decision Center (Região E).
 *
 * Decisões dos sócios com contexto, prioridade determinística e ação
 * evidente. Votos continuam sendo registrados na Central de Decisões
 * (estrutura segura da Etapa 1.1) — aqui o CEO vê e entra direto.
 */

import { ArrowRight, Landmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Panel } from "./panel";
import { navigate } from "@/lib/frameflow/router";
import { formatarBRL } from "@/lib/frameflow/format";
import { cn } from "@/lib/utils";
import { useDadosCeo } from "./use-dados-ceo";
import { useAuth } from "@/lib/frameflow/auth";

const REGRAS_ROTULO: Record<string, string> = {
  maioria: "maioria",
  unanimidade: "unanimidade",
  socio_presente: "sócio presente",
  livre: "livre",
};

const PRIORIDADE_ROTULO = {
  alta: { texto: "prioridade alta", classe: "border-[var(--frame-red)]/60 text-[var(--frame-red)]" },
  media: { texto: "prioridade média", classe: "border-border text-foreground/80" },
  padrao: { texto: "padrão", classe: "border-border text-muted-foreground" },
} as const;

export function DecisionCenter({ style }: { style?: React.CSSProperties }) {
  const { configured, profile } = useAuth();
  const { decisoesAbertas } = useDadosCeo();
  const ehSocio = profile?.role === "ceo" || profile?.role === "cro" || profile?.role === "coo_cfo";

  return (
    <Panel
      indice="04"
      titulo="Decision Center"
      style={style}
      className="ff-rise"
      acao={
        <Button
          variant="ghost"
          size="sm"
          className="ff-meta h-7 gap-1.5 rounded-lg px-2 text-[9px] text-muted-foreground hover:text-foreground"
          onClick={() => navigate("executivo", "decisoes")}
          aria-label="Abrir a central de decisões"
        >
          Central <ArrowRight className="h-3 w-3" aria-hidden />
        </Button>
      }
    >
      {configured ? (
        decisoesAbertas.length > 0 ? (
          <div>
            {configured && ehSocio && decisoesAbertas.length > 0 && (
              <p className="ff-meta mb-3 text-[8px] text-muted-foreground/70">
                VOCÊ PODE REGISTRAR SEU VOTO NA CENTRAL — CADA SÓCIO VOTA EM NOME PRÓPRIO (RLS)
              </p>
            )}
            <ul className="divide-y divide-[var(--line-soft)] border-t border-[var(--line-soft)]">
              {decisoesAbertas.map((d) => {
                const prio = PRIORIDADE_ROTULO[d.prioridade];
                return (
                  <li key={d.id} className="group/decisao py-3.5 first:pt-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium leading-snug">{d.titulo}</p>
                        <p className="ff-meta mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-[8px] text-muted-foreground">
                          <span>{d.impactoFinanceiro != null ? formatarBRL(d.impactoFinanceiro, true) : "sem impacto"}</span>
                          <span>regra: {REGRAS_ROTULO[d.regraAprovacao] ?? d.regraAprovacao}</span>
                          <span>{d.votos} voto(s)</span>
                        </p>
                      </div>
                      <span
                        className={cn(
                          "ff-meta shrink-0 rounded-lg border px-1.5 py-0.5 text-[7.5px] uppercase",
                          prio.classe,
                          d.prioridade === "alta" && "ff-dot-pulse"
                        )}
                      >
                        {prio.texto}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => navigate("executivo", "decisoes")}
                      className="ff-meta mt-2.5 inline-flex items-center gap-1.5 text-[8px] text-muted-foreground transition-colors ff-ease hover:text-[var(--frame-red)]"
                      aria-label={`Abrir decisão ${d.titulo}`}
                    >
                      analisar e votar <ArrowRight className="h-3 w-3" aria-hidden />
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : (
          <VazioLegitimo
            titulo="Nenhuma decisão aberta"
            texto="Solicitações estratégicas dos sócios aparecem aqui com contexto, prioridade e ação."
          />
        )
      ) : (
        <VazioLegitimo
          titulo="Centro de decisões aguardando conexão"
          texto="Configure o Supabase para as decisões reais dos sócios entrarem aqui — nenhuma é simulada."
          acao
        />
      )}
    </Panel>
  );
}

function VazioLegitimo({ titulo, texto, acao }: { titulo: string; texto: string; acao?: boolean }) {
  return (
    <div className="flex h-full min-h-[180px] flex-col items-center justify-center gap-3 px-4 py-8 text-center">
      <Landmark className="h-7 w-7 text-muted-foreground/50" aria-hidden />
      <p className="ff-display text-sm">{titulo}</p>
      <p className="max-w-xs text-xs leading-relaxed text-muted-foreground">{texto}</p>
      {acao && (
        <Button
          size="sm"
          variant="outline"
          className="ff-meta h-8 rounded-lg border-border text-[9px]"
          onClick={() => navigate("executivo", "configuracoes")}
        >
          Abrir configurações
        </Button>
      )}
    </div>
  );
}
