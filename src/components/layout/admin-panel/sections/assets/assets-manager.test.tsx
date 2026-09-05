import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { EMPTY_RICH_TEXT_CONTEXT } from "@/features/rich-text";
import { SITE_LOGO_DEFAULTS } from "@/lib/site-logos";
import type {
  HeroBanner,
  HomeFeatureItem,
  PromoMarqueeItem,
  SiteImageAssets,
} from "@/types/home-assets";

vi.mock("@/lib/client/admin-media-cleanup", () => ({
  deleteTemporaryAdminMedia: vi.fn().mockResolvedValue(undefined),
}));

import { AssetsManager } from "./assets-manager";

const heroBanners: HeroBanner[] = [
  {
    alt: "Banner de piteiras",
    desktopImageId: 11,
    desktopImageUrl: "/hero-desktop.png",
    href: "",
    id: "hero-1",
    isActive: true,
    mobileImageId: 12,
    mobileImageUrl: "/hero-mobile.png",
    order: 1,
  },
];

const messages: PromoMarqueeItem[] = [1, 2, 3].map((position) => ({
  content: null,
  id: `msg-${position}`,
  isActive: true,
  order: position,
  text: `Aviso ${position}`,
}));

const features: HomeFeatureItem[] = [
  ["one", "Frete Grátis", "Com cupom", "/images/icons/truck.svg"],
  ["two", "Troca Fácil", "15 dias para troca", "/images/icons/refresh.svg"],
  ["three", "Parcelamos", "Em 3x sem juros", "/images/icons/price.svg"],
  ["four", "Envio Rápido", "Sai no mesmo dia", "/images/icons/thunder.svg"],
].map(([id, title, subtitle, iconUrl]) => ({
  iconId: 0,
  iconUrl,
  id,
  subtitle,
  subtitleContent: null,
  title,
}));

function image(name: string) {
  return { alt: `Alt de ${name}`, imageId: 1, imageUrl: `/${name}.png` };
}

const siteImages: SiteImageAssets = {
  aboutHero: image("about-hero"),
  aboutStory: image("about-story"),
  productHero: image("product-hero"),
  revendedorBusinessMain: image("revendedor-main"),
  revendedorBusinessSecondary: image("revendedor-secondary"),
};

function renderManager(initialPage: Parameters<typeof AssetsManager>[0]["initialPage"] = "home") {
  return render(
    <AssetsManager
      initialFeaturesSnapshot={{ issues: [], items: features }}
      initialHeroSnapshot={{ banners: heroBanners, issues: [] }}
      initialLogosSnapshot={{ issues: [], logos: SITE_LOGO_DEFAULTS }}
      initialPage={initialPage}
      initialPartnerSnapshot={{
        banner: {
          alt: "Parceiros",
          ctaLabel: "Quero ser um parceiro",
          description: "Copy",
          desktopImageId: 5,
          desktopImageUrl: "/partner-desktop.png",
          href: "/revendedor",
          isActive: true,
          mobileImageId: 6,
          mobileImageUrl: "/partner-mobile.png",
          tag: "Seja um parceiro",
        },
        issues: [],
      }}
      initialPromoMarqueeSnapshot={{ issues: [], messages }}
      initialSiteImagesSnapshot={{ images: siteImages, issues: [] }}
      richTextContext={EMPTY_RICH_TEXT_CONTEXT}
    />,
  );
}

describe("AssetsManager", () => {
  beforeEach(() => {
    window.history.replaceState(null, "", "/admin/assets");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("abre na página pedida pela URL e agrupa os assets dela", () => {
    renderManager("sobre");

    expect(screen.getByRole("tab", { name: /sobre/i })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText(/imagens da página · 2 assets/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /editar banner da página sobre/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /editar imagem de produtos/i }),
    ).not.toBeInTheDocument();
  });

  it("separa a Home em blocos e não mistura assets de outra página", () => {
    renderManager("home");

    expect(screen.getByText(/hero section · 1 opção/i)).toBeInTheDocument();
    expect(screen.getByText(/faixa de avisos · 3 mensagens/i)).toBeInTheDocument();
    expect(screen.getByText(/benefícios da home · 4 itens/i)).toBeInTheDocument();
    expect(screen.getByText(/pdv perfeito · 1 bloco/i)).toBeInTheDocument();
    expect(screen.queryByText(/imagens da página/i)).not.toBeInTheDocument();
  });

  it("mostra o catálogo comercial só em Revendedor", () => {
    renderManager("revendedor");

    expect(screen.getByText(/catálogo comercial · 1 arquivo/i)).toBeInTheDocument();
    expect(screen.getByText(/imagens da página · 2 assets/i)).toBeInTheDocument();
  });

  it("grava a página escolhida na URL sem recarregar", async () => {
    const user = userEvent.setup();
    renderManager("home");

    await user.click(screen.getByRole("tab", { name: /produtos/i }));

    expect(window.location.pathname + window.location.search).toBe(
      "/admin/assets?pagina=produtos",
    );

    await user.click(screen.getByRole("tab", { name: /^home/i }));
    expect(window.location.pathname + window.location.search).toBe("/admin/assets");
  });

  it("percorre o fluxo: escolher página, editar asset, confirmar e trocar de página", async () => {
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body)) as { images: SiteImageAssets };
      return {
        json: async () => ({ images: body.images, issues: [] }),
        ok: true,
      } as unknown as Response;
    });
    vi.stubGlobal("fetch", fetchMock);

    const user = userEvent.setup();
    renderManager("sobre");

    await user.click(screen.getByRole("button", { name: /editar banner da página sobre/i }));

    const dialog = screen.getByRole("dialog");
    await user.type(within(dialog).getByLabelText(/texto alternativo/i), "!");
    await user.click(within(dialog).getByRole("button", { name: /cancelar/i }));

    expect(screen.getByText(/alterações ainda não publicadas em sobre/i)).toBeInTheDocument();
    expect(screen.getAllByText(/não salvo/i).length).toBeGreaterThan(0);

    await user.click(screen.getByRole("tab", { name: /produtos/i }));
    await user.click(screen.getByRole("tab", { name: /sobre/i }));

    expect(screen.getByText(/alterações ainda não publicadas em sobre/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /salvar imagens do site/i }));

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/admin/assets/site-images");
    expect(init?.method).toBe("PUT");
    expect(JSON.parse(String(init?.body)).images.aboutHero.alt).toBe("Alt de about-hero!");

    expect(await screen.findByText(/imagens do site atualizadas/i)).toBeInTheDocument();
    expect(screen.queryByText(/alterações ainda não publicadas/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/não salvo/i)).not.toBeInTheDocument();
  });

  it("mantém o erro do salvamento junto do bloco que falhou", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          ({
            json: async () => ({ message: "Imagem aboutHero precisa ter arquivo e alt." }),
            ok: false,
          }) as unknown as Response,
      ),
    );

    const user = userEvent.setup();
    renderManager("sobre");

    await user.click(screen.getByRole("button", { name: /editar banner da página sobre/i }));
    const dialog = screen.getByRole("dialog");
    await user.type(within(dialog).getByLabelText(/texto alternativo/i), "!");
    await user.click(within(dialog).getByRole("button", { name: /salvar imagens do site/i }));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(
      await within(screen.getByRole("dialog")).findByText(
        /imagem abouthero precisa ter arquivo e alt/i,
      ),
    ).toBeInTheDocument();
  });
});
