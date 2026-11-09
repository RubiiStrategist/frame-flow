"use client";

/**
 * Barra superior — troca de ambiente (sem novo login), menu completo de
 * módulos (mobile via Sheet) e ações de conta.
 */

import { useMemo, useState } from "react";
import { Check, LogOut, Menu, MonitorPlay, Search, UserRound } from "lucide-react";
import { Cap } from "@/components/cap/cap";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { ENVIRONMENTS, modulesByCategory, type EnvironmentDef } from "@/lib/frameflow/environments";
import { navigate } from "@/lib/frameflow/router";
import { useAuth } from "@/lib/frameflow/auth";
import { InstallButton } from "@/components/pwa/install-button";
import type { EnvironmentId } from "@/lib/frameflow/types";

export function Topbar({
  env,
  currentModule,
  onOpenCap,
  onSearch,
}: {
  env: EnvironmentDef;
  currentModule: string;
  onOpenCap(): void;
  onSearch(): void;
}) {
  const { profile, isPreview, signOut } = useAuth();
  const [menuAberto, setMenuAberto] = useState(false);

  const outrosAmbientes = useMemo(
    () => ENVIRONMENTS.filter((e) => e.id !== env.id),
    [env.id]
  );

  /** Mantém módulo equivalente ao trocar de ambiente (ex.: financeiro/cap). */
  function trocarAmbiente(alvo: EnvironmentDef) {
    const equivalente = alvo.modules.find(
      (m) => m.id === currentModule && m.phase === "mvp"
    );
    navigate(alvo.id, equivalente ? equivalente.id : alvo.startModule);
  }

  const nomeUsuario = isPreview
    ? "Pré-visualização"
    : profile?.fullName || profile?.email || "Conta";
  const papel = isPreview ? "Exploração de layout" : env.role;

  return (
    <header className="ff-topbar sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-[2px]">
      <div className="flex h-16 items-center gap-2 px-4 md:px-6">
        {/* Marca (mobile) */}
        <span className="lg:hidden">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M3 8 V3 H8" stroke="#f4f0e7" strokeWidth="2" />
            <path d="M16 3 H21 V8" stroke="#e10606" strokeWidth="2" />
            <path d="M3 16 v5 h5" stroke="#f4f0e7" strokeWidth="2" />
            <path d="M21 16 v5 h-5" stroke="#f4f0e7" strokeWidth="2" />
            <path d="M10 8.5 L16 12 L10 15.5 Z" fill="#e10606" />
          </svg>
        </span>

        {/* Troca de ambiente — sem novo login */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="ff-meta h-9 gap-2 rounded-lg border-border pl-3"
              aria-label={`Ambiente atual: ${env.label}. Trocar ambiente.`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--frame-red)]" aria-hidden />
              {env.label}
              <span className="hidden text-muted-foreground sm:inline">· {env.role}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-72 rounded-lg border-border bg-popover">
            <DropdownMenuLabel className="ff-eyebrow text-muted-foreground">
              Alternar ambiente — sem novo login
            </DropdownMenuLabel>
            {ENVIRONMENTS.map((e) => (
              <DropdownMenuItem
                key={e.id}
                onClick={() => trocarAmbiente(e)}
                className={cn("gap-2 rounded-lg", e.id === env.id && "text-[var(--frame-red)]")}
              >
                <Check className={cn("h-4 w-4", e.id === env.id ? "opacity-100" : "opacity-0")} aria-hidden />
                <span className="flex-1">
                  <span className="block text-sm">{e.label}</span>
                  <span className="block text-xs text-muted-foreground">{e.partnerFullRole}</span>
                </span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <button className="ff-global-search" onClick={onSearch} aria-label="Buscar módulos e ações"><Search size={16}/><span>Buscar no workspace</span><kbd>Ctrl K</kbd></button>
        <div className="ml-auto flex items-center gap-1.5">
          <InstallButton />

          {/* Cap */}
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenCap}
            className="ff-meta h-9 gap-2 rounded-lg border-border"
            aria-label="Abrir a Cap, assistente da FRAME FLOW"
          >
            <Cap presentation={env.capPresentation} size={30} />
            <span className="hidden sm:inline">Cap</span>
          </Button>

          {/* Conta */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-9 gap-2 rounded-lg border-border px-2.5"
                aria-label="Conta e sessão"
              >
                <UserRound className="h-4 w-4" aria-hidden />
                <span className="hidden max-w-28 truncate text-xs md:inline">{nomeUsuario}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 rounded-lg border-border bg-popover">
              <DropdownMenuLabel className="ff-eyebrow text-muted-foreground">
                {nomeUsuario}
                <span className="mt-1 block normal-case tracking-normal text-muted-foreground">
                  {papel}
                  {isPreview && " · modo de pré-visualização de layout"}
                </span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-border" />
              <DropdownMenuItem
                onClick={() => signOut()}
                className="gap-2 rounded-lg"
              >
                <LogOut className="h-4 w-4" aria-hidden />
                {isPreview ? "Sair da pré-visualização" : "Encerrar sessão"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Todos os módulos (mobile) */}
          <Sheet open={menuAberto} onOpenChange={setMenuAberto}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-9 w-9 rounded-lg border-border p-0 lg:hidden"
                aria-label="Abrir menu completo de módulos"
              >
                <Menu className="h-4 w-4" aria-hidden />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] overflow-y-auto border-border bg-background p-0">
              <SheetHeader className="border-b border-border px-5 py-4">
                <SheetTitle className="ff-display text-base">FRAME FLOW</SheetTitle>
                <SheetDescription className="ff-meta text-muted-foreground">Todos os módulos</SheetDescription>
              </SheetHeader>
              <div className="px-4 py-3">
                <p className="ff-eyebrow mb-2 flex items-center gap-1.5 text-muted-foreground">
                  <MonitorPlay className="h-3.5 w-3.5" aria-hidden /> {env.label} — atual
                </p>
                {modulesByCategory(env).map((grupo, idx) => (
                  <div key={`${grupo.category}-${idx}`} className="mb-4">
                    <p className="ff-eyebrow px-1 pb-1 text-[9px] text-muted-foreground/70">
                      {grupo.category}
                    </p>
                    <ul className="space-y-0.5">
                      {grupo.modules.map((mod) => (
                        <li key={mod.id}>
                          <button
                            type="button"
                            onClick={() => {
                              navigate(env.id, mod.id);
                              setMenuAberto(false);
                            }}
                            className={cn(
                              "flex w-full items-center gap-3 rounded-lg px-2.5 py-2.5 text-left text-[13px]",
                              mod.id === currentModule
                                ? "bg-[var(--sidebar-accent)] text-foreground"
                                : "text-muted-foreground hover:bg-white/[0.04] hover:text-foreground"
                            )}
                          >
                            <mod.icon className="h-[18px] w-[18px] shrink-0" aria-hidden />
                            <span className="flex-1 truncate">{mod.title}</span>
                            {mod.phase !== "mvp" && (
                              <span className="ff-meta text-[9px] text-muted-foreground/60">
                                {mod.phase === "fase-2" ? "f2" : "f3"}
                              </span>
                            )}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}

                <p className="ff-eyebrow mb-2 mt-6 flex items-center gap-1.5 text-muted-foreground">
                  <Search className="h-3.5 w-3.5" aria-hidden /> Outros ambientes
                </p>
                {outrosAmbientes.map((e) => (
                  <button
                    key={e.id}
                    type="button"
                    onClick={() => trocarAmbiente(e)}
                    className="mb-1 flex w-full items-center gap-3 rounded-lg border border-border px-2.5 py-2.5 text-left"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--frame-red)]" aria-hidden />
                    <span className="flex-1">
                      <span className="block text-[13px]">{e.label}</span>
                      <span className="block text-[11px] text-muted-foreground">{e.role}</span>
                    </span>
                  </button>
                ))}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
