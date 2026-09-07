import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const taxonomyClient = vi.hoisted(() => ({
  getPapelitoTaxonomy: vi.fn(),
}));

const contactConfigClient = vi.hoisted(() => ({
  getContactConfig: vi.fn(),
}));

vi.mock("@/features/catalog/services/get-papelito-categories", () => taxonomyClient);
vi.mock("@/features/site-contact/services/contact-config", () => contactConfigClient);

import { DEFAULT_SOCIAL_PROFILES } from "@/features/site-contact/social-profiles";

import { PublicFooter } from "./public-footer";

describe("PublicFooter", () => {
  beforeEach(() => {
    taxonomyClient.getPapelitoTaxonomy.mockResolvedValue({
      available: true,
      categories: [
        { name: "Sedas", slug: "sedas" },
        { name: "Bituqueiras", slug: "bituqueiras" },
      ],
      version: 1,
    });
    contactConfigClient.getContactConfig.mockResolvedValue({
      phone: "+556198364920",
      social: { ...DEFAULT_SOCIAL_PROFILES },
    });
  });

  it("lista as categorias fornecidas pela taxonomia Papelito", async () => {
    render(await PublicFooter({}));

    expect(screen.getByRole("link", { name: "Sedas" })).toHaveAttribute(
      "href",
      "/produtos?tipo=sedas",
    );
    expect(screen.getByRole("link", { name: "Bituqueiras" })).toHaveAttribute(
      "href",
      "/produtos?tipo=bituqueiras",
    );
  });

  it("aponta os ícones sociais para os links configurados no admin", async () => {
    contactConfigClient.getContactConfig.mockResolvedValue({
      phone: "+556198364920",
      social: { ...DEFAULT_SOCIAL_PROFILES, instagram: "https://www.instagram.com/outra/" },
    });

    render(await PublicFooter({}));

    expect(screen.getByRole("link", { name: "Instagram" })).toHaveAttribute(
      "href",
      "https://www.instagram.com/outra/",
    );
    expect(screen.getByRole("link", { name: "X" })).toHaveAttribute(
      "href",
      DEFAULT_SOCIAL_PROFILES.x,
    );
  });

  it("omite a rede social que o admin deixou em branco", async () => {
    contactConfigClient.getContactConfig.mockResolvedValue({
      phone: "+556198364920",
      social: { ...DEFAULT_SOCIAL_PROFILES, tiktok: "" },
    });

    render(await PublicFooter({}));

    expect(screen.queryByRole("link", { name: "TikTok" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "YouTube" })).toBeInTheDocument();
  });
});
