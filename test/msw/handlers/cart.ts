import { http, HttpResponse } from "msw";

export const cartHandlers = [
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
