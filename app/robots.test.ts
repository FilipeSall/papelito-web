import { afterEach, describe, expect, it, vi } from "vitest";

async function loadRobots(vercelEnv?: string) {
  vi.resetModules();

  if (vercelEnv === undefined) {
    delete process.env.VERCEL_ENV;
  } else {
    process.env.VERCEL_ENV = vercelEnv;
  }

  const robotsModule = await import("./robots");

  return robotsModule.default();
}

afterEach(() => {
  delete process.env.VERCEL_ENV;
});

describe("robots", () => {
  it("libera o rastreamento em produção e aponta o sitemap", async () => {
    const result = await loadRobots("production");
    const rule = Array.isArray(result.rules) ? result.rules[0] : result.rules;

    expect(rule.allow).toBe("/");
    expect(result.sitemap).toBe("https://marketplace.papelito.com/sitemap.xml");
  });

  it("bloqueia rotas privadas e de autenticação", async () => {
    const result = await loadRobots("production");
    const rule = Array.isArray(result.rules) ? result.rules[0] : result.rules;
    const disallow = rule.disallow as string[];

    for (const path of ["/admin", "/vendor", "/perfil", "/checkout", "/carrinho", "/api/", "/entrar"]) {
      expect(disallow).toContain(path);
    }
  });

  it("bloqueia o espaço facetado de busca e preço", async () => {
    const result = await loadRobots("production");
    const rule = Array.isArray(result.rules) ? result.rules[0] : result.rules;
    const disallow = rule.disallow as string[];

    expect(disallow).toContain("/*?*busca=");
    expect(disallow).toContain("/*?*precoMin=");
    expect(disallow).toContain("/*?*view=");
  });

  it("não libera assets de renderização", async () => {
    const result = await loadRobots("production");
    const rule = Array.isArray(result.rules) ? result.rules[0] : result.rules;
    const disallow = rule.disallow as string[];

    expect(disallow.some((path) => path.startsWith("/_next"))).toBe(false);
  });

  it("fecha o preview inteiro para não competir com o domínio de produção", async () => {
    const result = await loadRobots("preview");
    const rule = Array.isArray(result.rules) ? result.rules[0] : result.rules;

    expect(rule.disallow).toBe("/");
    expect(rule.allow).toBeUndefined();
    expect(result.sitemap).toBeUndefined();
  });
});
