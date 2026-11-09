import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { RecordManager } from "@/components/workspace/record-manager";
const mocks = vi.hoisted(() => ({ save: vi.fn() }));
vi.mock("@/lib/frameflow/auth", () => ({ useAuth: () => ({ configured: true, isPreview: false, profile: { id: "owner", role: "ceo" } }) }));
vi.mock("@/lib/frameflow/workspace", () => ({ useRecords: () => ({ records: [], loading: false, error: null, save: mocks.save }), listModuleAccess: vi.fn(), getRecordHistory: vi.fn() }));
beforeEach(() => { vi.clearAllMocks(); mocks.save.mockResolvedValue({ id: "saved" }); });
function open() {
  render(<RecordManager kind="objective" title="Objetivos" fields={[{key:"startDate",label:"Início",type:"date",required:true},{key:"dueDate",label:"Fim",type:"date",required:true}]} statuses={[{value:"planejado",label:"Planejado"},{value:"em_andamento",label:"Em andamento"}]} />);
  fireEvent.click(screen.getByRole("button", {name:"Adicionar"}));
  fireEvent.change(screen.getByLabelText("Título *"), {target:{value:"Objetivo de teste"}});
  return screen.getByRole("dialog").querySelector("form")!;
}
describe("cadastro de registros", () => {
  it("preserva datas digitadas quando outro campo muda e envia o ciclo completo", async () => {
    const form = open();
    fireEvent.input(screen.getByLabelText("Início *"), {target:{value:"2026-11-06"}});
    fireEvent.input(screen.getByLabelText("Fim *"), {target:{value:"2026-11-30"}});
    fireEvent.change(screen.getByRole("combobox", {name:"Status *"}), {target:{value:"em_andamento"}});
    fireEvent.submit(form);
    await waitFor(() => expect(mocks.save).toHaveBeenCalledWith(expect.objectContaining({startDate:"2026-11-06",dueDate:"2026-11-30",status:"em_andamento"}), undefined, undefined));
  });
  it("não salva um registro sem campos obrigatórios mesmo ao submeter sem validação nativa", async () => {
    fireEvent.submit(open());
    expect(await screen.findByRole("alert")).toBeTruthy();
    expect(mocks.save).not.toHaveBeenCalled();
  });
  it("rejeita o fim de ciclo anterior ao início", async () => {
    const form = open();
    fireEvent.input(screen.getByLabelText("Início *"), {target:{value:"2026-11-30"}});
    fireEvent.input(screen.getByLabelText("Fim *"), {target:{value:"2026-11-06"}});
    fireEvent.submit(form);
    expect((await screen.findByRole("alert")).textContent).toContain("data final");
    expect(mocks.save).not.toHaveBeenCalled();
  });
});
