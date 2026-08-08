import { describe, expect, it } from "vitest";

import { serializeEditor } from "./serialize";

function editorWith(html: string) {
  const root = document.createElement("div");
  root.innerHTML = html;
  return root;
}

describe("serializeEditor", () => {
  it("preserva negrito e itálico", () => {
    expect(serializeEditor(editorWith("Só hoje <strong>15% OFF</strong> e <em>nada mais</em>"))).toEqual([
      { type: "text", text: "Só hoje " },
      { type: "text", text: "15% OFF", bold: true },
      { type: "text", text: " e " },
      { type: "text", text: "nada mais", italic: true },
    ]);
  });

  it("normaliza b/i do execCommand para o mesmo modelo", () => {
    expect(serializeEditor(editorWith("<b><i>tudo</i></b>"))).toEqual([
      { type: "text", text: "tudo", bold: true, italic: true },
    ]);
  });

  it("lê o chip de token com os parâmetros", () => {
    const root = editorWith(
      'Confira <span data-rich-token="produto.nome" data-rich-token-params=\'{"productId":"123"}\'>Chip</span>!',
    );

    expect(serializeEditor(root)).toEqual([
      { type: "text", text: "Confira " },
      { type: "token", token: "produto.nome", params: { productId: "123" } },
      { type: "text", text: "!" },
    ]);
  });

  it("descarta chip de token desconhecido", () => {
    expect(
      serializeEditor(editorWith('a<span data-rich-token="promocao.inventada">x</span>b')),
    ).toEqual([{ type: "text", text: "ab" }]);
  });

  it("reduz HTML colado ao texto, sem deixar markup entrar no modelo", () => {
    const root = editorWith(
      '<div style="color:red"><a href="javascript:alert(1)">clique</a></div><script>alert(1)</script>',
    );

    expect(serializeEditor(root)).toEqual([{ type: "text", text: "clique" }]);
  });

  it("não permite que atributos de evento virem conteúdo", () => {
    const root = editorWith('<img src="x" onerror="alert(1)">seguro');
    expect(serializeEditor(root)).toEqual([{ type: "text", text: "seguro" }]);
  });

  it("junta trechos adjacentes com a mesma formatação", () => {
    expect(serializeEditor(editorWith("<span>oi</span><span> mundo</span>"))).toEqual([
      { type: "text", text: "oi mundo" },
    ]);
  });
});
