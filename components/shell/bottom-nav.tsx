"use client";

/**
 * Navegação inferior mobile — cinco atalhos por ambiente (o último é a Cap).
 * Fixa, com área de segurança iOS e alvos de toque de 44px+.
 */

import { Cap } from "@/components/cap/cap";
import { cn } from "@/lib/utils";
import { getEnvironment } from "@/lib/frameflow/environments";
import { navigate } from "@/lib/frameflow/router";
import type { EnvironmentId } from "@/lib/frameflow/types";

export function BottomNav({
  envId,
  currentModule,
}: {
  envId: EnvironmentId;
  currentModule: string;
}) {
  const env = getEnvironment(envId);
  // Os atalhos já contêm a Cap como 5º item (especificação do produto).
  const shortcuts = env.shortcuts.map((id) => env.modules.find((m) => m.id === id)!).filter(Boolean);

  return (
    <nav
      aria-label="Navegação inferior"
      className="ff-safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-border bg-[var(--ink-2)]/98 lg:hidden"
    >
      <ul className="mx-auto flex max-w-md items-stretch justify-around">
        {shortcuts.map((mod) => {
          const ativo = mod.id === currentModule;
          const Icone = mod.icon;
          return (
            <li key={mod.id} className="flex-1">
              <button
                type="button"
                onClick={() => navigate(env.id, mod.id)}
                aria-current={ativo ? "page" : undefined}
                aria-label={mod.id === "cap" ? "Abrir a Cap" : undefined}
                className={cn(
                  "relative flex min-h-[60px] w-full flex-col items-center justify-center gap-1 py-2 transition-colors ff-ease",
                  ativo ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {ativo && (
                  <span
                    aria-hidden
                    className="absolute top-0 h-[3px] w-7 bg-[var(--frame-red)]"
                  />
                )}
                {mod.id === "cap" ? <Cap presentation={env.capPresentation} size={25}/> : <Icone className="h-5 w-5" aria-hidden />}
                <span className="text-[10px] leading-none">{mod.id === "cap" ? "Cap" : mod.title}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
