import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type {
  VendorOrderFiscal,
  VendorOrderReceipt,
} from "@/features/vendor-orders/types/vendor-orders";

const refreshMock = vi.fn();
const saveDeclaredMock = vi.fn();
const uploadFileMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: refreshMock }),
}));

vi.mock("@/features/vendor-orders/services/vendor-fiscal-client", async () => {
  const actual = await vi.importActual<
    typeof import("@/features/vendor-orders/services/vendor-fiscal-client")
  >("@/features/vendor-orders/services/vendor-fiscal-client");

  return {
    ...actual,
    saveVendorFiscalDeclared: (...args: unknown[]) => saveDeclaredMock(...args),
    uploadVendorFiscalFile: (...args: unknown[]) => uploadFileMock(...args),
  };
});

const { VendorOrderDocumentsSection } = await import("./vendor-order-documents-section");

const ACCESS_KEY = "5325" + "0".repeat(40);
const OTHER_KEY = "5325" + "1".repeat(40);

function fiscal(overrides: Partial<VendorOrderFiscal> = {}): VendorOrderFiscal {
  return {
    blockReason: "",
    canAttach: true,
    document: null,
    enabled: true,
    limits: { danfe_pdf: 10 * 1024 * 1024, xml: 2 * 1024 * 1024 },
    ...overrides,
  };
}

function withDocument(): VendorOrderFiscal {
  return fiscal({
    document: {
      accessKey: ACCESS_KEY,
      accessKeyStatus: "valida",
      createdAt: "2026-09-01 12:00:00",
      docNumber: "777",
      docSeries: "1",
      docStatus: "recebida",
      docType: "nfe",
      events: [
        {
          actorRole: "vendor",
          createdAt: "2026-09-03 15:20:00",
          docStatus: "recebida",
          event: "substituida",
          id: 3,
          role: "xml",
        },
        {
          actorRole: "vendor",
          createdAt: "2026-09-01 12:00:00",
          docStatus: "recebida",
          event: "criado",
          id: 1,
          role: "",
        },
      ],
      files: [],
      flags: [],
      id: 42,
      issuedAt: "2026-09-01 12:00:00",
      issuerCnpj: "65326368000190",
      issuerName: "Emitente de Teste",
      notes: "",
      protocol: "",
      totalCents: 11027,
      updatedAt: "2026-09-01 12:00:00",
      validationLevel: 3,
    },
  });
}

const receipt: VendorOrderReceipt = {
  available: true,
  issuedAt: "2026-09-01 12:00:00",
  number: "PPL-2026-000123",
};

function renderSection(value: VendorOrderFiscal) {
  return render(
    <VendorOrderDocumentsSection
      initialFiscal={value}
      orderId={14094}
      orderTotal={110.27}
      receipt={receipt}
    />,
  );
}

describe("VendorOrderDocumentsSection", () => {
  beforeEach(() => {
    refreshMock.mockReset();
    saveDeclaredMock.mockReset();
    uploadFileMock.mockReset();
    saveDeclaredMock.mockImplementation(async () => withDocument());
  });

  it("não pede o recibo antes de o vendor mandar (gerar o PDF emite o recibo)", () => {
    renderSection(fiscal());

    expect(document.querySelector('iframe[title="Recibo do pedido"]')).toBeNull();
  });

  it("carrega o recibo quando o vendor visualiza", async () => {
    renderSection(fiscal());

    await userEvent.click(screen.getByRole("button", { name: /visualizar/i }));

    expect(document.querySelector('iframe[title="Recibo do pedido"]')).not.toBeNull();
  });

  it("parte do que já existe ao completar ou corrigir", async () => {
    renderSection(withDocument());

    await userEvent.click(screen.getByRole("button", { name: /completar ou corrigir/i }));

    expect(screen.getByLabelText("Chave de acesso")).toHaveValue(ACCESS_KEY);
    expect(screen.getByLabelText("Número")).toHaveValue("777");
  });

  it("não herda a identificação da nota anterior ao substituir (regressão)", async () => {
    renderSection(withDocument());

    await userEvent.click(screen.getByRole("button", { name: /substituir nota/i }));

    expect(screen.getByLabelText("Chave de acesso")).toHaveValue("");
    expect(screen.getByLabelText("Número")).toHaveValue("");
    expect(screen.getByLabelText("Série")).toHaveValue("");
    expect(screen.getByLabelText("Valor da nota")).toHaveValue("");
  });

  it("manda a chave da nota nova, e não a da antiga, ao substituir", async () => {
    uploadFileMock.mockImplementation(async () => withDocument());
    renderSection(withDocument());

    await userEvent.click(screen.getByRole("button", { name: /substituir nota/i }));
    await userEvent.type(screen.getByLabelText("Chave de acesso"), OTHER_KEY);
    await userEvent.click(screen.getByRole("button", { name: /^substituir nota$/i }));

    await waitFor(() => expect(saveDeclaredMock).toHaveBeenCalled());
    expect(saveDeclaredMock.mock.calls[0][1]).toMatchObject({ accessKey: OTHER_KEY });
  });

  it("apaga um campo digitado errado ao limpá-lo", async () => {
    renderSection(withDocument());

    await userEvent.click(screen.getByRole("button", { name: /completar ou corrigir/i }));
    await userEvent.clear(screen.getByLabelText("Série"));
    await userEvent.click(screen.getByRole("button", { name: /salvar nota/i }));

    await waitFor(() => expect(saveDeclaredMock).toHaveBeenCalled());
    expect(saveDeclaredMock.mock.calls[0][1]).toMatchObject({ docSeries: "" });
  });

  it("lê o valor da nota com ponto decimal sem multiplicar por cem", async () => {
    renderSection(withDocument());

    await userEvent.click(screen.getByRole("button", { name: /completar ou corrigir/i }));
    const total = screen.getByLabelText("Valor da nota");
    await userEvent.clear(total);
    await userEvent.type(total, "110.27");
    await userEvent.click(screen.getByRole("button", { name: /salvar nota/i }));

    await waitFor(() => expect(saveDeclaredMock).toHaveBeenCalled());
    expect(saveDeclaredMock.mock.calls[0][1]).toMatchObject({ totalCents: 11027 });
  });

  it("recusa chave de acesso incompleta em vez de deixar o backend truncar", async () => {
    renderSection(fiscal());

    await userEvent.click(screen.getByRole("button", { name: /anexar nota fiscal/i }));
    await userEvent.type(screen.getByLabelText("Chave de acesso"), "1234");
    await userEvent.click(screen.getByRole("button", { name: /salvar nota/i }));

    expect(await screen.findByText(/44 dígitos; você informou 4/i)).toBeInTheDocument();
    expect(saveDeclaredMock).not.toHaveBeenCalled();
  });

  it("mostra o histórico da nota, com o registro da troca", async () => {
    renderSection(withDocument());

    await userEvent.click(screen.getByRole("button", { name: /histórico da nota/i }));

    expect(screen.getByText("Nota substituída por outra")).toBeVisible();
    expect(screen.getByText("Nota registrada no pedido")).toBeVisible();
    // Evento gravado em UTC: 15:20Z é 12:20 em São Paulo.
    expect(screen.getByText(/03\/09\/2026, 12:20/)).toBeInTheDocument();
  });

  it("não abre o histórico sozinho, e conta quantos registros existem", () => {
    renderSection(withDocument());

    expect(screen.getByText("2 registros")).toBeInTheDocument();
    expect(screen.queryByText("Nota substituída por outra")).not.toBeVisible();
  });

  it("não mostra bloco de histórico quando a nota não tem eventos", () => {
    const value = withDocument();
    value.document!.events = [];
    renderSection(value);

    expect(screen.queryByRole("button", { name: /histórico da nota/i })).not.toBeInTheDocument();
  });

  it("esconde o formulário e explica quando o pedido ainda não aceita nota", () => {
    renderSection(fiscal({ blockReason: "aguardando_pagamento", canAttach: false }));

    expect(screen.getByText(/depois que o pagamento for confirmado/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /anexar nota fiscal/i })).not.toBeInTheDocument();
  });
});
