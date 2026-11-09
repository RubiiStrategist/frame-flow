"use client";

import { useMemo, useState } from "react";
import { ArrowUpRight, AudioLines, Pause, Play, ShieldCheck } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/frameflow/auth";
import { CAP_PRESENTATION_LABEL, CAP_ANIMATION_LABEL, Cap } from "./cap";
import type { CapPresentation } from "@/lib/frameflow/types";
import { CapChat } from "./cap-chat";
import { CapInsights } from "./cap-insights";
import "./cap-panel.css";

const CONTEXT: Record<CapPresentation, { label: string; focus: string; description: string; href: string; link: string }> = {
  executiva: { label: "Executivo", focus: "Clareza para decidir.", description: "Finanças, decisões e prioridades. Vamos organizar o que pede sua atenção.", href: "/#/executivo/decisoes", link: "Central de decisões" },
  comercial: { label: "Comercial", focus: "Conexões que avançam.", description: "Leads, oportunidades e próximos contatos. Vamos cuidar de cada conversa.", href: "/#/comercial/funil", link: "Abrir seu funil" },
  operacional: { label: "Operacional", focus: "Foco para entregar.", description: "Projetos, tarefas e prazos. Vamos transformar prioridades em entregas.", href: "/#/operacional/tarefas", link: "Ver suas tarefas" },
  concierge: { label: "Concierge", focus: "Seu próximo passo, claro.", description: "Contexto e organização para acompanhar o que importa.", href: "/#/executivo/inicio", link: "Visão geral" },
};

export function CapContent({ presentation, compact = false }: { presentation: CapPresentation; compact?: boolean }) {
  const { profile, isPreview } = useAuth();
  const [paused, setPaused] = useState(false);
  const [motionEnabled, setMotionEnabled] = useState(false);
  const [replay, setReplay] = useState(0);
  const context = CONTEXT[presentation];
  const nome = isPreview ? "Explorador" : profile?.fullName?.trim().split(/\s+/)[0];
  const saudacao = useMemo(() => {
    const hora = new Date().getHours();
    return hora < 12 ? "Bom dia" : hora < 18 ? "Boa tarde" : "Boa noite";
  }, []);

  return (
    <div className={cn("ff-cap-workspace", compact && "ff-cap-workspace--compact")}>
      <aside className="ff-cap-companion" aria-label={`Contexto da ${CAP_PRESENTATION_LABEL[presentation]}`}>
        <section className="ff-cap-profile">
          <div className="ff-cap-profile-top">
            <span className="ff-cap-context"><span aria-hidden />{context.label}</span>
            <span className="ff-cap-brand">FRAME VISION</span>
          </div>
          <div className="ff-cap-portrait">
            <span className="ff-cap-portrait-frame" aria-hidden />
            <Cap presentation={presentation} key={`${presentation}-${replay}`} paused={paused} motionEnabled={motionEnabled} size={compact ? 130 : 260} />
          </div>
          <div className="ff-cap-intro">
            <p className="ff-cap-greeting">{saudacao}{nome ? `, ${nome}` : ""}.</p>
            <h2>{context.focus}</h2>
            <p className="ff-cap-description">{context.description}</p>
          </div>
          <div className="ff-cap-animation" role="group" aria-label="Animação da Cap">
            <span><AudioLines size={13} aria-hidden />{CAP_ANIMATION_LABEL[presentation]}</span>
            <button type="button" title="Reproduzir a animação, inclusive com movimento reduzido ativado" aria-label={motionEnabled ? "Repetir animação" : "Ativar animação"} onClick={() => { setPaused(false); setMotionEnabled(true); setReplay(n => n + 1); }}><Play size={14} aria-hidden /></button>
            <button type="button" title={paused ? "Retomar animação" : "Pausar animação"} aria-label={paused ? "Retomar animação" : "Pausar animação"} aria-pressed={paused} onClick={() => setPaused(p => !p)}>{paused ? <Play size={14} aria-hidden /> : <Pause size={14} aria-hidden />}</button>
          </div>
        </section>
        {!compact && <>
          <CapInsights presentation={presentation} />
          <a className="ff-cap-context-link" href={context.href}>{context.link}<ArrowUpRight size={15} aria-hidden /></a>
          <p className="ff-cap-assurance"><ShieldCheck size={14} aria-hidden />Você revisa antes de qualquer ação.</p>
        </>}
      </aside>
      <CapChat presentation={presentation} compact={compact} />
    </div>
  );
}

export function CapSheet({ open, onOpenChange, presentation }: { open: boolean; onOpenChange(open: boolean): void; presentation: CapPresentation }) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="ff-cap-sheet w-full overflow-y-auto border-border bg-background p-0 sm:max-w-lg">
        <SheetHeader className="border-b border-border px-5 py-4">
          <SheetTitle className="ff-display text-base">{CAP_PRESENTATION_LABEL[presentation]}</SheetTitle>
          <SheetDescription className="text-xs text-muted-foreground">Seu contexto, sempre por perto.</SheetDescription>
        </SheetHeader>
        <div className="ff-cap-sheet-body min-h-0 px-4 pb-5">
          <CapContent key={presentation} presentation={presentation} compact />
        </div>
      </SheetContent>
    </Sheet>
  );
}
