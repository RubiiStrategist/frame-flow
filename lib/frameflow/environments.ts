import {
  BarChart3,
  Bot,
  Brain,
  CalendarDays,
  CheckSquare,
  ClipboardCheck,
  Clapperboard,
  Compass,
  Contact,
  CreditCard,
  Crown,
  FileText,
  FileCheck2,
  Files,
  Filter,
  Gauge,
  Handshake,
  Landmark,
  LayoutDashboard,
  LineChart,
  ListChecks,
  MessageSquare,
  Newspaper,
  PieChart,
  Scale,
  Search,
  Settings2,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  Wallet,
  Workflow,
  type LucideIcon,
} from "lucide-react";
import type {
  CapPresentation,
  EnvironmentId,
  ModulePhase,
} from "./types";

/**
 * Registro canônico de ambientes e módulos da FRAME FLOW.
 * Fonte da verdade para navegação (sidebar, bottom-nav, menu completo).
 *
 * Todos os módulos registrados nesta versão possuem telas operacionais.
 * As fases antigas ficam apenas como rótulos de compatibilidade.
 */

export interface ModuleDef {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  phase: ModulePhase;
  category: string;
}

export interface EnvironmentDef {
  id: EnvironmentId;
  label: string;
  role: string;
  partner: string;
  partnerFullRole: string;
  capPresentation: CapPresentation;
  modules: ModuleDef[];
  /** Atalhos da navegação inferior mobile (5, o último é sempre a Cap). */
  shortcuts: string[];
  startModule: string;
}

const M = (
  id: string,
  title: string,
  description: string,
  icon: LucideIcon,
  category: string,
  phase: ModulePhase
): ModuleDef => ({ id, title, description, icon, category, phase });

export const ENVIRONMENTS: EnvironmentDef[] = [
  {
    id: "executivo",
    label: "Executivo",
    role: "CEO",
    partner: "Rubian",
    partnerFullRole: "Rubian — CEO · Direção estratégica e decisões executivas",
    capPresentation: "executiva",
    startModule: "inicio",
    shortcuts: ["inicio", "indicadores", "financeiro", "decisoes", "cap"],
    modules: [
      M("inicio", "Início", "Dashboard executivo com visão geral da FRAME VISION.", LayoutDashboard, "Visão geral", "mvp"),
      M("indicadores", "Indicadores", "Inteligência de negócios: KPIs e tendências da operação.", LineChart, "Visão geral", "mvp"),
      M("financeiro", "Financeiro", "Gestão financeira empresarial: fluxo, contas e movimentações com sócios.", Wallet, "Gestão", "mvp"),
      M("decisoes", "Decisões", "Central de decisões dos sócios: solicitações, votos e histórico.", Landmark, "Gestão", "mvp"),
      M("clientes", "Clientes", "Gestão de clientes da FRAME VISION.", Contact, "Gestão", "mvp"),
      M("comercial", "Inteligência comercial", "Leitura executiva do funil, metas e expansão.", TrendingUp, "Gestão", "mvp"),
      M("operacional", "Gestão operacional", "Panorama de projetos, produção e entregas.", Workflow, "Gestão", "mvp"),
      M("planejamento", "Planejamento estratégico", "OKRs, metas empresariais e roadmap.", Compass, "Estratégia", "mvp"),
      M("pessoas", "Pessoas e equipe", "Equipe interna, papéis e desenvolvimento.", Users, "Estratégia", "mvp"),
      M("juridico", "Jurídico e contratos", "Contratos, propriedade intelectual e conformidade.", Scale, "Estratégia", "mvp"),
      M("cap", "Cap Executiva", "Assistente estratégica do ambiente executivo.", Bot, "Inteligência", "mvp"),
      M("configuracoes", "Configurações", "Administração da plataforma, conexão e permissões.", Settings2, "Sistema", "mvp"),
    ],
  },
  {
    id: "comercial",
    label: "Comercial",
    role: "CRO",
    partner: "William",
    partnerFullRole: "William — CRO · Comercial, crescimento e expansão",
    capPresentation: "comercial",
    startModule: "inicio",
    shortcuts: ["inicio", "funil", "leads", "equipe", "cap"],
    modules: [
      M("inicio", "Início", "Dashboard comercial: pipeline, metas e ritmo da semana.", Gauge, "Visão geral", "mvp"),
      M("leads", "Leads", "Gestão de leads: cadastro, origem, estágio e responsável.", Search, "Pipeline", "mvp"),
      M("funil", "Funil de vendas", "Funil completo da proposta ao fechamento.", Filter, "Pipeline", "mvp"),
      M("clientes", "Clientes", "Cadastro e relacionamento com clientes.", Handshake, "Pipeline", "mvp"),
      M("prospeccao", "Prospecção", "Listas de prospecção ativa e cadência de contatos.", Search, "Pipeline", "mvp"),
      M("propostas", "Propostas e negociações", "Propostas comerciais, versões e condições.", FileText, "Negociação", "mvp"),
      M("metas", "Metas e comissões", "Metas empresariais, departamentais e individuais; comissões.", Target, "Negociação", "mvp"),
      M("retencao", "Retenção e expansão", "Recorrência, upsell e saúde da carteira.", MessageSquare, "Relacionamento", "mvp"),
      M("equipe", "Equipe comercial", "Gestão de equipe, recrutamento e treinamento.", Users, "Relacionamento", "mvp"),
      M("cap", "Cap Comercial", "Assistente comercial energética e orientada a resultados.", Bot, "Inteligência", "mvp"),
    ],
  },
  {
    id: "operacional",
    label: "Operacional",
    role: "COO + CFO",
    partner: "Letícia",
    partnerFullRole: "Letícia — COO + CFO · Operações, produção, entregas e finanças",
    capPresentation: "operacional",
    startModule: "inicio",
    shortcuts: ["inicio", "projetos", "agenda", "financeiro", "cap"],
    modules: [
      M("inicio", "Início", "Dashboard operacional e financeiro do dia a dia.", Gauge, "Visão geral", "mvp"),
      M("projetos", "Projetos", "Gestão de projetos: briefing, produção e entrega.", Clapperboard, "Produção", "mvp"),
      M("tarefas", "Tarefas", "Gestão de tarefas com responsáveis e prazos.", ListChecks, "Produção", "mvp"),
      M("agenda", "Agenda", "Calendário integrado da operação.", CalendarDays, "Produção", "mvp"),
      M("financeiro", "Financeiro", "Movimentações, vencimentos e relações com sócios (pró-labore, reembolsos, distribuição).", Wallet, "Financeiro", "mvp"),
      M("custos", "Custos e rentabilidade", "Custo por projeto, margem e rentabilidade real.", PieChart, "Financeiro", "mvp"),
      M("producao", "Fluxo de produção", "Etapas de produção audiovisual do projeto.", Workflow, "Produção", "mvp"),
      M("aprovacoes", "Aprovações de clientes", "Aprovações de entregas e solicitações de alteração.", CheckSquare, "Produção", "mvp"),
      M("arquivos", "Central de arquivos", "Arquivos do projeto (armazenamento Supabase).", Files, "Produção", "mvp"),
      M("equipe", "Gestão de equipe", "Equipe operacional, funções e agenda.", Users, "Equipe", "mvp"),
      M("qualidade", "Qualidade e processos", "Processos padrão, checklists e qualidade.", ShieldCheck, "Equipe", "mvp"),
      M("frame-content", "Frame Content", "Central editorial e de publicações.", Newspaper, "Conteúdo", "mvp"),
      M("cap", "Cap Operacional", "Assistente organizada e prática da operação.", Bot, "Inteligência", "mvp"),
    ],
  },
];

export function getEnvironment(id: EnvironmentId): EnvironmentDef {
  const env = ENVIRONMENTS.find((e) => e.id === id);
  if (!env) throw new Error(`Ambiente desconhecido: ${id}`);
  return env;
}

export function getModule(env: EnvironmentId, moduleId: string): ModuleDef | undefined {
  return getEnvironment(env).modules.find((m) => m.id === moduleId);
}

export function moduleTitle(env: EnvironmentId, moduleId: string): string {
  return getModule(env, moduleId)?.title ?? moduleId;
}

/** Agrupa módulos por categoria preservando a ordem de registro (sidebar). */
export function modulesByCategory(env: EnvironmentDef): { category: string; modules: ModuleDef[] }[] {
  const groups: { category: string; modules: ModuleDef[] }[] = [];
  for (const mod of env.modules) {
    const last = groups[groups.length - 1];
    if (last && last.category === mod.category) last.modules.push(mod);
    else groups.push({ category: mod.category, modules: [mod] });
  }
  return groups;
}

/** Fases de desenvolvimento exibidas nos placeholders honestos. */
export const PHASE_LABEL: Record<ModulePhase, string> = {
  mvp: "MVP",
  "fase-2": "Fase 2 — pós-MVP",
  "fase-3": "Fase 3 — expansão",
};

/** Ícones utilitários compartilhados */
export const ICONS = { Crown, CreditCard, FileCheck2, ClipboardCheck, Sparkles, Brain, BarChart3, Contact };
