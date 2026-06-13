import { describe, expect, it } from "vitest";

import { isVendorOrderStatus, mapVendorOrderStatus, mapVendorOrderSummary } from "./vendor-order-mappers";

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
