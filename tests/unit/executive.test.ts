import { describe, expect, it } from "vitest";
import { contractDocument, contractRenewalState, executivePipeline, keyResultProgress, objectiveProgress, operationalCapacity, safeDocumentUrl, validateKeyResult } from "@/lib/frameflow/executive";
import { mapLead, mapProject, mapTask } from "@/lib/frameflow/data";

describe("strategic progress", () => {
  it("measures growth and reduction goals from the actual baseline", () => {
    expect(keyResultProgress({ baseline: 10, target: 30, current: 20 })).toBe(50);
    expect(keyResultProgress({ baseline: 20, target: 10, current: 15 })).toBe(50);
    expect(keyResultProgress({ baseline: -10, target: 10, current: 0 })).toBe(50);
  });
  it("clamps overachievement and regression without fabricating missing measurements", () => {
    expect(keyResultProgress({ baseline: 10, target: 30, current: 40 })).toBe(100);
    expect(keyResultProgress({ baseline: 10, target: 30, current: 0 })).toBe(0);
    expect(keyResultProgress({ baseline: 0, target: 10, current: null })).toBeNull();
    expect(keyResultProgress({ baseline: 0, target: 0, current: 0 })).toBeNull();
  });
  it("uses weights and ignores archived, cancelled and unrelated results", () => {
    const a = { id: "a", kind: "key_result", parentId: "o", status: "em_andamento", archivedAt: null, details: { baseline: 0, target: 100, current: 100, weight: 1 } };
    const b = { ...a, id: "b", details: { baseline: 0, target: 100, current: 0, weight: 3 } };
    expect(objectiveProgress("o", [a, b, { ...a, parentId: "other" }, { ...a, archivedAt: "2026-01-01" }, { ...a, status: "cancelado" }])).toBe(25);
    expect(objectiveProgress("other", [])).toBeNull();
  });
  it("does not declare a measured objective when a child result has missing data", () => {
    expect(objectiveProgress("o", [{ id: "k", kind: "key_result", parentId: "o", status: "planejado", archivedAt: null, details: {} }])).toBeNull();
  });
  it("rejects zero-range targets, missing measurements and invalid weights", () => {
    expect(() => validateKeyResult({ baseline: 0, target: 0, current: 0 })).toThrow("diferente");
    expect(() => validateKeyResult({ baseline: 0, target: 100, current: "" })).toThrow("medição");
    expect(() => validateKeyResult({ baseline: 0, target: 100, current: 0, weight: 0 })).toThrow("peso");
    expect(() => validateKeyResult({ baseline: 10, target: 0, current: 5, weight: 2 })).not.toThrow();
  });
});

describe("executive reporting", () => {
  it("calculates conversion only on closed deals and open value separately", () => {
    const leads = [mapLead({ etapa: "ganho", valor_estimado: 10000 }), mapLead({ etapa: "perdido", valor_estimado: 30000 }), mapLead({ etapa: "proposta", valor_estimado: 20000 })];
    expect(executivePipeline(leads)).toMatchObject({ conversion: 50, terminalCount: 2, openValue: 200, wonValue: 100 });
    expect(executivePipeline([leads[2]]).conversion).toBeNull();
  });
  it("does not count paused or delivered projects as active and respects the São Paulo day", () => {
    const projects = [mapProject({ id: "p", status: "producao", data_entrega_prevista: "2026-11-03" }), mapProject({ id: "paused", status: "pausado", data_entrega_prevista: "2026-10-01" }), mapProject({ id: "done", status: "entregue", data_entrega_prevista: "2026-10-01" })];
    const tasks = [mapTask({ status: "bloqueada", prazo: "2026-11-03" }), mapTask({ status: "concluida", prazo: "2026-10-01" })];
    const midnight = operationalCapacity(projects, tasks, new Date("2026-11-04T01:00:00Z"));
    expect(midnight.active).toHaveLength(1);
    expect(midnight.late).toHaveLength(0);
    expect(midnight.pending).toHaveLength(1);
    expect(midnight.blocked).toHaveLength(1);
    const daytime = operationalCapacity(projects, tasks, new Date("2026-11-04T12:00:00Z"));
    expect(daytime.late).toHaveLength(1);
    expect(daytime.overdueTasks).toHaveLength(1);
  });
});

describe("contract registers", () => {
  const now = new Date("2026-11-04T12:00:00Z");
  it("distinguishes expiry from renewal windows and terminated agreements", () => {
    expect(contractRenewalState("2026-11-03", "assinado", now)).toBe("vencido");
    expect(contractRenewalState("2026-11-04", "assinado", now)).toBe("renovar");
    expect(contractRenewalState("2026-12-04", "assinado", now)).toBe("renovar");
    expect(contractRenewalState("2026-12-05", "assinado", now)).toBe("vigente");
    expect(contractRenewalState("2026-11-03", "encerrado", now)).toBe("encerrado");
    expect(contractRenewalState(null, "rascunho", now)).toBe("sem_prazo");
  });
  it("escapes document content so exports cannot execute supplied HTML", () => {
    const html = contractDocument({ title: "<script>alert(1)</script>", version: 2, status: "rascunho", startDate: null, dueDate: null, amount: 0, details: { body: '<img src=x onerror="alert(1)">', terms: "A & B" } }, "<cliente>");
    expect(html).not.toContain("<script>");
    expect(html).not.toContain("<img");
    expect(html).toContain("&lt;cliente&gt;");
    expect(html).toContain("A &amp; B");
    expect(html).toContain("não comprova assinatura eletrônica");
  });
  it("opens only ordinary web document URLs", () => {
    expect(safeDocumentUrl("javascript:alert(1)")).toBeNull();
    expect(safeDocumentUrl("data:text/html,<script>alert(1)</script>")).toBeNull();
    expect(safeDocumentUrl("https://example.com/contract.pdf")).toBe("https://example.com/contract.pdf");
  });
});
