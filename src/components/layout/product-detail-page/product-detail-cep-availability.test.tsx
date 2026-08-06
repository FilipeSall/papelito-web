import { fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";

import { server } from "../../../../test/msw/server";
import { renderWithProviders } from "../../../../test/utils/render-with-providers";
import { ProductDetailCepAvailability } from "./product-detail-cep-availability";

describe("ProductDetailCepAvailability", () => {
  afterEach(() => {
    server.resetHandlers();
  });

  it("shows regional availability after a valid CEP lookup", async () => {
    server.use(
      http.get("/api/catalog/availability", ({ request }) => {
        const url = new URL(request.url);

        expect(url.searchParams.get("productIds")).toBe("11760");
        expect(url.searchParams.get("cep")).toBe("01310930");

        return HttpResponse.json({
          status: "ok",
          products: { "11760": { available: true, stockQty: 1 } },
        });
      }),
    );

    renderWithProviders(<ProductDetailCepAvailability productId="11760" />);

    fireEvent.change(
      screen.getByLabelText("CEP para consultar disponibilidade"),
      {
        target: { value: "01310-930" },
      },
    );
    fireEvent.click(screen.getByRole("button", { name: "Consultar" }));

    await waitFor(() => {
      expect(
        screen.getByText("Produto disponível para este CEP."),
      ).toBeInTheDocument();
    });
  });

  it("rejects an invalid CEP without making a request", async () => {
    let requestCount = 0;
    server.use(
      http.get("/api/catalog/availability", () => {
        requestCount += 1;
        return HttpResponse.json({ status: "ok", products: {} });
      }),
    );

    renderWithProviders(<ProductDetailCepAvailability productId="11760" />);

    fireEvent.change(
      screen.getByLabelText("CEP para consultar disponibilidade"),
      {
        target: { value: "123" },
      },
    );
    fireEvent.click(screen.getByRole("button", { name: "Consultar" }));

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Informe um CEP válido.",
    );
    expect(requestCount).toBe(0);
  });

  it("shows the unavailable state when no stock serves the CEP", async () => {
    server.use(
      http.get("/api/catalog/availability", () =>
        HttpResponse.json({
          status: "ok",
          products: { "11760": { available: false, stockQty: 0 } },
        }),
      ),
    );

    renderWithProviders(<ProductDetailCepAvailability productId="11760" />);

    fireEvent.change(
      screen.getByLabelText("CEP para consultar disponibilidade"),
      {
        target: { value: "01310930" },
      },
    );
    fireEvent.click(screen.getByRole("button", { name: "Consultar" }));

    await waitFor(() => {
      expect(
        screen.getByText("Produto sem estoque regional para este CEP."),
      ).toBeInTheDocument();
    });
  });
});
