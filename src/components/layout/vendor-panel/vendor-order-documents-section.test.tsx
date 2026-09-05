import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type {
  VendorOrderFiscal,
  VendorOrderReceipt,
} from "@/features/vendor-orders/types/vendor-orders";

const refreshMock = vi.fn();
const uploadFileMock = vi.fn();
const deleteDocumentMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: refreshMock }),
}));

vi.mock("@/features/vendor-orders/services/vendor-fiscal-client", async () => {
  const actual = await vi.importActual<
    typeof import("@/features/vendor-orders/services/vendor-fiscal-client")
  >("@/features/vendor-orders/services/vendor-fiscal-client");

  return {
    ...actual,
    deleteVendorFiscalDocument: (...args: unknown[]) => deleteDocumentMock(...args),
    uploadVendorFiscalFile: (...args: unknown[]) => uploadFileMock(...args),
  };
});

const { VendorOrderDocumentsSection } = await import("./vendor-order-documents-section");
const { VendorFiscalError } = await import(
  "@/features/vendor-orders/services/vendor-fiscal-client"
);

function fiscal(overrides: Partial<VendorOrderFiscal> = {}): VendorOrderFiscal {
  return {
    blockReason: "",
    canAttach: true,
    document: null,
    enabled: true,
    events: [],
    limits: { pdf: 10 * 1024 * 1024, xml: 2 * 1024 * 1024 },
    ...overrides,
  };
}

function withDocument(overrides: Partial<VendorOrderFiscal> = {}): VendorOrderFiscal {
  return fiscal({
    document: {
      createdAt: "2026-09-01 12:00:00",
      id: 42,
      mime: "application/pdf",
      originalName: "nota-777.pdf",
      sizeBytes: 284_000,
      updatedAt: "2026-09-01 12:00:00",
    },
    events: [
      {
        actorRole: "vendor",
        createdAt: "2026-09-01 12:00:00",
        event: "anexada",
        id: 1,
        originalName: "nota-777.pdf",
      },
    ],
    ...overrides,
  });
}

const receipt: VendorOrderReceipt = {
  available: true,
  issuedAt: "2026-09-01 12:00:00",
  number: "PPL-2026-000123",
};

function renderSection(value: VendorOrderFiscal) {
  return render(
    <VendorOrderDocumentsSection initialFiscal={value} orderId={14094} receipt={receipt} />,
  );
}

function pdf(name = "nota.pdf"): File {
  return new File(["%PDF-1.4"], name, { type: "application/pdf" });
}

/**
 * `applyAccept: false` porque o `accept` do input filtraria o arquivo antes de
 * o componente ver — e é justamente a guarda do componente que está sob teste.
 */
async function pick(file: File) {
  await userEvent.upload(screen.getByLabelText("Arquivo"), file, { applyAccept: false });
}

describe("VendorOrderDocumentsSection", () => {
  beforeEach(() => {
    refreshMock.mockReset();
    uploadFileMock.mockReset();
    deleteDocumentMock.mockReset();
  });

  it("não pede o recibo antes de o vendor mandar (gerar o PDF emite o recibo)", () => {
    renderSection(fiscal());

    expect(screen.queryByTitle("Recibo do pedido")).not.toBeInTheDocument();
  });

  it("não pede campo nenhum da nota: a nota é só o arquivo", () => {
    renderSection(fiscal());

    expect(screen.getByLabelText("Arquivo")).toBeInTheDocument();
    for (const label of ["Chave de acesso", "Número", "Série", "Emissão", "Valor da nota"]) {
      expect(screen.queryByLabelText(label)).not.toBeInTheDocument();
    }
  });

  it("anexa direto quando ainda não há nota, sem pedir confirmação", async () => {
    uploadFileMock.mockResolvedValue(withDocument());
    renderSection(fiscal());

    await pick(pdf());
    await userEvent.click(screen.getByRole("button", { name: /anexar nota/i }));

    await waitFor(() => expect(uploadFileMock).toHaveBeenCalledTimes(1));
    expect(uploadFileMock.mock.calls[0][0]).toMatchObject({ orderId: 14094 });
    expect(refreshMock).toHaveBeenCalled();
  });

  it("mostra o arquivo anexado com tamanho e data", () => {
    renderSection(withDocument());

    expect(screen.getByText("nota-777.pdf")).toBeInTheDocument();
    expect(screen.getByText(/277 KB · anexada em/)).toBeInTheDocument();
  });

  it("exige confirmação antes de substituir, porque o arquivo atual será apagado", async () => {
    uploadFileMock.mockResolvedValue(withDocument());
    renderSection(withDocument());

    await pick(pdf("nova.pdf"));
    await userEvent.click(screen.getByRole("button", { name: /substituir nota/i }));

    expect(uploadFileMock).not.toHaveBeenCalled();
    expect(screen.getByText(/será apagada e não poderá ser recuperada/)).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Substituir e apagar" }));

    await waitFor(() => expect(uploadFileMock).toHaveBeenCalledTimes(1));
  });

  it("não substitui quando o vendor desiste na confirmação", async () => {
    renderSection(withDocument());

    await pick(pdf("nova.pdf"));
    await userEvent.click(screen.getByRole("button", { name: /substituir nota/i }));
    await userEvent.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(screen.queryByText(/será apagada e não poderá ser recuperada/)).not.toBeInTheDocument();

    expect(uploadFileMock).not.toHaveBeenCalled();
  });

  it("exige confirmação para remover, e remove ao confirmar", async () => {
    deleteDocumentMock.mockResolvedValue(
      fiscal({
        events: [
          {
            actorRole: "vendor",
            createdAt: "2026-09-04 10:00:00",
            event: "removida",
            id: 2,
            originalName: "nota-777.pdf",
          },
        ],
      }),
    );
    renderSection(withDocument());

    await userEvent.click(screen.getByRole("button", { name: "Remover" }));
    expect(deleteDocumentMock).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole("button", { name: "Remover e apagar" }));

    await waitFor(() => expect(deleteDocumentMock).toHaveBeenCalledWith(14094));
    expect(await screen.findByText(/Nota fiscal removida do pedido/)).toBeInTheDocument();
  });

  it("mantém a trilha depois de remover a nota — é o único rastro que sobra", async () => {
    renderSection(
      fiscal({
        events: [
          {
            actorRole: "vendor",
            createdAt: "2026-09-01 12:00:00",
            event: "anexada",
            id: 1,
            originalName: "nota-777.pdf",
          },
          {
            actorRole: "sistema",
            createdAt: "2026-09-04 10:00:00",
            event: "removida",
            id: 2,
            originalName: "nota-777.pdf",
          },
        ],
      }),
    );

    await userEvent.click(screen.getByRole("button", { name: /histórico da nota/i }));

    expect(screen.getByText("Nota anexada ao pedido")).toBeInTheDocument();
    expect(screen.getByText("Nota removida")).toBeInTheDocument();
    expect(screen.getByText("· Sistema")).toBeInTheDocument();
  });

  it("não abre o histórico sozinho, e conta quantos registros existem", () => {
    renderSection(withDocument());

    expect(screen.getByText("1 registro")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /histórico da nota/i })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    expect(screen.getByText("Nota anexada ao pedido")).not.toBeVisible();
  });

  it("recusa arquivo fora de PDF e XML sem chamar o servidor", async () => {
    renderSection(fiscal());

    await pick(new File(["oi"], "nota.jpg", { type: "image/jpeg" }));
    await userEvent.click(screen.getByRole("button", { name: /anexar nota/i }));

    expect(uploadFileMock).not.toHaveBeenCalled();
    expect(screen.getByText(/Envie a nota em PDF ou XML/)).toBeInTheDocument();
  });

  it("recusa XML acima do limite do formato, que é menor que o do PDF", async () => {
    renderSection(fiscal());

    const big = new File([new Uint8Array(3 * 1024 * 1024)], "nota.xml", { type: "text/xml" });
    await pick(big);
    await userEvent.click(screen.getByRole("button", { name: /anexar nota/i }));

    expect(uploadFileMock).not.toHaveBeenCalled();
    expect(screen.getByText(/excede o limite de 2 MB para XML/)).toBeInTheDocument();
  });

  it("erro do servidor vira aviso e não quebra a seção", async () => {
    uploadFileMock.mockRejectedValue(new VendorFiscalError("O PDF enviado é inválido.", 422));
    renderSection(fiscal());

    await pick(pdf());
    await userEvent.click(screen.getByRole("button", { name: /anexar nota/i }));

    expect(await screen.findByText(/O PDF enviado é inválido/)).toBeInTheDocument();
    expect(screen.getByLabelText("Arquivo")).toBeInTheDocument();
  });

  it("esconde o formulário e explica quando o pedido ainda não aceita nota", () => {
    renderSection(fiscal({ blockReason: "aguardando_pagamento", canAttach: false }));

    expect(screen.queryByLabelText("Arquivo")).not.toBeInTheDocument();
    expect(
      screen.getByText(/pode ser anexada depois que o pagamento for confirmado/),
    ).toBeInTheDocument();
  });
});
