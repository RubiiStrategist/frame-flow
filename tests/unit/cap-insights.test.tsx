import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CapInsights } from "@/components/cap/cap-insights";
import type { CapPresentation, ListResult } from "@/lib/frameflow/types";

const mock = vi.hoisted(() => ({
  auth: { configured: true, isPreview: false, status: "autenticado", session: { user: { id: "test-user" } } as { user: { id: string } } | null },
  results: {} as Record<string, ListResult<unknown>>,
  transactions: vi.fn(), decisions: vi.fn(), leads: vi.fn(), clients: vi.fn(), tasks: vi.fn(), projects: vi.fn(),
}));

vi.mock("@/lib/frameflow/auth", () => ({ useAuth: () => mock.auth }));
vi.mock("@/lib/frameflow/data", async () => {
  const actual = await vi.importActual<typeof import("@/lib/frameflow/data")>("@/lib/frameflow/data");
  return {
    ...actual,
    useData: () => ({
      listTransactions: mock.transactions, listDecisions: mock.decisions,
      listLeads: mock.leads, listClients: mock.clients,
      listTasks: mock.tasks, listProjects: mock.projects,
    }),
  };
});

const sources = ["transactions", "decisions", "leads", "clients", "tasks", "projects"] as const;
beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-11-07T02:30:00Z")); // Still November 6 in São Paulo.
  mock.auth = { configured: true, isPreview: false, status: "autenticado", session: { user: { id: "test-user" } } as { user: { id: string } } | null };
  for (const source of sources) {
    mock.results[source] = { data: [], reason: "vazio" };
    mock[source].mockReset().mockImplementation(async () => mock.results[source]);
  }
});
afterEach(() => vi.useRealTimers());

describe("Cap radar scoped to the selected environment", () => {
  it.each([
    ["executiva", ["transactions", "decisions"]],
    ["concierge", ["transactions", "decisions"]],
    ["comercial", ["leads", "clients"]],
    ["operacional", ["tasks", "projects"]],
  ] as [CapPresentation, string[]][])("%s queries only its two sources", async (presentation, expected) => {
    render(<CapInsights presentation={presentation} />);
    await waitFor(() => expect(screen.queryByText("Consultando seus registros…")).toBeNull());
    for (const source of sources) expect(mock[source]).toHaveBeenCalledTimes(expected.includes(source) ? 1 : 0);
    expect(screen.getByRole("heading", { name: "Seu radar" })).toBeTruthy();
  });

  it("reads populated successful lists and compares deadlines in São Paulo without shifting date-only values", async () => {
    mock.results.transactions.data = [
      { pago: false, vencimento: "2026-11-05" }, // Overdue.
      { pago: false, vencimento: "2026-11-06" }, // Today, not overdue.
      { pago: false, vencimento: "2026-11-07T01:30:00Z" }, // November 6 locally.
      { pago: false, vencimento: "2026-11-12" }, // Included, day 7.
      { pago: false, vencimento: "2026-11-13" }, // Outside the 7-day window.
      { pago: true, vencimento: "2026-11-01" }, // Paid, ignored.
      { pago: false, vencimento: "invalid" },
    ];
    mock.results.decisions.data = [{ status: "aberta" }, { status: "aprovada" }];
    render(<CapInsights presentation="executiva" />);
    expect(await screen.findByText("1 movimentação(ões) financeira(s) vencida(s).")).toBeTruthy();
    expect(screen.getByText("3 vencimento(s) nos próximos 7 dias.")).toBeTruthy();
    expect(screen.getByText("1 decisão(ões) aguardando votação.")).toBeTruthy();
    expect(screen.queryByText("Nenhuma movimentação financeira registrada.")).toBeNull();
  });

  it("excludes closed leads from open opportunities and scheduled returns", async () => {
    mock.results.leads.data = [
      { etapa: "novo", proximoContato: "2026-11-06" },
      { etapa: "negociacao", proximoContato: "2026-11-05" },
      { etapa: "proposta", proximoContato: "2026-11-07" },
      { etapa: "ganho", proximoContato: "2026-11-04" },
      { etapa: "perdido", proximoContato: "2026-11-04" },
    ];
    mock.results.clients.data = [{ id: "a" }, { id: "b" }];
    render(<CapInsights presentation="comercial" />);
    expect(await screen.findByText("3 oportunidade(s) em andamento no funil.")).toBeTruthy();
    expect(screen.getByText("2 retorno(s) comercial(is) para hoje ou atrasado(s).")).toBeTruthy();
    expect(screen.getByText("2 cliente(s) na sua carteira.")).toBeTruthy();
  });

  it("counts blocked work within pending tasks and excludes paused/delivered projects", async () => {
    mock.results.tasks.data = [{ status: "concluida" }, { status: "bloqueada" }, { status: "em_andamento" }];
    mock.results.projects.data = [{ status: "entregue" }, { status: "pausado" }, { status: "aprovacao" }];
    render(<CapInsights presentation="operacional" />);
    expect(await screen.findByText("2 tarefa(s) aguardando conclusão.")).toBeTruthy();
    expect(screen.getByText("1 tarefa(s) bloqueada(s) ou com prazo vencido.").closest("[data-level]")?.getAttribute("data-level")).toBe("alerta");
    expect(screen.getByText("1 projeto(s) ativo(s) na produção.")).toBeTruthy();
  });

  it("keeps source failures visible even if another source has data", async () => {
    mock.results.tasks = { reason: "erro", data: [{ status: "concluida" }] };
    mock.results.projects.data = [{ status: "producao" }];
    render(<CapInsights presentation="operacional" />);
    expect(await screen.findByText("Não foi possível atualizar o radar. Tente novamente em instantes.")).toBeTruthy();
    expect(screen.queryByText(/tarefa\(s\) aguardando conclusão/)).toBeNull();
    expect(screen.queryByText(/operação em ordem/i)).toBeNull();
  });

  it("does not display zero counters while requests are still loading", () => {
    mock.leads.mockReturnValue(new Promise(() => {}));
    mock.clients.mockReturnValue(new Promise(() => {}));
    render(<CapInsights presentation="comercial" />);
    expect(screen.getByText("Consultando seus registros…")).toBeTruthy();
    expect(screen.queryByText(/cadastrados: 0|funil: 0/)).toBeNull();
  });

  it.each([
    { configured: true, isPreview: true, status: "preview", text: "Entre na sua conta para acompanhar os registros deste ambiente." },
    { configured: false, isPreview: false, status: "visitante", text: "Conecte a plataforma para acompanhar os dados deste ambiente." },
    { configured: true, isPreview: false, status: "verificando", text: "Verificando sua sessão…" },
    { configured: true, isPreview: false, status: "visitante", text: "Entre na sua conta para acessar os dados deste ambiente." },
  ])("does not query before access is ready: $status/$configured", (auth) => {
    mock.auth = { ...auth, session: null };
    render(<CapInsights presentation="executiva" />);
    expect(screen.getByText("Entre com sua conta para acompanhar os registros deste ambiente.")).toBeTruthy();
    for (const source of sources) expect(mock[source]).not.toHaveBeenCalled();
  });
});
