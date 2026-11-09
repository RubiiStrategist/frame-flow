import { afterEach, describe, expect, it, vi } from "vitest";
import {
  VARIAVEIS_EXIGIDAS,
  isSupabaseConfigured,
  readSupabaseConfig,
} from "@/lib/supabase/config";

afterEach(() => {
  vi.unstubAllEnvs();
});

const URL_VALIDA = "https://frame-flow-teste.supabase.co";
// JWT-like: 3 partes separadas por ponto, total >= 40 caracteres.
const CHAVE_VALIDA = "aaaaaaaabbbbbbbbcccccccc.dddddddddeeeeeeeefffffffff.ggggggggghhhhhhhhiiiiiiii";

describe("gate de autorização — validação estrita da configuração Supabase", () => {
  it("sem variáveis, retorna null (modo honesto: nada inventado)", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "");
    expect(readSupabaseConfig()).toBeNull();
    expect(isSupabaseConfigured()).toBe(false);
  });

  it("URL ausente mesmo com chave → null", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", CHAVE_VALIDA);
    expect(readSupabaseConfig()).toBeNull();
  });

  it("URL malformada → null (nunca um default interno)", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "isto não é uma url");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", CHAVE_VALIDA);
    expect(readSupabaseConfig()).toBeNull();
  });

  it("protocolo http é rejeitado — apenas https", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "http://frame-flow-teste.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", CHAVE_VALIDA);
    expect(readSupabaseConfig()).toBeNull();
  });

  it("host fora de *.supabase.co é rejeitado (impede ponteirar para servidor arbitrário)", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://evil.example.com");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", CHAVE_VALIDA);
    expect(readSupabaseConfig()).toBeNull();
  });

  it("chave curta é rejeitada", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", URL_VALIDA);
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "curta");
    expect(readSupabaseConfig()).toBeNull();
  });

  it("chave sem estrutura JWT (3 partes) é rejeitada", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", URL_VALIDA);
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "x".repeat(60)); // sem pontos
    expect(readSupabaseConfig()).toBeNull();
  });

  it("aceita chave publishable moderna do Supabase", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", URL_VALIDA);
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "sb_publishable_abcdefghijklmnopqrstuvwxyz123456");
    expect(isSupabaseConfigured()).toBe(true);
  });

  it("configuração válida retorna url e anon key exatas", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", URL_VALIDA);
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", CHAVE_VALIDA);
    expect(readSupabaseConfig()).toEqual({ url: URL_VALIDA, anonKey: CHAVE_VALIDA });
    expect(isSupabaseConfigured()).toBe(true);
  });

  it("declara publicamente as duas (e apenas as duas) variáveis exigidas", () => {
    expect(VARIAVEIS_EXIGIDAS).toContain("NEXT_PUBLIC_SUPABASE_URL");
    expect(VARIAVEIS_EXIGIDAS).toContain("NEXT_PUBLIC_SUPABASE_ANON_KEY");
    expect(VARIAVEIS_EXIGIDAS).toHaveLength(2);
  });
});
