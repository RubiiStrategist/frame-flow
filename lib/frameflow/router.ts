"use client";

/**
 * Roteador SPA por hash da FRAME FLOW.
 *
 * Por quê hash: o shell é servido na rota única `/` (ambiente de
 * pré-visualização e PWA standalone) e a troca de ambientes/módulos não pode
 * recarregar a página. A API pública (navigate/useRoute) é uma abstração —
 * na publicação em Vercel, a implementação pode ser trocada por rotas do App
 * Router sem alterar as views.
 */

import { useCallback, useEffect, useState } from "react";
import { ENVIRONMENTS, getEnvironment } from "./environments";
import type { EnvironmentId } from "./types";

const VALID_ENVS = new Set(ENVIRONMENTS.map((e) => e.id as string));

export interface RouteState {
  env: EnvironmentId;
  moduleId: string;
}

export function parseHash(): RouteState {
  if (typeof window === "undefined") return { env: "executivo", moduleId: "inicio" };
  const raw = window.location.hash.replace(/^#\/?/, "");
  const [envRaw, modRaw] = raw.split("/");
  const env = VALID_ENVS.has(envRaw) ? (envRaw as EnvironmentId) : "executivo";
  const envDef = getEnvironment(env);
  const moduleId = envDef.modules.some((m) => m.id === modRaw)
    ? modRaw
    : envDef.startModule;
  return { env, moduleId };
}

export function navigate(env: EnvironmentId, moduleId: string) {
  const target = `#/${env}/${moduleId}`;
  if (window.location.hash !== target) {
    window.location.hash = target; // não recarrega — navegação client-side
  }
}

export function useRoute(): RouteState & { navigate: typeof navigate } {
  const [route, setRoute] = useState<RouteState>(() => parseHash());

  useEffect(() => {
    const onChange = () => setRoute(parseHash());
    window.addEventListener("hashchange", onChange);
    // Normaliza o hash no primeiro acesso para deep-links funcionarem.
    const parsed = parseHash();
    if (window.location.hash !== `#/${parsed.env}/${parsed.moduleId}`) {
      window.history.replaceState(null, "", `#/${parsed.env}/${parsed.moduleId}`);
    }
    return () => window.removeEventListener("hashchange", onChange);
  }, []);

  const nav = useCallback((env: EnvironmentId, moduleId: string) => {
    navigate(env, moduleId);
  }, []);

  return { ...route, navigate: nav };
}

/** Deep-link: devolve URL absoluta para um módulo (usado nos alertas da Cap). */
export function moduleUrl(env: EnvironmentId, moduleId: string): string {
  return `${typeof window !== "undefined" ? window.location.origin : ""}/#/${env}/${moduleId}`;
}
