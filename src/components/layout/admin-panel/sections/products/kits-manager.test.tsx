import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { KitsManager } from "./kits-manager";

vi.mock("@/hooks/use-temporary-admin-media", () => ({
  useTemporaryAdminMedia: () => ({
    beginSave: vi.fn(),
    commit: vi.fn(),
    discard: vi.fn(),
    discardAllExcept: vi.fn().mockResolvedValue(undefined),
    endSave: vi.fn(),
    isTracked: vi.fn().mockReturnValue(false),
    track: vi.fn(),
  }),
}));

vi.mock("@/lib/client/direct-upload", () => ({
  uploadDirectFile: vi.fn(),
}));

describe("KitsManager", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("remove os presets e exige upload ao criar um Kit", async () => {
    const user = userEvent.setup();

    const fetchMock = vi.spyOn(globalThis, "fetch");

    render(<KitsManager initialKits={[]} initialProducts={[]} />);

    await user.click(screen.getByRole("button", { name: /criar kit/i }));

    expect(screen.queryByAltText("Ícone Kit")).not.toBeInTheDocument();
    expect(screen.queryByAltText("Kit")).not.toBeInTheDocument();
    expect(screen.queryByAltText("Premium")).not.toBeInTheDocument();
    expect(screen.getByText("Imagem obrigatória")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /salvar kit/i }));

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Envie uma imagem do Kit antes de salvar.",
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
