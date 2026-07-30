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

vi.mock("./assets/assets-manager", () => ({
  AssetsManager: () => <div data-testid="assets-manager" />,
}));

import { AssetsContent } from "./assets-content";

describe("AssetsContent", () => {
  it("loads the Home feature snapshot into Assets", async () => {
    render(await AssetsContent());

    expect(screen.getByTestId("assets-manager")).toBeInTheDocument();
  });
});
