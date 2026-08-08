import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EMPTY_RICH_TEXT_CONTEXT } from "@/features/rich-text";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { SITE_LOGO_DEFAULTS } from "@/lib/site-logos";
import type {
  AdminHeroBannersSnapshot,
  AdminHomeFeaturesSnapshot,
  AdminPartnerBannerSnapshot,
  AdminPromoMarqueeSnapshot,
} from "@/types/home-assets";

vi.mock("../catalog-pdf-manager", () => ({
  CatalogPdfManager: () => <div data-testid="catalog-pdf-manager" />,
}));

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

const promoMarqueeSnapshot: AdminPromoMarqueeSnapshot = {
  messages: [
    { id: "message-1", text: "⚡ Oferta inicial", content: null, order: 1, isActive: true },
    { id: "message-2", text: "🌿 Mensagem pausada", content: null, order: 2, isActive: false },
    { id: "message-3", text: "🎁 Oferta três", content: null, order: 3, isActive: true },
    { id: "message-4", text: "🔥 Oferta quatro", content: null, order: 4, isActive: true },
  ],
  issues: [],
};

const featuresSnapshot: AdminHomeFeaturesSnapshot = {
  items: [
    { id: "frete-gratis", title: "Frete Grátis", subtitle: "Com cupom", subtitleContent: null, iconId: 0, iconUrl: "/images/icons/truck.svg" },
    { id: "troca-facil", title: "Troca Fácil", subtitle: "15 dias para troca", subtitleContent: null, iconId: 0, iconUrl: "/images/icons/refresh.svg" },
    { id: "parcelamos", title: "Parcelamos", subtitle: "Em 3x sem juros", subtitleContent: null, iconId: 0, iconUrl: "/images/icons/price.svg" },
    { id: "envio-rapido", title: "Envio Rápido", subtitle: "Sai no mesmo dia", subtitleContent: null, iconId: 0, iconUrl: "/images/icons/thunder.svg" },
  ],
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
      richTextContext={EMPTY_RICH_TEXT_CONTEXT}
      initialFeaturesSnapshot={featuresSnapshot}
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
      initialPromoMarqueeSnapshot={promoMarqueeSnapshot}
      initialSiteImagesSnapshot={siteImagesSnapshot}
    />,
  );
}

async function openLogosSection(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: /expandir logos do site/i }));
}

async function openPromoMarqueeSection(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: /expandir faixa de avisos e promoções/i }));
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
    expect(screen.getByTestId("catalog-pdf-manager")).toBeInTheDocument();
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
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ticket: "a".repeat(43),
          uploadUrl: "https://wordpress.test/wp-json/papelito/v1/uploads/direct",
        }),
      })
      .mockResolvedValueOnce({
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

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "/api/uploads/ticket",
      expect.objectContaining({ method: "POST" }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "https://wordpress.test/wp-json/papelito/v1/uploads/direct",
      expect.objectContaining({ method: "POST" }),
    );
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

describe("AssetsManager - faixa de avisos e promoções", () => {
  it("edits, toggles, reorders and removes messages with confirmation", async () => {
    const user = userEvent.setup();
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(true);

    renderManager();
    await openPromoMarqueeSection(user);

    const firstInput = screen.getByLabelText("Mensagem 1");
    await user.clear(firstInput);
    await user.type(firstInput, "⚡ Oferta atualizada");
    await user.click(screen.getAllByLabelText("Ativa")[0]);
    expect(screen.getByRole("alert")).toHaveTextContent(/ative mais 1 frase/i);
    expect(screen.getByRole("button", { name: /salvar faixa/i })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Descer mensagem 1" }));

    expect(screen.getAllByText("⚡ Oferta atualizada").length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: "Subir mensagem 2" })).toBeEnabled();

    await user.click(screen.getAllByRole("button", { name: "Remover" })[1]);

    expect(confirm).toHaveBeenCalledWith("Remover esta mensagem da faixa?");
    expect(screen.queryAllByText("⚡ Oferta atualizada")).toHaveLength(0);
    confirm.mockRestore();
  }, 15000);

  it("adds a message and saves the complete collection once", async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ messages: promoMarqueeSnapshot.messages, issues: [] }),
    });

    renderManager();
    await openPromoMarqueeSection(user);
    await user.click(screen.getByRole("button", { name: /nova mensagem/i }));

    const newInput = screen.getByLabelText("Mensagem 5");
    await user.type(newInput, "🎁 Nova mensagem");
    await user.click(screen.getByRole("button", { name: /salvar faixa/i }));

    await waitFor(() => {
      expect(screen.getByRole("status")).toHaveTextContent(/faixa de avisos atualizada/i);
    });

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("/api/admin/assets/promo-marquee");
    expect(init.method).toBe("PUT");
    expect(JSON.parse(String(init.body)).messages).toHaveLength(5);
  }, 15000);

  it("shows the API error and keeps the save action guarded", async () => {
    const user = userEvent.setup();
    let resolveRequest: ((value: unknown) => void) | undefined;
    fetchMock.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveRequest = resolve;
      }),
    );

    renderManager();
    await openPromoMarqueeSection(user);
    const firstInput = screen.getByLabelText("Mensagem 1");
    await user.clear(firstInput);
    await user.type(firstInput, "⚡ Oferta local");
    const saveButton = screen.getByRole("button", { name: /salvar faixa/i });
    await user.click(saveButton);
    await user.click(saveButton);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    resolveRequest?.({
      ok: false,
      json: async () => ({ message: "Falha ao salvar faixa." }),
    });

    await waitFor(() => {
      expect(screen.getByRole("status")).toHaveTextContent(/falha ao salvar faixa/i);
    });
    expect(screen.getAllByText("⚡ Oferta inicial").length).toBeGreaterThan(0);
  }, 15000);
});
