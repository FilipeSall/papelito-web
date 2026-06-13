import { describe, expect, it } from "vitest";

import { buildNotification } from "../../../../test/factories/notification";
import { formatNotification } from "./format-notification";

describe("formatNotification", () => {
  it("shows discount details for favorite-on-promo notifications when available", () => {
    const formatted = formatNotification(
      buildNotification({
        payload: {
          product_id: 321,
          product_name: "Tubelito Tradicional",
          promo_label: "Oferta Relampago",
          discount_percent: 25,
          regular_price: 19.9,
          sale_price: 14.9,
        },
      }),
    );

    expect(formatted.icon).toBe("megaphone");
    expect(formatted.title).toBe("Favorito em promoção");
    expect(formatted.body).toContain("Tubelito Tradicional");
    expect(formatted.body).toContain("25% de desconto");
    expect(formatted.body).toContain("R$");
    expect(formatted.href).toBe("/produtos/321");
  });

  it("builds the admin product link for missing-weight notifications", () => {
    const formatted = formatNotification(
      buildNotification({
        type: "product_missing_weight",
        payload: {
          product_id: 321,
          product_name: "Tubelito Tradicional",
        },
      }),
    );

    expect(formatted.icon).toBe("package");
    expect(formatted.title).toBe("Produto sem peso");
    expect(formatted.body).toContain("Tubelito Tradicional");
    expect(formatted.href).toBe("/admin/products?focus=321");
  });

  it("links a new purchase to the vendor order detail and shows the total", () => {
    const formatted = formatNotification(
      buildNotification({
        type: "new_purchase",
        payload: {
          order_id: 11884,
          order_number: "11884",
          total: 60.36,
        },
      }),
    );

    expect(formatted.icon).toBe("package");
    expect(formatted.title).toBe("Nova compra");
    expect(formatted.body).toContain("#11884");
    expect(formatted.body).toContain("separacao");
    expect(formatted.href).toBe("/vendor/pedidos/11884");
  });

  it("falls back to the orders list when a new purchase has no order id", () => {
    const formatted = formatNotification(
      buildNotification({ type: "new_purchase", payload: {} }),
    );

    expect(formatted.href).toBe("/vendor/pedidos");
  });

  it("warns the vendor about an overdue order with the days late and a link", () => {
    const formatted = formatNotification(
      buildNotification({
        type: "vendor_processing_overdue",
        payload: {
          order_id: 11880,
          order_number: "11880",
          days_overdue: 2,
          lead_time_days: 3,
        },
      }),
    );

    expect(formatted.title).toBe("Pedido atrasado");
    expect(formatted.body).toContain("#11880");
    expect(formatted.body).toContain("2 dia(s)");
    expect(formatted.body).toContain("urgencia");
    expect(formatted.href).toBe("/vendor/pedidos/11880");
  });
});
