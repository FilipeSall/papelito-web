import { http, HttpResponse } from "msw";

export const cartHandlers = [
  http.post("/api/cart/pricing", async ({ request }) => {
    const body = (await request.json()) as {
      items?: Array<{
        product_id?: number;
        qty?: number;
        vendor_id?: number;
        promotion_context?: string;
      }>;
      shipping?: { destination_cep?: string; selected_code?: string };
    };
    const lines = (body.items ?? []).map((item) => {
      const quantity = Math.max(1, item.qty ?? 1);
      const unitCents = item.product_id === 11883 ? 9000 : 4950;
      const totalCents = unitCents * quantity;

      return {
        productId: item.product_id,
        qty: quantity,
        vendorId: item.vendor_id ?? 101,
        normalUnitCents: unitCents,
        subtotalCents: totalCents,
        discountCents: 0,
        totalCents,
        discountSource: "none",
        promotionContext: item.promotion_context ?? "",
      };
    });
    const subtotalCents = lines.reduce(
      (total, line) => total + line.subtotalCents,
      0,
    );
    const shippingCents =
      body.shipping?.selected_code === "03298"
        ? 1588
        : body.shipping?.selected_code === "03220"
          ? 2230
          : 0;

    return HttpResponse.json({
      lines,
      coupon: null,
      adjustments: [],
      totals: {
        subtotalCents,
        discountCents: 0,
        itemsCents: subtotalCents,
        shippingCents,
        totalCents: subtotalCents + shippingCents,
      },
      paymentRestrictions: {
        creditCardMinimumCents: 100,
        pixMinimumCents: 1,
        boletoMinimumCents: 1,
        installmentMinimumCents: 100,
        maxInstallments: 6,
      },
    });
  }),
  http.post("/api/cart/stock", async ({ request }) => {
    const body = (await request.json()) as {
      items?: Array<{ productId?: number }>;
    };
    const products = Object.fromEntries(
      (body.items ?? []).map((item) => {
        const productId = String(item.productId ?? "");
        const stockQty = productId === "1" ? 3 : productId === "2" ? 0 : 100;
        return [productId, { available: stockQty > 0, stockQty }];
      }),
    );

    return HttpResponse.json({ status: "ok", products });
  }),
  http.post("/api/cart/resolve-vendor", async ({ request }) => {
    const body = (await request.json()) as {
      product?: { id?: string };
    };

    if (body.product?.id === "401") {
      return HttpResponse.json({ message: "Nao autorizado." }, { status: 401 });
    }

    if (body.product?.id === "409") {
      return HttpResponse.json({
        status: "vendor_conflict",
        message: "Seu carrinho atual pertence a outro vendor.",
      });
    }

    return HttpResponse.json({
      status: "ok",
      vendor: {
        vendorId: 101,
        vendorName: "Vendor Centro",
        city: "Sao Paulo",
        state: "SP",
        distanceKm: 12,
        leadTimeDays: 2,
      },
    });
  }),
];
