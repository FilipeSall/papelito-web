import { beforeEach, describe, expect, it, vi } from "vitest";

const getPapelitoTaxonomy = vi.fn();
const fetchAllWpProductsResult = vi.fn();
const getKitsCatalog = vi.fn();

vi.mock("@/features/catalog/services/get-papelito-categories", () => ({
  getPapelitoTaxonomy: () => getPapelitoTaxonomy(),
}));

vi.mock("@/features/catalog/services/wp-catalog", () => ({
  fetchAllWpProductsResult: (...args: unknown[]) => fetchAllWpProductsResult(...args),
}));

vi.mock("@/features/catalog/services/get-kits-catalog", () => ({
  getKitsCatalog: () => getKitsCatalog(),
}));

import sitemap from "./sitemap";

const PRIVATE_PREFIXES = [
  "/admin",
  "/vendor",
  "/perfil",
  "/dashboard",
  "/carrinho",
  "/checkout",
  "/entrar",
  "/cadastro",
  "/convite",
  "/api/",
  "/pos-login",
  "/_verify-stepper",
];

beforeEach(() => {
  getPapelitoTaxonomy.mockResolvedValue({
    available: true,
    version: 1,
    categories: [
      { slug: "sedas", subcategories: [] },
      { slug: "piteiras", subcategories: [] },
    ],
  });
  fetchAllWpProductsResult.mockResolvedValue({
    products: [{ databaseId: 781 }, { databaseId: 795 }],
    ok: true,
    truncated: false,
  });
  getKitsCatalog.mockResolvedValue([
    { href: "/kits/combo-iniciante" },
    { href: "/kits" },
  ]);
});

describe("sitemap", () => {
  it("emite apenas URLs absolutas no domínio canônico", async () => {
    const entries = await sitemap();

    expect(entries.length).toBeGreaterThan(0);
    for (const entry of entries) {
      expect(entry.url.startsWith("https://marketplace.papelito.com/")).toBe(true);
      expect(entry.url).not.toContain("localhost");
      expect(entry.url).not.toContain("vercel.app");
    }
  });

  it("não expõe rota privada, de autenticação ou de API", async () => {
    const paths = (await sitemap()).map((entry) => new URL(entry.url).pathname);

    for (const path of paths) {
      for (const prefix of PRIVATE_PREFIXES) {
        expect(path.startsWith(prefix)).toBe(false);
      }
    }
  });

  it("inclui categorias, produtos e kits com slug", async () => {
    const paths = (await sitemap()).map((entry) => new URL(entry.url).pathname);

    expect(paths).toContain("/categorias/sedas");
    expect(paths).toContain("/categorias/piteiras");
    expect(paths).toContain("/produtos/781");
    expect(paths).toContain("/produtos/795");
    expect(paths).toContain("/kits/combo-iniciante");
  });

  it("descarta kit sem slug próprio em vez de duplicar a listagem", async () => {
    const paths = (await sitemap()).map((entry) => new URL(entry.url).pathname);

    expect(paths.filter((path) => path === "/kits")).toHaveLength(1);
  });

  it("degrada para as rotas estáticas quando o WordPress não responde", async () => {
    getPapelitoTaxonomy.mockResolvedValue({ available: false, version: 0, categories: [] });
    fetchAllWpProductsResult.mockResolvedValue({ products: [], ok: false, truncated: false });
    getKitsCatalog.mockResolvedValue([]);

    const paths = (await sitemap()).map((entry) => new URL(entry.url).pathname);

    expect(paths).toContain("/");
    expect(paths).toContain("/produtos");
    expect(paths).not.toContain("/categorias/sedas");
  });

  it("avisa no log quando a varredura do catálogo é truncada", async () => {
    fetchAllWpProductsResult.mockResolvedValue({
      products: [{ databaseId: 1 }],
      ok: true,
      truncated: true,
    });
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    await sitemap();

    expect(warn).toHaveBeenCalledWith(expect.stringContaining("incompleto"));
  });
});
