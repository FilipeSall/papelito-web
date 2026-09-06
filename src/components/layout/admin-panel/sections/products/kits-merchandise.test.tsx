import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { uploadDirectFile } from "@/lib/client/direct-upload";
import type { AdminKit } from "@/lib/server/admin-kits";
import type { AdminMerchandise } from "@/lib/server/admin-merchandise";

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

const piteira: AdminMerchandise = {
  id: 1,
  name: "Piteira Especial",
  imageAttachmentId: 71,
  imageUrl: "/piteira.webp",
  weight: "0.05",
  length: "14",
  width: "2",
  height: "2",
  kits: [],
  kitCount: 0,
};

const kit: AdminKit = {
  description: "",
  id: 12,
  imageAttachmentId: 70,
  imageSource: "custom",
  imageUrl: "/kit.webp",
  items: [],
  merchandise: [],
  name: "Kit teste",
  packageDimensions: { length: "30", width: "20", height: "10" },
  price: "10",
  productId: 900,
  referencePriceCents: 0,
  salePrice: "",
  shortDescription: "",
  slug: "kit-teste",
  status: "draft",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status });
}

function renderKits(merchandise: AdminMerchandise[]) {
  return render(
    <KitsManager
      initialKits={[kit]}
      initialMerchandise={merchandise}
      initialProducts={[]}
    />,
  );
}

async function openKitEditor(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: /^editar$/i }));
  await screen.findByRole("heading", { name: /editar kit/i });
}

describe("Brindes no editor de Kit", () => {
  beforeEach(() => {
    vi.mocked(uploadDirectFile).mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("associa um brinde do catálogo com quantidade do vínculo", async () => {
    const user = userEvent.setup();
    renderKits([piteira]);
    await openKitEditor(user);

    expect(screen.getByText("0,05 kg · 14 × 2 × 2 cm")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Adicionar" }));

    expect(screen.getByRole("button", { name: "Adicionado" })).toBeDisabled();
    const quantity = screen.getByRole("spinbutton", {
      name: "Quantidade de Piteira Especial",
    });
    expect(quantity).toHaveValue(1);

    await user.click(
      screen.getByRole("button", { name: "Aumentar quantidade de Piteira Especial" }),
    );
    expect(quantity).toHaveValue(2);
    expect(screen.getByRole("heading", { name: "Brindes" })).toBeInTheDocument();
  });

  it("desvincula sem excluir o brinde do catálogo", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.spyOn(globalThis, "fetch");
    renderKits([piteira]);
    await openKitEditor(user);

    await user.click(screen.getByRole("button", { name: "Adicionar" }));
    await user.click(screen.getByRole("button", { name: /remover do kit/i }));

    expect(
      screen.queryByRole("spinbutton", { name: "Quantidade de Piteira Especial" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Adicionar" })).toBeEnabled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("cria um brinde global de dentro do Kit e já o associa", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      jsonResponse(
        {
          merchandise: {
            ...piteira,
            id: 5,
            name: "Filtro",
            imageAttachmentId: 91,
            imageUrl: "/filtro.webp",
            weight: "0.01",
            length: "6",
          },
          unpublishedKits: [],
        },
        201,
      ),
    );
    vi.mocked(uploadDirectFile).mockResolvedValue({
      media: { id: 91, src: "/filtro.webp" },
    } as never);

    renderKits([]);
    await openKitEditor(user);

    expect(
      screen.getByText(/Nenhum brinde no catálogo ainda/),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /criar novo brinde/i }));

    const form = await screen.findByRole("dialog", { name: /criar brinde/i });
    await user.type(within(form).getByRole("textbox", { name: "Nome *" }), "Filtro");
    await user.type(within(form).getByRole("textbox", { name: /peso kg/i }), "0,01");
    await user.type(
      within(form).getByRole("textbox", { name: /comprimento cm/i }),
      "6",
    );
    await user.type(within(form).getByRole("textbox", { name: /largura cm/i }), "2");
    await user.type(within(form).getByRole("textbox", { name: /altura cm/i }), "2");
    await user.upload(
      within(form).getByLabelText<HTMLInputElement>(/enviar/i),
      new File(["x"], "filtro.png", { type: "image/png" }),
    );

    await user.click(
      within(form).getByRole("button", { name: /salvar brinde/i }),
    );

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/admin/merchandise",
        expect.objectContaining({ method: "POST" }),
      ),
    );

    // Salvo globalmente, entra no catálogo do seletor e já vem vinculado ao Kit.
    expect(
      await screen.findByRole("spinbutton", { name: "Quantidade de Filtro" }),
    ).toHaveValue(1);
    expect(screen.getByRole("button", { name: "Adicionado" })).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(
      '"Filtro" foi criado no catálogo de brindes e adicionado a este Kit.',
    );
  });

  it("salva o Kit mandando só a referência e a quantidade", async () => {
    const user = userEvent.setup();
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(jsonResponse({ kit: { ...kit, merchandise: [] } }));

    renderKits([piteira]);
    await openKitEditor(user);

    await user.click(screen.getByRole("button", { name: "Adicionar" }));
    await user.click(
      screen.getByRole("button", { name: "Aumentar quantidade de Piteira Especial" }),
    );
    await user.click(screen.getByRole("button", { name: /salvar kit/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    const body = JSON.parse(String(vi.mocked(fetchMock).mock.calls[0][1]?.body));
    expect(body.merchandise).toEqual([{ merchandiseId: 1, quantity: 2 }]);
  });
});
