import { describe, expect, it } from "vitest";
import { commercialCsv, commercialDay, dateInPeriod, proposalTotals, retentionPortfolio, salesGoalMetrics, validateAcceptance, validateSalesGoal } from "@/lib/frameflow/commercial";
import type { Client, FinanceTransaction, Lead } from "@/lib/frameflow/types";

const lead = (id: string, owner: string, closedAt: string | null, value = 1000) => ({ id, nome: id, empresa: id, email: null, telefone: null, origem: "site", etapa: "ganho", valorEstimado: value, responsavelId: owner, observacoes: null, proximoContato: null, clienteId: null, createdAt: "2026-01-01", updatedAt: "2026-11-20", closedAt }) as Lead & { closedAt: string | null };

describe("propostas comerciais", () => {
  it("calcula itens e desconto em centavos sem erro de ponto flutuante", () => {
    expect(proposalTotals([{ description: "Edição", quantity: 3, unitPrice: 0.1 }, { description: "Captação", quantity: 1, unitPrice: 100 }], 10)).toEqual({ subtotal: 100.3, discount: 10.03, total: 90.27 });
  });
  it("rejeita quantidade negativa, item sem descrição e desconto inválido", () => {
    expect(() => proposalTotals([{ description: "Edição", quantity: -1, unitPrice: 2 }])).toThrow();
    expect(() => proposalTotals([{ description: " ", quantity: 1, unitPrice: 2 }])).toThrow();
    expect(() => proposalTotals([{ description: "Edição", quantity: 1, unitPrice: 2 }], 101)).toThrow();
    expect(() => proposalTotals([{ description: "Edição", quantity: 1, unitPrice: NaN }])).toThrow();
  });
});

describe("datas e metas", () => {
  it("usa o dia de São Paulo nos limites do período", () => {
    expect(commercialDay("2026-11-01T01:00:00Z")).toBe("2026-10-31");
    expect(dateInPeriod("2026-11-01T01:00:00Z", "2026-10-01", "2026-10-31")).toBe(true);
    expect(commercialDay("2026-02-30")).toBe("");
    expect(dateInPeriod("2026-11-01", "2026-11-30", "2026-11-01")).toBe(false);
  });
  it("apura apenas ganhos do responsável e período, sem usar data de edição", () => {
    const goal = { amount: 2000, ownerId: "a", startDate: "2026-11-01", dueDate: "2026-11-30", details: { commissionPercent: 5 } };
    const result = salesGoalMetrics(goal, [lead("1", "a", "2026-11-04", 1500), lead("2", "b", "2026-11-04"), lead("3", "a", "2026-10-30"), lead("4", "a", null)]);
    expect(result.amount).toBe(1500);
    expect(result.progress).toBe(75);
    expect(result.commission).toBe(75);
    expect(result.undatedWins).toBe(1);
  });
  it("não divide por zero e calcula meta de quantidade", () => {
    const base = { amount: 0, ownerId: null, startDate: "2026-11-01", dueDate: "2026-11-30", details: {} };
    expect(salesGoalMetrics(base, []).progress).toBe(0);
    expect(salesGoalMetrics({ ...base, details: { metric: "count", targetCount: 4 } }, [lead("1", "a", "2026-11-04")]).progress).toBe(25);
  });
  it("exige responsável individual, período e objetivo positivos", () => {
    const base = { amount: 1000, ownerId: null, startDate: "2026-11-01", dueDate: "2026-11-30", details: { scope: "individual" } };
    expect(() => validateSalesGoal(base)).toThrow("responsável");
    expect(() => validateSalesGoal({ ...base, ownerId: "a", amount: 0 })).toThrow("maior que zero");
    expect(() => validateSalesGoal({ ...base, ownerId: "a", dueDate: "2026-10-31" })).toThrow("período");
    expect(() => validateSalesGoal({ ...base, ownerId: "a", details: { metric: "count", targetCount: 1.5 } })).toThrow("inteiro");
  });
});

describe("aceite de proposta", () => {
  const base = { name: "Cliente Teste", email: "cliente@example.test", acceptedAt: "2026-11-04", evidence: "Aceite recebido por e-mail." };
  it("rejeita aceite futuro, sem identidade ou sem evidência", () => {
    const now = new Date("2026-11-04T15:00:00Z");
    expect(validateAcceptance(base, now)).toEqual(base);
    expect(() => validateAcceptance({ ...base, acceptedAt: "2026-11-05" }, now)).toThrow("futuro");
    expect(() => validateAcceptance({ ...base, email: "inválido" }, now)).toThrow("e-mail");
    expect(() => validateAcceptance({ ...base, evidence: "" }, now)).toThrow("evidência");
  });
});

describe("carteira e exportação", () => {
  const client = { id: "c", nomeFantasia: "Cliente" } as Client;
  it("não inventa risco nem receita para cliente sem histórico", () => {
    const [summary] = retentionPortfolio([client], [], [], [], new Date("2026-11-04T12:00:00Z"));
    expect(summary.health).toBe("sem_historico");
    expect(summary.revenue).toBe(0);
    expect(summary.daysSincePayment).toBe(null);
  });
  it("considera somente entradas quitadas e sinaliza retorno vencido", () => {
    const transactions = [{ clienteId: "c", tipo: "entrada", pago: true, valor: 500, pagoEm: "2026-11-02T12:00:00Z" }, { clienteId: "c", tipo: "entrada", pago: false, valor: 900 }, { clienteId: "c", tipo: "saida", pago: true, valor: 300 }] as FinanceTransaction[];
    const [summary] = retentionPortfolio([client], transactions, [], [{ clientId: "c", status: "acompanhamento", dueDate: "2026-11-03", archivedAt: null, details: {} }], new Date("2026-11-04T12:00:00Z"));
    expect(summary.revenue).toBe(500);
    expect(summary.health).toBe("contato_atrasado");
    expect(summary.daysSincePayment).toBe(2);
  });
  it("neutraliza fórmulas e escapa aspas no CSV", () => {
    expect(commercialCsv([["=SUM(A1:A2)", 'A "B"', 42]])).toBe('\ufeff"\'=SUM(A1:A2)";"A ""B""";"42"');
  });
});
