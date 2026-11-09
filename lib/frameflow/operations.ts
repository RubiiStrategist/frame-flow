import { dateKey } from "./dashboard";

/** Small structural types keep business calculations independent from React/data fetching. */
export interface OperationalRecord {
  id: string;
  kind: string;
  title: string;
  status: string;
  amount: number;
  projectId: string | null;
  dueDate: string | null;
  details: Record<string, unknown>;
  archivedAt: string | null;
}

export interface ChecklistItem {
  id: string;
  label: string;
  done: boolean;
  completedAt?: string | null;
  completedBy?: string | null;
}

export function costLineTotal(quantity: number, unitPrice: number): number {
  if (!Number.isFinite(quantity) || quantity <= 0 || !Number.isFinite(unitPrice) || unitPrice < 0) {
    throw new Error("Informe quantidade maior que zero e custo unitário igual ou maior que zero.");
  }
  const cents = Math.round(quantity * unitPrice * 100);
  if (!Number.isSafeInteger(cents)) throw new Error("O custo calculado ultrapassa o limite permitido.");
  return cents / 100;
}

/** Actual + remaining planned costs form the forecast. Cancelled/archived costs never count. */
export function projectCostSummary(projectId: string, budget: number, records: OperationalRecord[]) {
  const lines = records.filter(r => r.kind === "project_cost" && r.projectId === projectId && !r.archivedAt && r.status !== "cancelado");
  const toCents = (n: number) => Number.isFinite(n) ? Math.round(n * 100) : 0;
  const actualCents = lines.filter(r => r.status === "realizado").reduce((sum, r) => sum + toCents(r.amount), 0);
  const plannedCents = lines.filter(r => r.status === "previsto").reduce((sum, r) => sum + toCents(r.amount), 0);
  const budgetCents = toCents(budget);
  const forecastCents = actualCents + plannedCents;
  return {
    lineCount: lines.length,
    actual: actualCents / 100,
    remaining: plannedCents / 100,
    forecast: forecastCents / 100,
    margin: (budgetCents - forecastCents) / 100,
    marginPercent: budgetCents > 0 ? Math.round(((budgetCents - forecastCents) / budgetCents) * 1000) / 10 : null,
  };
}

export function parseChecklistTemplate(text: string): ChecklistItem[] {
  const labels = [...new Set(text.split(/\r?\n/).map(s => s.trim()).filter(Boolean))];
  if (!labels.length) throw new Error("Adicione ao menos um item ao checklist.");
  if (labels.length > 50) throw new Error("Um checklist pode ter até 50 itens.");
  if (labels.some(label => label.length > 240)) throw new Error("Cada item pode ter até 240 caracteres.");
  return labels.map((label, index) => ({ id: `item-${index + 1}`, label, done: false }));
}

export function readChecklist(value: unknown): ChecklistItem[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap(item => {
    if (!item || typeof item !== "object") return [];
    const r = item as Record<string, unknown>;
    if (typeof r.id !== "string" || typeof r.label !== "string") return [];
    return [{ id: r.id, label: r.label, done: r.done === true, completedAt: typeof r.completedAt === "string" ? r.completedAt : null, completedBy: typeof r.completedBy === "string" ? r.completedBy : null }];
  });
}

export function updateChecklist(items: ChecklistItem[], itemId: string, done: boolean, actorId: string, now: string): ChecklistItem[] {
  if (!items.some(item => item.id === itemId)) throw new Error("Item do checklist não encontrado.");
  return items.map(item => item.id === itemId ? { ...item, done, completedAt: done ? now : null, completedBy: done ? actorId : null } : item);
}

export function checklistProgress(items: ChecklistItem[]): number | null {
  return items.length ? Math.round(100 * items.filter(item => item.done).length / items.length) : null;
}

export function safeWebUrl(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) return null;
  try {
    const url = new URL(value);
    return ["https:", "http:"].includes(url.protocol) ? url.href : null;
  } catch { return null; }
}

export function calendarMonthDays(month: string): string[] {
  const [year, m] = month.split("-").map(Number);
  if (!Number.isInteger(year) || !Number.isInteger(m) || m < 1 || m > 12) return [];
  const first = new Date(Date.UTC(year, m - 1, 1, 12));
  first.setUTCDate(1 - first.getUTCDay());
  return Array.from({ length: 42 }, (_, i) => {
    const day = new Date(first);
    day.setUTCDate(day.getUTCDate() + i);
    return day.toISOString().slice(0, 10);
  });
}

export function contentDate(record: OperationalRecord): string | null {
  if (!record.dueDate || !Number.isFinite(new Date(record.dueDate).getTime())) return null;
  return dateKey(record.dueDate);
}

export function approvalDecisionError(input: { status: string; details?: Record<string, unknown> }): string | null {
  if (!["aprovado", "ajustes", "reprovado"].includes(input.status)) return null;
  if (!String(input.details?.reviewer ?? "").trim()) return "Informe quem respondeu pelo cliente.";
  if (!String(input.details?.response ?? "").trim() && !safeWebUrl(input.details?.evidenceUrl)) return "Registre o retorno do cliente ou o link da evidência.";
  return null;
}

export function contentWorkflowError(input: { status: string; dueDate?: string | null; details?: Record<string, unknown> }): string | null {
  if (["aprovado", "agendado", "publicado"].includes(input.status) && !String(input.details?.approvedBy ?? "").trim()) return "Informe o responsável pela aprovação do conteúdo.";
  if (["agendado", "publicado"].includes(input.status) && !input.dueDate) return "Informe a data da publicação.";
  if (input.status === "publicado" && !safeWebUrl(input.details?.publicationUrl)) return "Informe a URL da publicação para registrar sua conclusão.";
  return null;
}

function escapeIcs(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/\r?\n/g, "\\n").replace(/;/g, "\\;").replace(/,/g, "\\,");
}

/** RFC 5545 folds lines at 75 octets, never in the middle of a UTF-8 character. */
function foldIcsLine(line: string): string {
  const encoder = new TextEncoder();
  const segments: string[] = [];
  let part = "";
  let size = 0;
  for (const character of line) {
    const bytes = encoder.encode(character).length;
    if (size + bytes > 75) {
      segments.push(part);
      part = " ";
      size = 1;
    }
    part += character;
    size += bytes;
  }
  segments.push(part);
  return segments.join("\r\n");
}

export function exportContentIcs(records: OperationalRecord[], now = new Date()): string {
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//FRAME VISION//FRAME FLOW//PT-BR", "CALSCALE:GREGORIAN", "METHOD:PUBLISH", "X-WR-CALNAME:FRAME Content"];
  const stamp = now.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
  for (const record of records.filter(r => !r.archivedAt && r.status !== "cancelado")) {
    const day = contentDate(record);
    if (!day) continue;
    const next = new Date(`${day}T12:00:00Z`);
    next.setUTCDate(next.getUTCDate() + 1);
    const description = [String(record.details.channel ?? ""), `Status: ${record.status}`, String(record.details.copy ?? "")].filter(Boolean).join("\n");
    lines.push("BEGIN:VEVENT", `UID:${escapeIcs(record.id)}@frameflow`, `DTSTAMP:${stamp}`, `DTSTART;VALUE=DATE:${day.replace(/-/g, "")}`, `DTEND;VALUE=DATE:${next.toISOString().slice(0, 10).replace(/-/g, "")}`, `SUMMARY:${escapeIcs(record.title)}`, `DESCRIPTION:${escapeIcs(description)}`, "END:VEVENT");
  }
  lines.push("END:VCALENDAR");
  return lines.map(foldIcsLine).join("\r\n") + "\r\n";
}

function csvCell(value: unknown): string {
  let s = String(value ?? "");
  if (/^[\s]*[=+@-]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

export function exportContentCsv(records: OperationalRecord[]): string {
  const rows: unknown[][] = [["Título", "Canal", "Data", "Status", "Texto", "URL publicada"]];
  for (const record of records.filter(r => !r.archivedAt)) rows.push([record.title, record.details.channel ?? "", contentDate(record) ?? "", record.status, record.details.copy ?? "", safeWebUrl(record.details.publicationUrl) ?? ""]);
  return "\uFEFF" + rows.map(row => row.map(csvCell).join(";")).join("\r\n");
}
