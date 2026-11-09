import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CapView } from "@/components/views/cap-view";
import type { CapPresentation, EnvironmentId } from "@/lib/frameflow/types";

vi.mock("@/components/cap/cap-panel", () => ({
  CapContent: ({ presentation }: { presentation: CapPresentation }) => <section aria-label={`Assistente ${presentation}`} />,
}));

describe("Cap vinculada ao ambiente", () => {
  it.each([
    ["executivo", "executiva", "Cap Executiva"],
    ["comercial", "comercial", "Cap Comercial"],
    ["operacional", "operacional", "Cap Operacional"],
  ] as [EnvironmentId, CapPresentation, string][])("%s abre somente sua própria Cap", (envId, presentation, title) => {
    render(<CapView envId={envId} />);
    expect(screen.getByRole("heading", { level: 1, name: title })).toBeTruthy();
    expect(screen.getAllByRole("region")).toHaveLength(1);
    expect(screen.getByRole("region", { name: `Assistente ${presentation}` })).toBeTruthy();
    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.queryByLabelText("As três Caps da FRAME FLOW")).toBeNull();
  });
});
