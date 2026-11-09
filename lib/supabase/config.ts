/**
 * Configuração do Supabase — validação estrita, sem valores inventados.
 *
 * Regra do produto: nenhuma credencial fake, nenhum default interno.
 * Sem as variáveis abaixo, a plataforma opera em estado honesto de
 * "configuração necessária" — autenticação e persistência ficam
 * explicitamente indisponíveis.
 */

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

/** Lê e valida as variáveis públicas. Retorna null quando ausentes/inválidas. */
export function readSupabaseConfig(): SupabaseConfig | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!url || !anonKey) return null;

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    console.warn("[frameflow] NEXT_PUBLIC_SUPABASE_URL inválida — ignorando configuração.");
    return null;
  }
  if (parsed.protocol !== "https:" || !parsed.hostname.endsWith(".supabase.co")) {
    console.warn("[frameflow] NEXT_PUBLIC_SUPABASE_URL deve ser https://<projeto>.supabase.co");
    return null;
  }
  const isLegacyAnonJwt = anonKey.length >= 40 && anonKey.split(".").length === 3;
  const isModernPublishable = /^sb_publishable_[A-Za-z0-9_-]{20,}$/.test(anonKey);
  if (!isLegacyAnonJwt && !isModernPublishable) {
    console.warn("[frameflow] NEXT_PUBLIC_SUPABASE_ANON_KEY deve ser uma chave pública Supabase válida.");
    return null;
  }

  return { url, anonKey };
}

export function isSupabaseConfigured(): boolean {
  return readSupabaseConfig() !== null;
}

/** Nomes das variáveis exigidas — usados na tela de configuração. */
export const VARIAVEIS_EXIGIDAS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
] as const;
