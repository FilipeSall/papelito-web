import { http, HttpResponse } from "msw";

export const availabilityHandlers = [
  http.get("/api/catalog/availability", ({ request }) => {
    const productIds =
      new URL(request.url).searchParams.get("productIds")?.split(",") ?? [];

    return HttpResponse.json({
      status: "ok",
      products: Object.fromEntries(
        productIds.map((id: string) => [
          id,
          {
            available: id !== "2",
            stockQty: id === "2" ? 0 : 5,
          },
        ]),
      ),
    });
  }),
];
