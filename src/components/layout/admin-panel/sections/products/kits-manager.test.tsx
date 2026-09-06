import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { AdminKit } from "@/lib/server/admin-kits";

import { KitsManager } from "./kits-manager";
import {
  createKitDraftFrom,
  invalidKitDimensionFields,
  kitDimensionError,
  kitDimensionRange,
  missingKitDimensionFields,
} from "./kits-manager-draft";

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

    render(
      <KitsManager
        initialKits={[]}
        initialMerchandise={[]}
        initialProducts={[]}
      />,
    );

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
            imageAttachmentId: 70,
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
        initialMerchandise={[]}
        initialProducts={[]}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Excluir Kit teste" }));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Excluir Kit?" }),
    ).toBeInTheDocument();
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

  it("abre o Kit da notificação e destaca somente as dimensões faltantes", async () => {
    const user = userEvent.setup();
    expect(kitDimensionRange("length")).toBe("11 a 100 cm");
    expect(kitDimensionRange("width")).toBe("6 a 100 cm");
    expect(kitDimensionRange("height")).toBe("0,4 a 100 cm");
    expect(kitDimensionError("length", "4")).toBe("Mínimo: 11 cm.");
    expect(kitDimensionError("width", "4")).toBe("Mínimo: 6 cm.");
    expect(
      invalidKitDimensionFields({ length: "4", width: "4", height: "0.4" }),
    ).toEqual(["length", "width"]);

    const kit = {
      description: "",
      id: 12,
      imageAttachmentId: 70,
      imageSource: "custom" as const,
      imageUrl: "/kit.webp",
      items: [],
      merchandise: [],
      name: "Kit teste",
      packageDimensions: { length: "", width: "20", height: "10" },
      price: "10",
      productId: 900,
      referencePriceCents: 0,
      salePrice: "",
      shortDescription: "",
      slug: "kit-teste",
      status: "draft" as const,
    };
    expect(
      missingKitDimensionFields({ length: "", width: "20", height: "10" }),
    ).toEqual(["length"]);
    expect(
      createKitDraftFrom(kit, { highlightMissingDimensions: true })
        .invalidDimensionFields,
    ).toEqual(["length"]);

    render(
      <KitsManager
        initialFocusKitId={12}
        initialIssue="shipping-dimensions"
        initialKits={[kit]}
        initialMerchandise={[]}
        initialProducts={[]}
      />,
    );

    await waitFor(() =>
      expect(
        screen.getByRole("textbox", { name: "Comprimento (cm)" }),
      ).toBeInTheDocument(),
    );
    expect(
      screen.getByRole("textbox", { name: "Comprimento (cm)" }),
    ).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText("Aceito: 6 a 100 cm")).toBeInTheDocument();
    expect(
      screen.getByRole("textbox", { name: "Largura (cm)" }),
    ).not.toHaveAttribute("aria-invalid");
    expect(
      screen.getByRole("textbox", { name: "Altura (cm)" }),
    ).not.toHaveAttribute("aria-invalid");

    const infoButtons = screen.getAllByRole("button", {
      name: "Mais informações",
    });
    for (const infoButton of infoButtons.slice(0, 3)) {
      await user.hover(infoButton);
      expect(screen.getByRole("tooltip")).toHaveTextContent("Correios");
      await user.unhover(infoButton);
    }
  });

  it("normaliza dimensões numéricas retornadas pela API", () => {
    const kit = {
      description: "",
      id: 12,
      imageAttachmentId: 14001,
      imageSource: "custom" as const,
      imageUrl: "/kit.webp",
      items: [],
      merchandise: [],
      name: "Kit teste",
      packageDimensions: { length: 20, width: 10, height: 0.5 },
      price: "10",
      productId: 900,
      referencePriceCents: 0,
      salePrice: "",
      shortDescription: "",
      slug: "kit-teste",
      status: "publish" as const,
    } as unknown as AdminKit;

    expect(createKitDraftFrom(kit).packageDimensions).toEqual({
      length: "20",
      width: "10",
      height: "0.5",
    });
    expect(createKitDraftFrom(kit).imageAttachmentId).toBe(14001);
  });
});
