import { describe, expect, it } from "vitest";

import {
  ASSETS_PAGES,
  ASSETS_PATH,
  assetsHref,
  assetsPageDefinition,
  parseAssetsPage,
} from "./assets-config";

describe("assets-config", () => {
  it("cai na Home quando a URL não traz uma página válida", () => {
    expect(parseAssetsPage(undefined)).toBe("home");
    expect(parseAssetsPage("")).toBe("home");
    expect(parseAssetsPage("contato")).toBe("home");
  });

  it("aceita as páginas registradas", () => {
    for (const page of ASSETS_PAGES) {
      expect(parseAssetsPage(page.key)).toBe(page.key);
    }
  });

  it("omite a página padrão da querystring", () => {
    expect(assetsHref("home")).toBe(ASSETS_PATH);
    expect(assetsHref("sobre")).toBe(`${ASSETS_PATH}?pagina=sobre`);
  });

  it("descreve cada página com rota pública e ícone", () => {
    for (const page of ASSETS_PAGES) {
      const definition = assetsPageDefinition(page.key);
      expect(definition.label).not.toBe("");
      expect(definition.description).not.toBe("");
      expect(definition.publicHref.startsWith("/")).toBe(true);
      expect(definition.icon).toBeTypeOf("object");
    }
  });
});
