import { describe, expect, it } from "vitest";

import { mapStatus } from "./get-profile-order-detail";

describe("mapStatus (customer order status)", () => {
  it("maps an unpaid order to awaiting_payment, never awaiting_shipment", () => {
    expect(mapStatus("aguardando_pagamento")).toBe("awaiting_payment");
  });

  it("falls back to awaiting_payment for unknown/unpaid statuses instead of awaiting_shipment", () => {
    expect(mapStatus(undefined)).toBe("awaiting_payment");
    expect(mapStatus("")).toBe("awaiting_payment");
    expect(mapStatus("pending")).toBe("awaiting_payment");
  });

  it("only maps a paid, released order to awaiting_shipment", () => {
    expect(mapStatus("aguardando_envio")).toBe("awaiting_shipment");
  });

  it("shows a paid order without a renewed stock reservation as under review", () => {
    expect(mapStatus("aguardando_estoque")).toBe("stock_review");
  });

  it("preserves the downstream fulfillment statuses", () => {
    expect(mapStatus("em_separacao")).toBe("picking");
    expect(mapStatus("enviado")).toBe("shipped");
    expect(mapStatus("entregue")).toBe("delivered");
    expect(mapStatus("cancelado")).toBe("cancelled");
  });
});
