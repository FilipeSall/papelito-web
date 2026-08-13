import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next-auth", () => ({
  getServerSession: vi.fn().mockResolvedValue({ accessToken: "admin-token" }),
}));

vi.mock("@/lib/auth", () => ({ authOptions: {} }));

vi.mock("@/lib/server/admin-home-assets", () => ({
  getAdminHeroBannersSnapshot: vi.fn().mockResolvedValue({ banners: [], issues: [] }),
  getAdminHomeFeaturesSnapshot: vi.fn().mockResolvedValue({ items: [], issues: [] }),
  getAdminPartnerBannerSnapshot: vi.fn().mockResolvedValue({ banner: {}, issues: [] }),
  getAdminPromoMarqueeSnapshot: vi.fn().mockResolvedValue({ messages: [], issues: [] }),
  getAdminSiteImageAssetsSnapshot: vi.fn().mockResolvedValue({ images: {}, issues: [] }),
  getAdminSiteLogosSnapshot: vi.fn().mockResolvedValue({ logos: {}, issues: [] }),
}));

vi.mock("@/lib/server/admin-product-benefits", () => ({
  getAdminBenefitGroupsSnapshot: vi
    .fn()
    .mockResolvedValue({ groups: [], collections: [], issues: [] }),
}));

vi.mock("@/lib/server/admin-taxonomy", () => ({
  getAdminTaxonomySnapshot: vi
    .fn()
    .mockResolvedValue({ categories: [], collections: [], issues: [], version: 0 }),
}));

vi.mock("./assets/assets-manager", () => ({
  AssetsManager: () => <div data-testid="assets-manager" />,
}));

vi.mock("./assets/product-benefits/product-benefits-section", () => ({
  ProductBenefitsSection: () => <div data-testid="product-benefits-section" />,
}));

import { AssetsContent } from "./assets-content";

describe("AssetsContent", () => {
  it("loads the Home feature snapshot into Assets", async () => {
    render(await AssetsContent());

    expect(screen.getByTestId("assets-manager")).toBeInTheDocument();
  });

  it("mostra os benefícios do produto na mesma página, sem rota própria", async () => {
    render(await AssetsContent());

    expect(screen.getByTestId("product-benefits-section")).toBeInTheDocument();
  });
});
