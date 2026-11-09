"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowUpRight, CheckCircle2, Loader2, MessageCircle, RefreshCw, Send, ShieldCheck, Sparkles, UserRound, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/frameflow/auth";
import type { CapPresentation } from "@/lib/frameflow/types";
import "./cap-chat.css";

type CapMode = "local" | "openai";
interface ChatMessage { id: string; role: "user" | "assistant"; content: string; createdAt: string }
interface CapAction { id: string; kind: string; label: string; payload: Record<string, unknown>; status: "pending" | "completed" | "cancelled"; result?: unknown; createdAt: string }
interface ChatHistory { mode: CapMode; messages: ChatMessage[]; actions: CapAction[] }
const nextActionPrompt = { label: "Próximas ações", message: "Recomendar próximas ações" };
const environmentContent = {
  executivo: { label: "Executivo", heading: "Clareza para o próximo passo.", description: "Conecte os números da empresa às decisões do dia. Comece pelo panorama da operação ou pelo financeiro.", placeholder: "Ex.: Analisar financeiro", prompts: [{ label: "Visão geral", message: "Resumir operação" }, { label: "Financeiro", message: "Analisar financeiro" }, nextActionPrompt] },
  comercial: { label: "Comercial", heading: "Mais foco em cada oportunidade.", description: "Acompanhe seu funil, identifique contatos pendentes e organize as próximas ações comerciais.", placeholder: "Ex.: Criar tarefa: revisar os leads da semana", prompts: [{ label: "Meu funil", message: "Resumir funil" }, nextActionPrompt, { label: "Prioridades", message: "Priorizar tarefas" }] },
  operacional: { label: "Operacional", heading: "Seu dia de produção, em ordem.", description: "Consulte prioridades, acompanhe a operação e prepare tarefas para dar sequência às entregas.", placeholder: "Ex.: Criar tarefa: revisar o briefing do próximo projeto", prompts: [{ label: "Priorizar tarefas", message: "Priorizar tarefas" }, { label: "Visão geral", message: "Resumir operação" }, nextActionPrompt] },
};
const fieldLabels: Record<string, string> = { title: "Título", titulo: "Título", description: "Descrição", descricao: "Descrição", status: "Status", priority: "Prioridade", prioridade: "Prioridade", dueDate: "Prazo", prazo: "Prazo", projectId: "Projeto", projeto_id: "Projeto", ownerId: "Responsável", responsavel_id: "Responsável", id: "Registro", taskId: "Tarefa", task_id: "Tarefa", label: "Descrição", message: "Resultado", brief: "Briefing", channel: "Canal", notes: "Observações", leadId: "Lead", expectedStatus: "Situação atual" };
const resultRoutes: Record<string, string> = { "/#/operacional/tarefas": "Abrir tarefas", "/#/comercial/prospeccao": "Abrir prospecção", "/#/operacional/frame-content": "Abrir Frame Content" };

function ActionResult({ result }: { result: unknown }) {
  if (!result || typeof result !== "object" || Array.isArray(result)) return null;
  const { message, route } = result as Record<string, unknown>;
  const linkLabel = typeof route === "string" && Object.hasOwn(resultRoutes, route) ? resultRoutes[route] : null;
  return <div className="ff-cap-action-result">
    {typeof message === "string" && <p>{message}</p>}
    {linkLabel && <a href={route as string}>{linkLabel}<ArrowUpRight size={14} aria-hidden /></a>}
  </div>;
}

function readable(value: unknown): string {
  if (value == null || value === "") return "Não informado";
  if (typeof value === "boolean") return value ? "Sim" : "Não";
  if (Array.isArray(value)) return value.map(readable).join(", ");
  if (typeof value === "object") return Object.entries(value).map(([key, val]) => `${fieldLabels[key] ?? key}: ${readable(val)}`).join("\n");
  return String(value);
}

export function CapChat({ presentation, compact = false }: { presentation: CapPresentation; compact?: boolean }) {
  const { session, isPreview } = useAuth();
  const identity = isPreview ? "preview" : session?.user?.id ?? session?.access_token ?? "signed-out";
  return <CapChatSession key={`${identity}-${presentation}`} presentation={presentation} compact={compact} />;
}

function CapChatSession({ presentation, compact }: { presentation: CapPresentation; compact: boolean }) {
  const { session, isPreview } = useAuth();
  const environment = presentation === "comercial" ? "comercial" : presentation === "operacional" ? "operacional" : "executivo";
  const content = environmentContent[environment];
  const token = session?.access_token;
  const [history, setHistory] = useState<ChatHistory>({ mode: "local", messages: [], actions: [] });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [busyAction, setBusyAction] = useState("");
  const [error, setError] = useState("");
  const requestSequence = useRef(0);
  const logRef = useRef<HTMLDivElement>(null);
  const mounted = useRef(true);
  const signedIn = !!token && !isPreview;

  const request = useCallback(async <T,>(body?: Record<string, unknown>, signal?: AbortSignal): Promise<T> => {
    if (!token || isPreview) throw new Error("Entre com sua conta para conversar com a Cap.");
    const response = await fetch(body ? "/api/cap" : `/api/cap?environment=${environment}`, {
      method: body ? "POST" : "GET", cache: "no-store", signal,
      headers: { Authorization: `Bearer ${token}`, ...(body ? { "Content-Type": "application/json" } : {}) },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    const result = await response.json().catch(() => null);
    if (!response.ok) throw new Error(typeof result?.error === "string" ? result.error : "A Cap não conseguiu concluir a solicitação. Tente novamente.");
    if (!result) throw new Error("A Cap recebeu uma resposta inválida. Tente novamente.");
    return result as T;
  }, [token, isPreview, environment]);

  const load = useCallback(async (signal?: AbortSignal) => {
    const sequence = ++requestSequence.current;
    setLoading(true); setError("");
    if (!signedIn) { setHistory({ mode: "local", messages: [], actions: [] }); setLoading(false); return; }
    try {
      const data = await request<ChatHistory>(undefined, signal);
      if (mounted.current && sequence === requestSequence.current) setHistory(data);
    } catch (err) {
      if (signal?.aborted) return;
      if (mounted.current && sequence === requestSequence.current) setError(err instanceof Error ? err.message : "Não foi possível carregar a conversa.");
    } finally { if (mounted.current && sequence === requestSequence.current) setLoading(false); }
  }, [request, signedIn]);

  useEffect(() => {
    mounted.current = true;
    const controller = new AbortController();
    void load(controller.signal);
    return () => { mounted.current = false; requestSequence.current++; controller.abort(); };
  }, [load]);
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = history.messages.length ? logRef.current.scrollHeight : 0;
  }, [history.messages.length, loading]);

  async function send(text: string) {
    const content = text.trim();
    if (!content || sending || loading || !signedIn) return;
    setSending(true); setError("");
    const optimistic: ChatMessage = { id: `local-${crypto.randomUUID()}`, role: "user", content, createdAt: new Date().toISOString() };
    const scope = requestSequence.current;
    setHistory(current => ({ ...current, messages: [...current.messages, optimistic] }));
    try {
      const result = await request<{ message: ChatMessage; actions: CapAction[]; mode: CapMode }>({ type: "chat", environment, message: content });
      if (!mounted.current || scope !== requestSequence.current) return;
      setHistory(current => ({ mode: result.mode, messages: [...current.messages, result.message], actions: [...current.actions.filter(a => !result.actions.some(next => next.id === a.id)), ...result.actions] }));
      setMessage("");
    } catch (err) {
      if (!mounted.current || scope !== requestSequence.current) return;
      setHistory(current => ({ ...current, messages: current.messages.filter(m => m.id !== optimistic.id) }));
      setError(err instanceof Error ? err.message : "Não foi possível enviar a mensagem.");
    } finally { if (mounted.current) setSending(false); }
  }

  async function act(action: CapAction, type: "confirm" | "cancel") {
    if (busyAction || action.status !== "pending") return;
    setBusyAction(action.id); setError("");
    const scope = requestSequence.current;
    try {
      await request<{ result?: unknown; ok?: boolean }>({ type, actionId: action.id });
      if (!mounted.current || scope !== requestSequence.current) return;
      // Another tab may have completed this action before this request arrived.
      // The persisted state, rather than the requested verb, determines its outcome.
      await load();
      window.dispatchEvent(new Event("frameflow:workspace-changed"));
    } catch (err) {
      if (mounted.current && scope === requestSequence.current) setError(err instanceof Error ? err.message : "Não foi possível atualizar a ação.");
    } finally { if (mounted.current) setBusyAction(""); }
  }

  return <section className={`ff-cap-chat${compact ? " ff-cap-chat--compact" : ""}`} aria-label="Conversa com a Cap">
    <header className="ff-cap-chat-header">
      <div className="ff-cap-chat-heading">
        <span className="ff-cap-chat-symbol" aria-hidden><MessageCircle size={19} /></span>
        <div><h2>Sua conversa com a Cap</h2><p>{content.label}<span aria-hidden> / </span>Registros da sua conta</p></div>
      </div>
      <span className={`ff-cap-chat-mode${signedIn && !loading ? " is-ready" : ""}`}>
        {loading ? <Loader2 size={12} className="animate-spin" aria-hidden /> : <span className="ff-cap-status-dot" aria-hidden />}
        {loading ? "Conectando" : !signedIn ? "Aguardando acesso" : history.mode === "openai" ? "IA conectada" : "Assistência local"}
      </span>
    </header>

    <div ref={logRef} className="ff-cap-chat-scroll">
      <div className="ff-cap-message-list" role="log" aria-label="Histórico da conversa" aria-live="polite" aria-busy={loading || sending}>
        {loading && <div className="ff-cap-chat-loading">
          <div className="ff-cap-loading-lines" aria-hidden><span /><span /><span /></div>
          <p role="status"><Loader2 size={15} className="animate-spin" aria-hidden />Carregando conversa…</p>
        </div>}
        {!loading && !history.messages.length && <div className="ff-cap-chat-empty">
          <div className="ff-cap-empty-emblem" aria-hidden><Sparkles size={27} /></div>
          <span className="ff-cap-eyebrow">CAP / {content.label}</span>
          <h3>{signedIn ? content.heading : "Sua operação começa com você."}</h3>
          <p>{signedIn ? content.description : "Entre com sua conta para consultar os registros da empresa e conversar com a Cap."}</p>
          <span className="ff-cap-empty-hint">{signedIn ? "Escolha um atalho abaixo para começar." : "Sua conversa fica vinculada à sua conta."}</span>
        </div>}
        {!loading && history.messages.map(entry => <article key={entry.id} className={`ff-cap-message ff-cap-message--${entry.role}`}>
          <span className="ff-cap-message-avatar" aria-hidden>{entry.role === "user" ? <UserRound size={15} /> : <Sparkles size={15} />}</span>
          <div className="ff-cap-message-body">
            <div className="ff-cap-message-meta"><strong>{entry.role === "user" ? "Você" : "Cap"}</strong><time dateTime={entry.createdAt}>{new Date(entry.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</time></div>
            <div className="ff-cap-message-bubble"><p>{entry.content}</p></div>
          </div>
        </article>)}
        {sending && <div className="ff-cap-thinking" role="status"><span className="ff-cap-thinking-dots" aria-hidden><i /><i /><i /></span><span>A Cap está consultando os dados…</span></div>}
      </div>

      {!!history.actions.length && <div className="ff-cap-actions" aria-label="Ações propostas pela Cap">
        <div className="ff-cap-actions-heading"><span>Revisão de ações</span><small>Você decide o que será executado.</small></div>
        {history.actions.map(action => <article key={action.id} className={`ff-cap-action ff-cap-action--${action.status}`}>
          <div className="ff-cap-action-heading">
            <span className="ff-cap-action-icon" aria-hidden>{action.status === "completed" ? <CheckCircle2 size={17} /> : action.status === "cancelled" ? <X size={17} /> : <ShieldCheck size={17} />}</span>
            <div><h3>{action.label}</h3><p>{action.status === "pending" ? "Revise os dados antes de autorizar." : action.status === "completed" ? "Ação concluída" : "Ação cancelada"}</p></div>
          </div>
          <dl className="ff-cap-action-details">{Object.entries(action.payload ?? {}).map(([key, value]) => <div key={key}><dt>{fieldLabels[key] ?? key}</dt><dd>{readable(value)}</dd></div>)}</dl>
          {action.status === "pending" ? <div className="ff-cap-action-buttons">
            <Button size="sm" className="ff-cap-confirm" disabled={!!busyAction || sending || !signedIn} onClick={() => act(action, "confirm")}>{busyAction === action.id ? <Loader2 size={15} className="animate-spin" aria-hidden /> : <CheckCircle2 size={15} aria-hidden />}Confirmar ação</Button>
            <Button size="sm" variant="outline" disabled={!!busyAction || sending || !signedIn} onClick={() => act(action, "cancel")}><X size={15} aria-hidden />Cancelar</Button>
          </div> : action.result != null && <ActionResult result={action.result} />}
        </article>)}
      </div>}
      {error && <div role="alert" className="ff-cap-chat-error"><p>{error}</p><Button variant="ghost" size="sm" disabled={sending || !!busyAction} onClick={() => load()}><RefreshCw size={14} aria-hidden />Recarregar conversa</Button></div>}
    </div>

    <footer className="ff-cap-chat-footer">
      <div className="ff-cap-chat-prompts" aria-label="Sugestões para a conversa">{content.prompts.map(prompt => <Button key={prompt.message} variant="outline" disabled={!signedIn || loading || sending || !!busyAction} onClick={() => send(prompt.message)}>{prompt.label}<ArrowUpRight size={13} aria-hidden /></Button>)}</div>
      <form onSubmit={event => { event.preventDefault(); void send(message); }} className="ff-cap-composer">
        <label><span className="sr-only">Mensagem para a Cap</span><Textarea maxLength={4000} required value={message} disabled={!signedIn || loading || sending || !!busyAction} placeholder={content.placeholder} onChange={e => setMessage(e.target.value)} onKeyDown={event => { if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) { event.preventDefault(); event.currentTarget.form?.requestSubmit(); } }} /></label>
        <div className="ff-cap-composer-toolbar"><p><span className="ff-cap-keyboard-hint"><kbd>Ctrl</kbd> + <kbd>Enter</kbd> para enviar<span aria-hidden> · </span></span><span>{message.length}/4000</span></p><Button type="submit" className="ff-cap-send" disabled={!signedIn || loading || sending || !!busyAction || !message.trim()}>{sending ? <Loader2 size={15} className="animate-spin" aria-hidden /> : <Send size={15} aria-hidden />}Enviar</Button></div>
      </form>
      <p className="ff-cap-chat-privacy"><ShieldCheck size={12} aria-hidden /><span>Ações só acontecem com sua confirmação. Histórico vinculado à sua conta.</span></p>
    </footer>
  </section>;
}
