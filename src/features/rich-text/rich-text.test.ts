import { describe, expect, it } from "vitest";

import { documentFromPlainText, normalizeRichTextDocument, resolveRichTextSource } from "./parse";
import { resolveRichTextDocument, resolveRichTextToPlainText } from "./resolve";
import type { RichTextResolutionContext } from "./tokens/context";
import { EMPTY_RICH_TEXT_CONTEXT } from "./tokens/context";
import type { RichTextDocument } from "./types";

const context: RichTextResolutionContext = {
  freeShippingMinimumCents: 9900,
  installments: { max: 6, minimumCents: 100 },
  promotion: { title: "Queima de Estoque", discountPercent: 15, endsAt: "2026-09-01T00:00:00" },
  promotionProducts: [
    { productId: 123, name: "Seda King Size", price: 4.9, originalPrice: 6.9, discount: 29 },
  ],
};

describe("compatibilidade com as faixas antigas", () => {
  it("trata texto puro como um único nó de texto", () => {
    expect(documentFromPlainText("⚡ COMPRE 3 LEVE 4 em Sedas")).toEqual([
      { type: "text", text: "⚡ COMPRE 3 LEVE 4 em Sedas" },
    ]);
  });

  it("converte o placeholder legado de frete grátis em token", () => {
    expect(documentFromPlainText("🔥 FRETE GRÁTIS acima de {minimo_frete_gratis}")).toEqual([
      { type: "text", text: "🔥 FRETE GRÁTIS acima de " },
      { type: "token", token: "frete_gratis.minimo" },
    ]);
  });

  it("prefere o documento estruturado quando ele existe", () => {
    const content: RichTextDocument = [{ type: "text", text: "novo", bold: true }];
    expect(resolveRichTextSource(content, "antigo")).toEqual(content);
  });

  it("cai no texto puro quando o documento é inválido", () => {
    expect(resolveRichTextSource("não é um documento", "antigo")).toEqual([
      { type: "text", text: "antigo" },
    ]);
  });
});

describe("normalização vinda da API", () => {
  it("descarta nós de tipo desconhecido e marks inventadas", () => {
    expect(
      normalizeRichTextDocument([
        { type: "image", src: "http://x/y.png" },
        { type: "text", text: "ok", bold: true, underline: true, color: "red" },
      ]),
    ).toEqual([{ type: "text", text: "ok", bold: true }]);
  });

  it("não aceita HTML como estrutura: tags viram texto literal", () => {
    const resolved = resolveRichTextDocument(
      normalizeRichTextDocument([
        { type: "text", text: "<img src=x onerror=alert(1)>" },
      ]) ?? [],
      EMPTY_RICH_TEXT_CONTEXT,
    );

    expect(resolved).toEqual([
      { text: "<img src=x onerror=alert(1)>", bold: false, italic: false },
    ]);
  });

  it("recusa token sem identificador", () => {
    expect(normalizeRichTextDocument([{ type: "token", token: "   " }])).toBeNull();
  });

  it("descarta parâmetros que não são escalares", () => {
    expect(
      normalizeRichTextDocument([
        { type: "token", token: "produto.nome", params: { productId: { nested: true } } },
      ]),
    ).toEqual([{ type: "token", token: "produto.nome" }]);
  });
});

describe("resolução dos tokens", () => {
  it("resolve parcelamento, promoção e produto com os dados atuais", () => {
    expect(
      resolveRichTextToPlainText(
        [
          { type: "text", text: "Parcele em " },
          { type: "token", token: "parcelamento.maximo" },
          { type: "text", text: "x · " },
          { type: "token", token: "promocao.nome" },
          { type: "text", text: " com " },
          { type: "token", token: "promocao.desconto" },
          { type: "text", text: "% OFF · " },
          { type: "token", token: "produto.nome", params: { productId: "123" } },
          { type: "text", text: " por " },
          { type: "token", token: "produto.preco_promocional", params: { productId: "123" } },
        ],
        context,
      ),
    ).toBe("Parcele em 6x · Queima de Estoque com 15% OFF · Seda King Size por R$ 4,90");
  });

  it("preserva bold e itálico ao redor do valor resolvido", () => {
    expect(
      resolveRichTextDocument(
        [
          { type: "text", text: "até " },
          { type: "token", token: "promocao.desconto", bold: true },
          { type: "text", text: "% OFF", bold: true },
        ],
        context,
      ),
    ).toEqual([
      { text: "até ", bold: false, italic: false },
      { text: "15% OFF", bold: true, italic: false },
    ]);
  });

  it("descarta a mensagem quando o produto some do catálogo em promoção", () => {
    expect(
      resolveRichTextDocument(
        [{ type: "token", token: "produto.nome", params: { productId: "999" } }],
        context,
      ),
    ).toBeNull();
  });

  it("descarta a mensagem quando a campanha expirou", () => {
    expect(
      resolveRichTextDocument([{ type: "token", token: "promocao.nome" }], {
        ...context,
        promotion: null,
      }),
    ).toBeNull();
  });

  it("descarta a mensagem quando a configuração deixou de existir", () => {
    expect(
      resolveRichTextDocument([{ type: "token", token: "frete_gratis.minimo" }], {
        ...context,
        freeShippingMinimumCents: null,
      }),
    ).toBeNull();
  });

  it("descarta a mensagem diante de um token que deixou de ser suportado", () => {
    expect(
      resolveRichTextDocument([{ type: "token", token: "promocao.legado_removido" }], context),
    ).toBeNull();
  });

  it("mantém texto sem token mesmo com o contexto vazio", () => {
    expect(
      resolveRichTextToPlainText(
        [{ type: "text", text: "🏆 A #1 DO BRASIL" }],
        EMPTY_RICH_TEXT_CONTEXT,
      ),
    ).toBe("🏆 A #1 DO BRASIL");
  });
});
