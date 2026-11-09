"use client";

/**
 * Página de módulo futuro — placeholder HONESTO e identificado.
 * Nunca simula funcionalidade: descreve o escopo planejado e a fase.
 */

import { ArrowUpRight, Clock3 } from "lucide-react";
import { ModuleHeader, PhaseChip } from "@/components/common/frame-primitives";
import { Cap } from "@/components/cap/cap";
import type { ModuleDef } from "@/lib/frameflow/environments";
import type { EnvironmentDef } from "@/lib/frameflow/environments";

const ROADMAP: Record<string, string> = {
  // Executivo
  planejamento: "OKRs e metas empresariais conectadas aos indicadores; roadmap trimestral da FRAME VISION; cenários de crescimento.",
  pessoas: "Registro de equipe, papéis e permissões granulares; onboarding de futuros colaboradores; desenvolvimento interno.",
  juridico: "Biblioteca de contratos com versionamento; controle de vigências; propriedade intelectual de produções.",
  comercial: "Leitura executiva do funil: conversão por etapa, velocidade de vendas, receita projetada e expansão.",
  operacional: "Panorama de capacidade: projetos simultâneos, gargalos de produção e entregas do período.",
  // Comercial
  prospeccao: "Listas de prospecção ativa com cadência de contatos, status de abordagem e histórico por lead.",
  propostas: "Propostas comerciais vinculadas a leads, versões, condições e assinatura — gatilho da automação de venda fechada.",
  metas: "Metas nos níveis empresarial, departamental e individual, com progresso real e comissões calculadas.",
  retencao: "Saúde da carteira: recorrência, sinais de risco, oportunidades de upsell e histórico de relacionamento.",
  equipe: "Equipe comercial: vendedores, metas individuais, recrutamento e treinamento.",
  // Operacional
  producao: "Etapas da produção audiovisual (roteiro → captação → edição → entrega) com status por projeto.",
  aprovacoes: "Aprovações de clientes sobre entregáveis e solicitações de alteração, integradas ao fluxo operacional.",
  arquivos: "Central de arquivos por projeto sobre o Supabase Storage, com versões e permissões por cliente.",
  custos: "Custo por projeto, margem real e rentabilidade — incluindo horas, terceiros e diárias.",
  qualidade: "Processos padrão, checklists de entrega e indicadores de qualidade da produção.",
  "frame-content": "Central editorial: calendário de publicações, aprovação de conteúdo e integração futura com plataformas.",
};

export function FutureModule({ env, mod }: { env: EnvironmentDef; mod: ModuleDef }) {
  return (
    <div>
      <ModuleHeader
        eyebrow={`${env.label} · ${mod.category}`}
        title={mod.title}
        description={mod.description}
        actions={<PhaseChip phase={mod.phase} />}
      />

      <section className="ff-roadmap"><div><span className="ff-roadmap-tag"><Clock3 size={13}/> Funcionalidade futura</span><h2>O próximo capítulo de {mod.title.toLowerCase()}.</h2><p>Este espaço faz parte da evolução da FRAME FLOW. A experiência visual está preparada; as funções deste módulo ainda não estão disponíveis.</p><div className="ff-roadmap-scope"><p className="ff-eyebrow">ESCOPO PLANEJADO</p><p>{ROADMAP[mod.id] ?? mod.description}</p></div><a className="ff-roadmap-link" href={`/#/${env.id}/inicio`}>Voltar ao painel do ambiente <ArrowUpRight size={16}/></a></div><Cap presentation={env.capPresentation} state="think" size={240}/></section>
    </div>
  );
}
