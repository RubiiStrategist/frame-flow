import { describe, expect, it } from "vitest";
import type { Session } from "@supabase/supabase-js";
import { derivarAuthStatus } from "@/lib/frameflow/auth";

describe("regras de autorização — derivação do status de sessão", () => {
  it("pré-visualização rotulada tem precedência sobre todos os demais estados", () => {
    expect(
      derivarAuthStatus({ isPreview: true, configured: false, verificandoSessao: false, session: null })
    ).toBe("preview");
    expect(
      derivarAuthStatus({ isPreview: true, configured: true, verificandoSessao: true, session: {} as Session })
    ).toBe("preview");
  });

  it("sem configuração Supabase, nunca há sessão real — apenas visitante", () => {
    expect(
      derivarAuthStatus({ isPreview: false, configured: false, verificandoSessao: false, session: null })
    ).toBe("visitante");
    // mesmo se existisse uma sessão residual, sem configuração o cliente não existe:
    // o AuthProvider desativa isPreview quando configured=true e nunca
    // consulta getSession sem cliente — aqui documentamos a regra do gate.
    expect(
      derivarAuthStatus({ isPreview: false, configured: false, verificandoSessao: true, session: null })
    ).toBe("visitante");
  });

  it("configurado: verificando sessão vem antes do veredito", () => {
    expect(
      derivarAuthStatus({ isPreview: false, configured: true, verificandoSessao: true, session: null })
    ).toBe("verificando");
  });

  it("configurado com sessão real → autenticado", () => {
    expect(
      derivarAuthStatus({ isPreview: false, configured: true, verificandoSessao: false, session: {} as Session })
    ).toBe("autenticado");
  });

  it("configurado sem sessão → visitante (tela de login)", () => {
    expect(
      derivarAuthStatus({ isPreview: false, configured: true, verificandoSessao: false, session: null })
    ).toBe("visitante");
  });
});
