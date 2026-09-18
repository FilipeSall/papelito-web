import { describe, expect, it } from "vitest";

import { getVendorPageTitle, isVendorNavItemActive, VENDOR_NAV_ITEMS } from "./vendor-config";

function navItem(href: string) {
  const item = VENDOR_NAV_ITEMS.find((candidate) => candidate.href === href);

  if (!item) {
    throw new Error(`Item de menu não encontrado: ${href}`);
  }

  return item;
}

describe("vendor-config — item ativo do menu", () => {
  it("marca Configurações na edição do cadastro e dos dados financeiros", () => {
    expect(isVendorNavItemActive(navItem("/vendor/configuracoes"), "/vendor/onboarding")).toBe(true);
    expect(getVendorPageTitle("/vendor/onboarding")).toBe("Configuracoes");
  });

  it("não marca nenhum outro item na edição do cadastro", () => {
    const active = VENDOR_NAV_ITEMS.filter((item) => isVendorNavItemActive(item, "/vendor/onboarding"));

    expect(active.map((item) => item.href)).toEqual(["/vendor/configuracoes"]);
  });

  it("mantém o item da própria rota e das subrotas", () => {
    expect(isVendorNavItemActive(navItem("/vendor/pedidos"), "/vendor/pedidos/42")).toBe(true);
    expect(getVendorPageTitle("/vendor/estoque")).toBe("Estoque");
    expect(getVendorPageTitle("/vendor/desconhecida")).toBe("Dashboard");
  });

  it("inclui a página de cubagem", () => {
    expect(navItem("/vendor/cubagem").label).toBe("Cubagem");
  });
});
