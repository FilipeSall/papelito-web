import { describe, expect, it } from "vitest";

import type { ProductGridItem } from "@/components/layout/products-page";

import { filterKits } from "./kits-filter";

function kit(name: string, price: number): ProductGridItem {
  return {
    id: name,
    name,
    category: "Kit",
    badge: "Kit Papelito",
    price,
    originalPrice: price,
    href: "/kits/x",
  };
}

const catalogo = [
  kit("Kit Sedas Premium", 50),
  kit("Kit Piteiras Básico", 100),
  kit("Combo Filtros", 150),
];

describe("filterKits", () => {
  it("devolve tudo sem busca", () => {
    expect(filterKits(catalogo, "")).toHaveLength(3);
  });

  it("casa a busca ignorando acento e caixa", () => {
    expect(filterKits(catalogo, "PITEIRAS BASICO").map((item) => item.name)).toEqual([
      "Kit Piteiras Básico",
    ]);
  });

  it("casa por trecho no meio do nome", () => {
    expect(filterKits(catalogo, "filtros").map((item) => item.name)).toEqual([
      "Combo Filtros",
    ]);
  });

  it("não devolve nada quando nenhum kit casa", () => {
    expect(filterKits(catalogo, "zzz")).toEqual([]);
  });
});
