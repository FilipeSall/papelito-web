import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next-auth", () => ({
  getServerSession: vi.fn().mockResolvedValue({ accessToken: "admin-token" }),
}));

vi.mock("@/lib/auth", () => ({ authOptions: {} }));

vi.mock("@/lib/server/admin-products", () => ({
  getAdminProductsSnapshot: vi
    .fn()
    .mockResolvedValue({ products: [], issues: [], totalProducts: 0 }),
}));

vi.mock("@/lib/server/admin-kits", () => ({
  getAdminKitsSnapshot: vi.fn().mockResolvedValue([]),
}));

vi.mock("@/lib/server/admin-flash-sale", () => ({
  getAdminFlashSaleProducts: vi.fn().mockResolvedValue({ products: [] }),
}));

vi.mock("@/lib/server/admin-product-benefits", () => ({
  getAdminBenefitGroupsSnapshot: vi
    .fn()
    .mockResolvedValue({ groups: [], collections: [], issues: [] }),
}));

vi.mock("@/lib/server/admin-taxonomy", () => ({
  getAdminTaxonomySnapshot: vi
    .fn()
    .mockResolvedValue({
      categories: [],
      collections: [],
      issues: [],
      version: 0,
    }),
}));

vi.mock("@/features/shipping/services/get-free-shipping-threshold", () => ({
  getAdminFreeShippingThreshold: vi
    .fn()
    .mockResolvedValue({ threshold: null, issues: [] }),
}));

vi.mock("@/features/rich-text/services/get-payment-config", () => ({
  getPaymentConfig: vi.fn().mockResolvedValue(null),
}));

vi.mock("@/features/catalog/services/get-home-flash-sale", () => ({
  getHomeFlashSale: vi.fn().mockResolvedValue(null),
}));

vi.mock("./products/products-manager", () => ({
  ProductsManager: () => <div data-testid="products-manager" />,
}));

vi.mock("./products/kits-manager", () => ({
  KitsManager: () => <div data-testid="kits-manager" />,
}));

vi.mock("./assets/product-benefits/product-benefits-section", () => ({
  ProductBenefitsSection: () => <div data-testid="product-benefits-section" />,
}));

import { ProductsContent } from "./products-content";

describe("ProductsContent", () => {
  it("mostra os benefícios do produto como aba de Produtos, sem rota própria", async () => {
    render(await ProductsContent({ searchParams: { tab: "benefits" } }));

    expect(screen.getByTestId("product-benefits-section")).toBeInTheDocument();
  });

  it("mantém a aba padrão em produtos", async () => {
    render(await ProductsContent({}));

    expect(screen.getByTestId("products-manager")).toBeInTheDocument();
    expect(
      screen.queryByTestId("product-benefits-section"),
    ).not.toBeInTheDocument();
  });
});
