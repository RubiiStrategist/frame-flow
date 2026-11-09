import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { CapChat } from "@/components/cap/cap-chat";

vi.mock("@/lib/frameflow/auth", () => ({ useAuth: () => ({ session: { access_token: "test-token" }, isPreview: false }) }));
const fetchMock = vi.fn();
const action = { id: "action-id", kind: "create_task", label: "Criar tarefa", payload: { title: "Revisar briefing" }, status: "pending", createdAt: "2026-11-06T10:00:00Z" };
const result = { id: "11111111-1111-4111-8111-111111111111", message: "Tarefa criada e atribuída a você.", route: "/#/operacional/tarefas" };
const history = (actions: Array<typeof action & { result?: unknown }> = [action]) => ({ mode: "local", messages: [], actions });
const json = (value: unknown, status = 200) => new Response(JSON.stringify(value), { status, headers: { "Content-Type": "application/json" } });

beforeEach(() => { fetchMock.mockReset(); vi.stubGlobal("fetch", fetchMock); });
afterEach(() => { vi.unstubAllGlobals(); });

describe("resultados de ações da Cap", () => {
  it.each([
    { presentation: "executiva", label: "Visão geral", command: "Resumir operação", environment: "executivo" },
    { presentation: "comercial", label: "Meu funil", command: "Resumir funil", environment: "comercial" },
    { presentation: "operacional", label: "Priorizar tarefas", command: "Priorizar tarefas", environment: "operacional" },
  ] as const)("envia o atalho suportado do ambiente $environment", async ({ presentation, label, command, environment }) => {
    fetchMock.mockResolvedValueOnce(json(history([])))
      .mockResolvedValueOnce(json({ mode: "local", actions: [], message: { id: "reply", role: "assistant", content: "Resumo do contexto autorizado.", createdAt: "2026-11-07T10:00:00Z" } }));
    render(<CapChat presentation={presentation} />);
    const prompt = screen.getByRole("button", { name: label });
    await waitFor(() => expect(prompt.hasAttribute("disabled")).toBe(false));
    fireEvent.click(prompt);
    expect(await screen.findByText("Resumo do contexto autorizado.")).toBeTruthy();
    expect(JSON.parse(fetchMock.mock.calls[1][1].body)).toEqual({ type: "chat", environment, message: command });
  });

  it("mostra a execução persistida quando outra aba já concluiu uma ação que o usuário tenta cancelar", async () => {
    fetchMock.mockResolvedValueOnce(json(history()))
      .mockResolvedValueOnce(json({ ok: true, result }))
      .mockResolvedValueOnce(json(history([{ ...action, status: "completed", result }])));
    render(<CapChat presentation="executiva" />);
    fireEvent.click(await screen.findByRole("button", { name: "Cancelar" }));
    expect(await screen.findByText("Ação concluída")).toBeTruthy();
    expect(screen.queryByText("Ação cancelada")).toBeNull();
    expect(screen.getByText(result.message)).toBeTruthy();
    expect(screen.getByRole("link", { name: "Abrir tarefas" }).getAttribute("href")).toBe(result.route);
    expect(screen.queryByText(result.id, { exact: false })).toBeNull();
    expect(screen.queryByText(result.route, { exact: false })).toBeNull();
    expect(JSON.parse(fetchMock.mock.calls[1][1].body)).toEqual({ type: "cancel", actionId: action.id });
  });

  it("não afirma execução ou cancelamento quando não consegue recarregar o estado persistido", async () => {
    fetchMock.mockResolvedValueOnce(json(history()))
      .mockResolvedValueOnce(json({ ok: true, result }))
      .mockResolvedValueOnce(json({ error: "Falha ao atualizar o histórico." }, 503));
    render(<CapChat presentation="operacional" />);
    fireEvent.click(await screen.findByRole("button", { name: "Confirmar ação" }));
    expect(await screen.findByRole("alert")).toBeTruthy();
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(3));
    expect(screen.queryByText("Ação concluída")).toBeNull();
    expect(screen.queryByText("Ação cancelada")).toBeNull();
  });

  it.each(["https://example.test/roubar", "javascript:alert(1)", "/#/operacional/tarefas?redirect=https://example.test", "toString"])("não transforma rota não autorizada em link: %s", async route => {
    fetchMock.mockResolvedValueOnce(json(history([{ ...action, status: "completed", result: { ...result, route } }])));
    render(<CapChat presentation="executiva" />);
    expect(await screen.findByText(result.message)).toBeTruthy();
    expect(screen.queryByRole("link")).toBeNull();
    expect(screen.queryByText(route, { exact: false })).toBeNull();
  });
});
