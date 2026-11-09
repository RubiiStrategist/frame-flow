import { describe, expect, it } from "vitest";
import {
  ENVIRONMENTS,
  PHASE_LABEL,
  getEnvironment,
  getModule,
  modulesByCategory,
} from "@/lib/frameflow/environments";

describe("registro canônico de ambientes e módulos", () => {
  it("existem exatamente os três ambientes administrativos da FRAME VISION", () => {
    expect(ENVIRONMENTS.map((e) => e.id)).toEqual(["executivo", "comercial", "operacional"]);
  });

  it("cada ambiente declara o sócio e o cargo corretos", () => {
    expect(getEnvironment("executivo").partner).toBe("Rubian");
    expect(getEnvironment("executivo").role).toBe("CEO");
    expect(getEnvironment("comercial").partner).toBe("William");
    expect(getEnvironment("comercial").role).toBe("CRO");
    expect(getEnvironment("operacional").partner).toBe("Letícia");
    expect(getEnvironment("operacional").role).toBe("COO + CFO");
  });

  it("cada ambiente apresenta uma Cap distinta", () => {
    expect(getEnvironment("executivo").capPresentation).toBe("executiva");
    expect(getEnvironment("comercial").capPresentation).toBe("comercial");
    expect(getEnvironment("operacional").capPresentation).toBe("operacional");
  });

  it("navegação inferior mobile: 5 atalhos por ambiente, o último é sempre a Cap", () => {
    for (const env of ENVIRONMENTS) {
      expect(env.shortcuts).toHaveLength(5);
      expect(env.shortcuts[4]).toBe("cap");
      // todo atalho aponta para um módulo registrado do ambiente
      for (const id of env.shortcuts) {
        const mod = getModule(env.id, id);
        expect(mod, `${env.id}/${id}`).toBeDefined();
      }
    }
  });

  it("atalhos seguem a especificação do produto por ambiente", () => {
    expect(getEnvironment("executivo").shortcuts).toEqual([
      "inicio", "indicadores", "financeiro", "decisoes", "cap",
    ]);
    expect(getEnvironment("comercial").shortcuts).toEqual([
      "inicio", "funil", "leads", "equipe", "cap",
    ]);
    expect(getEnvironment("operacional").shortcuts).toEqual([
      "inicio", "projetos", "agenda", "financeiro", "cap",
    ]);
  });

  it("os módulos liberados não são apresentados como funcionalidades futuras", () => {
    for (const env of ENVIRONMENTS) for (const mod of env.modules) expect(mod.phase).toBe("mvp");
  });

  it("os três ambientes compartilham os mesmos dados — módulos comuns existem em todos", () => {
    // equivalência preservada na troca de ambiente (topbar)
    expect(getModule("executivo", "financeiro")?.phase).toBe("mvp");
    expect(getModule("operacional", "financeiro")?.phase).toBe("mvp");
    for (const env of ENVIRONMENTS) {
      expect(getModule(env.id, "cap")?.phase).toBe("mvp");
    }
  });

  it("ids de módulo são únicos dentro de cada ambiente", () => {
    for (const env of ENVIRONMENTS) {
      const ids = env.modules.map((m) => m.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it("módulos MVP esperados existem com fase mvp", () => {
    const mvpEsperado: Record<string, string[]> = {
      executivo: ["inicio", "indicadores", "financeiro", "decisoes", "cap", "configuracoes"],
      comercial: ["inicio", "leads", "funil", "clientes", "cap"],
      operacional: ["inicio", "projetos", "tarefas", "agenda", "financeiro", "cap"],
    };
    for (const [envId, ids] of Object.entries(mvpEsperado)) {
      for (const id of ids) {
        expect(getModule(envId as never, id)?.phase, `${envId}/${id}`).toBe("mvp");
      }
    }
  });

  it("getModule de módulo ausente retorna undefined (views tratam como futura)", () => {
    expect(getModule("executivo", "nao-existe")).toBeUndefined();
  });

  it("getEnvironment com id inválido lança erro explícito", () => {
    expect(() => getEnvironment("portal")).toThrow();
  });

  it("fases possuem rótulo para os placeholders honestos", () => {
    expect(Object.keys(PHASE_LABEL).sort()).toEqual(["fase-2", "fase-3", "mvp"]);
  });

  it("sidebar agrupa módulos por categoria preservando a ordem de registro", () => {
    const grupos = modulesByCategory(getEnvironment("operacional"));
    expect(grupos.length).toBeGreaterThan(1);
    const total = grupos.reduce((s, g) => s + g.modules.length, 0);
    expect(total).toBe(getEnvironment("operacional").modules.length);
  });
});
