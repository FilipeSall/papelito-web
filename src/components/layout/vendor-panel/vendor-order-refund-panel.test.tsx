import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { VendorOrderRefund } from "@/features/vendor-orders/types/vendor-orders";

import { VendorOrderRefundPanel } from "./vendor-order-refund-panel";

const refreshMock = vi.fn();

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: refreshMock }) }));

function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    headers: { "Content-Type": "application/json" },
    status,
  });
}

function buildRefund(overrides: Partial<VendorOrderRefund> = {}): VendorOrderRefund {
  return {
    amountCents: 15990,
    attempts: 0,
    customerHasPixKey: true,
    id: 12,
    lastError: "",
    manualReference: "",
    mode: "manual",
    overdue: false,
    proofId: 0,
    receiptNumber: "",
    refundDueAt: "2026-09-21 13:02:11",
    requestedAt: "2026-09-14 13:02:11",
    settledAt: "",
    status: "manual_pendente",
    ...overrides,
  };
}

describe("VendorOrderRefundPanel", () => {
  beforeEach(() => {
    refreshMock.mockReset();
    vi.unstubAllGlobals();
  });

  it("não mostra a chave PIX antes de o vendor pedir", () => {
    render(<VendorOrderRefundPanel orderId={7788} refund={buildRefund()} />);

    expect(screen.getByRole("button", { name: /mostrar chave pix/i })).toBeInTheDocument();
    expect(screen.queryByText(/titular:/i)).not.toBeInTheDocument();
  });

  it("busca a chave PIX só quando o vendor pede", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(jsonResponse(200, { holderName: "Maria da Silva", key: "maria@exemplo.com.br", type: "email" }));
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();

    render(<VendorOrderRefundPanel orderId={7788} refund={buildRefund()} />);
    await user.click(screen.getByRole("button", { name: /mostrar chave pix/i }));

    expect(await screen.findByText("maria@exemplo.com.br")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith("/api/vendor/orders/7788/refund/pix-key", { cache: "no-store" });
    expect(screen.getByText(/titular: maria da silva/i)).toBeInTheDocument();
  });

  it("orienta a combinar pelo chamado quando o comprador não tem chave", () => {
    render(<VendorOrderRefundPanel orderId={7788} refund={buildRefund({ customerHasPixKey: false })} />);

    expect(screen.queryByRole("button", { name: /mostrar chave pix/i })).not.toBeInTheDocument();
    expect(screen.getByText(/ainda não cadastrou uma chave pix/i)).toBeInTheDocument();
  });

  it("não deixa registrar a devolução sem comprovante", () => {
    render(<VendorOrderRefundPanel orderId={7788} refund={buildRefund()} />);

    expect(screen.getByRole("button", { name: /registrar devolução/i })).toBeDisabled();
  });

  it("destaca o prazo vencido", () => {
    render(<VendorOrderRefundPanel orderId={7788} refund={buildRefund({ overdue: true })} />);

    expect(screen.getByRole("alert")).toHaveTextContent(/prazo vencido/i);
  });

  it("no caminho automático só informa, sem formulário de devolução", () => {
    render(
      <VendorOrderRefundPanel
        orderId={7788}
        refund={buildRefund({ mode: "api", refundDueAt: "", status: "processando" })}
      />,
    );

    expect(screen.getByText(/pedimos à pagar\.me o estorno/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /registrar devolução/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /mostrar chave pix/i })).not.toBeInTheDocument();
  });

  it("oferece recibo e comprovante depois de concluído", () => {
    render(
      <VendorOrderRefundPanel
        orderId={7788}
        refund={buildRefund({
          proofId: 5,
          receiptNumber: "PPE-2026-000001",
          settledAt: "2026-09-15 12:00:00",
          status: "reembolsado",
        })}
      />,
    );

    expect(screen.getByText("PPE-2026-000001")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /baixar recibo de estorno/i })).toHaveAttribute(
      "href",
      "/api/vendor/orders/7788/refund-receipt",
    );
    expect(screen.getByRole("link", { name: /ver comprovante/i })).toHaveAttribute(
      "href",
      "/api/order-refunds/proofs/5",
    );
  });
});
