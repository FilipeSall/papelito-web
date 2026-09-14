import { describe, expect, it } from "vitest";

import { VENDOR_ORDER_STATUS_ORDER } from "@/components/layout/vendor-panel/order-status";
import { VENDOR_ORDER_STATUSES } from "@/features/vendor-orders/types/vendor-orders";
import { parseVendorOrderStatus } from "@/lib/server/admin-vendor-filters";

import { normalizeVendorOrdersStatus } from "./vendor-order-filters";

describe("normalizeVendorOrdersStatus", () => {
  // O painel monta um atalho clicável por situação a partir de
  // VENDOR_ORDER_STATUS_ORDER. Uma situação que o parser não reconheça volta
  // como "all": o atalho existe, é clicável, e devolve a lista inteira.
  it.each(VENDOR_ORDER_STATUS_ORDER)("aceita %s, que o painel oferece como atalho", (status) => {
    expect(normalizeVendorOrdersStatus(status)).toBe(status);
  });

  it("cai para all em valor desconhecido", () => {
    expect(normalizeVendorOrdersStatus("inexistente")).toBe("all");
    expect(normalizeVendorOrdersStatus(null)).toBe("all");
  });
});

describe("parseVendorOrderStatus", () => {
  it.each(VENDOR_ORDER_STATUSES)("aceita %s", (status) => {
    expect(parseVendorOrderStatus(status)).toBe(status);
  });

  it("cai para all em valor desconhecido", () => {
    expect(parseVendorOrderStatus("inexistente")).toBe("all");
  });
});
