import { describe, expect, it } from "vitest";

import type { VendorReturnStatus } from "@/features/returns/types/vendor-return";

import { returnConditionLabel, returnMethodLabel, returnReasonLabel, returnStatusMeta } from "@/features/returns/return-status";

const OPEN_STATES: VendorReturnStatus[] = [
  "requested",
  "awaiting_reverse_authorization",
  "awaiting_posting",
  "in_transit",
  "awaiting_vendor_receipt",
  "under_inspection",
  "refund_pending",
];

const CLOSED_STATES: VendorReturnStatus[] = ["refunded", "rejected", "cancelled", "posting_expired"];

describe("returnStatusMeta", () => {
  it("dá exatamente uma ação a cada estado aberto", () => {
    for (const status of OPEN_STATES) {
      expect(returnStatusMeta(status).action, status).not.toBeNull();
    }
  });

  it("não oferece ação em estado encerrado", () => {
    for (const status of CLOSED_STATES) {
      expect(returnStatusMeta(status).action, status).toBeNull();
      expect(returnStatusMeta(status).callToAction, status).toBe("");
    }
  });

  it("mapeia cada ação para a rota que o WordPress aceita naquele estado", () => {
    expect(returnStatusMeta("requested").action).toBe("approve");
    expect(returnStatusMeta("awaiting_reverse_authorization").action).toBe("authorization");
    expect(returnStatusMeta("under_inspection").action).toBe("inspection");
    expect(returnStatusMeta("refund_pending").action).toBe("refund");
  });

  it("trata os três estados que aceitam recebimento como a mesma ação", () => {
    for (const status of ["awaiting_posting", "in_transit", "awaiting_vendor_receipt"] as const) {
      expect(returnStatusMeta(status).action, status).toBe("received");
    }
  });

  it("marca como espera só o que depende do cliente ou dos Correios", () => {
    expect(returnStatusMeta("awaiting_posting").waiting).toBe(true);
    expect(returnStatusMeta("in_transit").waiting).toBe(true);
    expect(returnStatusMeta("awaiting_vendor_receipt").waiting).toBe(false);
    expect(returnStatusMeta("requested").waiting).toBe(false);
  });

  it("não quebra em status desconhecido vindo do backend", () => {
    const meta = returnStatusMeta("estado_que_nao_existe");
    expect(meta.action).toBeNull();
    expect(meta.label).toBe("Situação desconhecida");
  });

  it("todo estado aberto tem chamada para ação em imperativo", () => {
    for (const status of OPEN_STATES) {
      expect(returnStatusMeta(status).callToAction.length, status).toBeGreaterThan(0);
    }
  });
});

describe("rótulos", () => {
  it("traduz os motivos que o WordPress aceita", () => {
    for (const reason of ["regret", "defective", "damaged", "incorrect_item", "incomplete_item", "other"]) {
      expect(returnReasonLabel(reason)).not.toBe("Motivo não informado");
    }
  });

  it("cai em texto neutro quando o motivo é desconhecido", () => {
    expect(returnReasonLabel("")).toBe("Motivo não informado");
  });

  it("traduz condições de inspeção e meios de estorno", () => {
    expect(returnConditionLabel("sellable")).toBe("Revendável");
    expect(returnConditionLabel(null)).toBe("");
    expect(returnMethodLabel("pix")).toBe("Pix");
    expect(returnMethodLabel("original_method")).toBe("Mesmo meio da compra");
  });
});
