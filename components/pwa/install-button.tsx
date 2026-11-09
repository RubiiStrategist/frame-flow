"use client";

/**
 * Botão de instalação PWA — aparece apenas quando o navegador sinaliza o
 * evento beforeinstallprompt (Chrome/Edge/Android). iOS usa "Adicionar à
 * Tela de Início" nativo (instrução exibida nas Configurações).
 */

import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallButton() {
  const [evento, setEvento] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setEvento(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!evento) return null;

  return (
    <Button
      variant="outline"
      size="sm"
      className="ff-meta h-9 gap-2 rounded-lg border-border"
      onClick={async () => {
        await evento.prompt();
        setEvento(null);
      }}
    >
      <Download className="h-4 w-4" aria-hidden />
      <span className="hidden sm:inline">Instalar app</span>
    </Button>
  );
}
