import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { AdminMerchandise } from "@/lib/server/admin-merchandise";
import { uploadDirectFile } from "@/lib/client/direct-upload";

import { MerchandiseManager } from "./merchandise-manager";

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
  kits: [
    { kitId: 7, productId: 900, name: "Kit Premium", status: "publish", quantity: 2 },
    { kitId: 8, productId: 901, name: "Kit Smoking", status: "publish", quantity: 1 },
  ],
  kitCount: 2,
};

const adesivo: AdminMerchandise = {
  id: 2,
  name: "Adesivo Papelito",
  imageAttachmentId: 72,
  imageUrl: "/adesivo.webp",
  weight: "0.01",
  length: "8",
  width: "8",
  height: "0.5",
  kits: [],
  kitCount: 0,
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status });
}

async function uploadImage(user: ReturnType<typeof userEvent.setup>) {
  vi.mocked(uploadDirectFile).mockResolvedValue({
    media: { id: 91, src: "/novo-brinde.webp" },
  } as never);

  const fileInput = document.querySelector<HTMLInputElement>(
    'input[type="file"]',
  );
  await user.upload(
    fileInput as HTMLInputElement,
    new File(["x"], "brinde.png", { type: "image/png" }),
  );
}

describe("MerchandiseManager", () => {
  beforeEach(() => {
    vi.mocked(uploadDirectFile).mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("lista os brindes com uso, distingue o não utilizado e busca por nome", async () => {
    const user = userEvent.setup();

    render(<MerchandiseManager initialMerchandise={[adesivo, piteira]} />);

    expect(screen.getByText("Piteira Especial")).toBeInTheDocument();
    expect(screen.getByText("Adesivo Papelito")).toBeInTheDocument();
    expect(screen.getByText("0,05 kg")).toBeInTheDocument();
    expect(screen.getByText("14 × 2 × 2 cm")).toBeInTheDocument();
    expect(screen.getByText("Usado em 2 kits")).toBeInTheDocument();
    expect(screen.getByText("Não utilizado")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /usado em 2 kits/i }));
    expect(screen.getByRole("link", { name: /Kit Premium/ })).toHaveAttribute(
      "href",
      "/admin/products?tab=kits&focus=7",
    );

    await user.type(screen.getByPlaceholderText(/buscar brinde/i), "adesivo");
    await waitFor(() =>
      expect(screen.queryByText("Piteira Especial")).not.toBeInTheDocument(),
    );
    expect(screen.getByText("Adesivo Papelito")).toBeInTheDocument();
  });

  it("cria um brinde global pelo formulário compartilhado", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      jsonResponse(
        {
          merchandise: {
            ...adesivo,
            id: 3,
            name: "Filtro",
            imageAttachmentId: 91,
            imageUrl: "/novo-brinde.webp",
          },
          unpublishedKits: [],
        },
        201,
      ),
    );

    render(<MerchandiseManager initialMerchandise={[]} />);

    await user.click(screen.getByRole("button", { name: /criar brinde/i }));
    await user.type(screen.getByRole("textbox", { name: /nome/i }), "Filtro");
    await user.type(screen.getByRole("textbox", { name: /peso kg/i }), "0,01");
    await user.type(
      screen.getByRole("textbox", { name: /comprimento cm/i }),
      "6",
    );
    await user.type(screen.getByRole("textbox", { name: /largura cm/i }), "2");
    await user.type(screen.getByRole("textbox", { name: /altura cm/i }), "2");
    await uploadImage(user);

    await user.click(screen.getByRole("button", { name: /salvar brinde/i }));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/admin/merchandise",
        expect.objectContaining({ method: "POST" }),
      ),
    );
    expect(JSON.parse(String(vi.mocked(fetchMock).mock.calls[0][1]?.body))).toEqual({
      name: "Filtro",
      imageAttachmentId: 91,
      weight: "0.01",
      length: "6",
      width: "2",
      height: "2",
    });
    expect(screen.getByRole("status")).toHaveTextContent(
      '"Filtro" foi criado no catálogo de brindes.',
    );
    expect(screen.getByText("Filtro")).toBeInTheDocument();
  });

  it("recusa salvar sem imagem e sem medidas", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.spyOn(globalThis, "fetch");

    render(<MerchandiseManager initialMerchandise={[]} />);

    await user.click(screen.getByRole("button", { name: /criar brinde/i }));
    await user.click(screen.getByRole("button", { name: /salvar brinde/i }));

    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.getByText("Envie uma imagem do brinde.")).toBeInTheDocument();
    expect(screen.getByText("Informe o nome do brinde.")).toBeInTheDocument();
    expect(screen.getByText("Informe peso.")).toBeInTheDocument();
  });

  it("exclui brinde sem uso e barra o brinde utilizado", async () => {
    const user = userEvent.setup();
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(
        jsonResponse({ deleted: true, merchandiseId: 2, imageDeleted: true }),
      );

    render(<MerchandiseManager initialMerchandise={[adesivo, piteira]} />);

    expect(
      screen.getByRole("button", { name: "Excluir Piteira Especial" }),
    ).toBeDisabled();

    await user.click(
      screen.getByRole("button", { name: "Excluir Adesivo Papelito" }),
    );
    await user.click(screen.getByRole("button", { name: "Excluir brinde" }));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith("/api/admin/merchandise/2", {
        method: "DELETE",
      }),
    );
    expect(screen.queryByText("Adesivo Papelito")).not.toBeInTheDocument();
  });

  it("pede confirmação antes de despublicar Kits e informa o resultado", async () => {
    const user = userEvent.setup();
    const impact = {
      affectedKits: piteira.kits,
      breakingKits: [piteira.kits[0]],
    };
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        jsonResponse(
          {
            code: "papelito_merchandise_impact_confirmation_required",
            message: "Confirme para continuar.",
            impact,
          },
          409,
        ),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          merchandise: { ...piteira, weight: "9" },
          unpublishedKits: [piteira.kits[0]],
        }),
      );

    render(<MerchandiseManager initialMerchandise={[piteira]} />);

    await user.click(screen.getByRole("button", { name: /^editar$/i }));
    expect(
      screen.getByText(/Este brinde é usado em 2 Kits/),
    ).toBeInTheDocument();

    const weightField = screen.getByRole("textbox", { name: /peso kg/i });
    await user.clear(weightField);
    await user.type(weightField, "9");
    await user.click(screen.getByRole("button", { name: /salvar brinde/i }));

    const confirmDialog = await screen.findByRole("dialog", {
      name: /esta alteração despublica kits/i,
    });
    expect(within(confirmDialog).getByText("Kit Premium")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);

    await user.click(
      within(confirmDialog).getByRole("button", { name: /salvar mesmo assim/i }),
    );

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(
      JSON.parse(String(vi.mocked(fetchMock).mock.calls[1][1]?.body)).confirmImpact,
    ).toBe(true);
    expect(screen.getByRole("status")).toHaveTextContent(
      '"Piteira Especial" foi salvo. Um Kit voltou para rascunho: Kit Premium.',
    );
  });

  it("avisa como erro quando um Kit quebrado continua publicado", async () => {
    const user = userEvent.setup();
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      jsonResponse({
        merchandise: { ...piteira, weight: "9" },
        unpublishedKits: [piteira.kits[1]],
        failedKits: [piteira.kits[0]],
      }),
    );

    render(<MerchandiseManager initialMerchandise={[piteira]} />);

    await user.click(screen.getByRole("button", { name: /^editar$/i }));
    const weightField = screen.getByRole("textbox", { name: /peso kg/i });
    await user.clear(weightField);
    await user.type(weightField, "9");
    await user.click(screen.getByRole("button", { name: /salvar brinde/i }));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(
      "um Kit continua publicado sem atender às regras de logística: Kit Premium",
    );
    expect(alert).toHaveTextContent("Despublique manualmente.");
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
});
