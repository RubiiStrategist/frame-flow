"use client";

/**
 * Camada de dados da FRAME FLOW.
 *
 * Regra: nenhuma view fala com o Supabase diretamente. Toda operação passa
 * por este repositório, que responde de forma honesta:
 *  - Sem configuração → ListResult.reason = "not-configured" (UI mostra estado
 *    de configuração, nunca dados fictícios).
 *  - Com configuração → operações reais no PostgreSQL com RLS.
 *
 * Valores monetários: armazenados em centavos (inteiros); convertidos na borda.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabase } from "@/lib/supabase/client";
import { centavosParaBRL } from "./format";
import { NotConfiguredError } from "./types";
import type {
  Client,
  DecisionRequest,
  DecisionVote,
  FinanceTransaction,
  Lead,
  ListResult,
  Project,
  Task,
} from "./types";

/* ---------- helpers de conversão (exportados para testes unitários) ---------- */

export function mapLead(row: Record<string, unknown>): Lead {
  return {
    id: String(row.id),
    nome: String(row.nome ?? ""),
    empresa: String(row.empresa ?? ""),
    email: (row.email as string) ?? null,
    telefone: (row.telefone as string) ?? null,
    origem: (row.origem as Lead["origem"]) ?? "outro",
    etapa: (row.etapa as Lead["etapa"]) ?? "novo",
    valorEstimado: centavosParaBRL(Number(row.valor_estimado ?? 0)),
    responsavelId: (row.responsavel_id as string) ?? null,
    observacoes: (row.observacoes as string) ?? null,
    proximoContato: (row.proximo_contato as string) ?? null,
    clienteId: (row.cliente_id as string) ?? null,
    createdAt: String(row.created_at ?? new Date().toISOString()),
    updatedAt: String(row.updated_at ?? row.created_at ?? new Date().toISOString()),
    closedAt: (row.closed_at as string) ?? null,
  };
}

export function mapClient(row: Record<string, unknown>): Client {
  return {
    id: String(row.id),
    nomeFantasia: String(row.nome_fantasia ?? ""),
    razaoSocial: (row.razao_social as string) ?? null,
    documento: (row.documento as string) ?? null,
    segmento: (row.segmento as Client["segmento"]) ?? "outro",
    site: (row.site as string) ?? null,
    contatos: (row.contatos as Client["contatos"]) ?? [],
    responsavelComercialId: (row.responsavel_comercial_id as string) ?? null,
    observacoes: (row.observacoes as string) ?? null,
    createdAt: String(row.created_at ?? new Date().toISOString()),
  };
}

export function mapProject(row: Record<string, unknown>): Project {
  return {
    id: String(row.id),
    clienteId: String(row.cliente_id ?? ""),
    titulo: String(row.titulo ?? ""),
    tipoServico: String(row.tipo_servico ?? ""),
    status: (row.status as Project["status"]) ?? "briefing",
    responsavelId: (row.responsavel_id as string) ?? null,
    dataInicio: (row.data_inicio as string) ?? null,
    dataEntregaPrevista: (row.data_entrega_prevista as string) ?? null,
    orcamento: centavosParaBRL(Number(row.orcamento ?? 0)),
    descricao: (row.descricao as string) ?? null,
    createdAt: String(row.created_at ?? new Date().toISOString()),
  };
}

export function mapTask(row: Record<string, unknown>): Task {
  return {
    id: String(row.id),
    projetoId: (row.projeto_id as string) ?? null,
    titulo: String(row.titulo ?? ""),
    descricao: (row.descricao as string) ?? null,
    status: (row.status as Task["status"]) ?? "pendente",
    prioridade: (row.prioridade as Task["prioridade"]) ?? "media",
    responsavelId: (row.responsavel_id as string) ?? null,
    prazo: (row.prazo as string) ?? null,
    concluidaEm: (row.concluida_em as string) ?? null,
    createdAt: String(row.created_at ?? new Date().toISOString()),
  };
}

export function mapTransaction(row: Record<string, unknown>): FinanceTransaction {
  return {
    id: String(row.id),
    tipo: (row.tipo as FinanceTransaction["tipo"]) ?? "entrada",
    categoria: (row.categoria as FinanceTransaction["categoria"]) ?? "outro",
    descricao: String(row.descricao ?? ""),
    valor: centavosParaBRL(Number(row.valor ?? 0)),
    projetoId: (row.projeto_id as string) ?? null,
    clienteId: (row.cliente_id as string) ?? null,
    vencimento: String(row.vencimento ?? new Date().toISOString()),
    pago: Boolean(row.pago),
    pagoEm: (row.pago_em as string) ?? null,
    metodoPagamento: (row.metodo_pagamento as string) ?? null,
    criadoPor: String(row.criado_por ?? ""),
    createdAt: String(row.created_at ?? new Date().toISOString()),
  };
}

/** Linha de `decisao_votos` (join) → voto tipado. */
export function mapVote(row: Record<string, unknown>): DecisionVote {
  return {
    socioId: String(row.socio_id ?? ""),
    voto: (row.voto as DecisionVote["voto"]) ?? "abstencao",
    comentario: (row.comentario as string) ?? null,
    atualizadoEm: String(row.atualizado_em ?? row.criado_em ?? new Date().toISOString()),
  };
}

export function mapDecision(row: Record<string, unknown>): DecisionRequest {
  const votosBrutos = Array.isArray(row.decisao_votos)
    ? (row.decisao_votos as Record<string, unknown>[])
    : [];
  return {
    id: String(row.id),
    titulo: String(row.titulo ?? ""),
    descricao: String(row.descricao ?? ""),
    solicitanteId: String(row.solicitante_id ?? ""),
    justificativa: (row.justificativa as string) ?? null,
    impactoFinanceiro:
      row.impacto_financeiro != null ? centavosParaBRL(Number(row.impacto_financeiro)) : null,
    participantes: (row.participantes as string[]) ?? [],
    regraAprovacao: (row.regra_aprovacao as DecisionRequest["regraAprovacao"]) ?? "maioria",
    status: (row.status as DecisionRequest["status"]) ?? "rascunho",
    votos: votosBrutos.map(mapVote),
    prazo: (row.prazo as string) ?? null,
    historico: (row.historico as DecisionRequest["historico"]) ?? [],
    createdAt: String(row.created_at ?? new Date().toISOString()),
  };
}

/* ---------- contexto ---------- */

export type DataStatus = "pronto" | "not-configured" | "erro";

export interface DataContextValue {
  status: DataStatus;
  client: SupabaseClient | null;
  listLeads(): Promise<ListResult<Lead>>;
  createLead(input: Omit<Lead, "id" | "createdAt" | "updatedAt" | "clienteId">): Promise<Lead | null>;
  updateLeadStage(id: string, etapa: Lead["etapa"]): Promise<boolean>;
  listClients(): Promise<ListResult<Client>>;
  createClient(input: Omit<Client, "id" | "createdAt">): Promise<Client | null>;
  listProjects(): Promise<ListResult<Project>>;
  createProject(input: Omit<Project, "id" | "createdAt">): Promise<Project | null>;
  listTasks(): Promise<ListResult<Task>>;
  createTask(input: Omit<Task, "id" | "createdAt" | "concluidaEm">): Promise<Task | null>;
  listTransactions(): Promise<ListResult<FinanceTransaction>>;
  createTransaction(
    input: Omit<FinanceTransaction, "id" | "createdAt" | "pagoEm" | "criadoPor">
  ): Promise<FinanceTransaction | null>;
  markTransactionPaid(id: string): Promise<boolean>;
  listDecisions(): Promise<ListResult<DecisionRequest>>;
  createDecision(
    input: Omit<DecisionRequest, "id" | "solicitanteId" | "status" | "votos" | "historico" | "createdAt">
  ): Promise<DecisionRequest | null>;
  /** Registra/altera o voto do sócio logado (RLS no banco garante identidade). */
  castVote(
    decisaoId: string,
    voto: DecisionVote["voto"],
    comentario?: string | null
  ): Promise<boolean>;
}

const DataContext = createContext<DataContextValue | null>(null);

async function listar<T>(
  client: SupabaseClient | null,
  tabela: string,
  mapper: (row: Record<string, unknown>) => T,
  ordem: string
): Promise<ListResult<T>> {
  if (!client) return { data: [], reason: "not-configured" };
  const { data, error } = await client.from(tabela).select("*").order(ordem, { ascending: false });
  if (error) return { data: [], reason: "erro", error: error.message };
  return { data: (data as Record<string, unknown>[]).map(mapper), reason: "vazio" };
}

export function DataProvider({ children }: { children: ReactNode }) {
  const client = useMemo(() => getSupabase(), []);
  const [status] = useState<DataStatus>(() => (client ? "pronto" : "not-configured"));

  /* ----- Comercial ----- */
  const listLeads = useCallback(
    () => listar(client, "leads", mapLead, "created_at"),
    [client]
  );

  const createLead = useCallback(
    async (input: Omit<Lead, "id" | "createdAt" | "updatedAt" | "clienteId">) => {
      if (!client) throw new NotConfiguredError();
      const { data, error } = await client
        .from("leads")
        .insert({
          nome: input.nome,
          empresa: input.empresa,
          email: input.email,
          telefone: input.telefone,
          origem: input.origem,
          etapa: input.etapa,
          valor_estimado: Math.round(input.valorEstimado * 100),
          responsavel_id: input.responsavelId,
          observacoes: input.observacoes,
          proximo_contato: input.proximoContato,
        })
        .select("*")
        .single();
      if (error) throw new Error(error.message);
      return mapLead(data as Record<string, unknown>);
    },
    [client]
  );

  const updateLeadStage = useCallback(
    async (id: string, etapa: Lead["etapa"]) => {
      if (!client) throw new NotConfiguredError();
      const { data, error } = await client.from("leads").update({ etapa }).eq("id", id).select("id").maybeSingle();
      return !error && data?.id === id;
    },
    [client]
  );

  const listClients = useCallback(
    () => listar(client, "clientes", mapClient, "created_at"),
    [client]
  );

  const createClient = useCallback(
    async (input: Omit<Client, "id" | "createdAt">) => {
      if (!client) throw new NotConfiguredError();
      const { data, error } = await client
        .from("clientes")
        .insert({
          nome_fantasia: input.nomeFantasia,
          razao_social: input.razaoSocial,
          documento: input.documento,
          segmento: input.segmento,
          site: input.site,
          contatos: input.contatos,
          responsavel_comercial_id: input.responsavelComercialId,
          observacoes: input.observacoes,
        })
        .select("*")
        .single();
      if (error) throw new Error(error.message);
      return mapClient(data as Record<string, unknown>);
    },
    [client]
  );

  /* ----- Operacional ----- */
  const listProjects = useCallback(
    () => listar(client, "projetos", mapProject, "created_at"),
    [client]
  );

  const createProject = useCallback(
    async (input: Omit<Project, "id" | "createdAt">) => {
      if (!client) throw new NotConfiguredError();
      const { data, error } = await client
        .from("projetos")
        .insert({
          cliente_id: input.clienteId,
          titulo: input.titulo,
          tipo_servico: input.tipoServico,
          status: input.status,
          responsavel_id: input.responsavelId,
          data_inicio: input.dataInicio,
          data_entrega_prevista: input.dataEntregaPrevista,
          orcamento: Math.round(input.orcamento * 100),
          descricao: input.descricao,
        })
        .select("*")
        .single();
      if (error) throw new Error(error.message);
      return mapProject(data as Record<string, unknown>);
    },
    [client]
  );

  const listTasks = useCallback(
    () => listar(client, "tarefas", mapTask, "created_at"),
    [client]
  );

  const createTask = useCallback(
    async (input: Omit<Task, "id" | "createdAt" | "concluidaEm">) => {
      if (!client) throw new NotConfiguredError();
      const { data, error } = await client
        .from("tarefas")
        .insert({
          projeto_id: input.projetoId,
          titulo: input.titulo,
          descricao: input.descricao,
          status: input.status,
          prioridade: input.prioridade,
          responsavel_id: input.responsavelId,
          prazo: input.prazo,
        })
        .select("*")
        .single();
      if (error) throw new Error(error.message);
      return mapTask(data as Record<string, unknown>);
    },
    [client]
  );

  /* ----- Financeiro ----- */
  const listTransactions = useCallback(
    () => listar(client, "transacoes_financeiras", mapTransaction, "vencimento"),
    [client]
  );

  const createTransaction = useCallback(
    async (input: Omit<FinanceTransaction, "id" | "createdAt" | "pagoEm" | "criadoPor">) => {
      if (!client) throw new NotConfiguredError();
      const { data: auth, error: authError } = await client.auth.getUser();
      if (authError || !auth.user) throw new Error("Sessão necessária para cadastrar transação.");
      const { data, error } = await client
        .from("transacoes_financeiras")
        .insert({
          tipo: input.tipo,
          categoria: input.categoria,
          descricao: input.descricao,
          valor: Math.round(input.valor * 100),
          projeto_id: input.projetoId,
          cliente_id: input.clienteId,
          vencimento: input.vencimento,
          pago: input.pago,
          metodo_pagamento: input.metodoPagamento,
          criado_por: auth.user.id,
        })
        .select("*")
        .single();
      if (error) throw new Error(error.message);
      return mapTransaction(data as Record<string, unknown>);
    },
    [client]
  );

  const markTransactionPaid = useCallback(
    async (id: string) => {
      if (!client) throw new NotConfiguredError();
      const { data, error } = await client
        .from("transacoes_financeiras")
        .update({ pago: true, pago_em: new Date().toISOString() })
        .eq("id", id)
        .select("id")
        .maybeSingle();
      return !error && data?.id === id;
    },
    [client]
  );

  /* ----- Decisões ----- */
  const listDecisions = useCallback(async (): Promise<ListResult<DecisionRequest>> => {
    if (!client) return { data: [], reason: "not-configured" };
    // Votos vêm da tabela relacional `decisao_votos` via join (FK) —
    // substitui o antigo campo jsonb editável.
    const { data, error } = await client
      .from("decisoes")
      .select("*, decisao_votos(*)")
      .order("created_at", { ascending: false });
    if (error) return { data: [], reason: "erro", error: error.message };
    return { data: (data as Record<string, unknown>[]).map(mapDecision), reason: "vazio" };
  }, [client]);

  const createDecision = useCallback(
    async (
      input: Omit<
        DecisionRequest,
        "id" | "solicitanteId" | "status" | "votos" | "historico" | "createdAt"
      >
    ) => {
      if (!client) throw new NotConfiguredError();
      const { data: auth, error: authError } = await client.auth.getUser();
      if (authError || !auth.user) throw new Error("Sessão necessária para criar decisão.");
      const { data, error } = await client
        .from("decisoes")
        .insert({
          solicitante_id: auth.user.id,
          titulo: input.titulo,
          descricao: input.descricao,
          justificativa: input.justificativa,
          impacto_financeiro:
            input.impactoFinanceiro != null ? Math.round(input.impactoFinanceiro * 100) : null,
          participantes: input.participantes,
          regra_aprovacao: input.regraAprovacao,
          prazo: input.prazo,
          status: "aberta",
        })
        .select("*")
        .single();
      if (error) throw new Error(error.message);
      return mapDecision(data as Record<string, unknown>);
    },
    [client]
  );

  const castVote = useCallback(
    async (decisaoId: string, voto: DecisionVote["voto"], comentario?: string | null) => {
      if (!client) throw new NotConfiguredError();
      const { data: userData } = await client.auth.getUser();
      const socioId = userData.user?.id;
      if (!socioId) throw new Error("Sessão necessária para votar.");
      // upsert na própria identidade: socio_id = auth.uid(). A policy RLS
      // `decisao_votos_socio_insert/update` impede escrever voto de outro.
      const { error } = await client
        .from("decisao_votos")
        .upsert(
          { decisao_id: decisaoId, socio_id: socioId, voto, comentario: comentario ?? null },
          { onConflict: "decisao_id,socio_id" }
        );
      return !error;
    },
    [client]
  );

  const value = useMemo<DataContextValue>(
    () => ({
      status,
      client,
      listLeads,
      createLead,
      updateLeadStage,
      listClients,
      createClient,
      listProjects,
      createProject,
      listTasks,
      createTask,
      listTransactions,
      createTransaction,
      markTransactionPaid,
      listDecisions,
      createDecision,
      castVote,
    }),
    [
      status,
      client,
      listLeads,
      createLead,
      updateLeadStage,
      listClients,
      createClient,
      listProjects,
      createProject,
      listTasks,
      createTask,
      listTransactions,
      createTransaction,
      markTransactionPaid,
      listDecisions,
      createDecision,
      castVote,
    ]
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData(): DataContextValue {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData deve ser usado dentro de <DataProvider>");
  return ctx;
}

/** Carregamento genérico de lista com estado honesto. */
export function useAsyncList<T>(
  loader: () => Promise<ListResult<T>>,
  deps: unknown[] = []
) {
  const [result, setResult] = useState<ListResult<T>>({ data: [], reason: "carregando" });
  const [tick, setTick] = useState(0);

  /** Recarrega: chamado de handlers/eventos (setState fora de effects). */
  const reload = useCallback(() => {
    setResult({ data: [], reason: "carregando" });
    setTick((t) => t + 1);
  }, []);

  useEffect(() => {
    let cancelado = false;
    loader()
      .then((r) => {
        if (!cancelado) setResult(r);
      })
      .catch(() => {
        if (!cancelado) setResult({ data: [], reason: "erro" });
      });
    return () => {
      cancelado = true;
    };
  }, [tick, ...deps]);

  return { result, loading: result.reason === "carregando", reload };
}
