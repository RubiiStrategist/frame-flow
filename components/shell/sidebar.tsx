"use client";

/**
 * Sidebar desktop — recolhível, módulos agrupados por categoria.
 * Colapsada/expandida persistida em localStorage.
 */

import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { modulesByCategory, type EnvironmentDef } from "@/lib/frameflow/environments";
import { navigate } from "@/lib/frameflow/router";
import { useAuth } from "@/lib/frameflow/auth";
import { useStorageFlag } from "@/lib/frameflow/storage";

const STORAGE_KEY = "frameflow.sidebar.collapsed";

export function Sidebar({
  env,
  currentModule,
  onModuleChange,
}: {
  env: EnvironmentDef;
  currentModule: string;
  onModuleChange?: () => void;
}) {
  const { isPreview } = useAuth();
  const [collapsed, setCollapsed] = useStorageFlag("local", STORAGE_KEY);

  const toggle = () => {
    setCollapsed(!collapsed);
  };

  const grupos = modulesByCategory(env);

  return (
    <aside
      data-collapsed={collapsed}
      aria-label={`Navegação ${env.label}`}
      className={cn(
        "hidden shrink-0 flex-col border-r border-[var(--sidebar-border)] bg-[var(--sidebar)] transition-[width] duration-300 ff-ease lg:flex",
        collapsed ? "w-[72px]" : "w-[264px]"
      )}
    >
      {/* Marca */}
      <div className={cn("flex h-16 items-center gap-3 border-b border-[var(--sidebar-border)] px-4", collapsed && "justify-center px-0")}>
        <span className="relative inline-block shrink-0">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M3 8 V3 H8" stroke="#f4f0e7" strokeWidth="2" />
            <path d="M16 3 H21 V8" stroke="#e10606" strokeWidth="2" />
            <path d="M3 16 v5 h5" stroke="#f4f0e7" strokeWidth="2" />
            <path d="M21 16 v5 h-5" stroke="#f4f0e7" strokeWidth="2" />
            <path d="M10 8.5 L16 12 L10 15.5 Z" fill="#e10606" />
          </svg>
        </span>
        {!collapsed && (
          <span className="ff-display text-sm leading-none">
            Frame<span className="text-[var(--frame-red)]">Flow</span>
            {isPreview && <span className="ml-2 align-middle"><PreviewDot /></span>}
          </span>
        )}
      </div>

      {/* Ambiente atual */}
      {!collapsed && (
        <div className="px-4 pt-5">
          <p className="ff-eyebrow text-muted-foreground">Ambiente</p>
          <p className="mt-1 text-sm font-medium">
            {env.label} <span className="text-muted-foreground">· {env.role}</span>
          </p>
        </div>
      )}

      {/* Módulos */}
      <nav className="ff-scroll mt-4 flex-1 overflow-y-auto px-3 pb-4">
        {grupos.map((grupo, idx) => (
          <div key={`${grupo.category}-${idx}`} className="mb-4">
            {!collapsed && (
              <p className="ff-eyebrow px-2 pb-1.5 text-[9px] text-muted-foreground/70">
                {grupo.category}
              </p>
            )}
            <ul className={cn("space-y-0.5", collapsed && "flex flex-col items-center")}>
              {grupo.modules.map((mod) => {
                const ativo = mod.id === currentModule;
                const Icone = mod.icon;
                return (
                  <li key={mod.id}>
                    <button
                      type="button"
                      onClick={() => {
                        navigate(env.id, mod.id);
                        onModuleChange?.();
                      }}
                      aria-current={ativo ? "page" : undefined}
                      title={collapsed ? mod.title : undefined}
                      className={cn(
                        "group relative flex min-h-11 w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors ff-ease",
                        collapsed && "w-11 justify-center px-0",
                        ativo
                          ? "bg-[var(--sidebar-accent)] text-foreground"
                          : "text-muted-foreground hover:bg-white/[0.04] hover:text-foreground"
                      )}
                    >
                      {ativo && (
                        <span aria-hidden className="absolute left-0 top-1.5 h-8 w-[2px] bg-[var(--frame-red)]" />
                      )}
                      <Icone className="h-[18px] w-[18px] shrink-0" aria-hidden />
                      {!collapsed && (
                        <span className="min-w-0">
                          <span className="block truncate text-[13px] leading-tight">{mod.title}</span>
                          {mod.phase !== "mvp" && (
                            <span className="ff-meta block text-[9px] text-muted-foreground/60">
                              {mod.phase === "fase-2" ? "fase 2" : "fase 3"}
                            </span>
                          )}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Recolher */}
      <div className="border-t border-[var(--sidebar-border)] p-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggle}
          className="w-full justify-start gap-3 rounded-lg text-muted-foreground hover:text-foreground"
          aria-label={collapsed ? "Expandir menu lateral" : "Recolher menu lateral"}
        >
          {collapsed ? <PanelLeftOpen className="h-4 w-4" aria-hidden /> : <PanelLeftClose className="h-4 w-4" aria-hidden />}
          {!collapsed && <span className="ff-meta">Recolher</span>}
        </Button>
      </div>
    </aside>
  );
}

function PreviewDot() {
  return (
    <span className="ff-meta rounded-lg border border-[var(--frame-red)]/50 px-1 py-px text-[8px] leading-tight text-[var(--frame-red)]">
      PRÉVIA
    </span>
  );
}
