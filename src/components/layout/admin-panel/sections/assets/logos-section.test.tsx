import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { SITE_LOGO_DEFAULTS } from "@/lib/site-logos";
import type { AdminHeroBannersSnapshot, AdminPartnerBannerSnapshot } from "@/types/home-assets";

import { AssetsManager } from "./assets-manager";

const heroSnapshot: AdminHeroBannersSnapshot = {
  banners: [
    {
      id: "hero-1",
      desktopImageId: 0,
      desktopImageUrl: "/images/hero-section/desktop.png",
      mobileImageId: 0,
      mobileImageUrl: "/images/hero-section/mobile.png",
      alt: "Banner",
      href: "",
      order: 1,
      isActive: true,
    },
  ],
  issues: [],
};

const partnerSnapshot: AdminPartnerBannerSnapshot = {
  banner: {
    tag: "Seja um parceiro",
    description: "Descrição",
    ctaLabel: "Quero ser um parceiro",
    href: "/revendedor",
    desktopImageId: 0,
    desktopImageUrl: "/images/CT1A3510%201.png",
    mobileImageId: 0,
    mobileImageUrl: "/images/pdv-mobile.jpg",
    alt: "Parceiros",
    isActive: true,
  },
  issues: [],
};

const siteImagesSnapshot = {
  images: {
    productHero: { imageId: 0, imageUrl: "/images/Rectangle21.png", alt: "Produtos" },
    aboutHero: { imageId: 0, imageUrl: "/images/sobre-page/sobre-banner.png", alt: "Sobre" },
    aboutStory: { imageId: 0, imageUrl: "/images/sobre-page/fabrica-papelito.jpg", alt: "História" },
    revendedorBusinessMain: { imageId: 0, imageUrl: "/images/revendedor/business-main.jpg", alt: "Main" },
    revendedorBusinessSecondary: {
      imageId: 0,
      imageUrl: "/images/revendedor/business-secondary.jpg",
      alt: "Secondary",
    },
    revendedorBusinessIllustration: {
      imageId: 0,
      imageUrl: "/images/revendedor/business-card-vector.svg",
      alt: "Ilustração",
    },
  },
  issues: [],
};

const CUSTOM_LOGO_URL = "http://localhost:8080/wp-content/uploads/2026/07/nova-logo.svg";

function renderManager(customPrivateLogo = false) {
  return render(
    <AssetsManager
      initialHeroSnapshot={heroSnapshot}
      initialLogosSnapshot={{
        logos: {
          ...SITE_LOGO_DEFAULTS,
          ...(customPrivateLogo
            ? {
                privateHeader: {
                  imageId: 501,
                  imageUrl: CUSTOM_LOGO_URL,
                  alt: "Marketplace Papelito",
                },
              }
            : {}),
        },
        issues: [],
      }}
      initialPartnerSnapshot={partnerSnapshot}
      initialSiteImagesSnapshot={siteImagesSnapshot}
    />,
  );
}

async function openLogosSection(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: /expandir logos do site/i }));
}

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("AssetsManager - seção de logos", () => {
  it("renders one card per managed logo with its own upload control", async () => {
    const user = userEvent.setup();
    renderManager();
    await openLogosSection(user);

    expect(screen.getByRole("heading", { name: "Logo das rotas públicas" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Logo das rotas privadas" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Logo do rodapé" })).toBeInTheDocument();
    expect(screen.getAllByText("Usando a logo padrão do projeto.")).toHaveLength(3);
  });

  it("falls back to the default logo of each area", async () => {
    const user = userEvent.setup();
    renderManager();
    await openLogosSection(user);

    expect(screen.getByAltText("Logo das rotas privadas")).toHaveAttribute(
      "src",
      "/images/marketplacelogo.svg",
    );
    expect(screen.getByAltText("Logo das rotas públicas")).toHaveAttribute(
      "src",
      "/images/logo.svg",
    );
    expect(screen.getByAltText("Logo do rodapé")).toHaveAttribute("src", "/images/logo3.svg");
  });

  it("uploads a logo and shows the new preview", async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ media: { alt: "", id: 501, src: CUSTOM_LOGO_URL } }),
    });

    renderManager();
    await openLogosSection(user);

    const input = screen.getByLabelText("Enviar Logo das rotas privadas") as HTMLInputElement;

    expect(input.accept).toBe("image/svg+xml,image/png,image/webp");

    await user.upload(input, new File(["<svg />"], "nova-logo.svg", { type: "image/svg+xml" }));

    await waitFor(() => {
      expect(screen.getByAltText("Logo das rotas privadas")).toHaveAttribute(
        "src",
        expect.stringContaining("nova-logo.svg"),
      );
    });

    expect(fetchMock).toHaveBeenCalledWith("/api/admin/assets/media", expect.objectContaining({ method: "POST" }));
    expect(screen.getByRole("status")).toHaveTextContent(/logo enviada com sucesso/i);
  });

  it("saves every logo in a single PUT payload", async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ logos: SITE_LOGO_DEFAULTS, issues: [] }),
    });

    renderManager();
    await openLogosSection(user);

    await user.click(screen.getByRole("button", { name: /salvar logos/i }));

    await waitFor(() => {
      expect(screen.getByRole("status")).toHaveTextContent(/logos do site atualizadas/i);
    });

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("/api/admin/assets/logos");
    expect(init.method).toBe("PUT");
    expect(JSON.parse(String(init.body))).toEqual({ logos: SITE_LOGO_DEFAULTS });
  });

  it("restores the default logo of a single key", async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ logos: SITE_LOGO_DEFAULTS, issues: [] }),
    });

    renderManager(true);
    await openLogosSection(user);

    const restoreButtons = screen.getAllByRole("button", { name: /restaurar padrão/i });
    const enabled = restoreButtons.filter((button) => !(button as HTMLButtonElement).disabled);

    expect(enabled).toHaveLength(1);

    await user.click(enabled[0]);

    await waitFor(() => {
      expect(screen.getByRole("status")).toHaveTextContent(/logo padrão restaurada/i);
    });

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("/api/admin/assets/logos?key=privateHeader");
    expect(init.method).toBe("DELETE");
  });

  it("surfaces the server message when saving fails", async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: "Logo publicHeader precisa ter arquivo e alt preenchidos." }),
    });

    renderManager();
    await openLogosSection(user);

    await user.click(screen.getByRole("button", { name: /salvar logos/i }));

    await waitFor(() => {
      expect(screen.getByRole("status")).toHaveTextContent(
        /logo publicheader precisa ter arquivo e alt preenchidos/i,
      );
    });
  });
});
