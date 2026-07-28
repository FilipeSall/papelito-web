import { describe, expect, it } from "vitest";

import { mapWpProductToDetailItem } from "./wp-catalog";

function buildProduct(description: string) {
  return {
    id: "gid://1",
    databaseId: 1,
    name: "Seda Tradicional Mini Size",
    slug: "seda-tradicional-mini-size",
    description,
  };
}

function describeOf(description: string) {
  return mapWpProductToDetailItem(buildProduct(description), []).description;
}

describe("mapWpProductToDetailItem — descrição", () => {
  it("preserva a fronteira entre paragrafos vindos do WooCommerce", () => {
    const result = describeOf(
      "<p>A amarelinha mais queridinha do Brasil</p><p>Nosso Campeao de vendas.</p>",
    );

    expect(result.split("\n\n")).toEqual([
      "A amarelinha mais queridinha do Brasil",
      "Nosso Campeao de vendas.",
    ]);
  });

  it("não emenda título de bloco com o paragrafo seguinte", () => {
    const result = describeOf("<p>o papel branqueado</p><h3>Ficha Técnica</h3><p>Mini Size</p>");

    expect(result.split("\n\n")).toEqual(["o papel branqueado", "Ficha Técnica", "Mini Size"]);
  });

  it("mantem <br> como quebra simples dentro do mesmo paragrafo", () => {
    expect(describeOf("<p>linha um<br />linha dois</p>")).toBe("linha um\nlinha dois");
  });

  it("colapsa espaco horizontal redundante sem criar paragrafo novo", () => {
    expect(describeOf("<p>muito    espaco     aqui</p>")).toBe("muito espaco aqui");
  });

  it("normaliza sequencias longas de quebras em uma única fronteira", () => {
    expect(describeOf("<p>um</p><p></p><p></p><p>dois</p>")).toBe("um\n\ndois");
  });

  it("decodifica entidades HTML", () => {
    expect(describeOf("<p>papel &amp; seda</p>")).toBe("papel & seda");
  });

  it("usa o fallback quando não ha descrição", () => {
    expect(describeOf("")).toBe(
      "Seda Tradicional Mini Size com qualidade premium para o seu dia a dia.",
    );
  });
});
