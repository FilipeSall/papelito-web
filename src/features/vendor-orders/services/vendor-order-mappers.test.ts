import { describe, expect, it } from "vitest";

import { mapVendorOrderStatus, mapVendorOrderSummary } from "./vendor-order-mappers";

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
