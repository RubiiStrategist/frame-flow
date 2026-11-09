import type { Client, FinanceTransaction, Lead, Project } from "./types";

export interface ProposalItem {
  description: string;
  quantity: number;
  unitPrice: number;
}

export function proposalTotals(items: ProposalItem[], discountPercent = 0) {
  if (!items.length || items.length > 100) throw new Error("Adicione de 1 a 100 itens à proposta.");
  if (!Number.isFinite(discountPercent) || discountPercent < 0 || discountPercent > 100) {
    throw new Error("O desconto deve ficar entre 0% e 100%.");
  }
  const subtotalCents = items.reduce((sum, item) => {
    if (!item.description.trim()) throw new Error("Descreva todos os itens da proposta.");
    if (!Number.isFinite(item.quantity) || item.quantity <= 0 || item.quantity > 1_000_000) {
      throw new Error("Informe uma quantidade positiva e válida em cada item.");
    }
    if (!Number.isFinite(item.unitPrice) || item.unitPrice < 0 || item.unitPrice > 100_000_000) {
      throw new Error("Informe um preço unitário válido em cada item.");
    }
    return sum + Math.round(item.quantity * Math.round(item.unitPrice * 100));
  }, 0);
  if (!Number.isSafeInteger(subtotalCents) || subtotalCents > 10_000_000_000) {
    throw new Error("O total ultrapassa o limite permitido para uma proposta.");
  }
  const discountCents = Math.round(subtotalCents * discountPercent / 100);
  return { subtotal: subtotalCents / 100, discount: discountCents / 100, total: (subtotalCents - discountCents) / 100 };
}

export function readProposalItems(value: unknown): ProposalItem[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is Record<string, unknown> => !!item && typeof item === "object")
    .map(item => ({ description: String(item.description ?? ""), quantity: Number(item.quantity), unitPrice: Number(item.unitPrice) }));
}

/** Calendar dates are compared in the company's timezone, never in the browser's timezone. */
export function commercialDay(value: string | Date): string {
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const parsed = new Date(`${value}T12:00:00Z`);
    if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) return "";
    return value;
  }
  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}

export function dateInPeriod(date: string | null | undefined, start: string, end: string) {
  if (!date) return false;
  const day = commercialDay(date);
  const from = commercialDay(start);
  const to = commercialDay(end);
  return !!day && !!from && !!to && from <= to && day >= from && day <= to;
}

export interface SalesGoalInput {
  amount: number;
  ownerId: string | null;
  startDate: string | null;
  dueDate: string | null;
  details: Record<string, unknown>;
}

/** A won date is required: editing a lead must never create a new commission period. */
export function salesGoalMetrics(goal: SalesGoalInput, leads: (Lead & { closedAt?: string | null })[]) {
  const rate = Number(goal.details.commissionPercent ?? 0);
  const commissionRate = Number.isFinite(rate) ? Math.min(100, Math.max(0, rate)) : 0;
  const won = leads.filter(lead => lead.etapa === "ganho" &&
    (!goal.ownerId || lead.responsavelId === goal.ownerId) &&
    dateInPeriod(lead.closedAt, goal.startDate ?? "", goal.dueDate ?? ""));
  const valueCents = won.reduce((sum, lead) => sum + Math.round(Math.max(0, lead.valorEstimado) * 100), 0);
  const amount = valueCents / 100;
  const isCount = goal.details.metric === "count";
  const target = isCount ? Number(goal.details.targetCount ?? 0) : goal.amount;
  const achieved = isCount ? won.length : amount;
  return {
    won, amount, achieved, target: Number.isFinite(target) ? Math.max(0, target) : 0,
    progress: target > 0 && Number.isFinite(target) ? Math.round(achieved / target * 1000) / 10 : 0,
    commission: Math.round(valueCents * commissionRate / 100) / 100,
    commissionRate,
    undatedWins: leads.filter(lead => lead.etapa === "ganho" && !lead.closedAt && (!goal.ownerId || lead.responsavelId === goal.ownerId)).length,
  };
}

export function validateSalesGoal(goal: SalesGoalInput) {
  const from = commercialDay(goal.startDate ?? "");
  const to = commercialDay(goal.dueDate ?? "");
  if (!from || !to || to < from) throw new Error("Informe um período válido para a meta.");
  const target = goal.details.metric === "count" ? Number(goal.details.targetCount) : goal.amount;
  if (!Number.isFinite(target) || target <= 0) throw new Error("A meta precisa ter um objetivo maior que zero.");
  if (goal.details.metric === "count" && !Number.isInteger(target)) throw new Error("A quantidade de vendas deve ser um número inteiro.");
  const rate = Number(goal.details.commissionPercent ?? 0);
  if (!Number.isFinite(rate) || rate < 0 || rate > 100) throw new Error("A comissão deve ficar entre 0% e 100%.");
  if (goal.details.scope === "individual" && !goal.ownerId) throw new Error("Selecione o responsável pela meta individual.");
}

export interface ProposalAcceptance { name: string; email: string; acceptedAt: string; evidence: string }
export function validateAcceptance(value: ProposalAcceptance, now = new Date()): ProposalAcceptance {
  const normalized = { name: value.name.trim(), email: value.email.trim(), acceptedAt: value.acceptedAt, evidence: value.evidence.trim() };
  if (normalized.name.length < 2) throw new Error("Informe o nome de quem aceitou a proposta.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized.email)) throw new Error("Informe um e-mail válido para o aceite.");
  const day = commercialDay(normalized.acceptedAt);
  if (!day || day > commercialDay(now)) throw new Error("A data do aceite deve ser válida e não pode estar no futuro.");
  if (normalized.evidence.length < 5) throw new Error("Registre a evidência do aceite: mensagem, reunião ou documento recebido.");
  return normalized;
}

export interface RetentionRecord {
  clientId: string | null;
  status: string;
  dueDate: string | null;
  archivedAt: string | null;
  details: Record<string, unknown>;
}

export function retentionPortfolio(clients: Client[], transactions: FinanceTransaction[], projects: Project[], records: RetentionRecord[], now = new Date()) {
  const today = commercialDay(now);
  return clients.map(client => {
    const incoming = transactions.filter(t => t.clienteId === client.id && t.tipo === "entrada" && t.pago);
    const revenue = incoming.reduce((sum, t) => sum + Math.round(t.valor * 100), 0) / 100;
    const payments = incoming.map(t => t.pagoEm).filter((v): v is string => !!v).sort();
    const lastPayment = payments.at(-1) ?? null;
    const clientRecords = records.filter(r => r.clientId === client.id && !r.archivedAt && r.status !== "concluido");
    const nextContact = clientRecords.map(r => r.dueDate).filter((v): v is string => !!v).sort()[0] ?? null;
    const overdue = !!nextContact && commercialDay(nextContact) < today;
    const explicitRisk = clientRecords.some(r => r.status === "risco");
    const activeProjects = projects.filter(p => p.clienteId === client.id && !["entregue", "pausado"].includes(p.status)).length;
    const daysSincePayment = lastPayment ? Math.max(0, Math.floor((new Date(`${today}T12:00:00Z`).getTime() - new Date(`${commercialDay(lastPayment)}T12:00:00Z`).getTime()) / 86_400_000)) : null;
    const health = explicitRisk ? "risco" : overdue ? "contato_atrasado" : activeProjects ? "em_operacao" : daysSincePayment === null ? "sem_historico" : daysSincePayment > 90 ? "reativar" : "acompanhamento";
    return { client, revenue, lastPayment, daysSincePayment, activeProjects, nextContact, health };
  });
}

/** Protect CSV exports from spreadsheet formula injection. */
export function commercialCsv(rows: (string | number | null | undefined)[][]) {
  return "\ufeff" + rows.map(row => row.map(value => {
    let text = String(value ?? "");
    if (/^[\s]*[=+@-]/.test(text)) text = `'${text}`;
    return `"${text.replace(/"/g, '""')}"`;
  }).join(";")).join("\r\n");
}
