"use client";

/**
 * FRAME FLOW OS — Sequência de entrada (boot cinematográfico).
 *
 * Experiência: o símbolo da FRAME VISION desenha-se discretamente sobre o
 * preto profundo, a linha vermelha cresce e o véu se dissolve revelando o
 * centro de comando. Curtíssima (~0,95s), executada UMA vez por sessão,
 * decorativa (não bloqueia interação) e inteiramente ignorada quando o
 * sistema prefere movimento reduzido.
 */

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const BOOT_KEY = "frameflow.os.boot";

export interface CinemaState {
  /** Véu em exibição (decorativo). */
  mostrando: boolean;
  /** Atraso-base (ms) da cascata de entrada dos painéis (0 = sem boot). */
  base: number;
}

export function useCinema(): CinemaState {
  // Decisão do boot na inicialização (leitura síncrona de sessionStorage —
  // seguro: a tela CEO só existe no cliente, atrás do gate de sessão).
  const [estado] = useState<CinemaState>(() => {
    try {
      if (typeof window === "undefined") return { mostrando: false, base: 0 };
      const movimentoReduzido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const jaVisto = window.sessionStorage.getItem(BOOT_KEY) === "1";
      if (movimentoReduzido || jaVisto) return { mostrando: false, base: 0 };
      window.sessionStorage.setItem(BOOT_KEY, "1");
      return { mostrando: true, base: 620 }; // painéis sobem antes do véu dissolver
    } catch {
      /* storage indisponível — sem boot, sem erro */
      return { mostrando: false, base: 0 };
    }
  });

  const [veuAtivo, setVeuAtivo] = useState(estado.mostrando);
  useEffect(() => {
    if (!estado.mostrando) return;
    const t = window.setTimeout(() => setVeuAtivo(false), 1000);
    return () => window.clearTimeout(t);
  }, [estado.mostrando]);

  return { mostrando: veuAtivo, base: estado.base };
}

const CANTOS = [
  "left-0 top-0 border-l border-t",
  "right-0 top-0 border-r border-t border-[var(--frame-red)]", // canto assinatura da marca
  "left-0 bottom-0 border-l border-b",
  "right-0 bottom-0 border-r border-b",
];

export function BootVeil({ ativo }: { ativo: boolean }) {
  if (!ativo) return null;

  return (
    <div
      aria-hidden
      className="ff-boot-veu pointer-events-none fixed inset-0 z-[70] flex items-center justify-center bg-[var(--ink)]"
    >
      <div className="relative flex h-56 w-56 items-center justify-center md:h-64 md:w-64">
        {/* Cantos do frame — desenham-se em sequência */}
        {CANTOS.map((classe, i) => (
          <span
            key={i}
            className={cn(
              "absolute h-10 w-10 border-white/40",
              i === 1 ? "border-[var(--frame-red)]" : "border-white/40",
              classe
            )}
            style={{ animation: `ff-boot-canto 0.28s var(--ease) ${i * 0.09}s both` }}
          />
        ))}

        {/* Redmark — a linha assinatura cresce */}
        <span
          className="absolute h-[2px] w-[42px] bg-[var(--frame-red)]"
          style={{ animation: "ff-boot-linha 0.3s var(--ease) 0.34s both", transformOrigin: "left center" }}
        />

        <p
          className="ff-eyebrow absolute -bottom-16 text-center text-[9px] tracking-[0.42em] text-muted-foreground"
          style={{ animation: "ff-boot-canto 0.3s var(--ease) 0.42s both" }}
        >
          FRAME FLOW OS
        </p>
      </div>
    </div>
  );
}
