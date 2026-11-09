import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET, POST } from "@/app/api/cap/route";

const mocks = vi.hoisted(() => ({ createClient: vi.fn(), profileRole: "ceo" }));
vi.mock("@supabase/supabase-js", () => ({ createClient: mocks.createClient }));
type Row = Record<string, unknown>;
const messages: Row[] = [
  { id: "u1", role: "user", content: "Primeira pergunta", created_at: "2026-11-06T10:00:00Z" },
  { id: "a1", role: "assistant", content: "Primeira resposta", created_at: "2026-11-06T10:00:00Z" },
  { id: "u2", role: "user", content: "Segunda pergunta", created_at: "2026-11-06T10:01:00Z" },
  { id: "a2", role: "assistant", content: "Segunda resposta", created_at: "2026-11-06T10:01:00Z" },
];

// Applies the requested database ordering to rows whose timestamps really tie,
// as happens when the user/assistant pair is inserted in one transaction.
function query(table: string) {
  const orders: { key: string; ascending: boolean }[] = [];
  let inserted: Row[] | undefined;
  let countOnly = false;
  let limit = Infinity;
  const result = () => {
    if (table === "profiles") return { data: { role: mocks.profileRole }, error: null };
    const rows = inserted ?? (table === "ff_cap_messages" ? messages : []);
    const sorted = [...rows].sort((a, b) => {
      for (const order of orders) {
        const comparison = String(a[order.key]).localeCompare(String(b[order.key]));
        if (comparison) return order.ascending ? comparison : -comparison;
      }
      return 0;
    });
    return { data: countOnly ? null : sorted.slice(0, limit), error: null, count: 0 };
  };
  const builder = {
    select(_columns: string, options?: { head?: boolean }) { countOnly = !!options?.head; return builder; },
    eq() { return builder; }, gte() { return builder; }, range() { return builder; },
    order(key: string, options?: { ascending?: boolean }) { orders.push({ key, ascending: options?.ascending ?? true }); return builder; },
    limit(value: number) { limit = value; return builder; },
    insert(rows: Row[]) { inserted = rows.map((row, index) => ({ ...row, id: `saved-${index}`, created_at: "2026-11-06T10:02:00Z" })); return builder; },
    single: async () => result(),
    then(resolve: (value: ReturnType<typeof result>) => unknown) { return Promise.resolve(result()).then(resolve); },
  };
  return builder;
}

beforeEach(() => {
  mocks.profileRole = "ceo";
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.test");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "test-anon");
  vi.stubEnv("OPENAI_API_KEY", "test-server-key");
  mocks.createClient.mockReturnValue({ auth: { getUser: async () => ({ data: { user: { id: "user-id" } }, error: null }) }, from: query });
});
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

describe("ordem causal das mensagens da Cap", () => {
  it("rejeita solicitação sem token antes de consultar a IA", async () => {
    const fetchMock = vi.fn(); vi.stubGlobal("fetch", fetchMock);
    const response = await POST(new NextRequest("https://frameflow.test/api/cap", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "chat", environment: "executivo", message: "Resumo da operação" }) }));
    expect(response.status).toBe(401); expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejeita perfil cliente antes de consultar contexto ou IA", async () => {
    mocks.profileRole = "cliente";
    const fetchMock = vi.fn(); vi.stubGlobal("fetch", fetchMock);
    const response = await POST(new NextRequest("https://frameflow.test/api/cap", { method: "POST", headers: { Authorization: "Bearer test-token", "Content-Type": "application/json" }, body: JSON.stringify({ type: "chat", environment: "executivo", message: "Resumo da operação" }) }));
    expect(response.status).toBe(403); expect(fetchMock).not.toHaveBeenCalled();
  });

  it("retorna cada pergunta antes de sua resposta mesmo com timestamps iguais", async () => {
    const response = await GET(new NextRequest("https://frameflow.test/api/cap?environment=executivo", { headers: { Authorization: "Bearer test-token" } }));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.messages.map((message: Row) => message.content)).toEqual(["Primeira pergunta", "Primeira resposta", "Segunda pergunta", "Segunda resposta"]);
  });

  it("envia ao modelo o histórico na mesma ordem pergunta/resposta", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ output: [{ type: "message", content: [{ type: "output_text", text: JSON.stringify({ content: "Resposta atual", actions: [] }) }] }] }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const response = await POST(new NextRequest("https://frameflow.test/api/cap", { method: "POST", headers: { Authorization: "Bearer test-token", "Content-Type": "application/json" }, body: JSON.stringify({ type: "chat", environment: "executivo", message: "Terceira pergunta" }) }));
    expect(response.status).toBe(200);
    const request = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(request.input.map((message: Row) => message.content)).toEqual(["Primeira pergunta", "Primeira resposta", "Segunda pergunta", "Segunda resposta", "Terceira pergunta"]);
  });
});
