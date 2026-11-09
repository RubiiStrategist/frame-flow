import type { Lead, Project, Task } from "./types";

export interface StrategicRecord {
  id: string;
  kind: string;
  parentId: string | null;
  status: string;
  archivedAt: string | null;
  details: Record<string, unknown>;
}

export function keyResultProgress(details: Record<string, unknown>): number | null {
  const baseline = Number(details.baseline);
  const target = Number(details.target);
  const current = Number(details.current);
  if ([details.baseline, details.target, details.current].some(n => n === "" || n == null)
    || ![baseline, target, current].every(Number.isFinite) || baseline === target) return null;
  return Math.round(Math.min(100, Math.max(0, (current - baseline) / (target - baseline) * 100)) * 10) / 10;
}

export function objectiveProgress(id: string, records: StrategicRecord[]): number | null {
  const results = records.filter(r => r.kind === "key_result" && r.parentId === id && !r.archivedAt && r.status !== "cancelado");
  if (!results.length) return null;
  const measured = results.map(r => ({ progress: keyResultProgress(r.details), weight: Number(r.details.weight ?? 1) }));
  if (measured.some(r => r.progress === null || !Number.isFinite(r.weight) || r.weight <= 0)) return null;
  const totalWeight = measured.reduce((sum, r) => sum + r.weight, 0);
  return Math.round(measured.reduce((sum, r) => sum + (r.progress ?? 0) * r.weight, 0) / totalWeight * 10) / 10;
}

export function validateKeyResult(details: Record<string, unknown>) {
  if (["baseline", "target", "current"].some(key => details[key] == null || details[key] === "" || !Number.isFinite(Number(details[key])))) {
    throw new Error("Informe valor inicial, meta e medição atual válidos.");
  }
  if (Number(details.baseline) === Number(details.target)) throw new Error("A meta deve ser diferente do valor inicial.");
  if (!Number.isFinite(Number(details.weight ?? 1)) || Number(details.weight ?? 1) <= 0) throw new Error("O peso do resultado deve ser maior que zero.");
}

export function executiveDay(value: string | Date): string {
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}

export function contractRenewalState(dueDate: string | null, status: string, now = new Date()): "sem_prazo" | "encerrado" | "vencido" | "renovar" | "vigente" {
  if (["encerrado", "cancelado"].includes(status)) return "encerrado";
  if (!dueDate || !Number.isFinite(new Date(dueDate).getTime())) return "sem_prazo";
  const today = executiveDay(now);
  const due = executiveDay(dueDate);
  const diff = Math.round((new Date(`${due}T12:00:00Z`).getTime() - new Date(`${today}T12:00:00Z`).getTime()) / 86_400_000);
  return diff < 0 ? "vencido" : diff <= 30 ? "renovar" : "vigente";
}

export function executivePipeline(leads: Lead[]) {
  const stages = ["novo", "contato", "qualificado", "proposta", "negociacao", "ganho", "perdido"] as const;
  const terminal = leads.filter(l => l.etapa === "ganho" || l.etapa === "perdido");
  const won = terminal.filter(l => l.etapa === "ganho");
  const sum = (list: Lead[]) => list.reduce((total, l) => total + Math.round(l.valorEstimado * 100), 0) / 100;
  return {
    stages: stages.map(stage => ({ stage, count: leads.filter(l => l.etapa === stage).length, amount: sum(leads.filter(l => l.etapa === stage)) })),
    openValue: sum(leads.filter(l => !["ganho", "perdido"].includes(l.etapa))),
    wonValue: sum(won),
    conversion: terminal.length ? Math.round(won.length / terminal.length * 1000) / 10 : null,
    terminalCount: terminal.length,
  };
}

export function operationalCapacity(projects: Project[], tasks: Task[], now = new Date()) {
  const today = executiveDay(now);
  const active = projects.filter(p => p.status !== "entregue" && p.status !== "pausado");
  const late = active.filter(p => p.dataEntregaPrevista && executiveDay(p.dataEntregaPrevista) < today);
  const pending = tasks.filter(t => t.status !== "concluida");
  const overdueTasks = pending.filter(t => t.prazo && executiveDay(t.prazo) < today);
  const owners = [...new Set([...active.map(p => p.responsavelId), ...pending.map(t => t.responsavelId)])];
  return {
    active, late, pending, overdueTasks,
    blocked: tasks.filter(t => t.status === "bloqueada"),
    owners: owners.map(id => ({ id, projects: active.filter(p => p.responsavelId === id).length, tasks: pending.filter(t => t.responsavelId === id).length, overdue: overdueTasks.filter(t => t.responsavelId === id).length })),
  };
}

export function escapeDocumentText(value: unknown): string {
  return String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

export function safeDocumentUrl(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) return null;
  try { const url = new URL(value); return ["http:", "https:"].includes(url.protocol) ? url.href : null; }
  catch { return null; }
}

export function contractDocument(record: { title: string; version: number; status: string; startDate: string | null; dueDate: string | null; amount: number; details: Record<string, unknown> }, clientName: string) {
  const field = (name: string, value: unknown) => `<dt>${escapeDocumentText(name)}</dt><dd>${escapeDocumentText(value || "Não informado")}</dd>`;
  return `<!doctype html><html lang="pt-BR"><meta charset="utf-8"><title>${escapeDocumentText(record.title)}</title><style>body{font:16px/1.6 system-ui,sans-serif;max-width:850px;margin:48px auto;padding:24px;color:#111}header{border-bottom:3px solid #e10606;padding-bottom:20px}h1{line-height:1.2}dt{font-size:12px;color:#555;text-transform:uppercase;margin-top:18px}dd{margin:0;white-space:pre-wrap;overflow-wrap:anywhere}footer{margin-top:40px;font-size:12px;color:#666}@media print{body{margin:0;padding:10mm}}</style><header><strong>FRAME FLOW · FRAME VISION</strong><h1>${escapeDocumentText(record.title)}</h1><p>Documento cadastrado · versão ${record.version} · ${escapeDocumentText(record.status)}</p></header><dl>${field("Cliente / contraparte", clientName || record.details.counterparty)}${field("Valor registrado (BRL)", record.amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }))}${field("Início", record.startDate)}${field("Vencimento", record.dueDate)}${field("Escopo", record.details.scope)}${field("Condições", record.details.terms)}${field("Texto do documento", record.details.body)}${field("Representante informado", record.details.signatory)}${field("Data de assinatura informada", record.details.signedDate)}</dl><footer>Exportação do registro interno. Este arquivo não comprova assinatura eletrônica nem substitui o documento firmado pelas partes.</footer></html>`;
}
