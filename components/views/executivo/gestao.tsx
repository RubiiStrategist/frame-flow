"use client";

import { useState, type ReactNode } from "react";
import { ArrowUpRight, Check, FileDown, Loader2, Target } from "lucide-react";
import { ModuleHeader } from "@/components/common/frame-primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RecordManager, WorkspaceNotice, downloadText, type RecordField, type RecordOption } from "@/components/workspace/record-manager";
import { useAuth } from "@/lib/frameflow/auth";
import { useAsyncList, useData } from "@/lib/frameflow/data";
import { formatarBRL } from "@/lib/frameflow/format";
import { navigate } from "@/lib/frameflow/router";
import { contractDocument, contractRenewalState, executivePipeline, keyResultProgress, objectiveProgress, operationalCapacity, safeDocumentUrl, validateKeyResult } from "@/lib/frameflow/executive";
import { useRecords, useWorkspaceLinks, listModuleAccess, setModuleAccess, type RecordInput, type WorkspaceRecord } from "@/lib/frameflow/workspace";
import { WORKSPACE_KINDS, KIND_LABELS } from "@/lib/frameflow/workspace-schema";
import type { EnvironmentId } from "@/lib/frameflow/types";

const selectClass = "min-h-11 w-full min-w-0 rounded-lg border border-border bg-secondary px-3 text-sm";
const panelClass = "min-w-0 rounded-2xl border border-border bg-card p-5";
const statusOptions: RecordOption[] = [{ value: "planejado", label: "Planejado" }, { value: "em_andamento", label: "Em andamento" }, { value: "concluido", label: "Concluído" }, { value: "cancelado", label: "Cancelado" }];

function Summary({ children }: { children: ReactNode }) { return <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{children}</div>; }
function Metric({ label, value, note }: { label: string; value: string | number; note?: string }) { return <div className={panelClass}><p className="text-xs text-muted-foreground">{label}</p><p className="mt-3 break-words text-2xl font-semibold tracking-tight">{value}</p>{note && <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{note}</p>}</div>; }
function Progress({ value }: { value: number | null }) { return <div className="space-y-2"><div className="flex justify-between text-xs text-muted-foreground"><span>Progresso medido</span><strong className="text-foreground">{value === null ? "Sem medição" : `${value}%`}</strong></div><div className="h-2 overflow-hidden rounded-full bg-secondary"><div className="h-full rounded-full bg-[var(--frame-red)] transition-[width] duration-500 motion-reduce:transition-none" style={{ width: `${value ?? 0}%` }} /></div></div>; }
function SmallDetails({ values }: { values: [string, ReactNode][] }) { return <dl className="grid min-w-0 gap-3 sm:grid-cols-2">{values.map(([label, value]) => <div className="min-w-0" key={label}><dt className="text-xs text-muted-foreground">{label}</dt><dd className="mt-1 whitespace-pre-wrap break-words">{value ?? "—"}</dd></div>)}</dl>; }
function recordInput(record: WorkspaceRecord): RecordInput { return { kind: record.kind, title: record.title, status: record.status, amount: record.amount, clientId: record.clientId, projectId: record.projectId, leadId: record.leadId, ownerId: record.ownerId, parentId: record.parentId, startDate: record.startDate, dueDate: record.dueDate, details: { ...record.details } }; }
const dateLabel = (value: string | null) => value ? value.slice(0, 10).split("-").reverse().join("/") : "Sem prazo";

export function PlanejamentoView() {
  const store = useRecords(["objective", "key_result"]);
  const links = useWorkspaceLinks();
  const [objectiveId, setObjectiveId] = useState("");
  const [checkIn, setCheckIn] = useState<WorkspaceRecord | null>(null);
  const [current, setCurrent] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const active = store.records.filter(r => !r.archivedAt);
  const objectives = active.filter(r => r.kind === "objective");
  const results = active.filter(r => r.kind === "key_result");
  const ownerOptions = links.members.map(m => ({ value: m.id, label: m.fullName }));
  const objectiveFields: RecordField[] = [
    { key: "details.description", label: "Resultado que queremos alcançar", type: "textarea", required: true },
    { key: "ownerId", label: "Responsável", type: "select", options: ownerOptions },
    { key: "startDate", label: "Início do ciclo", type: "date", required: true },
    { key: "dueDate", label: "Fim do ciclo", type: "date", required: true },
    { key: "details.priority", label: "Prioridade", type: "select", options: [{ value: "alta", label: "Alta" }, { value: "media", label: "Média" }, { value: "baixa", label: "Baixa" }], defaultValue: "media" },
  ];
  const resultFields: RecordField[] = [
    { key: "parentId", label: "Objetivo", type: "select", required: true, options: objectives.map(r => ({ value: r.id, label: r.title })) },
    { key: "ownerId", label: "Responsável", type: "select", options: ownerOptions },
    { key: "details.unit", label: "Unidade de medida", placeholder: "%, clientes, R$, dias…", required: true },
    { key: "details.baseline", label: "Valor inicial", type: "number", required: true, defaultValue: 0 },
    { key: "details.target", label: "Meta", type: "number", required: true },
    { key: "details.current", label: "Medição atual", type: "number", required: true, defaultValue: 0 },
    { key: "details.weight", label: "Peso no objetivo", type: "number", min: 0.01, defaultValue: 1, required: true },
    { key: "dueDate", label: "Prazo", type: "date", required: true },
    { key: "details.checkInNote", label: "Nota da medição / evidência", type: "textarea", required: true },
  ];
  async function saveCheckIn(event: React.FormEvent) {
    event.preventDefault();
    if (!checkIn || busy) return;
    setBusy(true); setError("");
    try {
      const details = { ...checkIn.details, current: Number(current), checkInNote: note.trim(), lastCheckIn: new Date().toISOString() };
      validateKeyResult(details);
      if (!note.trim()) throw new Error("Explique a medição ou registre sua evidência.");
      await store.save({ ...recordInput(checkIn), details }, checkIn.id, checkIn.version);
      setCheckIn(null);
    } catch (err) { setError(err instanceof Error ? err.message : "Não foi possível salvar a medição."); }
    finally { setBusy(false); }
  }
  return <div className="space-y-8">
    <ModuleHeader eyebrow="Executivo · Estratégia" title="Planejamento estratégico" description="Objetivos, resultados-chave e check-ins da FRAME VISION, com progresso calculado a partir das medições registradas." />
    <WorkspaceNotice error={store.error} loading={store.loading}><Summary><Metric label="Objetivos ativos" value={objectives.filter(r => !["concluido", "cancelado"].includes(r.status)).length} /><Metric label="Resultados-chave" value={results.filter(r => r.status !== "cancelado").length} /><Metric label="Resultados na meta" value={results.filter(r => r.status !== "cancelado" && keyResultProgress(r.details) === 100).length} /><Metric label="Objetivos concluídos" value={objectives.filter(r => r.status === "concluido").length} /></Summary></WorkspaceNotice>
    <RecordManager kind="objective" title="Objetivos e ciclos" titleLabel="Objetivo" description="Defina o destino e o ciclo. Cada resultado-chave pode ter um peso diferente no progresso." fields={objectiveFields} statuses={statusOptions} renderRecord={record => <div className="space-y-4"><p>{String(record.details.description ?? "")}</p><SmallDetails values={[["Responsável", links.members.find(m => m.id === record.ownerId)?.fullName ?? "Sem responsável"], ["Ciclo", `${dateLabel(record.startDate)} → ${dateLabel(record.dueDate)}`]]} /><Progress value={objectiveProgress(record.id, store.records)} /></div>} renderActions={record => <Button className="min-h-11" size="sm" variant="outline" onClick={() => setObjectiveId(record.id)}><Target size={14} />Ver resultados</Button>} />
    <section className="space-y-5" aria-label="Resultados-chave"><label className="block max-w-md space-y-2"><span className="text-sm">Filtrar resultados por objetivo</span><select className={selectClass} value={objectiveId} onChange={e => setObjectiveId(e.target.value)}><option value="">Todos os objetivos</option>{objectives.map(r => <option value={r.id} key={r.id}>{r.title}</option>)}</select></label><RecordManager kind="key_result" title="Resultados-chave e medições" titleLabel="Resultado-chave" description="Para metas de redução, informe um alvo menor que o valor inicial. O histórico preserva todas as medições." fields={resultFields} statuses={statusOptions} defaults={{ parentId: objectiveId || null }} filter={record => !objectiveId || record.parentId === objectiveId} prepare={input => { validateKeyResult(input.details ?? {}); return { ...input, details: { ...input.details, lastCheckIn: new Date().toISOString() } }; }} renderRecord={record => <div className="space-y-4"><SmallDetails values={[["Objetivo", objectives.find(r => r.id === record.parentId)?.title ?? "Objetivo arquivado"], ["Medição / meta", `${record.details.current ?? "—"} / ${record.details.target ?? "—"} ${record.details.unit ?? ""}`], ["Prazo", dateLabel(record.dueDate)], ["Última evidência", String(record.details.checkInNote ?? "—")]]} /><Progress value={keyResultProgress(record.details)} /></div>} renderActions={record => <Button className="min-h-11" size="sm" variant="outline" onClick={() => { setCheckIn(record); setCurrent(String(record.details.current ?? "")); setNote(""); setError(""); }}>Registrar check-in</Button>} /></section>
    <Dialog open={Boolean(checkIn)} onOpenChange={value => { if (!busy && !value) setCheckIn(null); }}><DialogContent className="rounded-2xl bg-card"><DialogHeader><DialogTitle>Check-in · {checkIn?.title}</DialogTitle><DialogDescription>Atualize a medição e deixe uma evidência para a equipe.</DialogDescription></DialogHeader><form onSubmit={saveCheckIn} className="space-y-4"><label className="block space-y-2"><span className="text-sm">Medição atual *</span><Input type="number" step="any" required value={current} onChange={e => setCurrent(e.target.value)} /></label><label className="block space-y-2"><span className="text-sm">Evidência / comentário *</span><Textarea required maxLength={3000} value={note} onChange={e => setNote(e.target.value)} /></label>{error && <p role="alert" className="text-sm text-red-300">{error}</p>}<DialogFooter><Button type="button" variant="outline" disabled={busy} onClick={() => setCheckIn(null)}>Cancelar</Button><Button type="submit" disabled={busy}>{busy ? "Salvando…" : "Salvar medição"}</Button></DialogFooter></form></DialogContent></Dialog>
  </div>;
}

function ModuleAccessEditor() {
  const { profile } = useAuth();
  const links = useWorkspaceLinks();
  const [userId, setUserId] = useState("");
  const [access, setAccess] = useState<Awaited<ReturnType<typeof listModuleAccess>>>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const canManage = !!profile && ["ceo", "cro", "coo_cfo"].includes(profile.role);
  if (!canManage) return null;
  async function load(id: string) {
    setUserId(id); setAccess([]); setError(""); setMessage("");
    if (!id) return;
    setLoading(true);
    try { setAccess(await listModuleAccess(id)); }
    catch (err) { setError(err instanceof Error ? err.message : "Não foi possível carregar as permissões."); }
    finally { setLoading(false); }
  }
  async function save(kind: string, canRead: boolean, canWrite: boolean) {
    if (!userId || saving) return;
    setSaving(kind); setError(""); setMessage("");
    try {
      await setModuleAccess(userId, kind, canRead, canWrite);
      setAccess(current => [...current.filter(r => r.kind !== kind), { kind, canRead, canWrite }]);
      setMessage("Permissão salva.");
    } catch (err) { setError(err instanceof Error ? err.message : "Não foi possível salvar a permissão."); }
    finally { setSaving(""); }
  }
  return <section className={`${panelClass} space-y-4`} aria-label="Acesso aos novos módulos"><div><h2 className="text-xl font-semibold">Acesso aos novos módulos</h2><p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">Defina leitura e edição nos módulos de gestão adicionados à plataforma. Os cargos de login e as permissões dos módulos anteriores são administrados separadamente.</p></div><label className="block max-w-md space-y-2"><span className="text-sm">Conta da equipe</span><select className={selectClass} value={userId} disabled={loading || !!saving} onChange={e => load(e.target.value)}><option value="">Selecione uma conta</option>{links.members.filter(m => m.role === "colaborador").map(m => <option key={m.id} value={m.id}>{m.fullName}</option>)}</select></label><p className="text-xs leading-relaxed text-muted-foreground">Os sócios mantêm acesso completo. Esta lista contém contas de colaboradores já cadastradas na autenticação; cadastrar uma pessoa na equipe não cria uma conta de login.</p>{message && <p role="status" className="text-sm">{message}</p>}<WorkspaceNotice error={error} loading={loading}>{userId && <div className="grid gap-2 md:grid-cols-2">{[...WORKSPACE_KINDS, "files"].map(kind => {
    const rule = access.find(r => r.kind === kind);
    const read = rule?.canRead ?? kind !== "contract";
    const write = rule?.canWrite ?? kind !== "contract";
    return <div key={kind} className="flex min-w-0 flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-3"><span className="min-w-0 text-sm">{KIND_LABELS[kind]}</span><div className="flex gap-4"><label className="flex min-h-11 items-center gap-2 text-xs"><input type="checkbox" className="h-5 w-5 accent-red-600" checked={read} disabled={!!saving} onChange={e => save(kind, e.target.checked, e.target.checked && write)} />Ler</label><label className="flex min-h-11 items-center gap-2 text-xs"><input type="checkbox" className="h-5 w-5 accent-red-600" checked={write} disabled={!!saving} onChange={e => save(kind, read || e.target.checked, e.target.checked)} />Editar</label></div></div>;
  })}</div>}</WorkspaceNotice></section>;
}

export function EquipeView({ envId = "executivo" }: { envId?: EnvironmentId }) {
  const store = useRecords(["team_member", "team_activity"]);
  const links = useWorkspaceLinks();
  const [actionError, setActionError] = useState("");
  const [busyId, setBusyId] = useState("");
  const { profile } = useAuth();
  const matches = (record: WorkspaceRecord) => envId === "executivo" || record.details.department === envId;
  const members = store.records.filter(r => r.kind === "team_member" && !r.archivedAt && matches(r));
  const activities = store.records.filter(r => r.kind === "team_activity" && !r.archivedAt && (envId === "executivo" || recordDepartment(r) === envId));
  function recordDepartment(record: WorkspaceRecord) { return record.details.department ?? store.records.find(r => r.id === record.parentId)?.details.department; }
  const departments: RecordOption[] = [{ value: "executivo", label: "Executivo" }, { value: "comercial", label: "Comercial" }, { value: "operacional", label: "Operacional" }];
  const memberFields: RecordField[] = [
    { key: "details.department", label: "Área", type: "select", required: true, options: departments, defaultValue: envId === "portal" ? "operacional" : envId },
    { key: "details.position", label: "Função na equipe", required: true, placeholder: "Edição, atendimento, direção…" },
    { key: "details.email", label: "E-mail de contato", type: "email" },
    { key: "details.phone", label: "Telefone de contato" },
    { key: "ownerId", label: "Conta vinculada (opcional)", type: "select", options: links.members.map(m => ({ value: m.id, label: m.fullName })), help: "Vincula uma conta existente; não altera seu cargo de acesso." },
    { key: "startDate", label: "Data de entrada", type: "date" },
    { key: "details.weeklyHours", label: "Capacidade semanal (horas)", type: "number", min: 0, max: 168 },
    { key: "details.skills", label: "Especialidades", type: "textarea" },
    { key: "details.notes", label: "Observações de trabalho", type: "textarea", help: "Registre somente informações profissionais necessárias à gestão." },
  ];
  const activityFields: RecordField[] = [
    { key: "parentId", label: "Pessoa", type: "select", required: true, options: members.map(m => ({ value: m.id, label: m.title })) },
    { key: "details.activityType", label: "Tipo de atividade", type: "select", required: true, options: [{ value: "onboarding", label: "Onboarding" }, { value: "treinamento", label: "Treinamento" }, { value: "recrutamento", label: "Recrutamento" }, { value: "desenvolvimento", label: "Desenvolvimento" }] },
    { key: "ownerId", label: "Responsável", type: "select", options: links.members.map(m => ({ value: m.id, label: m.fullName })) },
    { key: "dueDate", label: "Prazo", type: "date", required: true },
    { key: "details.notes", label: "Orientação / registro do resultado", type: "textarea", required: true },
  ];
  async function complete(record: WorkspaceRecord) {
    if (busyId) return;
    setBusyId(record.id); setActionError("");
    try { await store.save({ ...recordInput(record), status: "concluido", details: { ...record.details, completedAt: new Date().toISOString(), completedBy: profile?.id ?? null } }, record.id, record.version); }
    catch (err) { setActionError(err instanceof Error ? err.message : "Não foi possível concluir a atividade."); }
    finally { setBusyId(""); }
  }
  const environmentLabel = departments.find(d => d.value === envId)?.label ?? "Executivo";
  return <div className="space-y-8"><ModuleHeader eyebrow={`${environmentLabel} · Equipe`} title={envId === "comercial" ? "Equipe comercial" : envId === "operacional" ? "Gestão de equipe" : "Pessoas e equipe"} description="Diretório profissional, responsabilidades, recrutamento, onboarding e desenvolvimento da equipe." /><WorkspaceNotice error={store.error || links.error} loading={store.loading || links.loading}><Summary><Metric label="Pessoas ativas" value={members.filter(m => m.status === "ativo").length} /><Metric label="Candidatos" value={members.filter(m => m.status === "candidato").length} /><Metric label="Atividades em aberto" value={activities.filter(a => !["concluido", "cancelado"].includes(a.status)).length} /><Metric label="Atividades concluídas" value={activities.filter(a => a.status === "concluido").length} /></Summary></WorkspaceNotice><RecordManager kind="team_member" title="Pessoas da equipe" titleLabel="Nome" fields={memberFields} statuses={[{ value: "ativo", label: "Ativo" }, { value: "candidato", label: "Candidato" }, { value: "ferias", label: "Férias / afastamento" }, { value: "inativo", label: "Inativo" }]} filter={matches} defaults={{ details: { department: envId } }} renderRecord={record => <SmallDetails values={[["Função", String(record.details.position ?? "—")], ["Área", departments.find(d => d.value === record.details.department)?.label ?? "—"], ["Contato", String(record.details.email ?? record.details.phone ?? "—")], ["Capacidade semanal", record.details.weeklyHours == null ? "Não informada" : `${record.details.weeklyHours} h`], ["Especialidades", String(record.details.skills ?? "—")], ["Conta vinculada", links.members.find(m => m.id === record.ownerId)?.fullName ?? "Sem conta vinculada"]]} />} />
    {actionError && <p role="alert" className="text-sm text-red-300">{actionError}</p>}
    <RecordManager kind="team_activity" title="Onboarding, treinamento e recrutamento" titleLabel="Atividade" description="Registre os passos e resultados de cada pessoa, com prazos e histórico." fields={activityFields} statuses={statusOptions} filter={record => envId === "executivo" || recordDepartment(record) === envId} prepare={input => ({ ...input, details: { ...input.details, department: store.records.find(r => r.id === input.parentId)?.details.department ?? envId } })} renderRecord={record => <SmallDetails values={[["Pessoa", store.records.find(r => r.id === record.parentId)?.title ?? "Pessoa arquivada"], ["Tipo", String(record.details.activityType ?? "—")], ["Prazo", dateLabel(record.dueDate)], ["Orientação / resultado", String(record.details.notes ?? "—")]]} />} renderActions={record => !["concluido", "cancelado"].includes(record.status) && <Button size="sm" variant="outline" className="min-h-11" disabled={!!busyId} onClick={() => complete(record)}>{busyId === record.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check size={14} />}Concluir</Button>} />
    <ModuleAccessEditor />
  </div>;
}

export function ContratosView() {
  const store = useRecords("contract");
  const links = useWorkspaceLinks();
  const contracts = store.records.filter(r => !r.archivedAt);
  const [filter, setFilter] = useState("");
  const renewalLabels = { sem_prazo: "Sem vencimento", encerrado: "Encerrado", vencido: "Vencido", renovar: "Vence em até 30 dias", vigente: "Vigência registrada" };
  const fields: RecordField[] = [
    { key: "clientId", label: "Cliente", type: "select", options: links.clients.map(c => ({ value: c.id, label: c.nomeFantasia })) },
    { key: "projectId", label: "Projeto", type: "select", options: links.projects.map(p => ({ value: p.id, label: p.titulo })) },
    { key: "details.counterparty", label: "Contraparte / representante", required: true },
    { key: "details.documentType", label: "Tipo de documento", type: "select", required: true, options: [{ value: "prestacao", label: "Prestação de serviços" }, { value: "imagem", label: "Uso de imagem" }, { value: "confidencialidade", label: "Confidencialidade" }, { value: "licenca", label: "Licenciamento" }, { value: "outro", label: "Outro" }] },
    { key: "ownerId", label: "Responsável interno", type: "select", options: links.members.map(m => ({ value: m.id, label: m.fullName })) },
    { key: "amount", label: "Valor registrado (R$)", type: "number", min: 0, defaultValue: 0 },
    { key: "startDate", label: "Início da vigência", type: "date" },
    { key: "dueDate", label: "Fim da vigência / renovação", type: "date" },
    { key: "details.scope", label: "Escopo e direitos envolvidos", type: "textarea", required: true },
    { key: "details.terms", label: "Condições negociadas", type: "textarea", required: true },
    { key: "details.body", label: "Texto do documento", type: "textarea", required: true },
    { key: "details.signatory", label: "Representante que assinou" },
    { key: "details.signedDate", label: "Data de assinatura informada", type: "date" },
    { key: "details.documentUrl", label: "Link do documento firmado", type: "url", help: "Use um endereço privado autorizado da empresa." },
  ];
  return <div className="space-y-8"><ModuleHeader eyebrow="Executivo · Jurídico" title="Jurídico e contratos" description="Biblioteca de contratos e documentos, vigências, responsáveis e versões. Cada edição preserva o conteúdo anterior no histórico." /><WorkspaceNotice error={store.error} loading={store.loading}><Summary><Metric label="Documentos" value={contracts.length} /><Metric label="Assinatura registrada" value={contracts.filter(r => r.status === "assinado").length} /><Metric label="Renovação em até 30 dias" value={contracts.filter(r => contractRenewalState(r.dueDate, r.status) === "renovar").length} /><Metric label="Vencidos" value={contracts.filter(r => contractRenewalState(r.dueDate, r.status) === "vencido").length} /></Summary></WorkspaceNotice><label className="block max-w-md space-y-2"><span className="text-sm">Filtrar vigência</span><select className={selectClass} value={filter} onChange={e => setFilter(e.target.value)}><option value="">Todas as vigências</option>{Object.entries(renewalLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><RecordManager kind="contract" title="Biblioteca de documentos" titleLabel="Nome do documento" fields={fields} statuses={[{ value: "rascunho", label: "Rascunho" }, { value: "em_revisao", label: "Em revisão" }, { value: "assinado", label: "Assinatura registrada" }, { value: "encerrado", label: "Encerrado" }, { value: "cancelado", label: "Cancelado" }]} filter={record => !filter || contractRenewalState(record.dueDate, record.status) === filter} prepare={input => {
      if (input.status === "assinado" && (!input.details?.signatory || !input.details?.signedDate)) throw new Error("Informe representante e data para registrar a assinatura.");
      if (input.clientId && input.projectId && links.projects.find(p => p.id === input.projectId)?.clienteId !== input.clientId) throw new Error("O projeto selecionado pertence a outro cliente.");
      return input;
    }} renderRecord={record => <div className="space-y-4"><p className="inline-block rounded-md border border-red-500/30 bg-red-950/20 px-2 py-1 text-xs">{renewalLabels[contractRenewalState(record.dueDate, record.status)]} · v{record.version}</p><SmallDetails values={[["Cliente / contraparte", links.clients.find(c => c.id === record.clientId)?.nomeFantasia ?? String(record.details.counterparty ?? "—")], ["Valor", formatarBRL(record.amount)], ["Vigência", `${dateLabel(record.startDate)} → ${dateLabel(record.dueDate)}`], ["Responsável", links.members.find(m => m.id === record.ownerId)?.fullName ?? "Sem responsável"], ["Escopo", String(record.details.scope ?? "—")]]} /></div>} renderActions={record => <><Button className="min-h-11" variant="outline" size="sm" onClick={() => downloadText(`contrato-${record.id}-v${record.version}.html`, contractDocument(record, links.clients.find(c => c.id === record.clientId)?.nomeFantasia ?? ""), "text/html;charset=utf-8")}><FileDown size={14} />Exportar documento</Button>{safeDocumentUrl(record.details.documentUrl) && <a href={safeDocumentUrl(record.details.documentUrl)!} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-md border border-border px-3 text-xs">Documento firmado<ArrowUpRight size={14}/></a>}</>} /><p className="text-xs leading-relaxed text-muted-foreground">O status de assinatura registra a informação fornecida pela equipe. A plataforma não certifica identidade ou validade da assinatura. O arquivo exportado pode ser aberto no navegador e impresso em PDF.</p></div>;
}

export function InteligenciaComercialView() {
  const data = useData();
  const leads = useAsyncList(data.listLeads);
  const proposals = useRecords("proposal");
  const metrics = executivePipeline(leads.result.data);
  const labels: Record<string, string> = { novo: "Novos", contato: "Contato", qualificado: "Qualificados", proposta: "Proposta", negociacao: "Negociação", ganho: "Ganhos", perdido: "Perdidos" };
  const error = leads.result.reason === "erro" ? leads.result.error ?? "Não foi possível carregar o funil." : proposals.error;
  const total = leads.result.data.length;
  const now = new Date();
  const contacts = leads.result.data.filter(l => l.proximoContato && new Date(l.proximoContato) < now && !["ganho", "perdido"].includes(l.etapa));
  return <div className="space-y-7"><ModuleHeader eyebrow="Executivo · Comercial" title="Inteligência comercial" description="Visão consolidada do funil e dos valores registrados pela equipe. Conversão calculada apenas entre oportunidades já encerradas." actions={<Button variant="outline" className="min-h-11" onClick={() => navigate("comercial", "funil")}>Abrir funil<ArrowUpRight size={15} /></Button>} /><WorkspaceNotice error={error} loading={leads.loading || proposals.loading}><Summary><Metric label="Pipeline aberto" value={formatarBRL(metrics.openValue)} note="Valores estimados das oportunidades ainda abertas." /><Metric label="Vendas ganhas" value={formatarBRL(metrics.wonValue)} note="Valor comercial registrado; não equivale a recebimentos." /><Metric label="Conversão de encerradas" value={metrics.conversion == null ? "Sem base" : `${metrics.conversion}%`} note={`${metrics.terminalCount} oportunidades ganhas ou perdidas.`} /><Metric label="Contatos atrasados" value={contacts.length} /></Summary><section className={`${panelClass} mt-6`}><h2 className="text-lg font-semibold">Distribuição do funil</h2><div className="mt-5 space-y-5">{metrics.stages.map(stage => <div key={stage.stage}><div className="mb-2 flex flex-wrap justify-between gap-2 text-sm"><span>{labels[stage.stage]} · {stage.count}</span><span className="text-muted-foreground">{formatarBRL(stage.amount)}</span></div><div className="h-2 rounded-full bg-secondary"><div className="h-full rounded-full bg-[var(--frame-red)]" style={{ width: `${total ? stage.count / total * 100 : 0}%` }} /></div></div>)}</div>{!total && <p className="mt-5 text-sm text-muted-foreground">Cadastre leads no Comercial para acompanhar a distribuição real.</p>}</section><section className="mt-6 grid gap-4 lg:grid-cols-2"><div className={panelClass}><h2 className="text-lg font-semibold">Propostas por situação</h2><div className="mt-4 space-y-3">{[{ status: "rascunho", label: "Rascunhos" }, { status: "enviada", label: "Enviadas" }, { status: "negociacao", label: "Em negociação" }, { status: "aceita", label: "Aceitas" }, { status: "recusada", label: "Recusadas" }].map(s => <div className="flex justify-between gap-3 border-b border-border pb-2 text-sm" key={s.status}><span>{s.label}</span><strong>{proposals.records.filter(r => !r.archivedAt && r.status === s.status).length}</strong></div>)}</div><Button variant="ghost" className="mt-4 min-h-11" onClick={() => navigate("comercial", "propostas")}>Gerenciar propostas<ArrowUpRight size={14} /></Button></div><div className={panelClass}><h2 className="text-lg font-semibold">Próximos contatos vencidos</h2>{contacts.length ? <ul className="mt-4 space-y-3">{contacts.slice(0, 8).map(lead => <li key={lead.id} className="border-b border-border pb-3 text-sm"><p className="font-medium">{lead.nome} · {lead.empresa}</p><p className="mt-1 text-xs text-muted-foreground">Prazo: {dateLabel(lead.proximoContato)}</p></li>)}</ul> : <p className="mt-4 text-sm text-muted-foreground">Nenhum contato vencido nas oportunidades abertas.</p>}<Button variant="ghost" className="mt-4 min-h-11" onClick={() => navigate("comercial", "prospeccao")}>Abrir prospecção<ArrowUpRight size={14} /></Button></div></section></WorkspaceNotice></div>;
}

export function GestaoOperacionalView() {
  const links = useWorkspaceLinks();
  const tasks = useAsyncList(useData().listTasks);
  const summary = operationalCapacity(links.projects, tasks.result.data);
  const error = links.error || (tasks.result.reason === "erro" ? tasks.result.error ?? "Não foi possível carregar as tarefas." : null);
  return <div className="space-y-7"><ModuleHeader eyebrow="Executivo · Operação" title="Gestão operacional" description="Capacidade, distribuição de trabalho e prazos da produção, reunidos a partir dos projetos e tarefas da equipe." actions={<Button className="min-h-11" variant="outline" onClick={() => navigate("operacional", "producao")}>Abrir produção<ArrowUpRight size={15} /></Button>} /><WorkspaceNotice error={error} loading={links.loading || tasks.loading}><Summary><Metric label="Projetos em andamento" value={summary.active.length} /><Metric label="Projetos com prazo vencido" value={summary.late.length} /><Metric label="Tarefas pendentes" value={summary.pending.length} note={`${summary.overdueTasks.length} com prazo vencido.`} /><Metric label="Tarefas bloqueadas" value={summary.blocked.length} /></Summary><div className="mt-6 grid gap-4 lg:grid-cols-2"><section className={panelClass}><h2 className="text-lg font-semibold">Distribuição por responsável</h2><p className="mt-2 text-xs text-muted-foreground">Contagem de projetos ativos e tarefas ainda não concluídas; não estima horas sem apontamento.</p><ul className="mt-5 space-y-4">{summary.owners.map(owner => <li key={owner.id ?? "unassigned"} className="border-b border-border pb-4"><p className="font-medium">{links.members.find(m => m.id === owner.id)?.fullName ?? "Sem responsável"}</p><div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground"><span>{owner.projects} projeto(s)</span><span>{owner.tasks} tarefa(s)</span><span className={owner.overdue ? "text-red-300" : ""}>{owner.overdue} atrasada(s)</span></div></li>)}</ul>{!summary.owners.length && <p className="mt-5 text-sm text-muted-foreground">Nenhuma carga de trabalho registrada.</p>}</section><section className={panelClass}><h2 className="text-lg font-semibold">Entregas que precisam de atenção</h2>{summary.late.length ? <ul className="mt-5 space-y-4">{summary.late.map(project => <li key={project.id} className="border-b border-border pb-4 text-sm"><p className="font-medium">{project.titulo}</p><p className="mt-1 text-xs text-muted-foreground">{links.clients.find(c => c.id === project.clienteId)?.nomeFantasia ?? "Cliente"} · prazo {dateLabel(project.dataEntregaPrevista)}</p></li>)}</ul> : <p className="mt-5 text-sm text-muted-foreground">Nenhum projeto ativo com entrega vencida.</p>}<Button variant="ghost" className="mt-4 min-h-11" onClick={() => navigate("operacional", "projetos")}>Gerenciar projetos<ArrowUpRight size={14} /></Button></section></div><section className={`${panelClass} mt-6`}><h2 className="text-lg font-semibold">Bloqueios de execução</h2>{summary.blocked.length ? <ul className="mt-5 grid gap-4 sm:grid-cols-2">{summary.blocked.map(task => <li key={task.id} className="min-w-0 rounded-xl border border-border p-4"><p className="break-words text-sm font-medium">{task.titulo}</p><p className="mt-2 break-words text-xs leading-relaxed text-muted-foreground">{task.descricao ?? "Sem descrição do bloqueio."}</p><p className="mt-2 text-xs text-muted-foreground">{links.projects.find(p => p.id === task.projetoId)?.titulo ?? "Sem projeto"}</p></li>)}</ul> : <p className="mt-4 text-sm text-muted-foreground">Nenhuma tarefa marcada como bloqueada.</p>}</section></WorkspaceNotice></div>;
}
