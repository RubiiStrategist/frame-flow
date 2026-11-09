"use client";

import { useMemo, useState, type ReactNode } from "react";
import { Archive, CheckCircle2, Download, FileText, History, Loader2, Pencil, Plus, RotateCcw, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ModuleHeader } from "@/components/common/frame-primitives";
import { RecordManager, WorkspaceNotice, downloadText, type RecordField } from "@/components/workspace/record-manager";
import { useAuth } from "@/lib/frameflow/auth";
import { useAsyncList, useData } from "@/lib/frameflow/data";
import { acceptProposal, getRecordHistory, useRecords, useWorkspaceLinks, type WorkspaceRecord } from "@/lib/frameflow/workspace";
import { commercialCsv, commercialDay, proposalTotals, readProposalItems, retentionPortfolio, salesGoalMetrics, validateAcceptance, validateSalesGoal, type ProposalAcceptance, type ProposalItem } from "@/lib/frameflow/commercial";
import { formatarBRL } from "@/lib/frameflow/format";

const control = "min-h-11 w-full min-w-0 rounded-lg border border-border bg-secondary px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--frame-red)]";
const panel = "min-w-0 rounded-2xl border border-border bg-card p-5";
const shortDate = (value: string | null | undefined) => { const date = value ? commercialDay(value) : ""; return date ? date.split("-").reverse().join("/") : "Sem data"; };
const message = (error: unknown) => error instanceof Error ? error.message : "Não foi possível concluir a operação.";
const optionList = <T,>(items: T[], id: (item: T) => string, label: (item: T) => string) => items.map(item => ({ value: id(item), label: label(item) }));
const clientName = (id: string | null, clients: { id: string; nomeFantasia: string }[]) => clients.find(client => client.id === id)?.nomeFantasia ?? "Sem cliente vinculado";

function Stats({ items }: { items: { label: string; value: ReactNode; note?: string }[] }) {
  return <div className="mb-6 grid grid-cols-2 gap-3 xl:grid-cols-4">{items.map(item => <div key={item.label} className={panel}><p className="text-xs text-muted-foreground">{item.label}</p><p className="mt-3 break-words text-2xl font-semibold tracking-tight">{item.value}</p>{item.note && <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{item.note}</p>}</div>)}</div>;
}

function Field({ label, children, wide = false }: { label: string; children: ReactNode; wide?: boolean }) {
  return <label className={`min-w-0 space-y-2 ${wide ? "sm:col-span-2" : ""}`}><span className="block text-sm font-medium">{label}</span>{children}</label>;
}

export function ProspeccaoView() {
  const links = useWorkspaceLinks();
  const store = useRecords("outreach");
  const [leadFilter, setLeadFilter] = useState("");
  const [completing, setCompleting] = useState<WorkspaceRecord | null>(null);
  const [outcome, setOutcome] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const active = store.records.filter(record => !record.archivedAt);
  const today = commercialDay(new Date());
  const fields: RecordField[] = [
    { key: "leadId", label: "Lead", type: "select", options: optionList(links.leads, lead => lead.id, lead => `${lead.nome} · ${lead.empresa}`), required: true },
    { key: "ownerId", label: "Responsável", type: "select", options: optionList(links.members, member => member.id, member => member.fullName) },
    { key: "dueDate", label: "Data do contato", type: "date", required: true },
    { key: "details.channel", label: "Canal", type: "select", required: true, defaultValue: "email", options: [{ value: "email", label: "E-mail" }, { value: "whatsapp", label: "WhatsApp" }, { value: "telefone", label: "Telefone" }, { value: "linkedin", label: "LinkedIn" }, { value: "reuniao", label: "Reunião" }] },
    { key: "details.cadence", label: "Cadência / campanha", placeholder: "Ex.: Primeira abordagem — audiovisual" },
    { key: "details.sequence", label: "Etapa da cadência", type: "number", min: 1, max: 99, step: 1, defaultValue: 1 },
    { key: "details.notes", label: "Roteiro e observações", type: "textarea" },
    { key: "details.outcome", label: "Resultado do contato", type: "textarea", help: "Obrigatório para contatos concluídos." },
  ];
  async function complete(event: React.FormEvent) {
    event.preventDefault();
    if (!completing || busy) return;
    setBusy(true); setError("");
    try {
      if (outcome.trim().length < 3) throw new Error("Descreva o resultado do contato.");
      await store.save({ ...completing, status: "concluido", details: { ...completing.details, outcome: outcome.trim(), completedAt: new Date().toISOString() } }, completing.id, completing.version);
      setCompleting(null);
    } catch (err) { setError(message(err)); } finally { setBusy(false); }
  }
  return <div className="min-w-0 space-y-6">
    <ModuleHeader eyebrow="Comercial · Pipeline" title="Prospecção" description="Organize as abordagens, registre cada retorno e acompanhe a próxima etapa de cada lead." />
    <WorkspaceNotice loading={store.loading} error={store.error}><Stats items={[
      { label: "Contatos planejados", value: active.filter(r => r.status === "planejado").length },
      { label: "Retornos vencidos", value: active.filter(r => r.status === "planejado" && r.dueDate && commercialDay(r.dueDate) < today).length },
      { label: "Concluídos", value: active.filter(r => r.status === "concluido").length },
      { label: "Leads acompanhados", value: new Set(active.map(r => r.leadId).filter(Boolean)).size },
    ]} /></WorkspaceNotice>
    <WorkspaceNotice error={links.error} loading={links.loading} />
    <label className="block max-w-lg space-y-2"><span className="text-sm text-muted-foreground">Histórico de um lead</span><select className={control} value={leadFilter} onChange={event => setLeadFilter(event.target.value)}><option value="">Todos os leads</option>{links.leads.map(lead => <option key={lead.id} value={lead.id}>{lead.nome} · {lead.empresa}</option>)}</select></label>
    <RecordManager key={leadFilter || "all"} kind="outreach" title="Cadência de contatos" titleLabel="Ação planejada" fields={fields}
      defaults={{ leadId: leadFilter || null, status: "planejado" }} filter={record => !leadFilter || record.leadId === leadFilter}
      description="Cadastre cada etapa com data e canal. O envio da mensagem acontece no canal de atendimento escolhido."
      statuses={[{ value: "planejado", label: "Planejado" }, { value: "concluido", label: "Concluído" }, { value: "cancelado", label: "Cancelado" }]}
      prepare={(input, editing) => {
        if (!input.leadId || !input.dueDate) throw new Error("Selecione o lead e a data do contato.");
        if (input.status === "concluido" && String(input.details?.outcome ?? "").trim().length < 3) throw new Error("Registre o resultado antes de concluir o contato.");
        return { ...input, details: { ...input.details, completedAt: input.status === "concluido" ? editing?.details.completedAt ?? new Date().toISOString() : null } };
      }}
      renderRecord={record => <div className="space-y-2"><p>{links.leads.find(lead => lead.id === record.leadId)?.nome ?? "Lead indisponível"} <span className="text-muted-foreground">· {String(record.details.channel ?? "Contato")}</span></p><p className={record.status === "planejado" && record.dueDate && commercialDay(record.dueDate) < today ? "text-red-300" : "text-muted-foreground"}>{shortDate(record.dueDate)} · {String(record.details.cadence ?? "Sem campanha")} · Etapa {Number(record.details.sequence ?? 1)}</p>{!!record.details.notes && <p className="whitespace-pre-wrap">{String(record.details.notes)}</p>}{!!record.details.outcome && <p className="rounded-lg bg-secondary p-3"><span className="text-muted-foreground">Resultado: </span>{String(record.details.outcome)}</p>}</div>}
      renderActions={record => record.status === "planejado" && <Button className="min-h-11" size="sm" variant="outline" onClick={() => { setCompleting(record); setOutcome(""); setError(""); }}><CheckCircle2 className="h-4 w-4" />Registrar contato</Button>} />
    <Dialog open={!!completing} onOpenChange={open => { if (!open && !busy) setCompleting(null); }}><DialogContent className="bg-card"><DialogHeader><DialogTitle>Registrar contato</DialogTitle><DialogDescription>{completing?.title}. O resultado fica no histórico deste lead.</DialogDescription></DialogHeader><form onSubmit={complete} className="space-y-4"><Field label="Resultado *"><Textarea required minLength={3} maxLength={10000} value={outcome} onChange={event => setOutcome(event.target.value)} /></Field>{error && <p role="alert" className="text-sm text-red-300">{error}</p>}<DialogFooter><Button type="button" variant="outline" disabled={busy} onClick={() => setCompleting(null)}>Cancelar</Button><Button disabled={busy}>{busy ? "Salvando…" : "Concluir contato"}</Button></DialogFooter></form></DialogContent></Dialog>
  </div>;
}

const proposalStatuses = [{ value: "rascunho", label: "Rascunho" }, { value: "enviada", label: "Enviada" }, { value: "negociacao", label: "Em negociação" }, { value: "recusada", label: "Recusada" }, { value: "aceita", label: "Aceita" }];
interface ProposalDraft { title: string; status: string; clientId: string; leadId: string; ownerId: string; dueDate: string; deliveryDate: string; conditions: string; discount: number; items: ProposalItem[] }
const newProposal = (): ProposalDraft => ({ title: "", status: "rascunho", clientId: "", leadId: "", ownerId: "", dueDate: "", deliveryDate: "", conditions: "", discount: 0, items: [{ description: "", quantity: 1, unitPrice: 0 }] });
const escapeHtml = (value: unknown) => String(value ?? "").replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]!);

function proposalDocument(record: WorkspaceRecord, customer: string) {
  const items = readProposalItems(record.details.items);
  const totals = proposalTotals(items, Number(record.details.discountPercent ?? 0));
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(record.title)}</title><style>body{font:15px Arial,sans-serif;color:#191919;max-width:900px;margin:48px auto;padding:24px;line-height:1.6}header{border-bottom:3px solid #e10606;padding-bottom:24px}small{color:#666}h1{font-size:32px;line-height:1.2}table{width:100%;border-collapse:collapse;margin:30px 0}th,td{border-bottom:1px solid #ddd;padding:12px 8px;text-align:left}th{font-size:12px;color:#666}td:last-child,th:last-child{text-align:right}.total{text-align:right;font-size:22px}.notes{white-space:pre-wrap}button{padding:12px;border:0;background:#e10606;color:white;border-radius:6px;cursor:pointer}@media print{button{display:none}body{margin:0}}</style></head><body><header><strong>FRAME VISION</strong><small> / PROPOSTA COMERCIAL · V${record.version}</small><h1>${escapeHtml(record.title)}</h1><p>${escapeHtml(customer)}</p><small>Validade: ${escapeHtml(shortDate(record.dueDate))} · Status: ${escapeHtml(proposalStatuses.find(s => s.value === record.status)?.label ?? record.status)}</small><p>Entrega prevista: ${escapeHtml(record.details.deliveryDate ? shortDate(String(record.details.deliveryDate)) : "A definir")}</p></header><table><thead><tr><th>Entrega</th><th>Quantidade</th><th>Valor unitário</th><th>Total</th></tr></thead><tbody>${items.map(item => `<tr><td>${escapeHtml(item.description)}</td><td>${item.quantity}</td><td>${formatarBRL(item.unitPrice)}</td><td>${formatarBRL(Math.round(item.quantity * Math.round(item.unitPrice * 100)) / 100)}</td></tr>`).join("")}</tbody></table><p class="total">Subtotal: ${formatarBRL(totals.subtotal)}<br>Desconto: ${formatarBRL(totals.discount)}<br><strong>Total: ${formatarBRL(totals.total)}</strong></p><h2>Condições e escopo</h2><p class="notes">${escapeHtml(record.details.conditions)}</p><small>Documento gerado pela FRAME FLOW. Esta cópia não representa assinatura eletrônica.</small><p><button onclick="window.print()">Imprimir / salvar PDF</button></p></body></html>`;
}

export function PropostasView() {
  const store = useRecords("proposal");
  const links = useWorkspaceLinks();
  const { configured, isPreview } = useAuth();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [archived, setArchived] = useState(false);
  const [editing, setEditing] = useState<WorkspaceRecord | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [draft, setDraft] = useState<ProposalDraft>(newProposal);
  const [accepting, setAccepting] = useState<WorkspaceRecord | null>(null);
  const [acceptance, setAcceptance] = useState<ProposalAcceptance>({ name: "", email: "", acceptedAt: commercialDay(new Date()), evidence: "" });
  const [history, setHistory] = useState<Awaited<ReturnType<typeof getRecordHistory>>>([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyBusy, setHistoryBusy] = useState(false);
  const [archiving, setArchiving] = useState<WorkspaceRecord | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const canWrite = configured && !isPreview;
  const active = store.records.filter(record => !record.archivedAt);
  const records = store.records.filter(record => !!record.archivedAt === archived && (!status || record.status === status) && `${record.title} ${clientName(record.clientId, links.clients)}`.toLocaleLowerCase("pt-BR").includes(query.toLocaleLowerCase("pt-BR")));
  const totals = useMemo(() => { try { return proposalTotals(draft.items, draft.discount); } catch { return null; } }, [draft.items, draft.discount]);
  function begin(record: WorkspaceRecord | null) {
    setEditing(record); setError(""); setNotice("");
    setDraft(record ? { title: record.title, status: record.status, clientId: record.clientId ?? "", leadId: record.leadId ?? "", ownerId: record.ownerId ?? "", dueDate: record.dueDate?.slice(0, 10) ?? "", deliveryDate: String(record.details.deliveryDate ?? ""), conditions: String(record.details.conditions ?? ""), discount: Number(record.details.discountPercent ?? 0), items: readProposalItems(record.details.items) } : newProposal());
    setEditorOpen(true);
  }
  function duplicate(record: WorkspaceRecord) {
    begin(record);
    setEditing(null);
    setDraft(current => ({ ...current, title: `${current.title.slice(0, 220)} — revisão`, status: "rascunho" }));
  }
  async function save(event: React.FormEvent) {
    event.preventDefault(); if (busy) return; setBusy(true); setError("");
    try {
      if (!draft.title.trim() || (!draft.clientId && !draft.leadId)) throw new Error("Informe o título e vincule um cliente ou lead à proposta.");
      if (!commercialDay(draft.dueDate)) throw new Error("Informe a data de validade da proposta.");
      if (draft.deliveryDate && (!/^\d{4}-\d{2}-\d{2}$/.test(draft.deliveryDate) || commercialDay(draft.deliveryDate) !== draft.deliveryDate)) throw new Error("Informe uma data de entrega prevista válida.");
      if (draft.conditions.trim().length < 5) throw new Error("Descreva o escopo e as condições comerciais.");
      const calculated = proposalTotals(draft.items, draft.discount);
      await store.save({ kind: "proposal", title: draft.title.trim(), status: draft.status, clientId: draft.clientId || null, leadId: draft.leadId || null, ownerId: draft.ownerId || null, dueDate: draft.dueDate, amount: calculated.total, details: { ...editing?.details, items: draft.items.map(item => ({ ...item, description: item.description.trim() })), discountPercent: draft.discount, conditions: draft.conditions.trim(), deliveryDate: draft.deliveryDate || null } }, editing?.id, editing?.version);
      setEditorOpen(false); setNotice("Proposta salva. A versão está disponível no histórico.");
    } catch (err) { setError(message(err)); } finally { setBusy(false); }
  }
  async function accept(event: React.FormEvent) {
    event.preventDefault(); if (!accepting || busy) return; setBusy(true); setError("");
    try {
      const saved = await acceptProposal(accepting, validateAcceptance(acceptance));
      await store.reload(); setAccepting(null);
      setNotice(saved.projectId ? `Aceite registrado. ${accepting.leadId ? "O lead foi fechado e o " : "O "}projeto foi vinculado à operação.` : "Aceite registrado no histórico da proposta.");
    } catch (err) { setError(message(err)); } finally { setBusy(false); }
  }
  async function showHistory(record: WorkspaceRecord) {
    setError(""); setHistory([]); setHistoryBusy(true); setHistoryOpen(true);
    try { setHistory(await getRecordHistory(record.id)); } catch (err) { setError(message(err)); } finally { setHistoryBusy(false); }
  }
  async function archive(record: WorkspaceRecord) {
    setBusy(true); setError("");
    try { if (record.archivedAt) await store.restore(record); else await store.archive(record); setArchiving(null); }
    catch (err) { setError(message(err)); } finally { setBusy(false); }
  }
  function exportProposal(record: WorkspaceRecord) {
    try { downloadText(`proposta-${record.id.slice(0, 8)}-v${record.version}.html`, proposalDocument(record, clientName(record.clientId, links.clients)), "text/html;charset=utf-8"); }
    catch (err) { setError(message(err)); }
  }
  return <div className="min-w-0 space-y-6">
    <ModuleHeader eyebrow="Comercial · Negociação" title="Propostas e negociações" description="Monte escopos, acompanhe versões e registre o aceite para conectar a venda à operação." actions={<Button className="min-h-11" onClick={() => begin(null)} disabled={!canWrite}><Plus className="h-4 w-4" />Nova proposta</Button>} />
    <WorkspaceNotice loading={store.loading} error={store.error}><Stats items={[
      { label: "Propostas ativas", value: active.length },
      { label: "Em negociação", value: active.filter(r => ["enviada", "negociacao"].includes(r.status)).length },
      { label: "Valor em negociação", value: formatarBRL(active.filter(r => ["enviada", "negociacao"].includes(r.status)).reduce((sum, r) => sum + r.amount, 0)) },
      { label: "Propostas aceitas", value: active.filter(r => r.status === "aceita").length },
    ]} /></WorkspaceNotice>
    <WorkspaceNotice error={links.error} loading={links.loading} />
    {notice && <p role="status" className="rounded-xl border border-green-900/60 bg-green-950/15 p-4 text-sm">{notice}</p>}
    {error && !editorOpen && !accepting && !historyOpen && !archiving && <p role="alert" className="text-sm text-red-300">{error}</p>}
    <div className="flex flex-wrap gap-3"><label className="relative min-w-0 flex-1 basis-52"><span className="sr-only">Buscar propostas</span><Search className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" /><Input className={`${control} pl-9`} placeholder="Buscar proposta ou cliente" value={query} onChange={event => setQuery(event.target.value)} /></label><select className={`${control} !w-auto flex-1 basis-36`} aria-label="Filtrar propostas por status" value={status} onChange={event => setStatus(event.target.value)}><option value="">Todos os status</option>{proposalStatuses.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}</select><Button variant="outline" className="min-h-11" aria-pressed={archived} onClick={() => setArchived(!archived)}><Archive className="h-4 w-4" />{archived ? "Ver ativas" : "Arquivadas"}</Button></div>
    <WorkspaceNotice loading={store.loading} error={store.error}>
      {records.length ? <div className="grid min-w-0 gap-4 lg:grid-cols-2">{records.map(record => <article key={record.id} className={panel}>
        <div className="flex flex-wrap justify-between gap-3"><FileText className="h-5 w-5 text-[var(--frame-red)]" /><span className="rounded-md border border-border px-2 py-1 text-xs">{proposalStatuses.find(item => item.value === record.status)?.label ?? record.status} · V{record.version}</span></div>
        <h2 className="mt-4 break-words text-lg font-semibold">{record.title}</h2><p className="mt-1 break-words text-sm text-muted-foreground">{record.clientId ? clientName(record.clientId, links.clients) : links.leads.find(lead => lead.id === record.leadId)?.empresa ?? "Lead indisponível"}</p><p className="mt-4 text-2xl font-semibold">{formatarBRL(record.amount)}</p><p className="mt-2 text-xs text-muted-foreground">Validade: {shortDate(record.dueDate)} · {readProposalItems(record.details.items).length} entregas</p><p className="mt-1 text-xs text-muted-foreground">Entrega prevista: {record.details.deliveryDate ? shortDate(String(record.details.deliveryDate)) : "A definir"}</p>
        {!!record.details.acceptance && <p className="mt-3 rounded-lg bg-secondary p-3 text-sm">Aceite registrado com evidência. Consulte o histórico para os dados de confirmação.</p>}
        <div className="mt-5 flex flex-wrap gap-2 border-t border-border pt-4">
          {!record.archivedAt && record.status !== "aceita" && <Button size="sm" variant="outline" className="min-h-11" disabled={!canWrite || busy} onClick={() => begin(record)}><Pencil className="h-4 w-4" />Editar</Button>}
          {!record.archivedAt && record.status === "aceita" && <Button size="sm" variant="outline" className="min-h-11" disabled={!canWrite || busy} onClick={() => duplicate(record)}><Plus className="h-4 w-4" />Criar revisão</Button>}
          {!record.archivedAt && ["enviada", "negociacao"].includes(record.status) && <Button size="sm" className="min-h-11" disabled={!canWrite || busy} onClick={() => { setAccepting(record); setAcceptance({ name: "", email: "", acceptedAt: commercialDay(new Date()), evidence: "" }); setError(""); }}>Registrar aceite</Button>}
          <Button size="sm" variant="outline" className="min-h-11" onClick={() => exportProposal(record)}><Download className="h-4 w-4" />Documento / PDF</Button>
          <Button size="sm" variant="ghost" className="min-h-11" onClick={() => showHistory(record)}><History className="h-4 w-4" />Histórico</Button>
          <Button size="sm" variant="ghost" className="min-h-11" disabled={!canWrite || busy} onClick={() => { setArchiving(record); setError(""); }}>{record.archivedAt ? <RotateCcw className="h-4 w-4" /> : <Archive className="h-4 w-4" />}{record.archivedAt ? "Restaurar" : "Arquivar"}</Button>
        </div>
      </article>)}</div> : <div className={`${panel} py-12 text-center`}><FileText className="mx-auto mb-4 h-8 w-8 text-muted-foreground" /><p>Nenhuma proposta nesta seleção.</p><p className="mt-2 text-sm text-muted-foreground">Crie uma proposta com os serviços e valores da sua negociação.</p></div>}
    </WorkspaceNotice>
    <Dialog open={editorOpen} onOpenChange={open => { if (!busy) setEditorOpen(open); }}><DialogContent className="max-h-[92dvh] overflow-y-auto bg-card sm:max-w-3xl"><DialogHeader><DialogTitle>{editing ? "Editar proposta" : "Nova proposta"}</DialogTitle><DialogDescription>Os valores são calculados pelos itens. Cada salvamento registra uma versão.</DialogDescription></DialogHeader><form onSubmit={save} className="grid min-w-0 gap-4 sm:grid-cols-2">
      <Field label="Título da proposta *" wide><Input className={control} required maxLength={240} value={draft.title} onChange={event => setDraft({ ...draft, title: event.target.value })} /></Field>
      <Field label="Cliente"><select className={control} value={draft.clientId} onChange={event => setDraft({ ...draft, clientId: event.target.value })}><option value="">Selecione ou vincule um lead</option>{links.clients.map(client => <option key={client.id} value={client.id}>{client.nomeFantasia}</option>)}</select></Field>
      <Field label="Lead"><select className={control} value={draft.leadId} onChange={event => setDraft({ ...draft, leadId: event.target.value })}><option value="">Sem lead vinculado</option>{links.leads.map(lead => <option key={lead.id} value={lead.id}>{lead.nome} · {lead.empresa}</option>)}</select></Field>
      <Field label="Responsável"><select className={control} value={draft.ownerId} onChange={event => setDraft({ ...draft, ownerId: event.target.value })}><option value="">Selecione</option>{links.members.map(member => <option key={member.id} value={member.id}>{member.fullName}</option>)}</select></Field>
      <Field label="Validade *"><Input className={control} type="date" required value={draft.dueDate} onInput={event => { const value = event.currentTarget.value; setDraft(current => ({ ...current, dueDate: value })); }} onChange={event => { const value = event.currentTarget.value; setDraft(current => ({ ...current, dueDate: value })); }} /></Field>
      <Field label="Entrega prevista (opcional)"><Input className={control} type="date" value={draft.deliveryDate} onInput={event => { const value = event.currentTarget.value; setDraft(current => ({ ...current, deliveryDate: value })); }} onChange={event => { const value = event.currentTarget.value; setDraft(current => ({ ...current, deliveryDate: value })); }} /><span className="text-xs text-muted-foreground">Prazo do projeto criado no aceite. Deixe em branco se ainda não foi combinado.</span></Field>
      <Field label="Status"><select className={control} value={draft.status} onChange={event => setDraft({ ...draft, status: event.target.value })}>{proposalStatuses.filter(item => item.value !== "aceita").map(item => <option key={item.value} value={item.value}>{item.label}</option>)}</select></Field>
      <Field label="Desconto (%)"><Input className={control} type="number" min={0} max={100} step="0.01" required value={draft.discount} onChange={event => setDraft({ ...draft, discount: Number(event.target.value) })} /></Field>
      <section className="min-w-0 space-y-3 sm:col-span-2" aria-label="Itens da proposta"><h3 className="font-medium">Entregas e valores</h3>{draft.items.map((item, index) => <div key={index} className="grid min-w-0 grid-cols-2 gap-3 rounded-xl border border-border p-3 sm:grid-cols-6">
        <label className="col-span-2 min-w-0 space-y-1 sm:col-span-3"><span className="text-xs text-muted-foreground">Entrega {index + 1} *</span><Input required maxLength={500} className={control} value={item.description} onChange={event => setDraft({ ...draft, items: draft.items.map((row, i) => i === index ? { ...row, description: event.target.value } : row) })} /></label>
        <label className="min-w-0 space-y-1"><span className="text-xs text-muted-foreground">Quantidade *</span><Input type="number" className={control} required min="0.01" max={1000000} step="0.01" value={item.quantity} onChange={event => setDraft({ ...draft, items: draft.items.map((row, i) => i === index ? { ...row, quantity: Number(event.target.value) } : row) })} /></label>
        <label className="min-w-0 space-y-1 sm:col-span-2"><span className="text-xs text-muted-foreground">Valor unitário (R$) *</span><Input type="number" className={control} required min={0} max={100000000} step="0.01" value={item.unitPrice} onChange={event => setDraft({ ...draft, items: draft.items.map((row, i) => i === index ? { ...row, unitPrice: Number(event.target.value) } : row) })} /></label>
        <div className="col-span-2 flex items-center justify-between sm:col-span-6"><span className="text-sm text-muted-foreground">{formatarBRL(Math.round(item.quantity * Math.round(item.unitPrice * 100)) / 100)}</span><Button type="button" variant="ghost" size="sm" className="min-h-11" disabled={draft.items.length === 1} aria-label={`Remover entrega ${index + 1}`} onClick={() => setDraft({ ...draft, items: draft.items.filter((_, i) => i !== index) })}><Trash2 className="h-4 w-4" />Remover</Button></div>
      </div>)}<Button type="button" variant="outline" className="min-h-11" disabled={draft.items.length >= 100} onClick={() => setDraft({ ...draft, items: [...draft.items, { description: "", quantity: 1, unitPrice: 0 }] })}><Plus className="h-4 w-4" />Adicionar entrega</Button></section>
      <div className="rounded-xl bg-secondary p-4 text-right sm:col-span-2"><p className="text-sm text-muted-foreground">Subtotal {formatarBRL(totals?.subtotal ?? 0)} · Desconto {formatarBRL(totals?.discount ?? 0)}</p><p className="mt-2 text-xl font-semibold">Total {formatarBRL(totals?.total ?? 0)}</p></div>
      <Field label="Escopo e condições comerciais *" wide><Textarea required minLength={5} maxLength={30000} className="min-h-32" value={draft.conditions} onChange={event => setDraft({ ...draft, conditions: event.target.value })} placeholder="Prazo, entregáveis, revisões incluídas e condições de pagamento." /></Field>
      {error && <p role="alert" className="text-sm text-red-300 sm:col-span-2">{error}</p>}<DialogFooter className="sm:col-span-2"><Button type="button" variant="outline" disabled={busy} onClick={() => setEditorOpen(false)}>Cancelar</Button><Button disabled={busy || !canWrite}>{busy && <Loader2 className="h-4 w-4 animate-spin" />}{busy ? "Salvando…" : "Salvar proposta"}</Button></DialogFooter>
    </form></DialogContent></Dialog>
    <Dialog open={!!accepting} onOpenChange={open => { if (!open && !busy) setAccepting(null); }}><DialogContent className="max-h-[90dvh] overflow-y-auto bg-card"><DialogHeader><DialogTitle>Registrar aceite · {accepting?.title}</DialogTitle><DialogDescription>Registre o retorno recebido do cliente. {accepting?.leadId ? "Ao confirmar, o lead será fechado e o cliente e projeto serão vinculados à operação." : "O registro ficará no histórico da proposta."} Este registro interno não verifica uma assinatura eletrônica.</DialogDescription></DialogHeader><form onSubmit={accept} className="space-y-4">
      <Field label="Nome de quem aceitou *"><Input required minLength={2} maxLength={160} className={control} value={acceptance.name} onChange={event => setAcceptance({ ...acceptance, name: event.target.value })} /></Field>
      <Field label="E-mail *"><Input required type="email" maxLength={250} className={control} value={acceptance.email} onChange={event => setAcceptance({ ...acceptance, email: event.target.value })} /></Field>
      <Field label="Data do aceite *"><Input required type="date" max={commercialDay(new Date())} className={control} value={acceptance.acceptedAt} onInput={event => { const value = event.currentTarget.value; setAcceptance(current => ({ ...current, acceptedAt: value })); }} onChange={event => { const value = event.currentTarget.value; setAcceptance(current => ({ ...current, acceptedAt: value })); }} /></Field>
      <Field label="Evidência do aceite *"><Textarea required minLength={5} maxLength={10000} value={acceptance.evidence} onChange={event => setAcceptance({ ...acceptance, evidence: event.target.value })} placeholder="Mensagem recebida, reunião ou referência ao documento de aprovação." /></Field>
      {error && <p role="alert" className="text-sm text-red-300">{error}</p>}<DialogFooter><Button type="button" variant="outline" disabled={busy} onClick={() => setAccepting(null)}>Cancelar</Button><Button disabled={busy || !canWrite}>{busy ? "Registrando…" : "Confirmar aceite"}</Button></DialogFooter>
    </form></DialogContent></Dialog>
    <Dialog open={historyOpen} onOpenChange={setHistoryOpen}><DialogContent className="max-h-[90dvh] overflow-y-auto bg-card sm:max-w-2xl"><DialogHeader><DialogTitle>Versões da proposta</DialogTitle><DialogDescription>Valores, condições e registros de aceite de cada versão salva.</DialogDescription></DialogHeader><WorkspaceNotice loading={historyBusy} error={error}><div className="space-y-4">{history.map(entry => <article key={entry.id} className="rounded-xl border border-border p-4"><p className="font-medium">V{entry.version} · {entry.snapshot.title}</p><p className="mt-1 text-sm text-muted-foreground">{shortDate(entry.createdAt)} · {proposalStatuses.find(s => s.value === entry.snapshot.status)?.label ?? entry.snapshot.status} · {formatarBRL(entry.snapshot.amount)}</p><ul className="my-3 space-y-1 text-sm">{readProposalItems(entry.snapshot.details.items).map((item, i) => <li key={i}>{item.description} · {item.quantity} × {formatarBRL(item.unitPrice)}</li>)}</ul><p className="whitespace-pre-wrap text-sm">{String(entry.snapshot.details.conditions ?? "")}</p>{!!entry.snapshot.details.acceptance && <div className="mt-3 rounded-lg bg-secondary p-3 text-xs">{Object.entries(entry.snapshot.details.acceptance as Record<string, unknown>).map(([key, value]) => <p key={key} className="break-words">{({ name: "Nome", email: "E-mail", acceptedAt: "Data", evidence: "Evidência" } as Record<string, string>)[key] ?? key}: {String(value)}</p>)}</div>}<Button variant="outline" className="mt-3 min-h-11" onClick={() => exportProposal(entry.snapshot)}><Download className="h-4 w-4" />Exportar esta versão</Button></article>)}{!history.length && <p className="text-sm text-muted-foreground">Sem versões registradas.</p>}</div></WorkspaceNotice></DialogContent></Dialog>
    <Dialog open={!!archiving} onOpenChange={open => { if (!open && !busy) setArchiving(null); }}><DialogContent className="bg-card"><DialogHeader><DialogTitle>{archiving?.archivedAt ? "Restaurar" : "Arquivar"} proposta?</DialogTitle><DialogDescription>{archiving?.title}. O histórico será preservado.</DialogDescription></DialogHeader>{error && <p role="alert" className="text-red-300">{error}</p>}<DialogFooter><Button variant="outline" disabled={busy} onClick={() => setArchiving(null)}>Cancelar</Button><Button disabled={busy} onClick={() => archiving && archive(archiving)}>{busy ? "Salvando…" : "Confirmar"}</Button></DialogFooter></DialogContent></Dialog>
  </div>;
}

export function MetasView() {
  const links = useWorkspaceLinks();
  const store = useRecords("sales_goal");
  const active = store.records.filter(record => !record.archivedAt);
  const fields: RecordField[] = [
    { key: "details.scope", label: "Abrangência", type: "select", required: true, defaultValue: "empresarial", options: [{ value: "empresarial", label: "Empresa" }, { value: "departamental", label: "Departamento comercial" }, { value: "individual", label: "Individual" }] },
    { key: "ownerId", label: "Responsável / vendedor", type: "select", options: optionList(links.members, member => member.id, member => member.fullName), help: "Obrigatório para metas individuais. Sem responsável, contabiliza todas as vendas." },
    { key: "startDate", label: "Início do período", type: "date", required: true }, { key: "dueDate", label: "Fim do período", type: "date", required: true },
    { key: "details.metric", label: "Indicador", type: "select", required: true, defaultValue: "revenue", options: [{ value: "revenue", label: "Valor de vendas (R$)" }, { value: "count", label: "Quantidade de vendas" }] },
    { key: "amount", label: "Meta de valor (R$)", type: "number", min: 0, step: "0.01", defaultValue: 0 },
    { key: "details.targetCount", label: "Meta de quantidade", type: "number", min: 0, step: 1, defaultValue: 0 },
    { key: "details.commissionPercent", label: "Comissão sobre vendas (%)", type: "number", min: 0, max: 100, step: "0.01", defaultValue: 0 },
    { key: "details.notes", label: "Regras e observações", type: "textarea" },
  ];
  const results = active.map(goal => ({ goal, metrics: salesGoalMetrics(goal, links.leads) }));
  return <div className="space-y-6">
    <ModuleHeader eyebrow="Comercial · Performance" title="Metas e comissões" description="Acompanhe os ganhos efetivamente registrados no período e apure a comissão prevista para cada meta." actions={<Button variant="outline" className="min-h-11" disabled={!results.length || links.loading || !!links.error} onClick={() => downloadText("apuracao-comercial.csv", commercialCsv([["Meta", "Início", "Fim", "Vendas", "Valor ganho", "Progresso (%)", "Comissão (%)", "Comissão apurada"], ...results.map(({ goal, metrics }) => [goal.title, goal.startDate, goal.dueDate, metrics.won.length, metrics.amount, metrics.progress, metrics.commissionRate, metrics.commission])]), "text/csv;charset=utf-8")}><Download className="h-4 w-4" />Exportar apuração</Button>} />
    <WorkspaceNotice loading={links.loading || store.loading} error={links.error || store.error}><Stats items={[
      { label: "Metas ativas", value: active.filter(r => r.status === "ativa").length },
      { label: "Metas atingidas", value: results.filter(r => r.metrics.progress >= 100).length },
      { label: "Vendedores com meta", value: new Set(active.map(r => r.ownerId).filter(Boolean)).size },
      { label: "Ganhos sem data", value: links.leads.filter(lead => lead.etapa === "ganho" && !lead.closedAt).length, note: "Não entram na apuração por período." },
    ]} /></WorkspaceNotice>
    <p className="rounded-xl border border-border bg-card p-4 text-sm leading-relaxed text-muted-foreground">Cada meta apura seu próprio conjunto de vendas. Metas sobrepostas podem incluir o mesmo ganho; a comissão exibida é uma apuração, e não um pagamento realizado.</p>
    <RecordManager kind="sales_goal" title="Metas do comercial" fields={fields} statuses={[{ value: "ativa", label: "Ativa" }, { value: "encerrada", label: "Encerrada" }]} prepare={input => { validateSalesGoal({ amount: input.amount ?? 0, ownerId: input.ownerId ?? null, startDate: input.startDate ?? null, dueDate: input.dueDate ?? null, details: input.details ?? {} }); return input; }}
      renderRecord={goal => {
        const result = salesGoalMetrics(goal, links.leads);
        return <div className="space-y-3"><p className="text-muted-foreground">{shortDate(goal.startDate)} a {shortDate(goal.dueDate)} · {goal.ownerId ? links.members.find(member => member.id === goal.ownerId)?.fullName ?? "Responsável indisponível" : "Todo o comercial"}</p><p className="text-lg font-semibold">{goal.details.metric === "count" ? `${result.achieved} / ${result.target} vendas` : `${formatarBRL(result.achieved)} / ${formatarBRL(result.target)}`}</p><div role="progressbar" aria-label={`Progresso da meta ${goal.title}`} aria-valuenow={Math.min(100, result.progress)} aria-valuemin={0} aria-valuemax={100} className="h-2 overflow-hidden rounded-full bg-secondary"><div className="h-full rounded-full bg-[var(--frame-red)] transition-[width] duration-500 motion-reduce:transition-none" style={{ width: `${Math.min(100, result.progress)}%` }} /></div><div className="flex flex-wrap justify-between gap-2"><span>{result.progress}% da meta</span><span>Comissão: <strong>{formatarBRL(result.commission)}</strong> ({result.commissionRate}%)</span></div><p className="text-xs text-muted-foreground">{result.won.length} vendas ganhas no período.{result.undatedWins > 0 ? ` ${result.undatedWins} ganho(s) sem data de fechamento ficaram fora da apuração.` : ""}</p>{!!goal.details.notes && <p className="whitespace-pre-wrap">{String(goal.details.notes)}</p>}</div>;
      }} />
  </div>;
}

const healthLabels: Record<string, string> = { risco: "Risco sinalizado", contato_atrasado: "Retorno atrasado", em_operacao: "Em operação", sem_historico: "Sem histórico financeiro", reativar: "Reativar relacionamento", acompanhamento: "Em acompanhamento" };
export function RetencaoView() {
  const links = useWorkspaceLinks();
  const store = useRecords("retention");
  const data = useData();
  const finances = useAsyncList(data.listTransactions);
  const [clientFilter, setClientFilter] = useState("");
  const [healthFilter, setHealthFilter] = useState("");
  const portfolio = retentionPortfolio(links.clients, finances.result.data, links.projects, store.records);
  const rows = portfolio.filter(item => !healthFilter || item.health === healthFilter);
  const fields: RecordField[] = [
    { key: "clientId", label: "Cliente", type: "select", options: optionList(links.clients, client => client.id, client => client.nomeFantasia), required: true },
    { key: "ownerId", label: "Responsável pelo relacionamento", type: "select", options: optionList(links.members, member => member.id, member => member.fullName) },
    { key: "dueDate", label: "Próximo contato / revisão", type: "date", required: true },
    { key: "details.type", label: "Objetivo", type: "select", defaultValue: "relacionamento", options: [{ value: "relacionamento", label: "Relacionamento" }, { value: "renovacao", label: "Renovação" }, { value: "upsell", label: "Expansão / upsell" }, { value: "recuperacao", label: "Recuperação" }] },
    { key: "amount", label: "Potencial de expansão (R$)", type: "number", min: 0, defaultValue: 0 },
    { key: "details.notes", label: "Contexto e plano de ação", type: "textarea", required: true },
    { key: "details.outcome", label: "Resultado / retorno do cliente", type: "textarea" },
  ];
  const failure = links.error || store.error || (finances.result.reason === "erro" ? finances.result.error ?? "Não foi possível carregar as movimentações." : null);
  return <div className="space-y-6">
    <ModuleHeader eyebrow="Comercial · Relacionamento" title="Retenção e expansão" description="Conecte o histórico da carteira aos próximos contatos, renovações e oportunidades." />
    <WorkspaceNotice loading={links.loading || store.loading || finances.loading} error={failure}>
      <Stats items={[{ label: "Clientes na carteira", value: portfolio.length }, { label: "Receita recebida", value: formatarBRL(portfolio.reduce((sum, item) => sum + item.revenue, 0)), note: "Somente entradas quitadas vinculadas ao cliente." }, { label: "Contatos em atraso", value: portfolio.filter(item => item.health === "contato_atrasado").length }, { label: "Riscos sinalizados", value: portfolio.filter(item => item.health === "risco").length }]} />
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-semibold">Saúde da carteira</h2><select className={`${control} !w-auto max-w-full`} value={healthFilter} onChange={event => setHealthFilter(event.target.value)} aria-label="Filtrar saúde da carteira"><option value="">Todos os sinais</option>{Object.entries(healthLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
      {rows.length ? <div className="grid min-w-0 gap-3 md:grid-cols-2 xl:grid-cols-3">{rows.map(item => <article key={item.client.id} className={panel}><p className={`text-xs ${["risco", "contato_atrasado"].includes(item.health) ? "text-red-300" : "text-muted-foreground"}`}>{healthLabels[item.health]}</p><h3 className="mt-3 break-words font-semibold">{item.client.nomeFantasia}</h3><p className="mt-3 text-xl font-semibold">{formatarBRL(item.revenue)}</p><p className="mt-1 text-xs text-muted-foreground">Recebido · {item.activeProjects} projetos em andamento</p><p className="mt-4 text-sm">Próximo contato: {shortDate(item.nextContact)}</p><p className="mt-1 text-xs text-muted-foreground">Último recebimento: {shortDate(item.lastPayment)}</p><Button className="mt-4 min-h-11" variant="outline" onClick={() => setClientFilter(item.client.id)}>Ver plano de relacionamento</Button></article>)}</div> : <p className={`${panel} text-sm text-muted-foreground`}>Nenhum cliente nesta seleção. Cadastre os clientes e vincule os projetos e recebimentos para acompanhar a carteira.</p>}
    </WorkspaceNotice>
    <label className="block max-w-lg space-y-2"><span className="text-sm text-muted-foreground">Plano de relacionamento do cliente</span><select className={control} value={clientFilter} onChange={event => setClientFilter(event.target.value)}><option value="">Todos os clientes</option>{links.clients.map(client => <option key={client.id} value={client.id}>{client.nomeFantasia}</option>)}</select></label>
    <RecordManager key={clientFilter || "all"} kind="retention" title="Ações de relacionamento" fields={fields} defaults={{ clientId: clientFilter || null }} filter={record => !clientFilter || record.clientId === clientFilter}
      statuses={[{ value: "acompanhamento", label: "Em acompanhamento" }, { value: "risco", label: "Risco sinalizado" }, { value: "expansao", label: "Expansão" }, { value: "concluido", label: "Concluído" }]}
      prepare={input => { if (!input.clientId || !input.dueDate || !String(input.details?.notes ?? "").trim()) throw new Error("Preencha o cliente, a data e o plano de ação."); if (input.status === "concluido" && !String(input.details?.outcome ?? "").trim()) throw new Error("Registre o resultado antes de concluir a ação."); return input; }}
      renderRecord={record => <div className="space-y-2"><p className="font-medium">{clientName(record.clientId, links.clients)}</p><p className="text-muted-foreground">Contato / revisão: {shortDate(record.dueDate)}</p><p className="whitespace-pre-wrap">{String(record.details.notes ?? "")}</p>{record.amount > 0 && <p>Potencial de expansão: {formatarBRL(record.amount)}</p>}{!!record.details.outcome && <p className="rounded-lg bg-secondary p-3">Resultado: {String(record.details.outcome)}</p>}</div>} />
  </div>;
}
