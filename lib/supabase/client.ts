"use client";

/**
 * Cliente Supabase do navegador — singleton criado apenas com configuração válida.
 *
 * - Apenas a chave ANON é usada no frontend (RLS protege os dados).
 * - A chave service_role NUNCA deve entrar no bundle (regra de segurança do produto).
 * - Sessão gerenciada pelo supabase-js (PKCE + refresh automático).
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { readSupabaseConfig } from "./config";

let cached: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (cached) return cached;
  const config = readSupabaseConfig();
  if (!config) return null;

  cached = createClient(config.url, config.anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: "pkce",
      storageKey: "frameflow.auth",
    },
  });
  return cached;
}
