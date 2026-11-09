/**
 * FRAME FLOW — Tipos de domínio.
 * Espelham o esquema SQL (supabase/migrations). Quando o projeto Supabase
 * existir, estes tipos serão substituídos por tipos gerados
 * (`supabase gen types typescript`), mantendo a mesma forma.
 */

export type EnvironmentId = "executivo" | "comercial" | "operacional" | "portal";

export type PartnerKey = "ceo" | "cro" | "coo_cfo";

export type UserRole = PartnerKey | "colaborador" | "cliente";

export type ModulePhase = "mvp" | "fase-2" | "fase-3";

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  phone?: string | null;
  avatarUrl?: string | null;
  defaultEnvironment: EnvironmentId;
  createdAt: string;
}

/* ---------- Comercial ---------- */

export type LeadStage =
  | "novo"
  | "contato"
  | "qualificado"
  | "proposta"
  | "negociacao"
  | "ganho"
  | "perdido";

export type LeadSource =
  | "indicacao"
  | "site"
  | "instagram"
  | "linkedin"
  | "evento"
  | "outbound"
  | "outro";

export interface Lead {
  id: string;
  nome: string;
  empresa: string;
  email: string | null;
  telefone: string | null;
  origem: LeadSource;
  etapa: LeadStage;
  valorEstimado: number; // BRL (centavos no banco; aqui já convertido)
  responsavelId: string | null;
  observacoes: string | null;
  proximoContato: string | null; // data ISO
  clienteId: string | null; // quando convertido
  createdAt: string;
  updatedAt: string;
  closedAt?: string | null; // Data real do fechamento; não muda em edições posteriores.
}

export type ClientSegment =
  | "audiovisual"
  | "marketing"
  | "estrategia"
  | "influencia"
  | "outro";

export interface Client {
  id: string;
  nomeFantasia: string;
  razaoSocial: string | null;
  documento: string | null; // CNPJ/CPF
  segmento: ClientSegment;
  site: string | null;
  contatos: ClientContact[];
  responsavelComercialId: string | null;
  observacoes: string | null;
  createdAt: string;
}

export interface ClientContact {
  nome: string;
  cargo?: string;
  email?: string;
  telefone?: string;
}

/* ---------- Operacional ---------- */

export type ProjectStatus =
  | "briefing"
  | "planejamento"
  | "producao"
  | "revisao"
  | "aprovacao"
  | "entregue"
  | "pausado";

export interface Project {
  id: string;
  clienteId: string;
  titulo: string;
  tipoServico: string;
  status: ProjectStatus;
  responsavelId: string | null;
  dataInicio: string | null;
  dataEntregaPrevista: string | null;
  orcamento: number; // BRL
  descricao: string | null;
  createdAt: string;
}

export type TaskStatus = "pendente" | "em_andamento" | "concluida" | "bloqueada";

export type TaskPriority = "baixa" | "media" | "alta";

export interface Task {
  id: string;
  projetoId: string | null;
  titulo: string;
  descricao: string | null;
  status: TaskStatus;
  prioridade: TaskPriority;
  responsavelId: string | null;
  prazo: string | null;
  concluidaEm: string | null;
  createdAt: string;
}

/* ---------- Financeiro ---------- */

export type TransactionKind = "entrada" | "saida";

/** Categorias incluem movimentações legítimas com sócios (pró-labore, reembolso, distribuição). */
export type FinanceCategory =
  | "projeto"
  | "servico"
  | "produto"
  | "prazo_labore" // pró-labore
  | "reembolso"
  | "distribuicao_lucros"
  | "imposto"
  | "ferramenta"
  | "equipe"
  | "infraestrutura"
  | "marketing"
  | "outro";

export interface FinanceTransaction {
  id: string;
  tipo: TransactionKind;
  categoria: FinanceCategory;
  descricao: string;
  valor: number; // BRL (positivo; o tipo define direção)
  projetoId: string | null;
  clienteId: string | null;
  vencimento: string; // data ISO
  pago: boolean;
  pagoEm: string | null;
  metodoPagamento: string | null;
  criadoPor: string;
  createdAt: string;
}

/* ---------- Central de decisões ---------- */

export type DecisionStatus =
  | "rascunho"
  | "aberta"
  | "aprovada"
  | "reprovada"
  | "cancelada";

export type ApprovalRule = "unanimidade" | "maioria" | "socio_presente" | "livre";

export interface DecisionRequest {
  id: string;
  titulo: string;
  descricao: string;
  solicitanteId: string;
  justificativa: string | null;
  impactoFinanceiro: number | null; // BRL; null = sem impacto direto
  participantes: string[];
  regraAprovacao: ApprovalRule;
  status: DecisionStatus;
  votos: DecisionVote[];
  prazo: string | null;
  historico: DecisionEvent[];
  createdAt: string;
}

export interface DecisionVote {
  /** Sócio que votou — RLS garante que cada sócio só escreve o próprio voto. */
  socioId: string;
  voto: "favor" | "contra" | "abstencao";
  comentario: string | null;
  atualizadoEm: string;
}

export interface DecisionEvent {
  evento: string;
  usuarioId: string | null;
  detalhe: string | null;
  em: string;
}

/* ---------- Cap ---------- */

export type CapPresentation = "executiva" | "comercial" | "operacional" | "concierge";

export type CapState =
  | "idle"
  | "blink"
  | "wave"
  | "point"
  | "think"
  | "celebrate"
  | "alert"
  | "wait";

export interface CapMessage {
  id: string;
  presentation: CapPresentation;
  nivel: "info" | "sucesso" | "alerta";
  texto: string;
  acao?: { rotulo: string; rota: string };
  criadoEm: string;
}

/* ---------- Utilidades ---------- */

export interface ListResult<T> {
  data: T[];
  /** Motivo honesto quando não há dados: ausência de configuração, erro ou lista vazia real. */
  reason: "vazio" | "not-configured" | "erro" | "carregando";
  error?: string;
}

export class NotConfiguredError extends Error {
  constructor() {
    super("Conexão Supabase não configurada. Configure as variáveis de ambiente para operar.");
    this.name = "NotConfiguredError";
  }
}
