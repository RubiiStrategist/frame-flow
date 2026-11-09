"use client";

import { useEffect, useId, useState, type ReactNode } from "react";
import { Archive, History, Pencil, Plus, RotateCcw, Search, Loader2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/lib/frameflow/auth";
import { getRecordHistory, listModuleAccess, useRecords, type RecordInput, type WorkspaceRecord } from "@/lib/frameflow/workspace";

export interface RecordOption { value: string; label: string }
export interface RecordField {
  key: string;
  label: string;
  type?: "text" | "textarea" | "number" | "date" | "select" | "checkbox" | "email" | "url";
  options?: RecordOption[];
  required?: boolean;
  min?: number;
  max?: number;
  step?: number | string;
  placeholder?: string;
  help?: string;
  defaultValue?: string | number | boolean;
}

export interface RecordManagerProps {
  kind: string;
  title: string;
  description?: string;
  titleLabel?: string;
  fields: RecordField[];
  statuses: RecordOption[];
  defaults?: Partial<RecordInput>;
  filter?: (record: WorkspaceRecord) => boolean;
  renderRecord?: (record: WorkspaceRecord) => ReactNode;
  renderActions?: (record: WorkspaceRecord, reload: () => Promise<void>) => ReactNode;
  prepare?: (input: RecordInput, editing: WorkspaceRecord | null) => RecordInput | Promise<RecordInput>;
  onSaved?: (record: WorkspaceRecord) => void;
}

const selectClass = "min-h-11 w-full min-w-0 rounded-lg border border-border bg-secondary px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[var(--frame-red)]";
const formClass = "min-h-11 rounded-lg border-border bg-secondary";
type Draft = Record<string, string | number | boolean>;

function fieldValue(record: Partial<RecordInput>, key: string): unknown {
  if (key.startsWith("details.")) return record.details?.[key.slice(8)];
  return (record as Record<string, unknown>)[key];
}

function readable(value: unknown): string {
  if (value == null || value === "") return "—";
  if (typeof value === "boolean") return value ? "Sim" : "Não";
  if (Array.isArray(value)) return value.map(readable).join(", ");
  if (typeof value === "object") return Object.values(value).map(readable).join(" · ");
  return String(value);
}

/** Reusable safe CSV export: text beginning with spreadsheet formula characters is escaped. */
export function downloadCsv(filename: string, columns: string[], rows: (string | number | null)[][]) {
  const cell = (value: string | number | null) => {
    const text = String(value ?? "");
    const safe = /^\s*[=+@\-]/.test(text) || /^[\t\r]/.test(text) ? `'${text}` : text;
    return `"${safe.replaceAll('"', '""')}"`;
  };
  const csv = "\uFEFF" + [columns, ...rows].map(row => row.map(cell).join(";")).join("\r\n");
  downloadText(filename, csv, "text/csv;charset=utf-8");
}

export function downloadText(filename: string, text: string, mime = "text/plain;charset=utf-8") {
  const url = URL.createObjectURL(new Blob([text], { type: mime }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function WorkspaceNotice({ error, loading, children }: { error?: string | null; loading?: boolean; children?: ReactNode }) {
  if (loading) return <p role="status" className="flex items-center gap-2 rounded-xl border border-border p-5 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Carregando registros…</p>;
  if (error) return <p role="alert" className="rounded-xl border border-red-500/50 bg-red-950/20 p-4 text-sm leading-relaxed">{error}</p>;
  return <>{children}</>;
}

export function RecordManager({ kind, title, description, titleLabel = "Título", fields, statuses, defaults, filter, renderRecord, renderActions, prepare, onSaved }: RecordManagerProps) {
  const store = useRecords(kind);
  const { configured, isPreview, profile } = useAuth();
  const prefix = useId();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [editing, setEditing] = useState<WorkspaceRecord | null>(null);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Draft>({});
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState("");
  const [actionError, setActionError] = useState("");
  const [historyRecord, setHistoryRecord] = useState<WorkspaceRecord | null>(null);
  const [history, setHistory] = useState<Awaited<ReturnType<typeof getRecordHistory>>>([]);
  const [historyError, setHistoryError] = useState("");
  const [historyBusy, setHistoryBusy] = useState(false);
  const [confirmArchive, setConfirmArchive] = useState<WorkspaceRecord | null>(null);
  const [permission, setPermission] = useState<{ key: string; writable: boolean } | null>(null);
  const permissionKey = `${profile?.id ?? ""}:${kind}`;
  const partner = !!profile && ["ceo", "cro", "coo_cfo"].includes(profile.role);
  useEffect(() => {
    if (!profile || partner || profile.role !== "colaborador") return;
    let alive = true;
    const check = async () => {
      try {
        const access = await listModuleAccess(profile.id);
        const rule = access.find(r => r.kind === kind);
        if (alive) setPermission({ key: permissionKey, writable: rule?.canWrite ?? kind !== "contract" });
      } catch { if (alive) setPermission({ key: permissionKey, writable: false }); }
    };
    void check();
    window.addEventListener("frameflow:workspace-changed", check);
    return () => { alive = false; window.removeEventListener("frameflow:workspace-changed", check); };
  }, [profile?.id, profile?.role, partner, kind, permissionKey]);
  const canWrite = configured && !isPreview && (partner || (profile?.role === "colaborador" && permission?.key === permissionKey && permission.writable));

  const records = store.records.filter(r => (!filter || filter(r)) && Boolean(r.archivedAt) === showArchived
    && (!status || r.status === status)
    && (!query.trim() || `${r.title} ${readable(r.details)}`.toLocaleLowerCase("pt-BR").includes(query.trim().toLocaleLowerCase("pt-BR"))));

  function begin(record: WorkspaceRecord | null) {
    const base = record ?? { ...defaults, title: "", status: defaults?.status ?? statuses[0]?.value ?? "ativo" };
    const next: Draft = { title: base.title ?? "", status: base.status ?? "ativo" };
    fields.forEach(field => {
      const value = fieldValue(base, field.key) ?? field.defaultValue ?? (field.type === "checkbox" ? false : "");
      next[field.key] = field.type === "date" && typeof value === "string" ? value.slice(0, 10) : typeof value === "boolean" || typeof value === "number" ? value : String(value);
    });
    setEditing(record);
    setDraft(next);
    setFormError("");
    setOpen(true);
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const values = new FormData(event.currentTarget);
    setBusy(true);
    setFormError("");
    try {
      let input: RecordInput = {
        ...defaults,
        kind,
        title: String(values.get("title") ?? "").trim(),
        status: String(values.get("status") ?? statuses[0]?.value ?? "ativo"),
        details: { ...defaults?.details, ...editing?.details },
      };
      if (editing) {
        for (const key of ["amount", "clientId", "projectId", "leadId", "ownerId", "parentId", "startDate", "dueDate"] as const) {
          (input as Record<string, unknown>)[key] = editing[key];
        }
      }
      fields.forEach(field => {
        const value = field.type === "checkbox" ? values.has(field.key) : values.get(field.key);
        const parsed = field.type === "number" ? (value === "" || value == null ? null : Number(value))
          : field.type === "checkbox" ? Boolean(value)
          : typeof value === "string" ? value.trim() || null : value ?? null;
        if (field.required && (parsed == null || parsed === "" || (field.type === "checkbox" && !parsed))) throw new Error(`Preencha ${field.label.toLocaleLowerCase("pt-BR")}.`);
        if (typeof parsed === "number" && !Number.isFinite(parsed)) throw new Error(`${field.label}: informe um número válido.`);
        if (field.key.startsWith("details.")) input.details![field.key.slice(8)] = parsed;
        else (input as Record<string, unknown>)[field.key] = parsed;
      });
      if (!input.title) throw new Error(`Preencha ${titleLabel.toLocaleLowerCase("pt-BR")}.`);
      if (input.startDate && input.dueDate && input.dueDate < input.startDate) throw new Error("A data final deve ser igual ou posterior à data inicial.");
      if (prepare) input = await prepare(input, editing);
      const saved = await store.save(input, editing?.id, editing?.version);
      onSaved?.(saved);
      setOpen(false);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Não foi possível salvar. Tente novamente.");
    } finally { setBusy(false); }
  }

  async function archive(record: WorkspaceRecord, restore = false) {
    setBusy(true);
    setActionError("");
    try {
      if (restore) await store.restore(record);
      else await store.archive(record);
      setConfirmArchive(null);
    } catch (error) { setActionError(error instanceof Error ? error.message : "Não foi possível atualizar o registro."); }
    finally { setBusy(false); }
  }

  async function showHistory(record: WorkspaceRecord) {
    setHistoryRecord(record);
    setHistory([]);
    setHistoryError("");
    setHistoryBusy(true);
    try { setHistory(await getRecordHistory(record.id)); }
    catch (error) { setHistoryError(error instanceof Error ? error.message : "Não foi possível carregar o histórico."); }
    finally { setHistoryBusy(false); }
  }

  return <section className="min-w-0 space-y-4" aria-label={title}>
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0"><h2 className="text-xl font-semibold tracking-tight">{title}</h2>{description && <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">{description}</p>}</div>
      <Button className="min-h-11 bg-[var(--frame-red)] text-white hover:bg-red-600" onClick={() => begin(null)} disabled={!canWrite}><Plus className="h-4 w-4" /> Adicionar</Button>
    </div>
    {!canWrite && <p className="text-sm text-muted-foreground">{!configured || isPreview || !profile ? "Entre com sua conta para cadastrar ou editar registros." : "Seu acesso a este módulo é somente leitura ou está sendo verificado."}</p>}
    <div className="flex flex-wrap gap-2">
      <label className="relative min-w-0 flex-1 basis-52"><span className="sr-only">Buscar em {title}</span><Search className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" /><Input className={`${formClass} pl-9`} value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar registros" /></label>
      <select aria-label={`Filtrar status de ${title}`} value={status} onChange={e => setStatus(e.target.value)} className={`${selectClass} !w-auto max-w-full flex-1 basis-40`}><option value="">Todos os status</option>{statuses.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
      <Button className="min-h-11" variant="outline" aria-pressed={showArchived} onClick={() => setShowArchived(value => !value)}><Archive className="h-4 w-4" />{showArchived ? "Ver ativos" : "Arquivados"}</Button>
      <Button className="min-h-11" variant="outline" aria-label={`Exportar ${title} em CSV`} disabled={!records.length} onClick={() => downloadCsv(`${kind}.csv`, [titleLabel, "Status", ...fields.map(f => f.label)], records.map(record => [record.title, statuses.find(s => s.value === record.status)?.label ?? record.status, ...fields.map(f => readable(fieldValue(record, f.key)))]))}><Download className="h-4 w-4" /><span className="sr-only">Exportar CSV</span></Button>
    </div>
    <WorkspaceNotice error={store.error || actionError} loading={store.loading}>
      {records.length ? <div className="grid min-w-0 gap-3 lg:grid-cols-2">{records.map(record => <article key={record.id} className="min-w-0 rounded-2xl border border-border bg-card p-5">
        <div className="flex flex-wrap items-start justify-between gap-2"><h3 className="min-w-0 break-words font-semibold">{record.title}</h3><span className="rounded-md border border-border px-2 py-1 text-xs text-muted-foreground">{statuses.find(s => s.value === record.status)?.label ?? record.status}</span></div>
        <div className="mt-4 min-w-0 break-words text-sm leading-relaxed">{renderRecord ? renderRecord(record) : <dl className="grid gap-3 sm:grid-cols-2">{fields.filter(field => fieldValue(record, field.key) != null && fieldValue(record, field.key) !== "").map(field => <div key={field.key}><dt className="text-xs text-muted-foreground">{field.label}</dt><dd className="mt-1 whitespace-pre-wrap break-words">{field.options?.find(option => option.value === fieldValue(record, field.key))?.label ?? readable(fieldValue(record, field.key))}</dd></div>)}</dl>}</div>
        <div className="mt-5 flex flex-wrap gap-2 border-t border-border pt-4">
          {!record.archivedAt && <Button variant="outline" size="sm" className="min-h-11" disabled={!canWrite || busy} onClick={() => begin(record)}><Pencil className="h-3.5 w-3.5" />Editar</Button>}
          <Button variant="ghost" size="sm" className="min-h-11" onClick={() => showHistory(record)}><History className="h-3.5 w-3.5" />Histórico</Button>
          <Button variant="ghost" size="sm" className="min-h-11" disabled={!canWrite || busy} onClick={() => record.archivedAt ? archive(record, true) : setConfirmArchive(record)}>{record.archivedAt ? <RotateCcw className="h-3.5 w-3.5" /> : <Archive className="h-3.5 w-3.5" />}{record.archivedAt ? "Restaurar" : "Arquivar"}</Button>
          {!record.archivedAt && renderActions?.(record, store.reload)}
        </div>
      </article>)}</div> : <div className="rounded-2xl border border-dashed border-border px-5 py-12 text-center"><p className="font-medium">{query || status ? "Nenhum registro corresponde aos filtros" : showArchived ? "Nenhum registro arquivado" : "Seu próximo registro começa aqui"}</p><p className="mt-2 text-sm text-muted-foreground">{query || status ? "Ajuste a busca ou o status para ver os demais registros." : "Os registros salvos ficam disponíveis para a equipe conforme suas permissões."}</p></div>}
    </WorkspaceNotice>
    {store.error && <Button variant="outline" onClick={() => store.reload()}>Tentar novamente</Button>}

    <Dialog open={open} onOpenChange={value => { if (!busy) setOpen(value); }}><DialogContent className="max-h-[90dvh] overflow-y-auto rounded-2xl bg-card sm:max-w-2xl"><DialogHeader><DialogTitle>{editing ? "Editar" : "Adicionar"} · {title}</DialogTitle><DialogDescription>Preencha os dados. As alterações serão registradas no histórico.</DialogDescription></DialogHeader>
      <form onSubmit={submit} className="grid min-w-0 gap-4 sm:grid-cols-2">
        <label className="min-w-0 space-y-2 sm:col-span-2"><span className="text-sm font-medium">{titleLabel} *</span><Input name="title" autoFocus maxLength={240} required className={formClass} value={String(draft.title ?? "")} onChange={e => setDraft(value => ({ ...value, title: e.target.value }))} /></label>
        <label className="min-w-0 space-y-2"><span className="text-sm font-medium">Status *</span><select name="status" className={selectClass} required value={String(draft.status ?? "")} onChange={e => setDraft(value => ({ ...value, status: e.target.value }))}>{statuses.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
        {fields.map(field => <div key={field.key} className={`min-w-0 space-y-2 ${field.type === "textarea" ? "sm:col-span-2" : ""}`}>
          <label htmlFor={`${prefix}-${field.key}`} className="block text-sm font-medium">{field.label}{field.required ? " *" : ""}</label>
          {field.type === "select" ? <select name={field.key} id={`${prefix}-${field.key}`} className={selectClass} required={field.required} value={String(draft[field.key] ?? "")} onChange={e => setDraft(value => ({ ...value, [field.key]: e.target.value }))}><option value="">Selecione</option>{field.options?.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
            : field.type === "textarea" ? <Textarea name={field.key} id={`${prefix}-${field.key}`} className={`${formClass} min-h-28`} required={field.required} maxLength={30000} value={String(draft[field.key] ?? "")} placeholder={field.placeholder} onChange={e => setDraft(value => ({ ...value, [field.key]: e.target.value }))} />
            : field.type === "checkbox" ? <input name={field.key} id={`${prefix}-${field.key}`} type="checkbox" className="h-6 w-6 accent-red-600" checked={Boolean(draft[field.key])} onChange={e => setDraft(value => ({ ...value, [field.key]: e.target.checked }))} />
            : <Input name={field.key} id={`${prefix}-${field.key}`} className={formClass} type={field.type ?? "text"} onInput={field.type === "date" ? e => { const value = e.currentTarget.value; setDraft(current => ({ ...current, [field.key]: value })); } : undefined} required={field.required} min={field.min} max={field.max} step={field.step ?? (field.type === "number" ? "any" : undefined)} maxLength={field.type === "number" ? undefined : 2000} value={String(draft[field.key] ?? "")} placeholder={field.placeholder} onChange={e => setDraft(value => ({ ...value, [field.key]: e.target.value }))} />}
          {field.help && <p className="text-xs leading-relaxed text-muted-foreground">{field.help}</p>}
        </div>)}
        {formError && <p role="alert" className="rounded-lg border border-red-500/40 p-3 text-sm text-red-300 sm:col-span-2">{formError}</p>}
        <DialogFooter className="mt-2 sm:col-span-2"><Button type="button" variant="outline" className="min-h-11" disabled={busy} onClick={() => setOpen(false)}>Cancelar</Button><Button type="submit" className="min-h-11 bg-[var(--frame-red)] text-white hover:bg-red-600" disabled={busy || !canWrite}>{busy && <Loader2 className="h-4 w-4 animate-spin" />} {busy ? "Salvando…" : "Salvar"}</Button></DialogFooter>
      </form>
    </DialogContent></Dialog>

    <Dialog open={Boolean(confirmArchive)} onOpenChange={value => { if (!busy && !value) setConfirmArchive(null); }}><DialogContent className="rounded-2xl bg-card"><DialogHeader><DialogTitle>Arquivar {confirmArchive?.title}?</DialogTitle><DialogDescription>O registro sai da lista ativa. Você poderá restaurá-lo na opção Arquivados; o histórico será preservado.</DialogDescription></DialogHeader>{actionError && <p role="alert" className="text-sm text-red-300">{actionError}</p>}<DialogFooter><Button variant="outline" disabled={busy} onClick={() => setConfirmArchive(null)}>Cancelar</Button><Button disabled={busy} onClick={() => confirmArchive && archive(confirmArchive)}>{busy ? "Arquivando…" : "Arquivar"}</Button></DialogFooter></DialogContent></Dialog>

    <Dialog open={Boolean(historyRecord)} onOpenChange={value => { if (!value) setHistoryRecord(null); }}><DialogContent className="max-h-[90dvh] overflow-y-auto rounded-2xl bg-card sm:max-w-2xl"><DialogHeader><DialogTitle>Histórico · {historyRecord?.title}</DialogTitle><DialogDescription>Versões registradas de cada alteração salva.</DialogDescription></DialogHeader><WorkspaceNotice error={historyError} loading={historyBusy}><ol className="space-y-4">{history.map(entry => <li key={entry.id} className="rounded-xl border border-border p-4"><p className="text-sm font-medium">Versão {entry.version} <span className="text-xs font-normal text-muted-foreground">· {new Date(entry.createdAt).toLocaleString("pt-BR")}</span></p><p className="mt-2 break-words text-sm">{entry.snapshot.title}</p><p className="text-xs text-muted-foreground">{statuses.find(s => s.value === entry.snapshot.status)?.label ?? entry.snapshot.status}{entry.snapshot.archivedAt ? " · Arquivado" : ""}</p><dl className="mt-3 grid gap-2 text-xs sm:grid-cols-2">{fields.map(field => <div key={field.key}><dt className="text-muted-foreground">{field.label}</dt><dd className="whitespace-pre-wrap break-words">{field.options?.find(option => option.value === fieldValue(entry.snapshot, field.key))?.label ?? readable(fieldValue(entry.snapshot, field.key))}</dd></div>)}</dl></li>)}</ol>{!history.length && <p className="text-sm text-muted-foreground">Nenhuma versão registrada.</p>}</WorkspaceNotice></DialogContent></Dialog>
  </section>;
}
