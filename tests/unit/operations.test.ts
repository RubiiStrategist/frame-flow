import { describe, expect, it } from "vitest";
import { approvalDecisionError, calendarMonthDays, checklistProgress, contentDate, contentWorkflowError, costLineTotal, exportContentCsv, exportContentIcs, parseChecklistTemplate, projectCostSummary, readChecklist, safeWebUrl, updateChecklist, type OperationalRecord } from "@/lib/frameflow/operations";

function record(overrides: Partial<OperationalRecord> = {}): OperationalRecord {
  return { id: "cost-1", kind: "project_cost", title: "Edição", status: "previsto", amount: 100, projectId: "project-1", dueDate: "2026-11-04", details: {}, archivedAt: null, ...overrides };
}

describe("custos e margem por projeto", () => {
  it("calcula quantidades fracionadas sem perder centavos", () => {
    expect(costLineTotal(1.5, 123.45)).toBe(185.18);
    expect(costLineTotal(3, 0.1)).toBe(0.3);
    expect(costLineTotal(2, 0)).toBe(0);
  });
  it.each([[0, 100], [-1, 100], [2, -10], [NaN, 5], [2, Infinity], [Number.MAX_SAFE_INTEGER, 100]])("rejeita custo inválido (%s × %s)", (quantity, price) => {
    expect(() => costLineTotal(quantity, price)).toThrow();
  });
  it("soma realizados e previstos sem contar cancelamentos, arquivos ou outros projetos", () => {
    const rows = [record({ amount: 250, status: "realizado" }), record({ id: "2", amount: 100 }), record({ id: "3", amount: 999, status: "cancelado" }), record({ id: "4", amount: 500, archivedAt: "2026-11-01" }), record({ id: "5", amount: 800, projectId: "other" })];
    expect(projectCostSummary("project-1", 1000, rows)).toEqual({ lineCount: 2, actual: 250, remaining: 100, forecast: 350, margin: 650, marginPercent: 65 });
  });
  it("mostra margem negativa e não inventa porcentagem quando o orçamento é zero", () => {
    expect(projectCostSummary("project-1", 50, [record()]).margin).toBe(-50);
    expect(projectCostSummary("project-1", 0, [record()]).marginPercent).toBeNull();
  });
  it("a conclusão de um custo move a previsão para o realizado, sem duplicá-lo", () => {
    const planned = projectCostSummary("project-1", 500, [record()]);
    const done = projectCostSummary("project-1", 500, [record({ status: "realizado" })]);
    expect(done.forecast).toBe(planned.forecast);
    expect(done.remaining).toBe(0);
    expect(done.actual).toBe(100);
  });
});

describe("checklists com autoria", () => {
  it("normaliza linhas vazias e itens repetidos", () => {
    const items = parseChecklistTemplate(" Áudio \n\nLegendas\nÁudio");
    expect(items.map(i => i.label)).toEqual(["Áudio", "Legendas"]);
    expect(new Set(items.map(i => i.id)).size).toBe(2);
    expect(checklistProgress(items)).toBe(0);
  });
  it("registra autoria/data ao concluir e remove somente os metadados da conclusão ao reabrir", () => {
    const original = parseChecklistTemplate("Áudio\nLegendas");
    const changed = updateChecklist(original, original[0].id, true, "user-1", "2026-11-04T15:00:00Z");
    expect(changed[0]).toMatchObject({ done: true, completedBy: "user-1", completedAt: "2026-11-04T15:00:00Z" });
    expect(original[0].done).toBe(false);
    expect(checklistProgress(changed)).toBe(50);
    expect(updateChecklist(changed, changed[0].id, false, "user-2", "2026-11-05T00:00:00Z")[0]).toMatchObject({ done: false, completedAt: null, completedBy: null });
    expect(() => updateChecklist(original, "unknown", true, "user-1", "now")).toThrow();
  });
  it("rejeita modelos vazios ou excessivos e tolera dados antigos inválidos", () => {
    expect(() => parseChecklistTemplate(" \n ")).toThrow();
    expect(() => parseChecklistTemplate(Array.from({ length: 51 }, (_, i) => `Item ${i}`).join("\n"))).toThrow();
    expect(readChecklist([null, 8, {}, { id: "ok", label: "Áudio", done: true }])).toHaveLength(1);
    expect(checklistProgress([])).toBeNull();
  });
});

describe("aprovações e publicações", () => {
  it("exige revisor e resposta ou evidência para registrar decisão de cliente", () => {
    expect(approvalDecisionError({ status: "pendente" })).toBeNull();
    expect(approvalDecisionError({ status: "aprovado", details: { response: "Ok" } })).toBeTruthy();
    expect(approvalDecisionError({ status: "ajustes", details: { reviewer: "Ana" } })).toBeTruthy();
    expect(approvalDecisionError({ status: "aprovado", details: { reviewer: "Ana", response: "Aprovado por e-mail" } })).toBeNull();
    expect(approvalDecisionError({ status: "reprovado", details: { reviewer: "Ana", evidenceUrl: "https://example.com/evidencia" } })).toBeNull();
  });
  it("não permite marcar conteúdo como publicado sem aprovação, data e URL", () => {
    expect(contentWorkflowError({ status: "rascunho" })).toBeNull();
    expect(contentWorkflowError({ status: "aprovado" })).toBeTruthy();
    expect(contentWorkflowError({ status: "agendado", details: { approvedBy: "Ana" } })).toBeTruthy();
    expect(contentWorkflowError({ status: "publicado", dueDate: "2026-11-04", details: { approvedBy: "Ana", publicationUrl: "javascript:alert(1)" } })).toBeTruthy();
    expect(contentWorkflowError({ status: "publicado", dueDate: "2026-11-04", details: { approvedBy: "Ana", publicationUrl: "https://example.com/post" } })).toBeNull();
  });
  it("rejeita links que executem código ou abram arquivos locais", () => {
    expect(safeWebUrl("javascript:alert(1)")).toBeNull();
    expect(safeWebUrl("file:///secret.txt")).toBeNull();
    expect(safeWebUrl("https://example.com/path")).toBe("https://example.com/path");
  });
});

describe("calendário e exportação editorial", () => {
  it("inclui 42 dias iniciando domingo, incluindo virada de ano", () => {
    const days = calendarMonthDays("2027-01");
    expect(days).toHaveLength(42);
    expect(days[0]).toBe("2026-12-27");
    expect(new Set(days).size).toBe(42);
    expect(calendarMonthDays("2026-13")).toEqual([]);
  });
  it("preserva datas sem horário e usa São Paulo para timestamps", () => {
    expect(contentDate(record({ dueDate: "2026-11-04" }))).toBe("2026-11-04");
    expect(contentDate(record({ dueDate: "2026-11-04T01:00:00Z" }))).toBe("2026-11-03");
    expect(contentDate(record({ dueDate: "inválida" }))).toBeNull();
  });
  it("exporta agenda com final exclusivo, escapa conteúdo e omite cancelados/arquivados", () => {
    const rows = [record({ id: "editorial-1", kind: "content", title: "Vídeo; edição, final\nSegunda linha", details: { channel: "Instagram", copy: "Roteiro de ação" } }), record({ id: "cancelled", status: "cancelado" }), record({ id: "archived", archivedAt: "2026-11-04" })];
    const ics = exportContentIcs(rows, new Date("2026-11-01T00:00:00Z"));
    expect(ics).toContain("DTSTART;VALUE=DATE:20261104\r\nDTEND;VALUE=DATE:20261105");
    expect(ics).toContain("SUMMARY:Vídeo\\; edição\\, final\\nSegunda linha");
    expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(1);
    expect(ics.endsWith("END:VCALENDAR\r\n")).toBe(true);
  });
  it("dobra linhas longas em no máximo 75 bytes sem quebrar acentos", () => {
    const ics = exportContentIcs([record({ title: "Produção ação vídeo ".repeat(20) })]);
    for (const line of ics.split("\r\n")) expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75);
    expect(ics).not.toContain("�");
  });
  it("neutraliza fórmulas de planilha e escapa aspas no CSV", () => {
    const csv = exportContentCsv([record({ title: '=HYPERLINK("https://example.com")', details: { copy: "Texto; com aspas \"ok\"" } })]);
    expect(csv).toContain('"\'=HYPERLINK(""https://example.com"")"');
    expect(csv).toContain('"Texto; com aspas ""ok"""');
  });
});
