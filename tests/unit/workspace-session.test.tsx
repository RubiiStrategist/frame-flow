import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { listFiles, useRecords, useWorkspaceLinks } from "@/lib/frameflow/workspace";

const mocks = vi.hoisted(() => ({
  auth: { session: { user: { id: "account-A" } } as { user: { id: string } } | null, profile: { id: "account-A", role: "ceo" }, configured: true, isPreview: false },
  request: vi.fn(),
  data: { listClients: vi.fn(), listProjects: vi.fn(), listLeads: vi.fn() },
}));

type Reply = { data: Record<string, unknown>[] | null; error: { code?: string; message: string } | null };
type Query = { table: string; orders: unknown[][]; filters: unknown[][]; range?: number[] };

vi.mock("@/lib/frameflow/auth", () => ({ useAuth: () => mocks.auth }));
vi.mock("@/lib/frameflow/data", () => ({ useData: () => mocks.data }));
vi.mock("@/lib/supabase/client", () => ({ getSupabase: () => ({ from: (table: string) => {
  const query: Query = { table, orders: [], filters: [] };
  const builder = {
    select: () => builder,
    order: (...args: unknown[]) => { query.orders.push(args); return builder; },
    range: (from: number, to: number) => { query.range = [from, to]; return builder; },
    in: (...args: unknown[]) => { query.filters.push(args); return builder; },
    eq: (...args: unknown[]) => { query.filters.push(args); return builder; },
    neq: (...args: unknown[]) => { query.filters.push(args); return builder; },
    then: (resolve: (reply: Reply) => unknown, reject: (error: unknown) => unknown) => Promise.resolve(mocks.request(query)).then(resolve, reject),
  };
  return builder;
} }) }));

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(done => { resolve = done; });
  return { promise, resolve };
}
const record = (id: string) => ({ id, kind: "approval", title: id, status: "aberto", amount: 0, details: {}, version: 1 });
const file = (id: number) => ({ id: `file-${id}`, name: `Arquivo ${id}`, project_id: "project-A", version: 1, size: 10 });
const ok = (data: Record<string, unknown>[]): Reply => ({ data, error: null });

beforeEach(() => {
  vi.clearAllMocks();
  mocks.auth.session = { user: { id: "account-A" } };
  mocks.auth.profile = { id: "account-A", role: "ceo" };
  mocks.auth.configured = true;
  mocks.auth.isPreview = false;
  mocks.request.mockResolvedValue(ok([]));
  mocks.data.listClients.mockResolvedValue({ data: [], reason: "vazio" });
  mocks.data.listProjects.mockResolvedValue({ data: [], reason: "vazio" });
  mocks.data.listLeads.mockResolvedValue({ data: [], reason: "vazio" });
});

describe("paginação da biblioteca", () => {
  it("lê todas as páginas com o mesmo projeto e ordem estável", async () => {
    mocks.request.mockResolvedValueOnce(ok(Array.from({ length: 500 }, (_, index) => file(index)))).mockResolvedValueOnce(ok([file(500)]));
    const files = await listFiles("project-A");
    expect(files).toHaveLength(501);
    expect(files[500].id).toBe("file-500");
    expect(mocks.request.mock.calls.map(([query]) => query.range)).toEqual([[0, 499], [500, 999]]);
    for (const [query] of mocks.request.mock.calls) {
      expect(query.table).toBe("ff_files");
      expect(query.orders).toEqual([["created_at", { ascending: false }], ["id", { ascending: true }]]);
      expect(query.filters).toEqual([["project_id", "project-A"]]);
    }
  });

  it("não retorna um resultado parcial se outra página perde permissão", async () => {
    mocks.request.mockResolvedValueOnce(ok(Array.from({ length: 500 }, (_, index) => file(index)))).mockResolvedValueOnce({ data: null, error: { code: "42501", message: "denied" } });
    await expect(listFiles()).rejects.toThrow("não tem permissão");
    expect(mocks.request).toHaveBeenCalledTimes(2);
  });
});

describe("registros e identidade autenticada", () => {
  it("limpa os registros imediatamente e recarrega mesmo com perfil antigo durante a troca de conta", async () => {
    mocks.request.mockResolvedValueOnce(ok([record("privado-A")]));
    const { result, rerender } = renderHook(() => useRecords("approval"));
    await waitFor(() => expect(result.current.records[0]?.id).toBe("privado-A"));
    const next = deferred<Reply>();
    mocks.request.mockReturnValueOnce(next.promise);
    mocks.auth.session = { user: { id: "account-B" } };
    rerender();
    expect(result.current.records).toEqual([]);
    await act(async () => next.resolve(ok([record("privado-B")])));
    expect(result.current.records[0]?.id).toBe("privado-B");
  });

  it("descarta respostas pendentes da conta anterior e limpa os registros no logout", async () => {
    const old = deferred<Reply>();
    mocks.request.mockReturnValueOnce(old.promise);
    const { result, rerender } = renderHook(() => useRecords("approval"));
    await waitFor(() => expect(mocks.request).toHaveBeenCalledOnce());
    mocks.auth.session = { user: { id: "account-B" } };
    mocks.request.mockResolvedValueOnce(ok([record("privado-B")]));
    rerender();
    await waitFor(() => expect(result.current.records[0]?.id).toBe("privado-B"));
    await act(async () => old.resolve(ok([record("privado-A")])));
    expect(result.current.records[0]?.id).toBe("privado-B");
    mocks.auth.session = null;
    rerender();
    expect(result.current.records).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(mocks.request).toHaveBeenCalledTimes(2);
  });

  it("recarrega quando o perfil da mesma conta muda de cargo", async () => {
    mocks.request.mockResolvedValueOnce(ok([record("restrito")]));
    const { result, rerender } = renderHook(() => useRecords("approval"));
    await waitFor(() => expect(result.current.records).toHaveLength(1));
    mocks.auth.profile = { id: "account-A", role: "colaborador" };
    rerender();
    expect(result.current.records).toEqual([]);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(mocks.request).toHaveBeenCalledTimes(2);
  });
});

describe("vínculos e identidade autenticada", () => {
  it("limpa todos os vínculos antes de carregar outra conta", async () => {
    mocks.data.listClients.mockResolvedValueOnce({ data: [{ id: "client-A" }] });
    mocks.data.listProjects.mockResolvedValueOnce({ data: [{ id: "project-A" }] });
    mocks.data.listLeads.mockResolvedValueOnce({ data: [{ id: "lead-A" }] });
    mocks.request.mockResolvedValueOnce(ok([{ id: "member-A", full_name: "Pessoa A", role: "ceo" }]));
    const { result, rerender } = renderHook(() => useWorkspaceLinks());
    await waitFor(() => expect(result.current.members).toHaveLength(1));
    const next = deferred<Reply>();
    mocks.request.mockReturnValueOnce(next.promise);
    mocks.auth.session = { user: { id: "account-B" } };
    rerender();
    expect([result.current.clients, result.current.projects, result.current.leads, result.current.members]).toEqual([[], [], [], []]);
    await act(async () => next.resolve(ok([])));
    expect(result.current.loading).toBe(false);
  });

  it("ignora vínculos tardios após logout sem fazer leitura anônima", async () => {
    const old = deferred<Reply>();
    mocks.request.mockReturnValueOnce(old.promise);
    mocks.data.listClients.mockResolvedValueOnce({ data: [{ id: "client-A" }] });
    const { result, rerender } = renderHook(() => useWorkspaceLinks());
    await waitFor(() => expect(mocks.request).toHaveBeenCalledOnce());
    mocks.auth.session = null;
    rerender();
    await act(async () => old.resolve(ok([{ id: "member-A", full_name: "Pessoa A", role: "ceo" }])));
    expect([result.current.clients, result.current.projects, result.current.leads, result.current.members]).toEqual([[], [], [], []]);
    expect(result.current.loading).toBe(false);
    expect(mocks.request).toHaveBeenCalledOnce();
    expect(mocks.data.listClients).toHaveBeenCalledOnce();
  });
});
