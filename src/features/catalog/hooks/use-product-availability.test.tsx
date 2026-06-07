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
  const { status, isUnavailable, disabledReason, stockLabel } = useProductAvailability(productId);

  return (
    <div>
      <span>{status}</span>
      <span>{stockLabel}</span>
      <span>{isUnavailable ? "unavailable" : "available"}</span>
      <span>{disabledReason ?? "no-reason"}</span>
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
      expect(screen.getByText("Estoque por região")).toBeInTheDocument();
    });
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
