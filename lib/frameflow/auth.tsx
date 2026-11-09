"use client";

/**
 * Autenticação da FRAME FLOW.
 *
 * Regras do produto:
 *  - Nunca criar autenticação fictícia, nunca salvar senhas em texto puro.
 *  - Login real = Supabase Auth (e-mail + senha, sessão PKCE) — disponível
 *    apenas quando as variáveis de ambiente públicas existirem.
 *  - Modo Pré-visualização de Layout: entrada EXPLÍCITA e rotulada para
 *    validar navegação, responsividade e estrutura dos ambientes SEM
 *    autenticação e SEM persistência. Não cria sessão, não simula sócio,
 *    não fabrica dados — a plataforma marca esse estado em todas as telas.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { getSupabase } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { useStorageFlag } from "./storage";
import type { EnvironmentId, UserProfile } from "./types";

const PREVIEW_KEY = "frameflow.preview";

export type AuthStatus =
  | "verificando" // checando sessão existente
  | "autenticado" // sessão Supabase real
  | "visitante" // sem sessão → tela de login
  | "preview"; // pré-visualização de layout (rotulada)

export interface AuthContextValue {
  status: AuthStatus;
  configured: boolean;
  session: Session | null;
  profile: UserProfile | null;
  /** Modo pré-visualização de layout — não é autenticação. */
  isPreview: boolean;
  signIn(email: string, senha: string): Promise<{ ok: boolean; erro?: string }>;
  signOut(): Promise<void>;
  enterPreview(): void;
  exitPreview(): void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/** Mapeia auth.users + profiles para o perfil de aplicação. */
async function carregarPerfil(user: User): Promise<UserProfile> {
  const supabase = getSupabase();
  if (supabase) {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();
    if (data) {
      return {
        id: String(data.id),
        email: String(data.email ?? user.email ?? ""),
        fullName: String(data.full_name ?? ""),
        role: (data.role as UserProfile["role"]) ?? "colaborador",
        phone: (data.phone as string) ?? null,
        avatarUrl: (data.avatar_url as string) ?? null,
        defaultEnvironment:
          (data.default_environment as EnvironmentId) ?? "executivo",
        createdAt: String(data.created_at ?? user.created_at ?? ""),
      };
    }
  }
  // Perfil mínimo a partir do token — não inventa cargo.
  return {
    id: user.id,
    email: user.email ?? "",
    fullName: user.email?.split("@")[0] ?? "",
    role: "colaborador",
    phone: null,
    avatarUrl: null,
    defaultEnvironment: "executivo",
    createdAt: user.created_at ?? new Date().toISOString(),
  };
}

/**
 * Derivação pura do status de sessão — precedência documentada e testada
 * (tests/unit/auth-status.test.ts): pré-visualização rotulada > verificação >
 * sessão real > visitante. A pré-visualização nunca é sessão e só existe sem
 * configuração Supabase — logo, nunca alcança dados reais.
 */
export function derivarAuthStatus(args: {
  isPreview: boolean;
  configured: boolean;
  verificandoSessao: boolean;
  session: Session | null;
}): AuthStatus {
  if (args.isPreview) return "preview";
  if (!args.configured) return "visitante";
  if (args.verificandoSessao) return "verificando";
  if (args.session) return "autenticado";
  return "visitante";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const configured = useMemo(() => isSupabaseConfigured(), []);

  // Pré-visualização: flag externa (sessionStorage) — nunca uma sessão.
  const [previewBruto, escreverPreview] = useStorageFlag("session", PREVIEW_KEY);
  const isPreview = previewBruto && !configured;

  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [verificandoSessao, setVerificandoSessao] = useState(configured);

  // Sessão real (apenas quando configurado) — callbacks assíncronos do supabase-js.
  useEffect(() => {
    if (!configured) return;
    const supabase = getSupabase();
    if (!supabase) return;

    let ativo = true;
    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!ativo) return;
        setSession(data.session);
        setVerificandoSessao(false);
      })
      .catch(() => {
        if (ativo) setVerificandoSessao(false);
      });

    // Never await another Supabase request inside this callback: it can hold
    // the auth lock and block every data query. Profile loading runs below.
    const { data: sub } = supabase.auth.onAuthStateChange((_event, novaSessao) => {
      if (!ativo) return;
      setSession(novaSessao);
      if (!novaSessao) setProfile(null);
      setVerificandoSessao(false);
    });

    return () => {
      ativo = false;
      sub.subscription.unsubscribe();
    };
  }, [configured]);

  useEffect(() => {
    if (!session?.user) return;
    let active = true;
    carregarPerfil(session.user).then((next) => {
      if (active) setProfile(next);
    }).catch(() => { /* Session stays valid; database permissions stay intact. */ });
    return () => { active = false; };
  }, [session?.user]);

  const signIn = useCallback(async (email: string, senha: string) => {
    const supabase = getSupabase();
    if (!supabase) {
      return {
        ok: false,
        erro: "Conexão Supabase não configurada. Consulte Configuração necessária.",
      };
    }
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: senha });
    if (error) return { ok: false, erro: traduzirErroAuth(error.message) };
    if (data.session) {
      setSession(data.session);
    }
    return { ok: true };
  }, []);

  const signOut = useCallback(async () => {
    const supabase = getSupabase();
    if (supabase) await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
    escreverPreview(false);
  }, [escreverPreview]);

  const enterPreview = useCallback(() => {
    escreverPreview(true);
  }, [escreverPreview]);

  const exitPreview = useCallback(() => {
    escreverPreview(false);
  }, [escreverPreview]);

  const status = useMemo<AuthStatus>(
    () => derivarAuthStatus({ isPreview, configured, verificandoSessao, session }),
    [isPreview, configured, verificandoSessao, session]
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      configured,
      session,
      profile,
      isPreview,
      signIn,
      signOut,
      enterPreview,
      exitPreview,
    }),
    [status, configured, session, profile, isPreview, signIn, signOut, enterPreview, exitPreview]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de <AuthProvider>");
  return ctx;
}

function traduzirErroAuth(mensagem: string): string {
  const mapa: Record<string, string> = {
    "Invalid login credentials": "E-mail ou senha incorretos.",
    "Email not confirmed": "E-mail não confirmado. Verifique a caixa de entrada.",
    "Too many requests": "Muitas tentativas. Aguarde alguns minutos.",
  };
  for (const [chave, texto] of Object.entries(mapa)) {
    if (mensagem.includes(chave)) return texto;
  }
  return mensagem;
}
