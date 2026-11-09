import { describe, expect, it } from "vitest";
import {
  mapClient,
  mapDecision,
  mapLead,
  mapProject,
  mapTask,
  mapTransaction,
  mapVote,
} from "@/lib/frameflow/data";

describe("camada de dados — mappers snake_case (banco) ↔ camelCase (app)", () => {
  it("mapLead converte valor_estimado de centavos para BRL", () => {
    const lead = mapLead({
      id: "l1",
      nome: "Ana Souza",
      empresa: "ACME",
      valor_estimado: 1500000, // R$ 15.000,00 no banco
      created_at: "2026-10-01T10:00:00Z",
      updated_at: "2026-10-02T10:00:00Z",
    });
    expect(lead.valorEstimado).toBe(15000);
    expect(lead.etapa).toBe("novo"); // default honesto
    expect(lead.origem).toBe("outro");
    expect(lead.email).toBeNull();
    expect(lead.clienteId).toBeNull();
  });

  it("mapClient aplica defaults de contato/segmento", () => {
    const cliente = mapClient({ id: "c1", nome_fantasia: "ACME", created_at: "2026-10-01" });
    expect(cliente.nomeFantasia).toBe("ACME");
    expect(cliente.contatos).toEqual([]);
    expect(cliente.segmento).toBe("outro");
  });

  it("mapProject converve orçamento em centavos → BRL e exige clienteId", () => {
    const projeto = mapProject({
      id: "p1",
      cliente_id: "c1",
      titulo: "Campanha",
      tipo_servico: "Filme",
      orcamento: 3000000,
      created_at: "2026-10-01",
    });
    expect(projeto.orcamento).toBe(30000);
    expect(projeto.clienteId).toBe("c1");
    expect(projeto.status).toBe("briefing");
  });

  it("mapTask preserva prioridade e aceita tarefa sem projeto (backlog)", () => {
    const tarefa = mapTask({ id: "t1", titulo: "Rough cut", prioridade: "alta", created_at: "2026-10-01" });
    expect(tarefa.prioridade).toBe("alta");
    expect(tarefa.projetoId).toBeNull();
    expect(tarefa.status).toBe("pendente");
  });

  it("mapTransaction converte centavos e mantém vencimento (condições contratuais)", () => {
    const tx = mapTransaction({
      id: "tx1",
      tipo: "saida",
      categoria: "prazo_labore",
      descricao: "Pró-labore de outubro",
      valor: 500000,
      vencimento: "2026-11-05T00:00:00Z",
      pago: false,
      criado_por: "s1",
    });
    expect(tx.valor).toBe(5000);
    expect(tx.tipo).toBe("saida");
    expect(tx.categoria).toBe("prazo_labore");
    expect(tx.pago).toBe(false);
  });

  it("mapVote modela a linha da tabela relacional decisao_votos", () => {
    const voto = mapVote({
      decisao_id: "d1",
      socio_id: "s1",
      voto: "favor",
      comentario: "Concordo com o impacto projetado",
      criado_em: "2026-10-01T10:00:00Z",
      atualizado_em: "2026-10-03T10:00:00Z",
    });
    expect(voto.socioId).toBe("s1");
    expect(voto.voto).toBe("favor");
    expect(voto.atualizadoEm).toBe("2026-10-03T10:00:00Z");
  });

  it("mapVote aplica default honesto para voto ausente", () => {
    expect(mapVote({ socio_id: "s2" }).voto).toBe("abstencao");
  });

  it("mapDecision lê votos do JOIN com decisao_votos (substituiu o jsonb editável)", () => {
    const decisao = mapDecision({
      id: "d1",
      titulo: "Investimento",
      descricao: "Lente anamórfica",
      solicitante_id: "s1",
      impacto_financeiro: 1200000,
      regra_aprovacao: "maioria",
      status: "aberta",
      decisao_votos: [
        { socio_id: "s1", voto: "favor", comentario: null, atualizado_em: "2026-10-02T10:00:00Z" },
        { socio_id: "s2", voto: "contra", comentario: null, atualizado_em: "2026-10-02T11:00:00Z" },
      ],
      created_at: "2026-10-01",
    });
    expect(decisao.impactoFinanceiro).toBe(12000);
    expect(decisao.votos).toHaveLength(2);
    expect(decisao.votos.map((v) => v.socioId)).toEqual(["s1", "s2"]);
  });

  it("mapDecision sem votos retorna lista vazia (não inventa dados)", () => {
    const decisao = mapDecision({ id: "d2", titulo: "T", descricao: "D", created_at: "2026-10-01" });
    expect(decisao.votos).toEqual([]);
    expect(decisao.status).toBe("rascunho");
  });

  it("round-trip de centavos nas bordas: gravação (×100) e leitura (÷100)", () => {
    // createLead grava Math.round(valorEstimado * 100) — simulamos a ida e a volta
    const brlOriginal = 12345.67;
    const gravado = Math.round(brlOriginal * 100);
    expect(gravado).toBe(1234567);
    expect(mapLead({ valor_estimado: gravado }).valorEstimado).toBe(12345.67);
  });
});
