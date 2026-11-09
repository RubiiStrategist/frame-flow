"use client";

import { useEffect, useId, useState, type ReactNode } from "react";
import { Archive, ArrowDownToLine, CalendarDays, CheckCircle2, ChevronLeft, ChevronRight, FileText, FolderOpen, Loader2, RotateCcw, Upload } from "lucide-react";
import { ModuleHeader } from "@/components/common/frame-primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RecordManager, WorkspaceNotice, downloadText, type RecordField, type RecordOption } from "@/components/workspace/record-manager";
import { useAuth } from "@/lib/frameflow/auth";
import { useData, useAsyncList } from "@/lib/frameflow/data";
import { dateKey } from "@/lib/frameflow/dashboard";
import { formatarBRL, formatarData } from "@/lib/frameflow/format";
import type { ProjectStatus } from "@/lib/frameflow/types";
import { archiveFile, getFileUrl, listFiles, restoreFile, saveRecord, updateProjectStatus, uploadFile, useRecords, useWorkspaceLinks, type RecordInput, type WorkspaceFile, type WorkspaceRecord } from "@/lib/frameflow/workspace";
import { approvalDecisionError, calendarMonthDays, checklistProgress, contentDate, contentWorkflowError, costLineTotal, exportContentCsv, exportContentIcs, parseChecklistTemplate, projectCostSummary, readChecklist, safeWebUrl, updateChecklist } from "@/lib/frameflow/operations";

const selectClass = "min-h-11 w-full min-w-0 rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[var(--frame-red)]";
const PROJECT_STATUS: { value: ProjectStatus; label: string }[] = [
  { value: "briefing", label: "Briefing" }, { value: "planejamento", label: "Planejamento" }, { value: "producao", label: "Produção" }, { value: "revisao", label: "Revisão" }, { value: "aprovacao", label: "Aprovação" }, { value: "entregue", label: "Entregue" }, { value: "pausado", label: "Pausado" },
];
const STEP_STATUS: RecordOption[] = [{ value: "pendente", label: "Pendente" }, { value: "em_andamento", label: "Em andamento" }, { value: "concluida", label: "Concluída" }, { value: "bloqueada", label: "Bloqueada" }];
const CONTENT_STATUS: RecordOption[] = [{ value: "ideia", label: "Ideia" }, { value: "rascunho", label: "Rascunho" }, { value: "revisao", label: "Em revisão" }, { value: "aprovado", label: "Aprovado" }, { value: "agendado", label: "Agendado" }, { value: "publicado", label: "Publicado" }, { value: "cancelado", label: "Cancelado" }];

function message(error: unknown) { return error instanceof Error ? error.message : "Não foi possível concluir. Tente novamente."; }
function text(record: WorkspaceRecord, key: string) { return String(record.details[key] ?? ""); }
function Metric({ label, value, detail }: { label: string; value: string | number; detail?: string }) {
  return <article className="min-w-0 rounded-2xl border border-border bg-card p-5"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-3 break-words text-2xl font-semibold tracking-tight">{value}</p>{detail && <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{detail}</p>}</article>;
}
function Panel({ title, children }: { title: string; children: ReactNode }) {
  return <section className="min-w-0 rounded-2xl border border-border bg-card p-4 sm:p-5"><h2 className="mb-4 text-base font-semibold">{title}</h2>{children}</section>;
}
function ProjectSelector({ options, value, onChange, label = "Filtrar por projeto" }: { options: RecordOption[]; value: string; onChange: (value: string) => void; label?: string }) {
  const id = useId();
  return <div className="mb-5 max-w-md"><label htmlFor={id} className="mb-2 block text-xs text-muted-foreground">{label}</label><select id={id} className={selectClass} value={value} onChange={e => onChange(e.target.value)}><option value="">Todos os projetos</option>{options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select></div>;
}
function ExternalEvidence({ value, label }: { value: unknown; label: string }) {
  const url = safeWebUrl(value);
  return url ? <a className="inline-flex min-h-11 items-center gap-2 text-sm text-red-300 underline underline-offset-4" href={url} target="_blank" rel="noopener noreferrer"><FileText className="h-4 w-4" />{label}</a> : null;
}

export function ProducaoView() {
  const data = useData();
  const projects = useAsyncList(data.listProjects);
  const links = useWorkspaceLinks();
  const steps = useRecords("production_step");
  const { configured, isPreview } = useAuth();
  const [projectId, setProjectId] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const options = links.projects.map(p => ({ value: p.id, label: p.titulo }));
  const visible = projects.result.data.filter(p => !projectId || p.id === projectId);
  const activeSteps = steps.records.filter(r => !r.archivedAt && (!projectId || r.projectId === projectId));
  async function move(id: string, status: ProjectStatus) {
    setBusy(id); setError("");
    try { await updateProjectStatus(id, status); projects.reload(); } catch (e) { setError(message(e)); } finally { setBusy(null); }
  }
  return <div className="space-y-6">
    <ModuleHeader eyebrow="Operacional · Produção" title="Fluxo de produção" description="Acompanhe cada projeto, organize as etapas e registre a evolução da entrega." actions={<Button asChild variant="outline"><a href="/#/operacional/projetos">Criar projeto</a></Button>} />
    <div className="grid gap-3 sm:grid-cols-3"><Metric label="Projetos em produção" value={visible.filter(p => !["entregue", "pausado"].includes(p.status)).length} /><Metric label="Etapas concluídas" value={`${activeSteps.filter(r => r.status === "concluida").length}/${activeSteps.length}`} /><Metric label="Bloqueios" value={activeSteps.filter(r => r.status === "bloqueada").length} detail="Etapas que precisam de atenção" /></div>
    <ProjectSelector options={options} value={projectId} onChange={setProjectId} />
    <WorkspaceNotice loading={projects.loading || links.loading} error={error || links.error || (projects.result.reason === "erro" ? projects.result.error ?? "Falha ao carregar projetos." : null)}>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4" aria-label="Quadro de produção">
        {PROJECT_STATUS.map(stage => <section key={stage.value} className="min-w-0 rounded-xl border border-border bg-card/70 p-3"><h2 className="mb-3 flex items-center justify-between text-sm font-medium">{stage.label}<span className="rounded-md bg-secondary px-2 py-1 text-xs text-muted-foreground">{visible.filter(p => p.status === stage.value).length}</span></h2><div className="space-y-3">{visible.filter(p => p.status === stage.value).map(project => <article key={project.id} className="rounded-lg border border-border bg-background p-3"><h3 className="break-words text-sm font-medium">{project.titulo}</h3><p className="mt-1 break-words text-xs text-muted-foreground">{links.clients.find(c => c.id === project.clienteId)?.nomeFantasia ?? "Cliente"}</p>{project.dataEntregaPrevista && <p className="my-3 text-xs text-muted-foreground">Entrega {formatarData(project.dataEntregaPrevista)}</p>}<label className="mt-3 block text-xs text-muted-foreground">Etapa do projeto<select aria-label={`Etapa de ${project.titulo}`} value={project.status} disabled={Boolean(busy) || !configured || isPreview} onChange={e => void move(project.id, e.target.value as ProjectStatus)} className={`${selectClass} mt-2`}>{PROJECT_STATUS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}</select></label>{busy === project.id && <p role="status" className="mt-2 text-xs">Salvando…</p>}</article>)}{!visible.some(p => p.status === stage.value) && <p className="py-5 text-center text-xs text-muted-foreground">Nenhum projeto nesta etapa</p>}</div></section>)}
      </div>
    </WorkspaceNotice>
    <RecordManager kind="production_step" title="Etapas e entregáveis" description="Detalhe o roteiro, a captação, a edição e a entrega de cada projeto." statuses={STEP_STATUS} defaults={{ status: "pendente", projectId: projectId || undefined }} filter={r => !projectId || r.projectId === projectId} fields={[
      { key: "projectId", label: "Projeto", type: "select", options, required: true },
      { key: "details.stage", label: "Fase", type: "select", required: true, options: ["Roteiro", "Pré-produção", "Captação", "Edição", "Revisão", "Entrega"].map(s => ({ value: s, label: s })) },
      { key: "ownerId", label: "Responsável", type: "select", options: links.members.map(m => ({ value: m.id, label: m.fullName })) },
      { key: "dueDate", label: "Prazo", type: "date" }, { key: "details.notes", label: "Instruções e bloqueios", type: "textarea" },
    ]} renderRecord={r => <div className="mt-3 space-y-2 text-sm text-muted-foreground"><p>{links.projects.find(p => p.id === r.projectId)?.titulo ?? "Projeto"} · {text(r, "stage")}</p>{r.dueDate && <p>Prazo {formatarData(r.dueDate)}</p>}{text(r, "notes") && <p className="whitespace-pre-wrap break-words">{text(r, "notes")}</p>}</div>} />
  </div>;
}

export function CustosView() {
  const links = useWorkspaceLinks();
  const costs = useRecords("project_cost");
  const [projectId, setProjectId] = useState("");
  const projects = links.projects.filter(p => !projectId || p.id === projectId);
  const summaries = projects.map(p => ({ project: p, ...projectCostSummary(p.id, p.orcamento, costs.records) }));
  const sum = (key: "actual" | "forecast" | "margin") => summaries.reduce((total, p) => total + Math.round(p[key] * 100), 0) / 100;
  return <div className="space-y-6">
    <ModuleHeader eyebrow="Operacional · Financeiro" title="Custos e rentabilidade" description="Custos de produção por projeto, com quantidades, horas e prestadores. A margem considera o orçamento contratado e o custo total previsto." />
    <div className="grid gap-3 sm:grid-cols-3"><Metric label="Custos realizados" value={formatarBRL(sum("actual"))} /><Metric label="Previsão total de custos" value={formatarBRL(sum("forecast"))} detail="Realizados + custos ainda previstos" /><Metric label="Margem projetada" value={formatarBRL(sum("margin"))} detail="Orçamento dos projetos − previsão de custos" /></div>
    <ProjectSelector options={links.projects.map(p => ({ value: p.id, label: p.titulo }))} value={projectId} onChange={setProjectId} />
    <WorkspaceNotice loading={links.loading || costs.loading} error={links.error || costs.error}>
      <div className="grid gap-3 md:grid-cols-2">{summaries.map(row => <Panel key={row.project.id} title={row.project.titulo}><dl className="grid grid-cols-2 gap-3 text-sm"><dt className="text-muted-foreground">Orçamento</dt><dd className="text-right">{formatarBRL(row.project.orcamento)}</dd><dt className="text-muted-foreground">Realizado</dt><dd className="text-right">{formatarBRL(row.actual)}</dd><dt className="text-muted-foreground">Ainda previsto</dt><dd className="text-right">{formatarBRL(row.remaining)}</dd><dt className="text-muted-foreground">Margem projetada</dt><dd className={`text-right ${row.margin < 0 ? "text-red-300" : ""}`}>{formatarBRL(row.margin)} {row.marginPercent !== null ? `(${row.marginPercent}%)` : ""}</dd></dl>{!row.lineCount && <p className="mt-4 text-xs text-muted-foreground">Nenhum custo registrado. A margem será mais precisa ao incluir os custos do projeto.</p>}</Panel>)}</div>
      {!summaries.length && <p className="rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">Cadastre um projeto para acompanhar sua rentabilidade.</p>}
    </WorkspaceNotice>
    <RecordManager kind="project_cost" title="Lançamentos de custo" description="Um custo realizado substitui sua previsão. Estes registros não geram nem quitam transações financeiras automaticamente." statuses={[{ value: "previsto", label: "Previsto" }, { value: "realizado", label: "Realizado" }, { value: "cancelado", label: "Cancelado" }]} defaults={{ projectId: projectId || undefined, status: "previsto" }} filter={r => !projectId || r.projectId === projectId} fields={[
      { key: "projectId", label: "Projeto", type: "select", required: true, options: links.projects.map(p => ({ value: p.id, label: p.titulo })) },
      { key: "details.category", label: "Categoria", type: "select", required: true, options: ["Horas internas", "Terceiros", "Diárias", "Locação", "Transporte", "Licenças", "Outros"].map(s => ({ value: s, label: s })) },
      { key: "details.quantity", label: "Quantidade / horas", type: "number", min: 0.01, step: 0.01, defaultValue: 1, required: true },
      { key: "details.unitPrice", label: "Custo unitário (R$)", type: "number", min: 0, step: 0.01, required: true },
      { key: "details.supplier", label: "Profissional ou fornecedor" }, { key: "dueDate", label: "Data do custo", type: "date", required: true }, { key: "details.notes", label: "Observações", type: "textarea" },
    ]} prepare={input => ({ ...input, amount: costLineTotal(Number(input.details?.quantity), Number(input.details?.unitPrice)) })} renderRecord={r => <div className="mt-3 space-y-2 text-sm"><p className="text-xl font-semibold">{formatarBRL(r.amount)}</p><p className="text-muted-foreground">{text(r, "quantity")} × {formatarBRL(Number(r.details.unitPrice ?? 0))} · {text(r, "category")}</p><p className="text-muted-foreground">{links.projects.find(p => p.id === r.projectId)?.titulo ?? "Projeto"}{text(r, "supplier") ? ` · ${text(r, "supplier")}` : ""}</p></div>} />
  </div>;
}

export function AprovacoesView() {
  const links = useWorkspaceLinks();
  const approvals = useRecords("approval");
  const active = approvals.records.filter(r => !r.archivedAt);
  return <div className="space-y-6">
    <ModuleHeader eyebrow="Operacional · Relacionamento" title="Aprovações de clientes" description="Controle os materiais enviados, as respostas recebidas e as revisões solicitadas. Cada retorno fica registrado com sua evidência e histórico." />
    <div className="grid gap-3 sm:grid-cols-3"><Metric label="Aguardando retorno" value={active.filter(r => r.status === "pendente").length} /><Metric label="Ajustes solicitados" value={active.filter(r => r.status === "ajustes").length} /><Metric label="Aprovados" value={active.filter(r => r.status === "aprovado").length} /></div>
    <WorkspaceNotice error={links.error || approvals.error} loading={links.loading || approvals.loading} />
    <RecordManager kind="approval" title="Pedidos de aprovação" description="O responsável interno registra a resposta recebida do cliente. O histórico identifica quem realizou o registro." statuses={[{ value: "pendente", label: "Aguardando cliente" }, { value: "aprovado", label: "Aprovado" }, { value: "ajustes", label: "Ajustes solicitados" }, { value: "reprovado", label: "Reprovado" }]} fields={[
      { key: "projectId", label: "Projeto", type: "select", required: true, options: links.projects.map(p => ({ value: p.id, label: p.titulo })) },
      { key: "details.deliverableVersion", label: "Versão do material", required: true, defaultValue: "1" },
      { key: "details.assetUrl", label: "Link do material", type: "url", help: "Ou associe o arquivo ao pedido pela Central de arquivos." },
      { key: "dueDate", label: "Prazo de retorno", type: "date" },
      { key: "details.instructions", label: "O que deve ser aprovado", type: "textarea", required: true },
      { key: "details.reviewer", label: "Nome de quem respondeu pelo cliente" }, { key: "details.response", label: "Resposta e alterações solicitadas", type: "textarea" },
      { key: "details.evidenceUrl", label: "Link da evidência do retorno", type: "url" },
    ]} prepare={(input, editing) => {
      const problem = approvalDecisionError({ status: input.status ?? "pendente", details: input.details });
      if (problem) throw new Error(problem);
      if (input.details?.assetUrl && !safeWebUrl(input.details.assetUrl)) throw new Error("Informe um link HTTP ou HTTPS válido para o material.");
      return { ...input, clientId: links.projects.find(p => p.id === input.projectId)?.clienteId ?? null, details: { ...input.details, respondedAt: input.status === "pendente" ? null : editing && editing.status === input.status ? editing.details.respondedAt ?? new Date().toISOString() : new Date().toISOString() } };
    }} renderRecord={r => <div className="mt-3 space-y-2 text-sm text-muted-foreground"><p>{links.projects.find(p => p.id === r.projectId)?.titulo ?? "Projeto"} · versão {text(r, "deliverableVersion")}</p><p className="whitespace-pre-wrap break-words">{text(r, "instructions")}</p>{r.dueDate && <p>Retorno esperado: {formatarData(r.dueDate)}</p>}<ExternalEvidence value={r.details.assetUrl} label="Abrir material" />{text(r, "reviewer") && <p className="text-foreground">Resposta de {text(r, "reviewer")}</p>}{text(r, "response") && <p className="whitespace-pre-wrap break-words">{text(r, "response")}</p>}<ExternalEvidence value={r.details.evidenceUrl} label="Ver evidência" /></div>} />
  </div>;
}

function ChecklistItems({ record }: { record: WorkspaceRecord }) {
  const { profile, configured, isPreview } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const items = readChecklist(record.details.items);
  const progress = checklistProgress(items);
  async function toggle(id: string, checked: boolean) {
    if (!profile?.id || busy) return;
    setBusy(true); setError("");
    try {
      const next = updateChecklist(items, id, checked, profile.id, new Date().toISOString());
      const done = checklistProgress(next);
      await saveRecord({ ...record, status: done === 100 ? "concluido" : done ? "em_andamento" : "aberto", details: { ...record.details, items: next } }, record.id, record.version);
    } catch (e) { setError(message(e)); } finally { setBusy(false); }
  }
  return <div className="mt-3 space-y-3"><div className="flex justify-between text-xs text-muted-foreground"><span>{items.filter(i => i.done).length} de {items.length} verificados</span><span>{progress ?? 0}%</span></div><div className="h-1.5 overflow-hidden rounded bg-secondary"><div className="h-full bg-[var(--frame-red)] transition-[width]" style={{ width: `${progress ?? 0}%` }} /></div><ul className="space-y-1">{items.map(item => <li key={item.id}><label className="flex min-h-11 cursor-pointer items-start gap-3 rounded-lg p-2 hover:bg-secondary"><input type="checkbox" className="mt-0.5 h-5 w-5 shrink-0 accent-red-600" checked={item.done} disabled={busy || !configured || isPreview || !profile} onChange={e => void toggle(item.id, e.target.checked)} /><span className={`break-words text-sm ${item.done ? "text-muted-foreground line-through" : ""}`}>{item.label}</span></label></li>)}</ul>{error && <p role="alert" className="text-sm text-red-300">{error}</p>}{busy && <p role="status" className="text-xs text-muted-foreground">Salvando verificação…</p>}</div>;
}

export function QualidadeView() {
  const links = useWorkspaceLinks();
  const templates = useRecords("quality_template");
  const checks = useRecords("quality_check");
  const active = checks.records.filter(r => !r.archivedAt);
  return <div className="space-y-6">
    <ModuleHeader eyebrow="Operacional · Qualidade" title="Qualidade e processos" description="Transforme padrões de entrega em checklists por projeto. Cada verificação registra o responsável e o momento da conclusão." />
    <div className="grid gap-3 sm:grid-cols-3"><Metric label="Checklists de projeto" value={active.length} /><Metric label="Concluídos" value={active.filter(r => checklistProgress(readChecklist(r.details.items)) === 100).length} /><Metric label="Itens pendentes" value={active.reduce((n, r) => n + readChecklist(r.details.items).filter(i => !i.done).length, 0)} /></div>
    <WorkspaceNotice loading={links.loading || templates.loading || checks.loading} error={links.error || templates.error || checks.error} />
    <RecordManager kind="quality_check" title="Verificação das entregas" titleLabel="Nome do checklist" statuses={[{ value: "aberto", label: "Aberto" }, { value: "em_andamento", label: "Em andamento" }, { value: "concluido", label: "Concluído" }]} fields={[
      { key: "projectId", label: "Projeto", type: "select", required: true, options: links.projects.map(p => ({ value: p.id, label: p.titulo })) },
      { key: "parentId", label: "Modelo de checklist", type: "select", required: true, options: templates.records.filter(r => (!r.archivedAt && r.status === "ativo") || checks.records.some(check => check.parentId === r.id)).map(r => ({ value: r.id, label: r.title + (r.archivedAt || r.status !== "ativo" ? " (inativo)" : "") })), help: "Os itens são copiados ao criar. Alterações futuras no modelo não mudam verificações existentes." },
      { key: "ownerId", label: "Responsável pela revisão", type: "select", options: links.members.map(m => ({ value: m.id, label: m.fullName })) },
      { key: "dueDate", label: "Prazo da revisão", type: "date" }, { key: "details.notes", label: "Observações da revisão", type: "textarea" },
    ]} prepare={(input, editing) => {
      if (editing && input.parentId !== editing.parentId) throw new Error("Crie outro checklist para usar um modelo diferente e preservar o histórico desta revisão.");
      const template = templates.records.find(r => r.id === input.parentId);
      if (!editing && (!template || template.archivedAt || template.status !== "ativo")) throw new Error("Selecione um modelo ativo. Cadastre o primeiro modelo abaixo, se necessário.");
      const items = editing ? readChecklist(editing.details.items) : parseChecklistTemplate(String(template?.details.templateText ?? ""));
      const progress = checklistProgress(items);
      return { ...input, status: progress === 100 ? "concluido" : progress ? "em_andamento" : "aberto", details: { ...input.details, items, templateName: editing?.details.templateName ?? template?.title } };
    }} renderRecord={record => <><p className="mt-3 text-xs text-muted-foreground">{links.projects.find(p => p.id === record.projectId)?.titulo ?? "Projeto"} · {text(record, "templateName")}</p><ChecklistItems record={record} /></>} />
    <RecordManager kind="quality_template" title="Modelos de processo" titleLabel="Nome do modelo" description="Mantenha os padrões reutilizáveis da equipe. Escreva uma verificação por linha." statuses={[{ value: "ativo", label: "Ativo" }, { value: "inativo", label: "Inativo" }]} fields={[
      { key: "details.templateText", label: "Itens do checklist", type: "textarea", required: true, placeholder: "Conferir áudio e legendas\nValidar identidade visual\nRevisar formato de exportação" },
      { key: "details.description", label: "Quando usar este processo", type: "textarea" },
    ]} prepare={input => { parseChecklistTemplate(String(input.details?.templateText ?? "")); return input; }} renderRecord={r => <p className="mt-3 whitespace-pre-wrap break-words text-sm text-muted-foreground">{text(r, "templateText")}</p>} />
  </div>;
}

export function FrameContentView() {
  const links = useWorkspaceLinks();
  const store = useRecords("content");
  const [month, setMonth] = useState(() => dateKey(new Date()).slice(0, 7));
  const [selectedDay, setSelectedDay] = useState("");
  const active = store.records.filter(r => !r.archivedAt && r.status !== "cancelado");
  const monthRecords = active.filter(r => contentDate(r)?.startsWith(month));
  const monthLabel = new Date(`${month}-15T12:00:00Z`).toLocaleDateString("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" });
  function changeMonth(delta: number) { const d = new Date(`${month}-15T12:00:00Z`); d.setUTCMonth(d.getUTCMonth() + delta); setMonth(d.toISOString().slice(0, 7)); setSelectedDay(""); }
  const fields: RecordField[] = [
    { key: "clientId", label: "Cliente", type: "select", options: links.clients.map(c => ({ value: c.id, label: c.nomeFantasia })) },
    { key: "projectId", label: "Projeto", type: "select", options: links.projects.map(p => ({ value: p.id, label: p.titulo })) },
    { key: "details.channel", label: "Canal", type: "select", required: true, options: ["Instagram", "LinkedIn", "YouTube", "TikTok", "Facebook", "Blog", "E-mail", "Outro"].map(s => ({ value: s, label: s })) },
    { key: "details.format", label: "Formato", type: "select", options: ["Vídeo", "Reels/Shorts", "Carrossel", "Imagem", "Artigo", "Story", "Outro"].map(s => ({ value: s, label: s })) },
    { key: "dueDate", label: "Data da publicação", type: "date" },
    { key: "ownerId", label: "Responsável", type: "select", options: links.members.map(m => ({ value: m.id, label: m.fullName })) },
    { key: "details.copy", label: "Texto e roteiro", type: "textarea", required: true }, { key: "details.assetUrl", label: "Link dos materiais", type: "url" },
    { key: "details.approvedBy", label: "Nome do responsável pela aprovação" }, { key: "details.feedback", label: "Observações da aprovação", type: "textarea" },
    { key: "details.publicationUrl", label: "URL publicada", type: "url", help: "Obrigatória para concluir como publicado." },
  ];
  return <div className="space-y-6">
    <ModuleHeader eyebrow="Operacional · Conteúdo" title="Frame Content" description="Planejamento editorial, revisão e registro de publicações em uma única agenda." actions={<div className="flex flex-wrap gap-2"><Button variant="outline" disabled={store.loading || Boolean(store.error)} onClick={() => downloadText(`frame-content-${month}.ics`, exportContentIcs(monthRecords), "text/calendar;charset=utf-8")}><CalendarDays className="h-4 w-4" />Exportar agenda</Button><Button variant="outline" disabled={store.loading || Boolean(store.error)} onClick={() => downloadText(`frame-content-${month}.csv`, exportContentCsv(monthRecords), "text/csv;charset=utf-8")}>CSV</Button></div>} />
    <div className="grid gap-3 sm:grid-cols-3"><Metric label="Planejados no mês" value={monthRecords.length} /><Metric label="Em revisão" value={monthRecords.filter(r => r.status === "revisao").length} /><Metric label="Publicados no mês" value={monthRecords.filter(r => r.status === "publicado").length} /></div>
    <WorkspaceNotice loading={store.loading || links.loading} error={store.error || links.error} />
    <Panel title="Calendário editorial"><div className="mb-4 flex items-center justify-between gap-2"><Button variant="outline" size="icon" aria-label="Mês anterior" onClick={() => changeMonth(-1)}><ChevronLeft className="h-4 w-4" /></Button><h3 className="text-center text-sm font-medium capitalize">{monthLabel}</h3><Button variant="outline" size="icon" aria-label="Próximo mês" onClick={() => changeMonth(1)}><ChevronRight className="h-4 w-4" /></Button></div><div className="grid grid-cols-7 gap-1 text-center">{["D", "S", "T", "Q", "Q", "S", "S"].map((d, i) => <span key={i} className="pb-2 text-xs text-muted-foreground">{d}</span>)}{calendarMonthDays(month).map(day => { const count = active.filter(r => contentDate(r) === day).length; return <button key={day} type="button" aria-label={`${formatarData(day)}, ${count} conteúdo${count === 1 ? "" : "s"}`} aria-pressed={selectedDay === day} onClick={() => setSelectedDay(selectedDay === day ? "" : day)} className={`flex min-h-12 min-w-0 flex-col items-center justify-center rounded-lg border px-1 py-2 text-xs transition-colors sm:min-h-16 ${selectedDay === day ? "border-red-500 bg-red-950/50" : "border-border hover:bg-secondary"} ${day.startsWith(month) ? "" : "text-muted-foreground opacity-50"}`}><span>{Number(day.slice(-2))}</span>{count > 0 && <span className="mt-1 rounded bg-red-950 px-1.5 py-0.5 text-[10px] text-red-200">{count}</span>}</button>; })}</div>{selectedDay && <Button className="mt-4" variant="outline" onClick={() => setSelectedDay("")}>Limpar filtro de {formatarData(selectedDay)}</Button>}<p className="mt-4 text-xs leading-relaxed text-muted-foreground">A agenda organiza a publicação pela equipe. Após publicar no canal, registre a URL para concluir o conteúdo.</p></Panel>
    <RecordManager kind="content" title={selectedDay ? `Conteúdos de ${formatarData(selectedDay)}` : "Pautas e publicações"} description="Do rascunho ao link publicado, com aprovação e histórico de versões." statuses={CONTENT_STATUS} defaults={{ dueDate: selectedDay || undefined }} filter={r => !selectedDay || contentDate(r) === selectedDay} fields={fields} prepare={(input, editing) => {
      const problem = contentWorkflowError({ status: input.status ?? "ideia", dueDate: input.dueDate, details: input.details });
      if (problem) throw new Error(problem);
      if (input.details?.assetUrl && !safeWebUrl(input.details.assetUrl)) throw new Error("Informe um link HTTP ou HTTPS válido para os materiais.");
      const project = links.projects.find(p => p.id === input.projectId);
      if (project && input.clientId && project.clienteId !== input.clientId) throw new Error("O projeto selecionado pertence a outro cliente.");
      return { ...input, clientId: project?.clienteId ?? input.clientId, details: { ...input.details, publishedAt: input.status === "publicado" ? editing?.details.publishedAt ?? new Date().toISOString() : null } };
    }} renderRecord={r => <div className="mt-3 space-y-2 text-sm text-muted-foreground"><p>{text(r, "channel")} · {text(r, "format")}{r.dueDate ? ` · ${formatarData(r.dueDate)}` : " · Sem data"}</p><p className="whitespace-pre-wrap break-words">{text(r, "copy")}</p><ExternalEvidence value={r.details.assetUrl} label="Abrir materiais" /><ExternalEvidence value={r.details.publicationUrl} label="Ver publicação" /></div>} />
  </div>;
}

function fileSize(value: number) { return value >= 1024 * 1024 ? `${(value / 1024 / 1024).toFixed(1)} MB` : `${Math.ceil(value / 1024)} KB`; }

export function ArquivosView() {
  const { session, profile, configured, isPreview } = useAuth();
  const userId = !isPreview ? session?.user.id : null;
  const identity = JSON.stringify([configured, userId ?? null, profile?.id === userId ? profile?.role : null]);
  // Reset files, selected uploads and dialogs together when the account changes.
  return <ArquivosLibrary key={identity} canQuery={Boolean(configured && userId)} />;
}

function ArquivosLibrary({ canQuery }: { canQuery: boolean }) {
  const links = useWorkspaceLinks();
  const related = useRecords(["approval", "contract", "content"]);
  const { configured, isPreview } = useAuth();
  const [projectId, setProjectId] = useState("");
  const [recordId, setRecordId] = useState("");
  const [query, setQuery] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [files, setFiles] = useState<WorkspaceFile[]>([]);
  const [loading, setLoading] = useState(canQuery);
  const [file, setFile] = useState<File | null>(null);
  const [tick, setTick] = useState(0);
  const [inputKey, setInputKey] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [loadError, setLoadError] = useState(canQuery ? "" : "Entre com sua conta para carregar os arquivos.");
  const [success, setSuccess] = useState("");
  const [archiveTarget, setArchiveTarget] = useState<WorkspaceFile | null>(null);
  const prefix = useId();
  useEffect(() => {
    if (!canQuery) return;
    let active = true;
    listFiles().then(next => { if (active) { setFiles(next); setLoadError(""); } }).catch(e => { if (active) setLoadError(message(e)); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [tick, canQuery]);
  const visible = files.filter(f => Boolean(f.archivedAt) === showArchived && (!projectId || f.projectId === projectId) && (!query || f.name.toLocaleLowerCase("pt-BR").includes(query.toLocaleLowerCase("pt-BR"))));
  function refresh() { setLoading(true); setTick(t => t + 1); }
  async function upload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file || !projectId || busy) return;
    if (file.size > 50 * 1024 * 1024) { setError("Cada arquivo pode ter até 50 MB."); return; }
    if (!file.size) { setError("O arquivo está vazio."); return; }
    setBusy(true); setError(""); setSuccess("");
    try {
      const version = 1 + Math.max(0, ...files.filter(f => f.projectId === projectId && f.name === file.name).map(f => f.version));
      const saved = await uploadFile(file, { projectId, clientId: links.projects.find(p => p.id === projectId)?.clienteId, recordId: recordId || undefined, version });
      setFile(null); setInputKey(k => k + 1); setSuccess(`Arquivo enviado como versão ${saved.version}.`); refresh();
    } catch (e) { setError(message(e)); } finally { setBusy(false); }
  }
  async function download(target: WorkspaceFile) {
    setBusy(true); setError("");
    try { const url = await getFileUrl(target); const a = document.createElement("a"); a.href = url; a.target = "_blank"; a.rel = "noopener noreferrer"; a.download = target.name; a.click(); } catch (e) { setError(message(e)); } finally { setBusy(false); }
  }
  async function archive(target: WorkspaceFile, restore = false) {
    setBusy(true); setError("");
    try { if (restore) await restoreFile(target); else await archiveFile(target); setArchiveTarget(null); refresh(); } catch (e) { setError(message(e)); } finally { setBusy(false); }
  }
  return <div className="space-y-6">
    <ModuleHeader eyebrow="Operacional · Arquivos" title="Central de arquivos" description="Materiais privados por projeto, com versões preservadas e acesso pela sua conta." />
    <div className="grid gap-3 sm:grid-cols-3"><Metric label="Arquivos ativos" value={files.filter(f => !f.archivedAt).length} /><Metric label="Volume armazenado" value={fileSize(files.reduce((n, f) => n + f.size, 0))} detail="Inclui versões e arquivos arquivados" /><Metric label="Projetos com arquivos" value={new Set(files.filter(f => !f.archivedAt).map(f => f.projectId)).size} /></div>
    <WorkspaceNotice loading={links.loading} error={links.error || related.error} />
    <Panel title="Enviar arquivo"><form onSubmit={upload} className="grid gap-4 sm:grid-cols-2"><div><label htmlFor={`${prefix}-project`} className="mb-2 block text-sm">Projeto</label><select id={`${prefix}-project`} className={selectClass} required value={projectId} onChange={e => { setProjectId(e.target.value); setRecordId(""); }}><option value="">Selecione um projeto</option>{links.projects.map(p => <option key={p.id} value={p.id}>{p.titulo}</option>)}</select></div><div><label htmlFor={`${prefix}-record`} className="mb-2 block text-sm">Associar a um registro (opcional)</label><select id={`${prefix}-record`} className={selectClass} value={recordId} onChange={e => setRecordId(e.target.value)}><option value="">Somente projeto</option>{related.records.filter(r => !r.archivedAt && (!r.projectId || r.projectId === projectId)).map(r => <option key={r.id} value={r.id}>{r.title}</option>)}</select></div><div className="min-w-0 sm:col-span-2"><label htmlFor={`${prefix}-file`} className="mb-2 block text-sm">Arquivo · até 50 MB</label><input key={inputKey} id={`${prefix}-file`} type="file" required onChange={e => setFile(e.target.files?.[0] ?? null)} className="min-h-11 w-full min-w-0 rounded-lg border border-border bg-secondary p-2 text-sm file:mr-3 file:rounded file:border-0 file:bg-red-950 file:px-3 file:py-1.5 file:text-red-100" /><p className="mt-2 text-xs leading-relaxed text-muted-foreground">Um arquivo com o mesmo nome no projeto cria uma nova versão e mantém as anteriores.</p></div><Button type="submit" disabled={busy || !configured || isPreview || !file || !projectId} className="sm:col-span-2"><Upload className="h-4 w-4" />{busy ? "Processando…" : "Enviar arquivo"}</Button></form>{success && <p role="status" className="mt-3 flex items-center gap-2 text-sm text-green-300"><CheckCircle2 className="h-4 w-4" />{success}</p>}</Panel>
    {(error || loadError) && <p role="alert" className="rounded-xl border border-red-500/50 bg-red-950/20 p-4 text-sm">{error || loadError}</p>}
    <Panel title="Biblioteca"><div className="mb-5 flex flex-wrap gap-3"><Input aria-label="Buscar arquivo pelo nome" placeholder="Buscar arquivo…" value={query} onChange={e => setQuery(e.target.value)} className="min-w-0 flex-1" /><Button variant="outline" aria-pressed={showArchived} onClick={() => setShowArchived(s => !s)}><Archive className="h-4 w-4" />{showArchived ? "Mostrar ativos" : "Arquivados"}</Button>{projectId && <Button variant="outline" onClick={() => { setProjectId(""); setRecordId(""); }}>Todos os projetos</Button>}<Button variant="outline" onClick={refresh} disabled={loading}>Atualizar</Button></div><WorkspaceNotice loading={loading}><div className="space-y-3">{visible.map(item => <article key={item.id} className="flex min-w-0 flex-col gap-3 rounded-xl border border-border p-4 sm:flex-row sm:items-center"><FileText className="h-5 w-5 shrink-0 text-red-400" /><div className="min-w-0 flex-1"><h3 className="break-all text-sm font-medium">{item.name}</h3><p className="mt-1 break-words text-xs leading-relaxed text-muted-foreground">{links.projects.find(p => p.id === item.projectId)?.titulo ?? "Projeto"} · v{item.version} · {fileSize(item.size)} · {formatarData(item.createdAt)}</p></div><div className="flex shrink-0 flex-wrap gap-2"><Button aria-label={`Baixar ${item.name}, versão ${item.version}`} variant="outline" disabled={busy} onClick={() => void download(item)}><ArrowDownToLine className="h-4 w-4" />Baixar</Button><Button variant="outline" disabled={busy} onClick={() => item.archivedAt ? void archive(item, true) : setArchiveTarget(item)}>{item.archivedAt ? <RotateCcw className="h-4 w-4" /> : <Archive className="h-4 w-4" />}{item.archivedAt ? "Restaurar" : "Arquivar"}</Button></div></article>)}</div>{!visible.length && <div className="flex flex-col items-center gap-3 py-10 text-center text-sm text-muted-foreground"><FolderOpen className="h-7 w-7" />Nenhum arquivo encontrado neste filtro.</div>}</WorkspaceNotice></Panel>
    <Dialog open={Boolean(archiveTarget)} onOpenChange={open => { if (!open && !busy) setArchiveTarget(null); }}><DialogContent><DialogHeader><DialogTitle>Arquivar arquivo</DialogTitle><DialogDescription>O arquivo {archiveTarget?.name} continuará armazenado e poderá ser restaurado na lista de arquivados.</DialogDescription></DialogHeader><DialogFooter><Button variant="outline" disabled={busy} onClick={() => setArchiveTarget(null)}>Cancelar</Button><Button disabled={busy} onClick={() => archiveTarget && void archive(archiveTarget)}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}Arquivar</Button></DialogFooter></DialogContent></Dialog>
  </div>;
}
