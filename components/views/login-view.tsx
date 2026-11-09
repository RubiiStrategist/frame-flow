"use client";

/**
 * Tela de entrada — autenticação REAL via Supabase.
 *
 * Sem configuração: o formulário não finge autenticar. A tela apresenta o
 * estado "configuração necessária" com instruções exatas e oferece a
 * pré-visualização de layout, rotulada.
 */

import { Cap } from "@/components/cap/cap";
import { useState } from "react";
import { ArrowRight, Eye, Lock, Mail, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FrameMark } from "@/components/common/frame-primitives";
import { useAuth } from "@/lib/frameflow/auth";
import { VARIAVEIS_EXIGIDAS } from "@/lib/supabase/config";
import { cn } from "@/lib/utils";

export function LoginView() {
  const { configured, signIn, enterPreview } = useAuth();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  async function submeter(e: React.FormEvent) {
    e.preventDefault();
    if (!configured) return; // sem configuração, não há login real — nunca simulado
    setErro(null);
    setCarregando(true);
    const r = await signIn(email, senha);
    setCarregando(false);
    if (!r.ok) setErro(r.erro ?? "Não foi possível entrar.");
  }

  return (
    <div className="ff-login relative flex min-h-screen flex-col bg-background lg:flex-row">
      {/* Painel de marca */}
      <section className="ff-login-brand relative hidden flex-1 flex-col justify-between overflow-hidden border-r border-border p-10 lg:flex xl:p-14">
        <FrameMark active size={16} stroke={1.6} className="opacity-90" />
        <div>
          <p className="ff-eyebrow text-muted-foreground">Frame Vision</p>
          <h1 className="ff-display mt-4 text-5xl xl:text-6xl">
            Frame
            <br />
            Flow<span className="text-[var(--frame-red)]">.</span>
          </h1>
          <div className="mt-8 h-[3px] w-[42px] bg-[var(--frame-red)]" aria-hidden />
          <p className="mt-6 max-w-md text-sm leading-relaxed text-muted-foreground">
            O sistema operacional digital da FRAME VISION — clientes, vendas,
            produção, projetos, finanças e decisões em um único ecossistema
            premium e cinematográfico.
          </p>
        </div>
        <Cap presentation="executiva" size={290} className="ff-login-cap" />
        <p className="ff-meta text-[9px] text-muted-foreground">
          Todo frame começa com um olhar
        </p>
      </section>

      {/* Formulário */}
      <section className="flex flex-1 items-center justify-center px-5 py-12 lg:max-w-[520px]">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" aria-hidden className="mb-4">
              <path d="M3 8 V3 H8" stroke="#f4f0e7" strokeWidth="2" />
              <path d="M16 3 H21 V8" stroke="#e10606" strokeWidth="2" />
              <path d="M3 16 v5 h5" stroke="#f4f0e7" strokeWidth="2" />
              <path d="M21 16 v5 h-5" stroke="#f4f0e7" strokeWidth="2" />
              <path d="M10 8.5 L16 12 L10 15.5 Z" fill="#e10606" />
            </svg>
            <h1 className="ff-display text-3xl">
              Frame Flow<span className="text-[var(--frame-red)]">.</span>
            </h1>
          </div>

          <h2 className="ff-display text-xl">Entrar</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {configured
              ? "Seu workspace está pronto. Entre para continuar."
              : "Autenticação real via Supabase — aguardando configuração."}
          </p>

          <form onSubmit={submeter} className="mt-8 space-y-5" noValidate>
            <div className="space-y-2">
              <Label htmlFor="email" className="ff-meta text-muted-foreground">
                E-mail
              </Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nome@framevision.com.br"
                  disabled={!configured}
                  className="h-11 rounded-lg border-border bg-secondary pl-9"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="senha" className="ff-meta text-muted-foreground">
                Senha
              </Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                <Input
                  id="senha"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="••••••••"
                  disabled={!configured}
                  className="h-11 rounded-lg border-border bg-secondary pl-9"
                />
              </div>
            </div>

            {erro && (
              <p role="alert" className="flex items-center gap-2 border border-[var(--frame-red)]/40 bg-[var(--frame-red)]/[0.06] p-3 text-xs text-[#ffb3b3]">
                <TriangleAlert className="h-3.5 w-3.5 shrink-0" aria-hidden /> {erro}
              </p>
            )}

            {configured ? (
              <Button
                type="submit"
                disabled={carregando}
                className="ff-meta h-11 w-full rounded-lg bg-[var(--frame-red)] text-white hover:bg-[#ff1a1a]"
              >
                {carregando ? "Entrando…" : "Entrar"}
                {!carregando && <ArrowRight className="h-4 w-4" aria-hidden />}
              </Button>
            ) : (
              <p className="flex items-center gap-2 border border-border bg-secondary p-3 text-xs leading-relaxed text-muted-foreground">
                <Eye className="h-3.5 w-3.5 shrink-0" aria-hidden />
                O login ativa assim que o Supabase for conectado — nenhum acesso
                fictício é criado antes disso.
              </p>
            )}
          </form>

          {!configured && (
            <>
              <div className="my-7 flex items-center gap-3" aria-hidden>
                <span className="h-px flex-1 bg-border" />
                <span className="ff-meta text-[9px] text-muted-foreground">enquanto isso</span>
                <span className="h-px flex-1 bg-border" />
              </div>

              <Button
                onClick={() => enterPreview()}
                variant="outline"
                className={cn(
                  "ff-meta h-11 w-full rounded-lg border-border",
                  "hover:border-[var(--frame-red)]/60 hover:text-foreground"
                )}
              >
                Pré-visualizar layout dos ambientes
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Button>
              <p className="mt-2 text-center text-[11px] leading-relaxed text-muted-foreground">
                Exploração rotulada de navegação e responsividade — sem
                autenticação, sem persistência, sem dados fictícios.
              </p>

              <div className="mt-8 ff-surface border border-border bg-card p-4">
                <p className="ff-eyebrow mb-2 text-muted-foreground">Configuração necessária</p>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Crie um projeto no{" "}
                  <a
                    href="https://supabase.com/dashboard"
                    target="_blank"
                    rel="noreferrer"
                    className="text-foreground underline underline-offset-4"
                  >
                    Supabase
                  </a>
                  , execute as migrations da pasta{" "}
                  <code className="rounded-lg bg-secondary px-1">supabase/migrations</code> e
                  defina as variáveis:
                </p>
                <ul className="mt-2 space-y-1">
                  {VARIAVEIS_EXIGIDAS.map((v) => (
                    <li key={v} className="ff-numeric text-[11px] text-foreground">
                      {v}
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-[11px] text-muted-foreground">
                  Passo a passo completo em <code className="rounded-lg bg-secondary px-1">docs/SETUP-SUPABASE.md</code>.
                </p>
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
