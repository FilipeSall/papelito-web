import { describe, expect, it } from "vitest";

import {
  mapVendorOrderFiscal,
  isVendorOrderStatus,
  mapVendorOrderDetail,
  mapVendorOrderDocumentsSurface,
  mapVendorOrderRefund,
  mapVendorOrderRefundPreview,
  mapVendorOrderStatus,
  mapVendorOrderSummary,
} from "./vendor-order-mappers";

describe("isVendorOrderStatus", () => {
  it("accepts aguardando_pagamento so its filter is recognized (regression)", () => {
    expect(isVendorOrderStatus("aguardando_pagamento")).toBe(true);
  });

  it("accepts every known vendor order status", () => {
    for (const status of [
      "aguardando_pagamento",
      "aguardando_estoque",
      "aguardando_envio",
      "em_separacao",
      "enviado",
      "entregue",
      "cancelado",
    ]) {
      expect(isVendorOrderStatus(status)).toBe(true);
    }
  });

  it("rejects unknown values and non-strings so they fall back to Todos", () => {
    expect(isVendorOrderStatus("all")).toBe(false);
    expect(isVendorOrderStatus(undefined)).toBe(false);
    expect(isVendorOrderStatus("")).toBe(false);
    expect(isVendorOrderStatus("processing")).toBe(false);
  });
});

describe("mapVendorOrderStatus", () => {
  it("maps an order awaiting payment to aguardando_pagamento", () => {
    expect(mapVendorOrderStatus("aguardando_pagamento")).toBe("aguardando_pagamento");
  });

  it("keeps an order released for shipping as aguardando_envio", () => {
    expect(mapVendorOrderStatus("aguardando_envio")).toBe("aguardando_envio");
  });

  it("never treats an unknown/unpaid status as ready to ship", () => {
    expect(mapVendorOrderStatus(undefined)).toBe("aguardando_pagamento");
    expect(mapVendorOrderStatus("")).toBe("aguardando_pagamento");
    expect(mapVendorOrderStatus("pending")).toBe("aguardando_pagamento");
    expect(mapVendorOrderStatus("anything-else")).toBe("aguardando_pagamento");
  });

  it("preserves the downstream fulfillment statuses", () => {
    expect(mapVendorOrderStatus("em_separacao")).toBe("em_separacao");
    expect(mapVendorOrderStatus("enviado")).toBe("enviado");
    expect(mapVendorOrderStatus("entregue")).toBe("entregue");
    expect(mapVendorOrderStatus("cancelado")).toBe("cancelado");
  });
});

describe("mapVendorOrderSummary", () => {
  it("surfaces aguardando_pagamento for an unpaid order so the vendor does not see it as ready to ship", () => {
    const summary = mapVendorOrderSummary({
      id: 11879,
      order_number: "11879",
      total: 71.36,
      vendor_status: "aguardando_pagamento",
    });

    expect(summary.status).toBe("aguardando_pagamento");
    expect(summary.id).toBe(11879);
  });
});

describe("mapVendorOrderDetail logistics", () => {
  it("maps generation/provider/label capabilities without exposing storage details", () => {
    const order = mapVendorOrderDetail({
      id: 11887,
      logistics: {
        automatic_generation_enabled: true,
        creation_outcome: "created",
        generation_status: "generated",
        generation_error_code: "",
        manual_fallback_available: false,
        manual_registration_enabled: false,
        reconciliation_attempts: 1,
        reconciliation_status: "resolved_created",
        status: "preposted",
        support_review_required: false,
        shipments: [
          {
            creation_outcome: "created",
            generation_status: "generated",
            id: 91,
            label_available: true,
            provider: "mock",
            reconciliation_status: "resolved_created",
            is_test: true,
            status: "preposted",
            tracking_code: "MOCK-11887-ABCDEF12",
          },
        ],
      },
    });

    expect(order.logistics.automaticGenerationEnabled).toBe(true);
    expect(order.logistics.generationStatus).toBe("generated");
    expect(order.logistics.creationOutcome).toBe("created");
    expect(order.logistics.reconciliationStatus).toBe("resolved_created");
    expect(order.logistics.manualRegistrationEnabled).toBe(false);
    expect(order.logistics.manualFallbackAvailable).toBe(false);
    expect(order.logistics.shipments[0]).toMatchObject({
      generationStatus: "generated",
      creationOutcome: "created",
      labelAvailable: true,
      provider: "mock",
      reconciliationStatus: "resolved_created",
      isTest: true,
      trackingCode: "MOCK-11887-ABCDEF12",
    });
  });

  it("keeps old backend shipments compatible by inferring generated", () => {
    const order = mapVendorOrderDetail({
      logistics: {
        shipments: [{ id: 2, status: "preposted", tracking_code: "AA123456789BR" }],
      },
    });

    expect(order.logistics.generationStatus).toBe("generated");
    expect(order.logistics.shipments[0].generationStatus).toBe("generated");
  });
});

describe("mapVendorOrderFiscal", () => {
  it("nasce desligado quando o WordPress não manda o bloco", () => {
    const fiscal = mapVendorOrderFiscal(undefined);

    expect(fiscal.enabled).toBe(false);
    expect(fiscal.canAttach).toBe(false);
    expect(fiscal.document).toBeNull();
    expect(fiscal.events).toEqual([]);
  });

  it("nunca habilita o anexo por omissão de campo", () => {
    const fiscal = mapVendorOrderFiscal({ enabled: true });

    expect(fiscal.canAttach).toBe(false);
    expect(fiscal.blockReason).toBe("");
  });

  it("mantém o motivo do bloqueio só quando ele é conhecido", () => {
    expect(mapVendorOrderFiscal({ block_reason: "cancelado" }).blockReason).toBe("cancelado");
    expect(mapVendorOrderFiscal({ block_reason: "motivo_novo" }).blockReason).toBe("");
  });

  it("cai nos limites do spec quando o payload não os traz", () => {
    const fiscal = mapVendorOrderFiscal({ enabled: true });

    expect(fiscal.limits).toEqual({ pdf: 10 * 1024 * 1024, xml: 2 * 1024 * 1024 });
  });

  it("descarta documento sem id", () => {
    expect(mapVendorOrderFiscal({ document: { original_name: "nota.pdf" } }).document).toBeNull();
  });

  it("mapeia o arquivo da nota", () => {
    const fiscal = mapVendorOrderFiscal({
      document: {
        created_at: "2026-09-01 12:00:00",
        id: 42,
        mime: "application/pdf",
        original_name: "nota.pdf",
        size_bytes: 284_000,
        updated_at: "2026-09-03 15:20:00",
      },
    });

    expect(fiscal.document).toEqual({
      createdAt: "2026-09-01 12:00:00",
      id: 42,
      mime: "application/pdf",
      originalName: "nota.pdf",
      sizeBytes: 284_000,
      updatedAt: "2026-09-03 15:20:00",
    });
  });

  it("lê a trilha do bloco, e não do documento: ela sobrevive à remoção da nota", () => {
    const fiscal = mapVendorOrderFiscal({
      document: null,
      events: [
        { actor_role: "vendor", created_at: "2026-09-01 12:00:00", event: "anexada", id: 1, original_name: "nota.pdf" },
        { actor_role: "sistema", created_at: "2026-09-03 15:20:00", event: "removida", id: 3, original_name: "nota.pdf" },
      ],
    });

    expect(fiscal.document).toBeNull();
    expect(fiscal.events).toHaveLength(2);
    expect(fiscal.events[1]).toMatchObject({ actorRole: "sistema", event: "removida" });
  });

  it("descarta evento sem id ou sem nome, e nunca deixa a trilha indefinida", () => {
    const fiscal = mapVendorOrderFiscal({
      events: [{ event: "anexada" }, { id: 7 }, { id: 8, event: "substituida" }],
    });

    expect(fiscal.events.map((entry) => entry.id)).toEqual([8]);
    expect(mapVendorOrderFiscal({}).events).toEqual([]);
  });

  it("zera papel de ator desconhecido em vez de inventar autor", () => {
    const fiscal = mapVendorOrderFiscal({
      events: [{ actor_role: "robo", event: "anexada", id: 1 }],
    });

    expect(fiscal.events[0].actorRole).toBe("");
  });
});

describe("mapVendorOrderRefund", () => {
  it("reconhece os status de pedido pago cancelado", () => {
    expect(isVendorOrderStatus("cancelamento_solicitado")).toBe(true);
    expect(isVendorOrderStatus("estornado")).toBe(true);
  });

  it("mapeia o estorno manual pendente vindo do WordPress", () => {
    const refund = mapVendorOrderRefund({
      amountCents: 15990,
      customerHasPixKey: true,
      id: 12,
      mode: "manual",
      overdue: false,
      refundDueAt: "2026-09-21 13:02:11",
      status: "manual_pendente",
    });

    expect(refund).toMatchObject({
      amountCents: 15990,
      customerHasPixKey: true,
      id: 12,
      mode: "manual",
      proofId: 0,
      refundDueAt: "2026-09-21 13:02:11",
      status: "manual_pendente",
    });
  });

  it("descarta estorno sem id ou com estado desconhecido em vez de inventar situação", () => {
    expect(mapVendorOrderRefund(null)).toBeNull();
    expect(mapVendorOrderRefund({ id: 0, status: "reembolsado" })).toBeNull();
    expect(mapVendorOrderRefund({ id: 3, status: "estornado_talvez" })).toBeNull();
  });

  it("trata modo desconhecido como manual, que obriga alguém a devolver", () => {
    expect(mapVendorOrderRefund({ id: 4, mode: "outro", status: "processando" })?.mode).toBe("manual");
  });
});

describe("mapVendorOrderRefundPreview", () => {
  it("mapeia a prévia do estorno pela API", () => {
    expect(mapVendorOrderRefundPreview({ amountCents: 9990, manualDueDays: 7, mode: "api" })).toEqual({
      amountCents: 9990,
      manualDueDays: 7,
      mode: "api",
    });
  });

  it("ignora prévia sem caminho reconhecido", () => {
    expect(mapVendorOrderRefundPreview(null)).toBeNull();
    expect(mapVendorOrderRefundPreview({ amountCents: 1, mode: "boleto" })).toBeNull();
  });

  it("deixa estorno e prévia nulos no detalhe quando o WordPress não os manda", () => {
    const detail = mapVendorOrderDetail({ id: 1, vendor_status: "aguardando_envio" });

    expect(detail.refund).toBeNull();
    expect(detail.refundPreview).toBeNull();
  });
});

describe("mapVendorOrderDocumentsSurface", () => {
  it("segue a decisão do WordPress", () => {
    expect(mapVendorOrderDocumentsSurface({ surface: "estorno" })).toBe("estorno");
    expect(mapVendorOrderDocumentsSurface({ surface: "pedido" })).toBe("pedido");
  });

  it("sem o campo, a tela fica no fluxo normal — omissão não é decisão do front", () => {
    expect(mapVendorOrderDocumentsSurface(undefined)).toBe("pedido");
    expect(mapVendorOrderDocumentsSurface({})).toBe("pedido");
    expect(mapVendorOrderDocumentsSurface({ surface: "valor_novo" })).toBe("pedido");
  });

  it("o status do pedido não decide a superfície: só o campo decide", () => {
    const refundedWithoutBlock = mapVendorOrderDetail({ id: 1, vendor_status: "estornado" });
    const runningWithBlock = mapVendorOrderDetail({
      documents: { surface: "estorno" },
      id: 2,
      vendor_status: "aguardando_envio",
    });

    expect(refundedWithoutBlock.documentsSurface).toBe("pedido");
    expect(runningWithBlock.documentsSurface).toBe("estorno");
  });
});

describe("mapVendorOrderSummary transportadora", () => {
  it("leva a transportadora para a fila, que também fala do envio", () => {
    expect(mapVendorOrderSummary({ shipping_provider: "braspress" }).shippingProvider).toBe(
      "braspress",
    );
  });

  it("devolve vazio quando o pedido não gravou transportadora, sem chutar uma", () => {
    expect(mapVendorOrderSummary({}).shippingProvider).toBe("");
  });
});
