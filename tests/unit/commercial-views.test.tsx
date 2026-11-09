import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { PropostasView } from "@/components/views/comercial/gestao";
import type { WorkspaceRecord } from "@/lib/frameflow/workspace";

const mocks = vi.hoisted(() => ({ records: [] as WorkspaceRecord[], save: vi.fn(), accept: vi.fn(), reload: vi.fn(), archive: vi.fn(), restore: vi.fn(), history: vi.fn(), download: vi.fn() }));
vi.mock("@/components/workspace/record-manager", async importOriginal => ({ ...await importOriginal<typeof import("@/components/workspace/record-manager")>(), downloadText: mocks.download }));
vi.mock("@/lib/frameflow/auth", () => ({ useAuth: () => ({ configured: true, isPreview: false }) }));
vi.mock("@/lib/frameflow/workspace", () => ({
  useRecords: () => ({ records: mocks.records, loading: false, error: null, save: mocks.save, reload: mocks.reload, archive: mocks.archive, restore: mocks.restore }),
  useWorkspaceLinks: () => ({ clients: [{ id: "client-id", nomeFantasia: "Cliente teste" }], leads: [{ id: "lead-id", nome: "Contato", empresa: "Empresa teste" }], members: [], projects: [], loading: false, error: null }),
  acceptProposal: mocks.accept,
  getRecordHistory: mocks.history,
}));

const proposal = (status = "enviada"): WorkspaceRecord => ({ id: "proposal-id", kind: "proposal", title: "Filme institucional", status, amount: 1000, clientId: "client-id", projectId: null, leadId: "lead-id", ownerId: null, parentId: null, startDate: null, dueDate: "2026-11-30", details: { items: [{ description: "Captação", quantity: 1, unitPrice: 1000 }], conditions: "Duas revisões incluídas.", discountPercent: 0 }, version: 2, createdAt: "2026-11-01", updatedAt: "2026-11-02", archivedAt: null });

beforeEach(() => { vi.clearAllMocks(); mocks.records = [proposal()]; mocks.save.mockResolvedValue(proposal()); mocks.accept.mockResolvedValue({ ...proposal("aceita"), projectId: "project-id" }); mocks.reload.mockResolvedValue(undefined); });

describe("negociação e aceite de proposta", () => {
  it("exige evidência e não executa o aceite com dados incompletos", async () => {
    render(<PropostasView />);
    fireEvent.click(screen.getByRole("button", { name: "Registrar aceite" }));
    const dialog = screen.getByRole("dialog");
    fireEvent.submit(dialog.querySelector("form")!);
    expect(await within(dialog).findByRole("alert")).toBeTruthy();
    expect(mocks.accept).not.toHaveBeenCalled();
  });

  it("envia a versão exibida e os dados de aceite, só anuncia sucesso após persistir", async () => {
    render(<PropostasView />);
    fireEvent.click(screen.getByRole("button", { name: "Registrar aceite" }));
    const dialog = screen.getByRole("dialog");
    fireEvent.change(within(dialog).getByLabelText("Nome de quem aceitou *"), { target: { value: "Cliente Teste" } });
    fireEvent.change(within(dialog).getByLabelText("E-mail *"), { target: { value: "cliente@example.test" } });
    fireEvent.input(within(dialog).getByLabelText("Data do aceite *"), { target: { value: "2026-01-01" } });
    fireEvent.change(within(dialog).getByLabelText("Evidência do aceite *"), { target: { value: "Cliente confirmou o escopo por e-mail." } });
    fireEvent.submit(dialog.querySelector("form")!);
    await waitFor(() => expect(mocks.accept).toHaveBeenCalledWith(expect.objectContaining({ id: "proposal-id", version: 2 }), { name: "Cliente Teste", email: "cliente@example.test", acceptedAt: "2026-01-01", evidence: "Cliente confirmou o escopo por e-mail." }));
    expect(await screen.findByRole("status")).toBeTruthy();
    expect(mocks.reload).toHaveBeenCalled();
  });

  it("preserva a proposta aceita e cria uma revisão separada sem copiar o aceite", async () => {
    mocks.records = [{ ...proposal("aceita"), details: { ...proposal().details, acceptance: { name: "Cliente", evidence: "E-mail" }, execution: { projectId: "old-project" } } }];
    render(<PropostasView />);
    expect(screen.queryByRole("button", { name: "Editar" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Criar revisão" }));
    const dialog = screen.getByRole("dialog");
    fireEvent.submit(dialog.querySelector("form")!);
    await waitFor(() => expect(mocks.save).toHaveBeenCalled());
    const [input, id, version] = mocks.save.mock.calls[0];
    expect(id).toBeUndefined(); expect(version).toBeUndefined();
    expect(input.status).toBe("rascunho"); expect(input.details.acceptance).toBeUndefined(); expect(input.details.execution).toBeUndefined();
    expect(input.title).toContain("revisão");
  });

  it("preserva as datas recebidas por input ao editar outro campo e salva entrega separada da validade", async () => {
    render(<PropostasView />);
    fireEvent.click(screen.getByRole("button", { name: "Editar" }));
    const dialog = screen.getByRole("dialog");
    const validity = within(dialog).getByLabelText("Validade *") as HTMLInputElement;
    const delivery = within(dialog).getByLabelText(/Entrega prevista \(opcional\)/) as HTMLInputElement;
    fireEvent.input(validity, { target: { value: "2030-06-01" } });
    fireEvent.input(delivery, { target: { value: "2030-07-15" } });
    fireEvent.change(within(dialog).getByLabelText("Título da proposta *"), { target: { value: "Proposta com entrega combinada" } });
    expect(validity.value).toBe("2030-06-01"); expect(delivery.value).toBe("2030-07-15");
    fireEvent.submit(dialog.querySelector("form")!);
    await waitFor(() => expect(mocks.save).toHaveBeenCalledWith(expect.objectContaining({ dueDate: "2030-06-01", details: expect.objectContaining({ deliveryDate: "2030-07-15" }) }), "proposal-id", 2));
  });

  it("permite salvar sem prazo de entrega e remove um prazo anteriormente definido", async () => {
    mocks.records = [{ ...proposal(), details: { ...proposal().details, deliveryDate: "2030-07-15" } }];
    render(<PropostasView />);
    fireEvent.click(screen.getByRole("button", { name: "Editar" }));
    const dialog = screen.getByRole("dialog");
    fireEvent.input(within(dialog).getByLabelText(/Entrega prevista \(opcional\)/), { target: { value: "" } });
    fireEvent.submit(dialog.querySelector("form")!);
    await waitFor(() => expect(mocks.save).toHaveBeenCalledWith(expect.objectContaining({ dueDate: "2026-11-30", details: expect.objectContaining({ deliveryDate: null }) }), "proposal-id", 2));
  });

  it("rejeita uma data de entrega inexistente recebida do registro", async () => {
    mocks.records = [{ ...proposal(), details: { ...proposal().details, deliveryDate: "2030-02-31" } }];
    render(<PropostasView />);
    fireEvent.click(screen.getByRole("button", { name: "Editar" }));
    fireEvent.submit(screen.getByRole("dialog").querySelector("form")!);
    expect(await screen.findByRole("alert")).toBeTruthy();
    expect(mocks.save).not.toHaveBeenCalled();
  });

  it("mostra a entrega prevista no card e no documento exportado", () => {
    mocks.records = [{ ...proposal(), details: { ...proposal().details, deliveryDate: "2030-07-15" } }];
    render(<PropostasView />);
    expect(screen.getByText(/Entrega prevista: 15\/07\/2030/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Documento / PDF" }));
    expect(mocks.download.mock.calls[0][1]).toContain("Entrega prevista: 15/07/2030");
    expect(mocks.download.mock.calls[0][1]).toContain("Validade: 30/11/2026");
  });
});
