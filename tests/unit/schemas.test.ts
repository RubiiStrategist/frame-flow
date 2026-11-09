import { describe, expect, it } from "vitest";
import {
  clienteSchema,
  decisaoSchema,
  leadSchema,
  projetoSchema,
  tarefaSchema,
  transacaoSchema,
} from "@/lib/frameflow/schemas";

/** Executa o schema e devolve a primeira mensagem de erro (ou null quando válido). */
function primeiroErro(schema: { safeParse: (v: unknown) => { success: boolean; data?: unknown; error?: { issues: { message: string }[] } } }, valor: unknown): string | null {
  const r = schema.safeParse(valor);
  if (r.success) return null;
  return r.error?.issues[0]?.message ?? "erro";
}

describe("validação de formulários — Leads", () => {
  const leadValido = {
    nome: "Ana Souza",
    empresa: "ACME Filmes",
    email: "ana@acme.com",
    telefone: "11999999999",
    origem: "indicacao",
    valorEstimado: "15000",
    observacoes: "Indicação do Rubian",
  };

  it("aceita lead completo", () => {
    expect(primeiroErro(leadSchema, leadValido)).toBeNull();
  });

  it("aceita lead sem e-mail/telefone (opcionais)", () => {
    expect(primeiroErro(leadSchema, { ...leadValido, email: "", telefone: "" })).toBeNull();
  });

  it("rejeita nome curto", () => {
    expect(primeiroErro(leadSchema, { ...leadValido, nome: "A" })).toBe("Informe o nome.");
  });

  it("rejeita empresa vazia", () => {
    expect(primeiroErro(leadSchema, { ...leadValido, empresa: "" })).toBe("Informe a empresa.");
  });

  it("rejeita e-mail inválido", () => {
    expect(primeiroErro(leadSchema, { ...leadValido, email: "sem-arroba" })).toBe("E-mail inválido.");
  });

  it("rejeita valor não numérico", () => {
    expect(primeiroErro(leadSchema, { ...leadValido, valorEstimado: "abc" })).toBe("Valor inválido");
  });

  it("aceita valor com vírgula decimal (padrão pt-BR)", () => {
    expect(primeiroErro(leadSchema, { ...leadValido, valorEstimado: "15,5" })).toBeNull();
  });
});

describe("validação de formulários — Clientes", () => {
  const clienteValido = {
    nomeFantasia: "ACME",
    razaoSocial: "",
    documento: "",
    segmento: "audiovisual",
    site: "",
    observacoes: "",
  };

  it("aceita cliente válido", () => {
    expect(primeiroErro(clienteSchema, clienteValido)).toBeNull();
  });

  it("rejeita nome curto", () => {
    expect(primeiroErro(clienteSchema, { ...clienteValido, nomeFantasia: "X" })).toBe("Informe o nome.");
  });
});

describe("validação de formulários — Projetos", () => {
  const projetoValido = {
    titulo: "Campanha natalina",
    tipoServico: "Filme publicitário",
    clienteId: "uuid-cliente",
    status: "briefing",
    orcamento: "30000",
    dataEntregaPrevista: "2026-12-10",
    descricao: "",
  };

  it("aceita projeto válido", () => {
    expect(primeiroErro(projetoSchema, projetoValido)).toBeNull();
  });

  it("exige cliente (integridade: projeto sempre pertence a cliente)", () => {
    expect(primeiroErro(projetoSchema, { ...projetoValido, clienteId: "" })).toBe("Selecione o cliente.");
  });

  it("rejeita título curto e orçamento inválido", () => {
    expect(primeiroErro(projetoSchema, { ...projetoValido, titulo: "ab" })).toBe("Informe o título.");
    expect(primeiroErro(projetoSchema, { ...projetoValido, orcamento: "xyz" })).toBe("Valor inválido");
  });
});

describe("validação de formulários — Tarefas", () => {
  const tarefaValida = { titulo: "Editar rough cut", prioridade: "alta", prazo: "2026-11-01" };

  it("aceita tarefa válida e tarefa sem prazo", () => {
    expect(primeiroErro(tarefaSchema, tarefaValida)).toBeNull();
    expect(primeiroErro(tarefaSchema, { ...tarefaValida, prazo: undefined })).toBeNull();
  });

  it("rejeita título curto", () => {
    expect(primeiroErro(tarefaSchema, { ...tarefaValida, titulo: "ab" })).toBe("Descreva a tarefa.");
  });

  it("exige prioridade como string válida (select)", () => {
    expect(primeiroErro(tarefaSchema, { ...tarefaValida, prioridade: undefined })).toBeTruthy();
  });
});

describe("validação de formulários — Financeiro", () => {
  const transacaoValida = {
    tipo: "entrada",
    categoria: "prazo_labore",
    descricao: "Pró-labore de outubro",
    valor: "5000",
    vencimento: "2026-11-05",
  };

  it("aceita movimentação válida, incluindo categorias de sócios", () => {
    expect(primeiroErro(transacaoSchema, transacaoValida)).toBeNull();
  });

  it("rejeita valor zero e negativo (o banco exige valor >= 0 e a UI > 0)", () => {
    expect(primeiroErro(transacaoSchema, { ...transacaoValida, valor: "0" })).toBe("Valor inválido");
    expect(primeiroErro(transacaoSchema, { ...transacaoValida, valor: "-5" })).toBe("Valor inválido");
  });

  it("exige vencimento (condições contratuais)", () => {
    expect(primeiroErro(transacaoSchema, { ...transacaoValida, vencimento: "" })).toBe("Informe o vencimento.");
  });
});

describe("validação de formulários — Decisões", () => {
  const decisaoValida = {
    titulo: "Investir em lente cinematográfica",
    descricao: "Aquisição de lente anamórfica para diferenciação premium",
    justificativa: "",
    impactoFinanceiro: "12000",
    regraAprovacao: "maioria",
    prazo: "",
  };

  it("aceita solicitação válida", () => {
    expect(primeiroErro(decisaoSchema, decisaoValida)).toBeNull();
  });

  it("rejeita título curto e descrição insuficiente", () => {
    expect(primeiroErro(decisaoSchema, { ...decisaoValida, titulo: "abc" })).toBe("Dê um título claro.");
    expect(primeiroErro(decisaoSchema, { ...decisaoValida, descricao: "curta" })).toBe("Descreva a decisão solicitada.");
  });

  it("aceita todas as regras de aprovação configuráveis", () => {
    for (const regra of ["maioria", "unanimidade", "socio_presente", "livre"]) {
      expect(primeiroErro(decisaoSchema, { ...decisaoValida, regraAprovacao: regra })).toBeNull();
    }
  });
});
