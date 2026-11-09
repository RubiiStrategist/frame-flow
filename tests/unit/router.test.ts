import { beforeEach, describe, expect, it } from "vitest";
import { moduleUrl, navigate, parseHash } from "@/lib/frameflow/router";

describe("navegação entre ambientes — roteador por hash", () => {
  beforeEach(() => {
    window.location.hash = "";
  });

  it("sem hash, abre o ambiente padrão no módulo inicial", () => {
    const rota = parseHash();
    expect(rota.env).toBe("executivo");
    expect(rota.moduleId).toBe("inicio");
  });

  it("deep-link válido resolve ambiente e módulo", () => {
    window.location.hash = "#/comercial/leads";
    expect(parseHash()).toEqual({ env: "comercial", moduleId: "leads" });

    window.location.hash = "#/operacional/tarefas";
    expect(parseHash()).toEqual({ env: "operacional", moduleId: "tarefas" });
  });

  it("módulo inexistente cai no módulo inicial do ambiente (sem quebrar)", () => {
    window.location.hash = "#/comercial/modulo-fantasma";
    const rota = parseHash();
    expect(rota.env).toBe("comercial");
    expect(rota.moduleId).toBe("inicio");
  });

  it("ambiente inexistente cai no ambiente padrão", () => {
    window.location.hash = "#/qualquer-coisa/leads";
    const rota = parseHash();
    expect(rota.env).toBe("executivo");
  });

  it("navigate troca o hash sem recarregar a página (client-side)", () => {
    navigate("operacional", "agenda");
    expect(window.location.hash).toBe("#/operacional/agenda");
    // hashchange é disparado e parseHash reflete o novo estado
    expect(parseHash().moduleId).toBe("agenda");
  });

  it("moduleUrl gera deep-link absoluto para os alertas da Cap", () => {
    const url = moduleUrl("comercial", "leads");
    expect(url).toBe(`${window.location.origin}/#/comercial/leads`);
  });

  it("navegar para o mesmo destino não reescreve o hash (idempotente)", () => {
    window.location.hash = "#/executivo/inicio";
    navigate("executivo", "inicio");
    expect(window.location.hash).toBe("#/executivo/inicio");
  });
});
