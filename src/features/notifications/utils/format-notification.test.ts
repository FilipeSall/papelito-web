import { describe, expect, it } from "vitest";

import { buildNotification } from "../../../../test/factories/notification";
import { formatNotification } from "./format-notification";

describe("formatNotification", () => {
  it("links a pending company review directly to the user review tab", () => {
    const formatted = formatNotification(
      buildNotification({
        type: "company_owner_review_pending",
        payload: {
          userId: 84,
          companyName: "Papelaria Exemplo",
        },
      }),
    );

    expect(formatted.title).toBe("Análise empresarial pendente");
    expect(formatted.body).toContain("Papelaria Exemplo");
    expect(formatted.href).toBe("/admin/contas/84?tab=company-review");
  });

  it("links a pre-account document review into the administrative accounts table", () => {
    const formatted = formatNotification(
      buildNotification({
        type: "company_owner_review_pending",
        payload: {
          applicationId: "pre:84",
          companyName: "Papelaria Exemplo",
          href: "/admin/empresas/pre%3A84",
        },
      }),
    );

    expect(formatted.href).toBe("/admin/contas?preAccountApplication=pre%3A84");
  });

  it("shows discount details for favorite-on-promo notifications when available", () => {
    const formatted = formatNotification(
      buildNotification({
        payload: {
          product_id: 321,
          product_name: "Tubelito Tradicional",
          promo_label: "Oferta Relâmpago",
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
    expect(formatted.href).toBe(
      "/admin/products?focus=321&issue=missing-weight",
    );
  });

  it("consolidates missing price and weight into one admin notification", () => {
    const formatted = formatNotification(
      buildNotification({
        type: "product_data_incomplete",
        payload: {
          missing_price: true,
          missing_weight: true,
          product_id: 321,
          product_name: "Dichavador Brilho",
        },
      }),
    );

    expect(formatted.title).toBe("Cadastro de produto incompleto");
    expect(formatted.body).toContain("sem preço e sem peso");
    expect(formatted.href).toBe(
      "/admin/products?focus=321&issue=product-data-incomplete",
    );
  });

  it("formats a Kit logistics notification without treating it as a regular product", () => {
    const formatted = formatNotification(
      buildNotification({
        type: "product_data_incomplete",
        payload: {
          entity_type: "kit",
          kit_id: 17,
          missing_dimensions: true,
          missing_weight: false,
          product_id: 321,
          product_name: "Kit Escritório",
        },
      }),
    );

    expect(formatted.title).toBe("Cadastro de Kit incompleto");
    expect(formatted.body).toContain("sem dimensões da embalagem");
    expect(formatted.href).toBe(
      "/admin/products?tab=kits&focus=17&issue=shipping-dimensions",
    );
  });

  it("links a vendor interest notification to its detail inside Vendors", () => {
    const formatted = formatNotification(
      buildNotification({
        type: "new_vendor_application",
        payload: {
          interest_id: 42,
          store_name: "Loja Exemplo",
        },
      }),
    );

    expect(formatted.href).toBe("/admin/vendors/interesses/42");
  });

  it("falls back to the analysis queue when the notification has no interest id", () => {
    const formatted = formatNotification(
      buildNotification({ type: "new_vendor_application", payload: {} }),
    );

    expect(formatted.href).toBe("/admin/contas?tab=analises&analysisType=vendor");
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
    expect(formatted.body).toContain("separação");
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
    expect(formatted.body).toContain("urgência");
    expect(formatted.href).toBe("/vendor/pedidos/11880");
  });

  it("sends a Pagar.me pending notification to vendor settings", () => {
    const formatted = formatNotification(
      buildNotification({ type: "vendor_pagarme_sync_pending", payload: {} }),
    );

    expect(formatted.title).toBe("Configuração Pagar.me pendente");
    expect(formatted.body).toContain("começar a vender");
    expect(formatted.href).toBe("/vendor/configuracoes");
  });

  it("describes Pagar.me support without referring to an order", () => {
    const formatted = formatNotification(
      buildNotification({
        type: "support_message",
        payload: {
          context: "pagarme_bank_account_update",
          recipient_role: "seller",
          sender_name: "Suporte Papelito",
          thread_id: 42,
        },
      }),
    );

    expect(formatted.title).toBe("Nova mensagem sobre a conta Pagar.me");
    expect(formatted.body).toContain("conta bancária");
    expect(formatted.body).not.toContain("pedido");
    expect(formatted.href).toBe("/vendor/mensagens/42");
  });
});
