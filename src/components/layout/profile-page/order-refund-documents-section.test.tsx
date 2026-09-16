import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { ProfileOrderRefund } from "@/features/orders/types/profile-order-detail";

import { OrderRefundDocumentsSection } from "./order-refund-documents-section";

const ORDER_ID = "14885";
const REFUND_RECEIPT_NUMBER = "PPE-2026-000016";

function buildRefund(overrides: Partial<ProfileOrderRefund> = {}): ProfileOrderRefund {
  return {
    amountCents: 10_436,
    mode: "api",
    overdue: false,
    proofId: 0,
    receiptNumber: REFUND_RECEIPT_NUMBER,
    refundDueAt: "",
    settledAt: "2026-09-14 23:25:30",
    status: "reembolsado",
    ...overrides,
  };
}

describe("OrderRefundDocumentsSection", () => {
  it("apresenta o recibo de estorno no lugar dos documentos do pedido", () => {
    render(<OrderRefundDocumentsSection orderId={ORDER_ID} refund={buildRefund()} />);

    expect(screen.getByText("Documentos do estorno")).toBeInTheDocument();
    expect(screen.getByText(REFUND_RECEIPT_NUMBER)).toBeInTheDocument();
    expect(screen.queryByText("Recibo")).not.toBeInTheDocument();
    expect(screen.queryByText("Nota fiscal")).not.toBeInTheDocument();
  });

  it("separa ver de baixar, como o recibo do pedido separava", () => {
    render(<OrderRefundDocumentsSection orderId={ORDER_ID} refund={buildRefund()} />);

    expect(screen.getByRole("link", { name: /ver recibo de estorno/i })).toHaveAttribute(
      "href",
      `/api/profile/orders/${ORDER_ID}/refund-receipt`,
    );
    expect(screen.getByRole("link", { name: /baixar pdf/i })).toHaveAttribute(
      "href",
      `/api/profile/orders/${ORDER_ID}/refund-receipt?download=1`,
    );
  });

  it("mostra o comprovante que a loja anexou no caminho manual", () => {
    render(
      <OrderRefundDocumentsSection
        orderId={ORDER_ID}
        refund={buildRefund({ mode: "manual", proofId: 7 })}
      />,
    );

    expect(screen.getByRole("link", { name: /ver comprovante/i })).toHaveAttribute(
      "href",
      "/api/order-refunds/proofs/7",
    );
  });

  it("estorno em andamento não oferece recibo que ainda não existe", () => {
    render(
      <OrderRefundDocumentsSection
        orderId={ORDER_ID}
        refund={buildRefund({ receiptNumber: "", settledAt: "", status: "manual_pendente" })}
      />,
    );

    expect(
      screen.getByText(/recibo de estorno fica disponível quando a devolução do valor for concluída/i),
    ).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /baixar pdf/i })).not.toBeInTheDocument();
  });

  it("pedido estornado sem linha de estorno não volta a mostrar o recibo do pedido", () => {
    render(<OrderRefundDocumentsSection orderId={ORDER_ID} refund={null} />);

    expect(screen.getByText("Documentos do estorno")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /baixar pdf/i })).not.toBeInTheDocument();
  });
});
