import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import type { VendorOrderRefund } from "@/features/vendor-orders/types/vendor-orders";

import { VendorOrderRefundDocumentsSection } from "./vendor-order-refund-documents-section";

const ORDER_ID = 14885;
const REFUND_RECEIPT_NUMBER = "PPE-2026-000016";

function buildRefund(overrides: Partial<VendorOrderRefund> = {}): VendorOrderRefund {
  return {
    amountCents: 10_436,
    attempts: 2,
    customerHasPixKey: false,
    id: 26,
    lastError: "",
    manualReference: "",
    mode: "api",
    overdue: false,
    proofId: 0,
    receiptNumber: REFUND_RECEIPT_NUMBER,
    refundDueAt: "",
    requestedAt: "2026-09-14 23:22:20",
    settledAt: "2026-09-14 23:25:30",
    status: "reembolsado",
    ...overrides,
  };
}

describe("VendorOrderRefundDocumentsSection", () => {
  it("apresenta o recibo de estorno no lugar dos documentos do pedido", () => {
    render(<VendorOrderRefundDocumentsSection orderId={ORDER_ID} refund={buildRefund()} />);

    expect(screen.getByText("Documentos do estorno")).toBeInTheDocument();
    expect(screen.getByText(REFUND_RECEIPT_NUMBER)).toBeInTheDocument();
    expect(screen.queryByText("Recibo do pedido")).not.toBeInTheDocument();
    expect(screen.queryByText("Nota fiscal")).not.toBeInTheDocument();
  });

  it("oferece visualizar e baixar, como o recibo do pedido oferecia", async () => {
    render(<VendorOrderRefundDocumentsSection orderId={ORDER_ID} refund={buildRefund()} />);

    expect(screen.getByRole("link", { name: /baixar pdf/i })).toHaveAttribute(
      "href",
      `/api/vendor/orders/${ORDER_ID}/refund-receipt?download=1`,
    );

    // O frame só existe depois do clique, e aponta para a rota sem `download`:
    // com `attachment` o navegador baixaria o arquivo em vez de exibi-lo.
    expect(screen.queryByTitle("Recibo de estorno")).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Visualizar" }));

    expect(screen.getByTitle("Recibo de estorno")).toHaveAttribute(
      "src",
      `/api/vendor/orders/${ORDER_ID}/refund-receipt`,
    );
  });

  it("mostra o comprovante da transferência no caminho manual", () => {
    render(
      <VendorOrderRefundDocumentsSection
        orderId={ORDER_ID}
        refund={buildRefund({ mode: "manual", proofId: 5 })}
      />,
    );

    expect(screen.getByRole("link", { name: /ver comprovante/i })).toHaveAttribute(
      "href",
      "/api/order-refunds/proofs/5",
    );
  });

  it("não inventa comprovante quando o estorno voltou pela Pagar.me", () => {
    render(<VendorOrderRefundDocumentsSection orderId={ORDER_ID} refund={buildRefund()} />);

    expect(screen.queryByRole("link", { name: /ver comprovante/i })).not.toBeInTheDocument();
  });

  it("estorno em andamento não oferece recibo que ainda não existe", () => {
    render(
      <VendorOrderRefundDocumentsSection
        orderId={ORDER_ID}
        refund={buildRefund({ receiptNumber: "", settledAt: "", status: "processando" })}
      />,
    );

    expect(screen.getByText(/emitido quando o estorno for concluído/i)).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /baixar pdf/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Visualizar" })).not.toBeInTheDocument();
  });

  it("pedido estornado antes desta regra, sem linha de estorno, não volta a mostrar o recibo do pedido", () => {
    render(<VendorOrderRefundDocumentsSection orderId={ORDER_ID} refund={null} />);

    expect(screen.getByText("Documentos do estorno")).toBeInTheDocument();
    expect(screen.queryByText("Recibo do pedido")).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /baixar pdf/i })).not.toBeInTheDocument();
  });

  it("diz que recibo e nota continuam guardados, em vez de sugerir que sumiram", () => {
    render(<VendorOrderRefundDocumentsSection orderId={ORDER_ID} refund={buildRefund()} />);

    expect(screen.getByText(/continuam guardados para histórico e auditoria/i)).toBeInTheDocument();
  });
});
