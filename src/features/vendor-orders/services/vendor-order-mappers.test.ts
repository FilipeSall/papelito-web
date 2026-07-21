import { describe, expect, it } from "vitest";

import {
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
        generation_status: "generated",
        generation_error_code: "",
        manual_fallback_available: false,
        manual_registration_enabled: false,
        status: "preposted",
        shipments: [
          {
            generation_status: "generated",
            id: 91,
            label_available: true,
            provider: "mock",
            is_test: true,
            status: "preposted",
            tracking_code: "MOCK-11887-ABCDEF12",
          },
        ],
      },
    });

    expect(order.logistics.automaticGenerationEnabled).toBe(true);
    expect(order.logistics.generationStatus).toBe("generated");
    expect(order.logistics.manualRegistrationEnabled).toBe(false);
    expect(order.logistics.manualFallbackAvailable).toBe(false);
    expect(order.logistics.shipments[0]).toMatchObject({
      generationStatus: "generated",
      labelAvailable: true,
      provider: "mock",
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
