"use client";

/**
 * FRAME FLOW OS — Central de Comandos (⌘K).
 *
 * Busca e navegação por teclado no padrão de ferramentas de precisão
 * (Linear/Raycast — nossa leitura própria, na linguagem FRAME). Nenhum
 * comando simula ação: tudo navega por rotas reais já existentes.
 * Atalho: ⌘K / Ctrl+K (desktop) · botão (mobile).
 */

import { useEffect } from "react";
import { ArrowRight, Landmark, Search } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { PHASE_LABEL } from "@/lib/frameflow/environments";
import { ENVIRONMENTS, getEnvironment } from "@/lib/frameflow/environments";
import { navigate } from "@/lib/frameflow/router";

export function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange(aberto: boolean): void;
}) {
  // Atalho global — apenas enquanto a tela CEO está montada (escopo desta etapa).
  useEffect(() => {
    function aoTeclar(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
    }
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [open, onOpenChange]);

  const executivo = getEnvironment("executivo");
  const outros = ENVIRONMENTS.filter((e) => e.id !== "executivo");

  const ir = (env: typeof executivo.id, modulo: string) => {
    onOpenChange(false);
    navigate(env, modulo);
  };

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Central de Comandos — FRAME FLOW OS"
      description="Pesquise módulos, ambientes e ações rápidas."
      className="rounded-lg border-[var(--line-soft)] bg-popover sm:max-w-xl"
    >
      <CommandInput placeholder="Pesquisar módulo, ambiente ou ação…" />
      <CommandList className="ff-scroll">
        <CommandEmpty>Nenhum resultado — tente outro termo.</CommandEmpty>

        {ENVIRONMENTS.map(e=><CommandGroup key={e.id} heading={e.label}>{e.modules.map(m=><CommandItem key={`${e.id}-${m.id}`} value={`${e.label} ${m.title} ${m.id}`} onSelect={()=>ir(e.id,m.id)} className="gap-3 rounded-lg"><m.icon className="h-4 w-4 shrink-0 text-[var(--frame-red)]"/><span className="flex-1">{m.title}</span>{m.phase!=="mvp"&&<span className="ff-meta text-muted-foreground">{PHASE_LABEL[m.phase]}</span>}</CommandItem>)}</CommandGroup>)}
        <CommandSeparator />

        <CommandGroup heading="Trocar de ambiente — sem novo login">
          {outros.map((e) => (
            <CommandItem key={e.id} onSelect={() => ir(e.id, e.startModule)} className="gap-3 rounded-lg">
              <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
              <span className="flex-1">
                <span className="block text-sm">{e.label}</span>
                <span className="ff-meta block text-[8px] text-muted-foreground">{e.partnerFullRole}</span>
              </span>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Ações rápidas">
          <CommandItem onSelect={() => ir("executivo", "decisoes")} className="gap-3 rounded-lg">
            <Landmark className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
            <span className="flex-1 text-sm">Abrir decisão estratégica</span>
            <CommandShortcut>nova</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => ir("executivo", "cap")} className="gap-3 rounded-lg">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
            <span className="flex-1 text-sm">Falar com a Cap Executiva</span>
            <CommandShortcut>cap</CommandShortcut>
          </CommandItem>
        </CommandGroup>
      </CommandList>

      <div className="ff-meta flex items-center justify-between border-t border-[var(--line-soft)] px-4 py-2.5 text-[8px] text-muted-foreground">
        <span>↑↓ navegar · ↵ executar · esc fechar</span>
        <span>FRAME FLOW OS</span>
      </div>
    </CommandDialog>
  );
}
