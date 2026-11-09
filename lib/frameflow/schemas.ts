/**
 * FRAME FLOW — Schemas Zod dos formulários (fonte única de validação).
 *
 * As views usam estes schemas via react-hook-form (`zodResolver`); eles são
 * testados diretamente em `tests/unit/schemas.test.ts`. Regra da etapa 1.1:
 * validação idêntica à original — apenas extraída para ser verificável.
 */

import { z } from "zod";
import type {
  ApprovalRule,
  ClientSegment,
  FinanceCategory,
  LeadSource,
  ProjectStatus,
  TaskPriority,
  TransactionKind,
} from "./types";

/* ---------- Comercial ---------- */

export const leadSchema = z.object({
  nome: z.string().min(2, "Informe o nome."),
  empresa: z.string().min(1, "Informe a empresa."),
  email: z.string().email("E-mail inválido.").or(z.literal("")),
  telefone: z.string().max(20).or(z.literal("")),
  origem: z.custom<LeadSource>((v) => typeof v === "string"),
  valorEstimado: z
    .string()
    .refine((v) => !Number.isNaN(Number(v.replace(",", "."))), "Valor inválido"),
  observacoes: z.string().max(2000).optional(),
});

export type LeadForm = z.infer<typeof leadSchema>;

export const clienteSchema = z.object({
  nomeFantasia: z.string().min(2, "Informe o nome."),
  razaoSocial: z.string().optional(),
  documento: z.string().optional(),
  segmento: z.custom<ClientSegment>((v) => typeof v === "string"),
  site: z.string().optional(),
  observacoes: z.string().max(2000).optional(),
});

export type ClienteForm = z.infer<typeof clienteSchema>;

/* ---------- Operacional ---------- */

export const projetoSchema = z.object({
  titulo: z.string().min(3, "Informe o título."),
  tipoServico: z.string().min(2, "Informe o serviço."),
  clienteId: z.string().min(1, "Selecione o cliente."),
  status: z.custom<ProjectStatus>((v) => typeof v === "string"),
  orcamento: z.string().refine((v) => !Number.isNaN(Number(v.replace(",", "."))), "Valor inválido"),
  dataEntregaPrevista: z.string().optional(),
  descricao: z.string().max(3000).optional(),
});

export type ProjetoForm = z.infer<typeof projetoSchema>;

export const tarefaSchema = z.object({
  titulo: z.string().min(3, "Descreva a tarefa."),
  prioridade: z.custom<TaskPriority>((v) => typeof v === "string"),
  prazo: z.string().optional(),
});

export type TarefaForm = z.infer<typeof tarefaSchema>;

/* ---------- Financeiro ---------- */

export const transacaoSchema = z.object({
  tipo: z.custom<TransactionKind>((v) => typeof v === "string"),
  categoria: z.custom<FinanceCategory>((v) => typeof v === "string"),
  descricao: z.string().min(3, "Descreva a movimentação."),
  valor: z.string().refine((v) => !Number.isNaN(Number(v.replace(",", "."))) && Number(v.replace(",", ".")) > 0, "Valor inválido"),
  vencimento: z.string().min(1, "Informe o vencimento."),
});

export type TransacaoForm = z.infer<typeof transacaoSchema>;

/* ---------- Central de decisões ---------- */

export const decisaoSchema = z.object({
  titulo: z.string().min(4, "Dê um título claro."),
  descricao: z.string().min(10, "Descreva a decisão solicitada."),
  justificativa: z.string().max(2000).optional(),
  impactoFinanceiro: z.string().optional(),
  regraAprovacao: z.custom<ApprovalRule>((v) => typeof v === "string"),
  prazo: z.string().optional(),
});

export type DecisaoForm = z.infer<typeof decisaoSchema>;
