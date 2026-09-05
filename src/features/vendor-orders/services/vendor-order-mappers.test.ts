import { describe, expect, it } from "vitest";

import {
  mapVendorOrderFiscal,
  isVendorOrderStatus,
  mapVendorOrderDetail,
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

    expect(fiscal.limits).toEqual({ danfe_pdf: 10 * 1024 * 1024, xml: 2 * 1024 * 1024 });
  });

  it("descarta documento sem id", () => {
    expect(mapVendorOrderFiscal({ document: { access_key: "5325" } }).document).toBeNull();
  });

  it("normaliza situação e papel desconhecidos sem perder o documento", () => {
    const fiscal = mapVendorOrderFiscal({
      document: {
        id: 42,
        doc_status: "situacao_nova",
        access_key_status: "outra",
        files: [{ id: 7, role: "planilha" }],
      },
    });

    expect(fiscal.document?.docStatus).toBe("recebida");
    expect(fiscal.document?.accessKeyStatus).toBe("ausente");
    expect(fiscal.document?.files[0].role).toBe("other");
  });

  it("mapeia o histórico do documento", () => {
    const fiscal = mapVendorOrderFiscal({
      document: {
        id: 42,
        events: [
          { id: 3, event: "substituida", actor_role: "vendor", created_at: "2026-09-03 15:20:00", role: "xml" },
          { id: 1, event: "criado", actor_role: "vendor", created_at: "2026-09-01 12:00:00" },
        ],
      },
    });

    expect(fiscal.document?.events).toHaveLength(2);
    expect(fiscal.document?.events[0]).toMatchObject({ event: "substituida", role: "xml" });
    expect(fiscal.document?.events[1].role).toBe("");
  });

  it("descarta evento sem id ou sem nome, e nunca deixa o histórico indefinido", () => {
    const fiscal = mapVendorOrderFiscal({
      document: { id: 42, events: [{ event: "criado" }, { id: 7 }, { id: 8, event: "atualizado" }] },
    });

    expect(fiscal.document?.events.map((entry) => entry.id)).toEqual([8]);
    expect(mapVendorOrderFiscal({ document: { id: 42 } }).document?.events).toEqual([]);
  });

  it("aceita as observações pelo nome de coluna ou pelo nome de payload", () => {
    expect(mapVendorOrderFiscal({ document: { id: 1, notes: "do payload" } }).document?.notes).toBe(
      "do payload",
    );
    expect(
      mapVendorOrderFiscal({ document: { id: 1, internal_notes: "da coluna" } }).document?.notes,
    ).toBe("da coluna");
  });
});
