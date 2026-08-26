import { afterEach, describe, expect, it, vi } from "vitest";

import { buildPageMetadata, buildPrivatePageMetadata, resolveRobots } from "./metadata";

afterEach(() => {
  delete process.env.VERCEL_ENV;
  vi.resetModules();
});

describe("resolveRobots", () => {
  it("libera a página e pede prévia grande de imagem e snippet sem limite", () => {
    const robots = resolveRobots() as Record<string, unknown>;

    expect(robots.index).toBe(true);
    expect(robots["max-image-preview"]).toBe("large");
    expect(robots["max-snippet"]).toBe(-1);
    expect(robots["max-video-preview"]).toBe(-1);
  });

  it("tira do índice mas mantém follow, para os produtos linkados continuarem descobríveis", () => {
    const robots = resolveRobots(true) as Record<string, unknown>;

    expect(robots.index).toBe(false);
    expect(robots.follow).toBe(true);
  });
});

describe("buildPageMetadata", () => {
  const metadata = buildPageMetadata({
    title: "Sedas no atacado",
    description: "Sedas para revenda.",
    path: "/categorias/sedas",
  });

  it("resolve canonical absoluto no domínio de produção", () => {
    expect(metadata.alternates?.canonical).toBe(
      "https://marketplace.papelito.com/categorias/sedas",
    );
  });

  it("preenche Open Graph e Twitter Card com o perfil oficial", () => {
    const twitter = metadata.twitter as Record<string, unknown>;

    expect(metadata.openGraph?.locale).toBe("pt_BR");
    expect(metadata.openGraph?.siteName).toBe("Papelito Brasil");
    expect(twitter.card).toBe("summary_large_image");
    expect(twitter.site).toBe("@papelito_brasil");
    expect(twitter.creator).toBe("@papelito_brasil");
  });

  it("usa o ícone da marca quando a rota não tem imagem própria", () => {
    const images = metadata.openGraph?.images as Array<{ url: string }>;

    expect(images[0].url).toBe("/web-app-manifest-512x512.png");
  });
});

describe("buildPrivatePageMetadata", () => {
  it("fecha índice e follow, e não emite canonical", () => {
    const metadata = buildPrivatePageMetadata("Checkout");
    const robots = metadata.robots as Record<string, unknown>;

    expect(robots.index).toBe(false);
    expect(robots.follow).toBe(false);
    expect(metadata.alternates).toBeUndefined();
  });
});
