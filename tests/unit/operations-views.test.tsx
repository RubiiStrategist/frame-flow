import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { ArquivosView, QualidadeView } from "@/components/views/operacional/gestao";
import type { WorkspaceRecord } from "@/lib/frameflow/workspace";

const mocks = vi.hoisted(() => ({
  save: vi.fn(), archive: vi.fn(), restore: vi.fn(), reload: vi.fn(), listFiles: vi.fn(), uploadFile: vi.fn(), getFileUrl: vi.fn(), archiveFile: vi.fn(), restoreFile: vi.fn(), getRecordHistory: vi.fn(),
  records: [] as unknown[], userId: "actor-1" as string | null, profile: { id: "actor-1", fullName: "Operação" } as { id: string; fullName: string } | null,
}));

vi.mock("@/lib/frameflow/auth", () => ({ useAuth: () => ({ session: mocks.userId ? { user: { id: mocks.userId } } : null, profile: mocks.profile, configured: true, isPreview: false }) }));
vi.mock("@/lib/frameflow/workspace", () => ({
  useRecords: (kinds: string | string[]) => ({ records: (mocks.records as WorkspaceRecord[]).filter(r => (Array.isArray(kinds) ? kinds : [kinds]).includes(r.kind)), loading: false, error: null, save: mocks.save, archive: mocks.archive, restore: mocks.restore, reload: mocks.reload }),
  useWorkspaceLinks: () => ({ projects: [{ id: "project-1", clienteId: "client-1", titulo: "Projeto real", orcamento: 1000 }], clients: [{ id: "client-1", nomeFantasia: "Cliente real" }], members: [{ id: "actor-1", fullName: "Operação", role: "coo_cfo" }], leads: [], loading: false, error: null, reload: mocks.reload }),
  listFiles: mocks.listFiles, uploadFile: mocks.uploadFile, getFileUrl: mocks.getFileUrl, archiveFile: mocks.archiveFile, restoreFile: mocks.restoreFile, getRecordHistory: mocks.getRecordHistory,
  saveRecord: mocks.save,
  updateProjectStatus: vi.fn(),
}));

function row(overrides: Partial<WorkspaceRecord> = {}): WorkspaceRecord {
  return { id: "check-1", kind: "quality_check", title: "Revisão final", status: "aberto", amount: 0, clientId: null, projectId: "project-1", leadId: null, ownerId: "actor-1", parentId: "template-1", startDate: null, dueDate: null, details: { templateName: "Modelo antigo", items: [{ id: "item-1", label: "Verificar áudio", done: false }] }, version: 4, createdAt: "2026-11-04T12:00:00Z", updatedAt: "2026-11-04T12:00:00Z", archivedAt: null, ...overrides };
}

beforeEach(() => {
  cleanup();
  vi.clearAllMocks();
  mocks.profile = { id: "actor-1", fullName: "Operação" };
  mocks.userId = "actor-1";
  mocks.records = [];
  mocks.listFiles.mockResolvedValue([]);
  mocks.save.mockResolvedValue(row({ version: 5 }));
  mocks.uploadFile.mockResolvedValue({ id: "file-1", version: 1 });
  mocks.getRecordHistory.mockResolvedValue([]);
});

describe("checklists do projeto", () => {
  it("preserva os itens copiados mesmo quando o modelo original mudou e salva autoria com versão esperada", async () => {
    const check = row();
    mocks.records = [check, row({ id: "template-1", kind: "quality_template", title: "Modelo atualizado", status: "inativo", archivedAt: "2026-11-05", details: { templateText: "Outro item" } })];
    render(<QualidadeView />);
    const item = screen.getByRole("checkbox", { name: "Verificar áudio" });
    expect((item as HTMLInputElement).checked).toBe(false);
    fireEvent.click(item);
    await waitFor(() => expect(mocks.save).toHaveBeenCalledOnce());
    const [input, id, version] = mocks.save.mock.calls[0];
    expect(id).toBe("check-1");
    expect(version).toBe(4);
    expect(input.status).toBe("concluido");
    expect(input.details.items[0]).toMatchObject({ id: "item-1", label: "Verificar áudio", done: true, completedBy: "actor-1" });
    expect(input.details.items[0].completedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect((check.details.items as { done: boolean }[])[0].done).toBe(false);
  });

  it("mantém a verificação aberta quando o banco recusa a atualização concorrente", async () => {
    mocks.records = [row()];
    mocks.save.mockRejectedValue(new Error("O registro mudou. Recarregue para continuar."));
    render(<QualidadeView />);
    fireEvent.click(screen.getByRole("checkbox", { name: "Verificar áudio" }));
    expect((await screen.findByRole("alert")).textContent).toContain("O registro mudou");
    expect((screen.getByRole("checkbox", { name: "Verificar áudio" }) as HTMLInputElement).checked).toBe(false);
  });

  it("não permite concluir um item antes de carregar a identidade autenticada", () => {
    mocks.records = [row()];
    mocks.profile = null;
    render(<QualidadeView />);
    expect((screen.getByRole("checkbox", { name: "Verificar áudio" }) as HTMLInputElement).disabled).toBe(true);
    expect(mocks.save).not.toHaveBeenCalled();
  });

  it("recupera versões do registro correto no histórico", async () => {
    mocks.records = [row()];
    mocks.getRecordHistory.mockResolvedValue([{ id: "history-1", recordId: "check-1", version: 3, createdAt: "2026-11-03T12:00:00Z", actorId: "actor-1", snapshot: row({ title: "Revisão anterior", version: 3 }) }]);
    render(<QualidadeView />);
    const section = screen.getByRole("region", { name: "Verificação das entregas" });
    fireEvent.click(within(section).getByRole("button", { name: "Histórico" }));
    expect(await screen.findByText("Revisão anterior")).toBeTruthy();
    expect(mocks.getRecordHistory).toHaveBeenCalledWith("check-1");
  });
});

describe("biblioteca de arquivos", () => {
  it("limpa os arquivos e o formulário ao trocar de conta na mesma tela", async () => {
    mocks.listFiles.mockResolvedValueOnce([{ id: "private-file", name: "privado-A.txt", projectId: "project-1", clientId: "client-1", recordId: null, path: "private", mime: "text/plain", size: 20, version: 1, createdAt: "2026-11-04T12:00:00Z", archivedAt: null }]);
    const { rerender } = render(<ArquivosView />);
    await screen.findByText("privado-A.txt");
    fireEvent.change(screen.getByLabelText("Projeto"), { target: { value: "project-1" } });
    const file = new File(["material A"], "enviar-A.txt", { type: "text/plain" });
    fireEvent.change(screen.getByLabelText("Arquivo · até 50 MB"), { target: { files: [file] } });
    mocks.userId = "actor-2";
    rerender(<ArquivosView />);
    expect(screen.queryByText("privado-A.txt")).toBeNull();
    expect((screen.getByLabelText("Projeto") as HTMLSelectElement).value).toBe("");
    expect((screen.getByRole("button", { name: "Enviar arquivo" }) as HTMLButtonElement).disabled).toBe(true);
    await waitFor(() => expect(mocks.listFiles).toHaveBeenCalledTimes(2));
  });

  it("ignora arquivos que chegam depois do logout e não consulta sem sessão", async () => {
    let resolveFiles!: (files: unknown[]) => void;
    mocks.listFiles.mockImplementationOnce(() => new Promise(resolve => { resolveFiles = resolve; }));
    const { rerender } = render(<ArquivosView />);
    mocks.userId = null;
    mocks.profile = null;
    rerender(<ArquivosView />);
    expect((await screen.findByRole("alert")).textContent).toContain("Entre com sua conta");
    resolveFiles([{ id: "late", name: "privado-atrasado.txt", projectId: "project-1", version: 1, size: 20, archivedAt: null }]);
    await waitFor(() => expect(mocks.listFiles).toHaveBeenCalledOnce());
    expect(screen.queryByText("privado-atrasado.txt")).toBeNull();
  });

  it("informa erro de leitura sem inventar arquivos", async () => {
    mocks.listFiles.mockRejectedValue(new Error("Seu perfil não tem permissão para esta operação."));
    render(<ArquivosView />);
    expect((await screen.findByRole("alert")).textContent).toContain("não tem permissão");
    expect(screen.queryByRole("button", { name: /^Baixar / })).toBeNull();
  });

  it("preserva o arquivo escolhido e permite nova tentativa quando o upload falha", async () => {
    mocks.uploadFile.mockRejectedValue(new Error("Falha ao enviar o arquivo."));
    render(<ArquivosView />);
    await screen.findByText("Nenhum arquivo encontrado neste filtro.");
    fireEvent.change(screen.getByLabelText("Projeto"), { target: { value: "project-1" } });
    const file = new File(["material real"], "roteiro.txt", { type: "text/plain" });
    fireEvent.change(screen.getByLabelText("Arquivo · até 50 MB"), { target: { files: [file] } });
    fireEvent.submit(screen.getByRole("button", { name: "Enviar arquivo" }).closest("form")!);
    expect((await screen.findByRole("alert")).textContent).toContain("Falha ao enviar");
    expect(mocks.uploadFile).toHaveBeenCalledWith(file, { projectId: "project-1", clientId: "client-1", recordId: undefined, version: 1 });
    expect((screen.getByRole("button", { name: "Enviar arquivo" }) as HTMLButtonElement).disabled).toBe(false);
    expect(screen.queryByText(/Arquivo enviado como/)).toBeNull();
  });

  it("considera versões arquivadas ao solicitar uma nova versão com o mesmo nome", async () => {
    mocks.listFiles.mockResolvedValue([{ id: "file-old", name: "roteiro.txt", projectId: "project-1", clientId: "client-1", recordId: null, path: "path", mime: "text/plain", size: 20, version: 3, createdAt: "2026-11-04T12:00:00Z", archivedAt: "2026-11-05T12:00:00Z" }]);
    render(<ArquivosView />);
    await screen.findByText("1 KB");
    fireEvent.change(screen.getByLabelText("Projeto"), { target: { value: "project-1" } });
    const file = new File(["nova versão"], "roteiro.txt", { type: "text/plain" });
    fireEvent.change(screen.getByLabelText("Arquivo · até 50 MB"), { target: { files: [file] } });
    fireEvent.submit(screen.getByRole("button", { name: "Enviar arquivo" }).closest("form")!);
    await waitFor(() => expect(mocks.uploadFile).toHaveBeenCalled());
    expect(mocks.uploadFile.mock.calls[0][1].version).toBe(4);
  });
});
