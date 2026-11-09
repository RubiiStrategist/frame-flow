import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { LoginView } from "@/components/views/login-view";

/**
 * Teste de componente do formulário de entrada.
 * O AuthProvider é simulado (mock) nas duas condições do produto:
 *  - SEM configuração Supabase: campos desabilitados, estado "configuração
 *    necessária" explícito e entrada ONLY na pré-visualização rotulada.
 *  - COM configuração: submissão dispara o login real via signIn.
 */

const h = vi.hoisted(() => ({
  configured: false,
  signIn: vi.fn(),
  enterPreview: vi.fn(),
}));

vi.mock("@/lib/frameflow/auth", () => ({
  useAuth: () => ({
    status: "visitante",
    configured: h.configured,
    session: null,
    profile: null,
    isPreview: false,
    signIn: h.signIn,
    signOut: vi.fn(),
    enterPreview: h.enterPreview,
    exitPreview: vi.fn(),
  }),
  AuthProvider: (props: { children: React.ReactNode }) => props.children,
}));

beforeEach(() => {
  h.configured = false;
  h.signIn.mockReset();
  h.enterPreview.mockReset();
  h.signIn.mockResolvedValue({ ok: true });
});

describe("Login — sem configuração Supabase (estado honesto)", () => {
  it("desabilita e-mail e senha: nenhum login fictício é possível", () => {
    render(<LoginView />);
    expect((screen.getByLabelText("E-mail") as HTMLInputElement).disabled).toBe(true);
    expect((screen.getByLabelText("Senha") as HTMLInputElement).disabled).toBe(true);
  });

  it("não existe botão 'Entrar' — apenas o estado de configuração necessária", () => {
    render(<LoginView />);
    expect(screen.queryByRole("button", { name: /entrar/i })).toBeNull();
    expect(screen.getByText(/aguardando configuração/i)).toBeTruthy();
  });

  it("declara as duas variáveis exigidas na tela de configuração", () => {
    render(<LoginView />);
    expect(screen.getByText("NEXT_PUBLIC_SUPABASE_URL")).toBeTruthy();
    expect(screen.getByText("NEXT_PUBLIC_SUPABASE_ANON_KEY")).toBeTruthy();
  });

  it("oferece exclusivamente a pré-visualização de layout, rotulada", () => {
    render(<LoginView />);
    const botaoPreview = screen.getByRole("button", { name: /pré-visualizar layout dos ambientes/i });
    fireEvent.click(botaoPreview);
    expect(h.enterPreview).toHaveBeenCalledTimes(1);
    // e o aviso é explícito: sem autenticação, sem persistência, sem dados fictícios
    expect(screen.getByText(/sem\s+autenticação, sem\s+persistência, sem\s+dados fictícios/i)).toBeTruthy();
  });

  it("nunca chama signIn sem configuração", () => {
    render(<LoginView />);
    expect(h.signIn).not.toHaveBeenCalled();
  });
});

describe("Login — com configuração Supabase (caminho real)", () => {
  it("habilita os campos e submete e-mail e senha ao signIn", async () => {
    h.configured = true;
    render(<LoginView />);
    fireEvent.change(screen.getByLabelText("E-mail"), { target: { value: "rubian@framevision.com.br" } });
    fireEvent.change(screen.getByLabelText("Senha"), { target: { value: "senha-forte" } });
    fireEvent.click(screen.getByRole("button", { name: /entrar/i }));

    expect(h.signIn).toHaveBeenCalledTimes(1);
    expect(h.signIn).toHaveBeenCalledWith("rubian@framevision.com.br", "senha-forte");
  });

  it("sem pré-visualização disponível quando configurado (login real only)", () => {
    h.configured = true;
    render(<LoginView />);
    expect(screen.queryByRole("button", { name: /pré-visualizar/i })).toBeNull();
  });
});
