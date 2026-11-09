"use client";

import { useSyncExternalStore } from "react";
import { Layers3, LayoutDashboard } from "lucide-react";

export type ExperienceMode = "comando" | "imersivo";
const STORAGE_KEY = "frameflow:executivo:experience-mode";
const EVENT = "frameflow:experience";
function subscribe(callback: () => void) {
  window.addEventListener(EVENT, callback);
  window.addEventListener("storage", callback);
  return () => { window.removeEventListener(EVENT, callback); window.removeEventListener("storage", callback); };
}
function snapshot(): ExperienceMode {
  try { return window.sessionStorage.getItem(STORAGE_KEY) === "imersivo" ? "imersivo" : "comando"; }
  catch { return "comando"; }
}

/** Presentation preference only. Never changes business data or authorization. */
export function useExperienceMode() {
  const mode = useSyncExternalStore(subscribe, snapshot, () => "comando" as ExperienceMode);
  const changeMode = (next: ExperienceMode) => {
    try { window.sessionStorage.setItem(STORAGE_KEY, next); } catch { /* Optional preference. */ }
    window.dispatchEvent(new Event(EVENT));
  };
  return { mode, changeMode };
}

export function ExperienceModeSwitch({ mode, onChange }: {
  mode: ExperienceMode;
  onChange: (mode: ExperienceMode) => void;
}) {
  return (
    <div className="inline-flex min-h-11 items-center gap-1 rounded-lg border border-white/15 bg-[#151515] p-1" role="group" aria-label="Modo de visualização">
      <button type="button" onClick={() => onChange("comando")} aria-pressed={mode === "comando"}
        className={`inline-flex min-h-10 items-center gap-2 rounded-md px-3 text-xs font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${mode === "comando" ? "bg-[#f4f0e7] text-[#0a0a0a]" : "text-[#d1cdc6] hover:bg-white/10"}`}>
        <LayoutDashboard size={15} aria-hidden /> Comando
      </button>
      <button type="button" onClick={() => onChange("imersivo")} aria-pressed={mode === "imersivo"}
        className={`inline-flex min-h-10 items-center gap-2 rounded-md px-3 text-xs font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${mode === "imersivo" ? "bg-[#f4f0e7] text-[#0a0a0a]" : "text-[#d1cdc6] hover:bg-white/10"}`}>
        <Layers3 size={15} aria-hidden /> Imersivo
      </button>
    </div>
  );
}
