import { screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { http, HttpResponse } from "msw";

import { server } from "../../../../test/msw/server";
import { renderWithProviders } from "../../../../test/utils/render-with-providers";
import { useProductAvailability } from "./use-product-availability";

let authState = {
  isAuthenticated: true,
  isLoading: false,
  role: "customer",
};

vi.mock("@/hooks/use-auth-session", () => ({
  useAuthSession: () => authState,
}));

function Consumer({ productId }: { productId: string }) {
  const { status, isUnavailable, disabledReason, stockLabel, isRegionBlocked, regionBlockReason } =
    useProductAvailability(productId);

  return (
    <div>
      <span>{status}</span>
      <span>{stockLabel}</span>
      <span>{isUnavailable ? "unavailable" : "available"}</span>
      <span>{disabledReason ?? "no-reason"}</span>
      <span>{isRegionBlocked ? "region-blocked" : "region-open"}</span>
      <span data-testid="region-reason">{regionBlockReason ?? "no-region-reason"}</span>
    </div>
  );
}

describe("useProductAvailability", () => {
  beforeEach(() => {
    authState = {
      isAuthenticated: true,
      isLoading: false,
      role: "customer",
    };
  });

  afterEach(() => {
    server.resetHandlers();
  });

  it("returns not_applicable when the user is not a customer", () => {
    authState.role = "seller";

    renderWithProviders(<Consumer productId="2" />, { productIds: ["2"] });

    expect(screen.getByText("not_applicable")).toBeInTheDocument();
    expect(screen.getByText("available")).toBeInTheDocument();
  });

  it("returns disabled reason for unavailable products", async () => {
    renderWithProviders(<Consumer productId="2" />, { productIds: ["2"] });

    await waitFor(() => {
      expect(screen.getByText("ok")).toBeInTheDocument();
      expect(screen.getByText("unavailable")).toBeInTheDocument();
      expect(
        screen.getByText("O vendor da sua região não tem esse produto."),
      ).toBeInTheDocument();
    });
  });

  it("falls back to unavailable status on API errors", async () => {
    server.use(
      http.get("/api/catalog/availability", () => HttpResponse.json({}, { status: 500 })),
    );

    renderWithProviders(<Consumer productId="2" />, { productIds: ["2"] });

    await waitFor(() => {
      expect(screen.getByText("unavailable")).toBeInTheDocument();
      expect(screen.getByText("Não foi possível consultar")).toBeInTheDocument();
    });
  });

  it("keeps a neutral label when the response omits the stock quantity", async () => {
    server.use(
      http.get("/api/catalog/availability", () =>
        HttpResponse.json({ status: "ok", products: { "2": { available: true } } }),
      ),
    );

    renderWithProviders(<Consumer productId="2" />, { productIds: ["2"] });

    await waitFor(() => {
      expect(screen.getByText("Estoque por região")).toBeInTheDocument();
    });

    expect(screen.getByText("available")).toBeInTheDocument();
  });

  it("blocks the region when no vendor covers the account CEP", async () => {
    server.use(
      http.get("/api/catalog/availability", () =>
        HttpResponse.json({
          status: "no_vendor",
          products: { "2": { available: false, stockQty: 0 } },
        }),
      ),
    );

    renderWithProviders(<Consumer productId="2" />, { productIds: ["2"] });

    await waitFor(() => {
      expect(screen.getByText("region-blocked")).toBeInTheDocument();
      expect(screen.getByTestId("region-reason")).toHaveTextContent(
        "Nenhum vendor atende sua região no momento.",
      );
    });

    expect(screen.getByText("unavailable")).toBeInTheDocument();
  });

  it("blocks the region when the logged customer has no CEP", async () => {
    server.use(
      http.get("/api/catalog/availability", () =>
        HttpResponse.json({ status: "missing_cep", products: {} }),
      ),
    );

    renderWithProviders(<Consumer productId="2" />, { productIds: ["2"] });

    await waitFor(() => {
      expect(screen.getByText("region-blocked")).toBeInTheDocument();
      expect(screen.getByTestId("region-reason")).toHaveTextContent(
        "Cadastre um CEP para verificar os vendors da sua região.",
      );
    });
  });

  it("keeps the region open for anonymous visitors", () => {
    authState.isAuthenticated = false;

    renderWithProviders(<Consumer productId="2" />, { productIds: ["2"] });

    expect(screen.getByText("not_applicable")).toBeInTheDocument();
    expect(screen.getByText("region-open")).toBeInTheDocument();
    expect(screen.getByText("Consulte o CEP no produto")).toBeInTheDocument();
  });

  /**
   * O rótulo não pode contradizer o estado de compra: com a consulta fora do ar a região segue
   * aberta, então o card não pode afirmar que o produto está indisponível.
   */
  it("keeps the region open when the availability lookup fails", async () => {
    server.use(
      http.get("/api/catalog/availability", () => HttpResponse.json({}, { status: 500 })),
    );

    renderWithProviders(<Consumer productId="2" />, { productIds: ["2"] });

    await waitFor(() => {
      expect(screen.getByText("unavailable")).toBeInTheDocument();
    });

    expect(screen.getByText("region-open")).toBeInTheDocument();
    expect(screen.getByText("no-reason")).toBeInTheDocument();
    expect(screen.getByText("Não foi possível consultar")).toBeInTheDocument();

    expect(screen.getByText("region-open")).toBeInTheDocument();
  });

  it("writes successful responses to local storage cache", async () => {
    renderWithProviders(<Consumer productId="2" />, { productIds: ["2"] });

    await waitFor(() => {
      expect(window.localStorage.getItem("papelito:catalog-availability:v3:2")).toContain(
        "\"status\":\"ok\"",
      );
    });
  });
});
