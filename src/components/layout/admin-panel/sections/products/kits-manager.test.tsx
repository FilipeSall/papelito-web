import { render, screen, waitFor } from "@testing-library/react";
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

  it("pede confirmação em modal próprio antes de excluir o Kit", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          deleted: true,
          kitId: 12,
          mediaCleanup: { deletedIds: [70], failedIds: [], preservedIds: [] },
          partial: false,
          productId: 900,
        }),
        { status: 200 },
      ),
    );

    render(
      <KitsManager
        initialKits={[
          {
            description: "",
            id: 12,
            imageSource: "custom",
            imageUrl: "/kit.webp",
            items: [],
            merchandise: [],
            name: "Kit teste",
            packageDimensions: null,
            price: "10",
            productId: 900,
            referencePriceCents: 0,
            salePrice: "",
            shortDescription: "",
            slug: "kit-teste",
            status: "draft",
          },
        ]}
        initialProducts={[]}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Excluir Kit teste" }));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Excluir Kit?" })).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Excluir Kit" }));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith("/api/admin/kits/12", {
        method: "DELETE",
      }),
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(
      "Kit excluído e imagens exclusivas removidas.",
    );
  });
});
