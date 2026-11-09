import { z } from "zod";

export const WORKSPACE_KINDS = ["objective", "key_result", "team_member", "team_activity", "contract", "outreach", "proposal", "sales_goal", "retention", "production_step", "project_cost", "approval", "quality_template", "quality_check", "content"] as const;
export type WorkspaceKind = typeof WORKSPACE_KINDS[number];
export const KIND_LABELS: Record<string, string> = { objective: "Objetivos", key_result: "Resultados-chave", team_member: "Equipe", team_activity: "Desenvolvimento da equipe", contract: "Contratos", outreach: "Prospecção", proposal: "Propostas", sales_goal: "Metas e comissões", retention: "Retenção", production_step: "Produção", project_cost: "Custos", approval: "Aprovações", quality_template: "Modelos de qualidade", quality_check: "Checklists", content: "Frame Content", files: "Central de arquivos" };
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Informe uma data válida.").refine(v => { const d = new Date(`${v}T12:00:00Z`); return Number.isFinite(d.getTime()) && d.toISOString().slice(0, 10) === v; }, "Data inexistente.").nullable().optional();
const link = z.string().uuid("Vínculo inválido.").nullable().optional();
export const recordInputSchema = z.object({
  kind: z.enum(WORKSPACE_KINDS), title: z.string().trim().min(2, "Informe um título com ao menos 2 caracteres.").max(240),
  status: z.string().trim().min(1).max(50).default("ativo"), amount: z.number().finite().min(0).max(100_000_000).default(0),
  clientId: link, projectId: link, leadId: link, ownerId: link, parentId: link, startDate: date, dueDate: date,
  details: z.record(z.string(), z.unknown()).default({}),
}).superRefine((v, ctx) => {
  if (v.startDate && v.dueDate && v.startDate > v.dueDate) ctx.addIssue({code:"custom", path:["dueDate"], message:"O prazo deve ser igual ou posterior ao início."});
  if (JSON.stringify(v.details).length > 100_000) ctx.addIssue({code:"custom", path:["details"], message:"O conteúdo ultrapassa o limite de 100 KB."});
  if (v.kind === "key_result" && !v.parentId) ctx.addIssue({code:"custom", path:["parentId"], message:"Vincule o resultado-chave a um objetivo."});
});

export interface WorkspaceRecord {
  id: string; kind: string; title: string; status: string; amount: number;
  clientId: string | null; projectId: string | null; leadId: string | null; ownerId: string | null; parentId: string | null;
  startDate: string | null; dueDate: string | null; details: Record<string, unknown>;
  version: number; createdAt: string; updatedAt: string; archivedAt: string | null;
}
export type RecordInput = Pick<WorkspaceRecord, "kind" | "title"> & Partial<Omit<WorkspaceRecord, "id" | "kind" | "title" | "version" | "createdAt" | "updatedAt" | "archivedAt">>;
export function mapWorkspaceRecord(row: Record<string, unknown>): WorkspaceRecord {
  return { id:String(row.id), kind:String(row.kind), title:String(row.title), status:String(row.status), amount:Number(row.amount ?? 0)/100,
    clientId:row.client_id as string|null, projectId:row.project_id as string|null, leadId:row.lead_id as string|null, ownerId:row.owner_id as string|null, parentId:row.parent_id as string|null,
    startDate:row.start_date as string|null, dueDate:row.due_date as string|null, details:(row.details ?? {}) as Record<string,unknown>, version:Number(row.version), createdAt:String(row.created_at), updatedAt:String(row.updated_at), archivedAt:row.archived_at as string|null };
}
export function recordPayload(input: RecordInput) {
  const parsed=recordInputSchema.safeParse(input);
  if (!parsed.success) throw new Error(parsed.error.issues.map(i=>i.message).join(" "));
  const v=parsed.data;
  return {kind:v.kind,title:v.title,status:v.status,amount:Math.round(v.amount*100),client_id:v.clientId??null,project_id:v.projectId??null,lead_id:v.leadId??null,owner_id:v.ownerId??null,parent_id:v.parentId??null,start_date:v.startDate??null,due_date:v.dueDate??null,details:v.details};
}
