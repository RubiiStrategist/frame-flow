"use client";

/**
 * AppShell — estrutura responsiva dos ambientes administrativos.
 *
 * Desktop: sidebar recolhível + área central (largura máx. 1600px da marca).
 * Mobile: navegação inferior fixa com 5 atalhos do ambiente.
 * Footer: gruda no rodapé em telas curtas e é empurrado naturalmente em
 * telas longas (regra de layout).
 */

import { useEffect, useRef, useState, type ReactNode } from "react";
import "@/app/motion.css";
import { getEnvironment } from "@/lib/frameflow/environments";
import { useAuth } from "@/lib/frameflow/auth";
import { CommandPalette } from "@/components/executivo/command-palette";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { BottomNav } from "./bottom-nav";
import { PreviewBanner } from "./preview-banner";
import { CapSheet } from "@/components/cap/cap-panel";
import type { EnvironmentId } from "@/lib/frameflow/types";

export function AppShell({
  envId,
  currentModule,
  children,
}: {
  envId: EnvironmentId;
  currentModule: string;
  children: ReactNode;
}) {
  const { isPreview, signOut } = useAuth();
  const [search, setSearch] = useState(false);
  const [capAberta, setCapAberta] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const env = getEnvironment(envId);

  useEffect(() => {
    // Hash navigation should open each workspace at its heading, not at the
    // previous page's scroll position. Keep this immediate for reduced motion.
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    const content = contentRef.current;
    if (!content?.animate || typeof window.matchMedia !== "function") return;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (preference.matches) return;
    // Opacity never changes the containing block of sticky/fixed content.
    // No key: animating navigation must not remount a form or restart data hooks.
    const entrance = content.animate([{ opacity: 0.88 }, { opacity: 1 }], {
      duration: 220,
      easing: "cubic-bezier(0.2, 0.72, 0.2, 1)",
    });
    const stop = () => { if (preference.matches) entrance.cancel(); };
    preference.addEventListener?.("change", stop);
    return () => { entrance.cancel(); preference.removeEventListener?.("change", stop); };
  }, [envId, currentModule]);

  return (
    <div className="flow-shell flex min-h-screen">
      <Sidebar env={env} currentModule={currentModule} />

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onSearch={() => setSearch(true)} env={env} currentModule={currentModule} onOpenCap={() => setCapAberta(true)} />
        {isPreview && <PreviewBanner />}

        <main className="mx-auto w-full max-w-[1600px] flex-1 px-4 pb-24 pt-5 md:px-8 md:pb-10 md:pt-7">
          <div ref={contentRef} className="ff-motion-page">
            {children}
          </div>
        </main>

        <footer className="mt-auto border-t border-border px-4 py-4 md:px-8">
          <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-2">
            <p className="ff-meta text-[9px] text-muted-foreground">
              FRAME FLOW — FRAME VISION © {new Date().getFullYear()}
            </p>
            <p className="ff-meta text-[9px] text-muted-foreground">
              pt-BR · BRL · America/Sao_Paulo
            </p>
            {isPreview && (
              <button
                type="button"
                onClick={() => signOut()}
                className="ff-meta text-[9px] text-[var(--frame-red)] underline underline-offset-4"
              >
                Sair da pré-visualização
              </button>
            )}
          </div>
          {/* Espaço para a navegação inferior no mobile */}
          <div className="h-20 lg:hidden" aria-hidden />
        </footer>
      </div>

      <CommandPalette open={search} onOpenChange={setSearch} />
      <BottomNav envId={envId} currentModule={currentModule} />
      <CapSheet open={capAberta} onOpenChange={setCapAberta} presentation={env.capPresentation} />
    </div>
  );
}

