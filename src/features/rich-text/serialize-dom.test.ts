import { describe, expect, it } from "vitest";

import { serializeRichTextDom } from "./serialize-dom";

const CHAT = { allowBreaks: true, allowTokens: false, maxNodes: 200 } as const;
const BAND = { allowBreaks: false, allowTokens: true, maxNodes: 40 } as const;

function editorWith(html: string) {
  const root = document.createElement("div");
  root.innerHTML = html;
  return root;
}

describe("serializeRichTextDom", () => {
  it("preserva negrito e itálico no modo chat", () => {
    expect(
      serializeRichTextDom(editorWith("um <strong>dois</strong> <em>três</em>"), CHAT),
    ).toEqual([
      { type: "text", text: "um " },
      { type: "text", text: "dois", bold: true },
      { type: "text", text: " " },
      { type: "text", text: "três", italic: true },
    ]);
  });

  it("converte <br> em quebra de linha quando allowBreaks", () => {
    expect(serializeRichTextDom(editorWith("linha 1<br>linha 2"), CHAT)).toEqual([
      { type: "text", text: "linha 1\nlinha 2" },
    ]);
  });

  it("converte bloco por linha em quebra de linha, sem quebra antes do primeiro", () => {
    expect(
      serializeRichTextDom(editorWith("<div>linha 1</div><div>linha 2</div>"), CHAT),
    ).toEqual([{ type: "text", text: "linha 1\nlinha 2" }]);
  });

  it("descarta <br> e limites de bloco quando allowBreaks é false", () => {
    expect(serializeRichTextDom(editorWith("linha 1<br>linha 2"), BAND)).toEqual([
      { type: "text", text: "linha 1linha 2" },
    ]);
    expect(serializeRichTextDom(editorWith("<div>a</div><div>b</div>"), BAND)).toEqual([
      { type: "text", text: "ab" },
    ]);
  });

  it("reduz chip de token a nada quando allowTokens é false", () => {
    const root = editorWith(
      'a<span data-rich-token="produto.nome" data-rich-token-params=\'{"productId":"1"}\'>Chip</span>b',
    );

    expect(serializeRichTextDom(root, CHAT)).toEqual([{ type: "text", text: "aChipb" }]);
  });

  it("reduz script, iframe e href javascript a texto inerte", () => {
    const root = editorWith(
      '<div><a href="javascript:alert(1)">clique</a></div><script>alert(1)</script><iframe src="x"></iframe>',
    );

    expect(serializeRichTextDom(root, CHAT)).toEqual([{ type: "text", text: "clique" }]);
  });

  it("não deixa atributo de evento virar conteúdo", () => {
    expect(
      serializeRichTextDom(editorWith('<img src="x" onerror="alert(1)">seguro'), CHAT),
    ).toEqual([{ type: "text", text: "seguro" }]);
  });

  it("respeita maxNodes", () => {
    const html = Array.from({ length: 6 }, (_, index) =>
      index % 2 === 0 ? `<span>${index}</span>` : `<strong>${index}</strong>`,
    ).join("");

    expect(serializeRichTextDom(editorWith(html), { ...CHAT, maxNodes: 3 })).toHaveLength(3);
  });
});
