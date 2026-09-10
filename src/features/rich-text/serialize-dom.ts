import { getTokenDefinition } from "./tokens/registry";
import { RICH_TEXT_MAX_NODES, type RichTextDocument, type RichTextNode } from "./types";

export const TOKEN_ATTRIBUTE = "data-rich-token";
export const TOKEN_PARAMS_ATTRIBUTE = "data-rich-token-params";

const BOLD_TAGS = new Set(["B", "STRONG"]);
const ITALIC_TAGS = new Set(["I", "EM"]);
const BLOCK_TAGS = new Set(["DIV", "P"]);
const DROPPED_TAGS = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "TEMPLATE", "IFRAME", "OBJECT"]);

export type SerializeDomOptions = {
  /** `<br>` e limites de bloco viram `"\n"`. Com `false` são descartados, como na faixa promocional. */
  allowBreaks: boolean;
  /** Chips de token conhecidos sobrevivem. Com `false` o chip é reduzido a nada. */
  allowTokens: boolean;
  maxNodes?: number;
};

function parseParams(raw: string | null): Record<string, string> | undefined {
  if (!raw) return undefined;

  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return undefined;

    const entries = Object.entries(parsed).filter(
      (entry): entry is [string, string | number] =>
        typeof entry[1] === "string" || typeof entry[1] === "number",
    );

    return entries.length > 0
      ? Object.fromEntries(entries.map(([key, value]) => [key, String(value)]))
      : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Lê o DOM de um editor `contentEditable` e devolve o modelo de nós.
 *
 * Esta é a fronteira de sanitização do lado do editor, compartilhada pela faixa promocional e pelo
 * compositor do chamado: só texto, negrito, itálico e chips de token conhecidos sobrevivem.
 * Qualquer outro elemento — inclusive HTML colado de fora — é atravessado e reduzido ao seu texto,
 * então markup nunca entra no documento persistido.
 *
 * A marcação de quebra de linha em `contentEditable` é dependente de navegador: `execCommand`
 * produz `<br>` e a digitação normal produz um bloco por linha. `allowBreaks` trata as duas.
 */
export function serializeRichTextDom(
  root: HTMLElement,
  { allowBreaks, allowTokens, maxNodes = RICH_TEXT_MAX_NODES }: SerializeDomOptions,
): RichTextDocument {
  const nodes: RichTextNode[] = [];

  function pushBreak() {
    if (allowBreaks) {
      nodes.push({ type: "text", text: "\n" });
    }
  }

  function walk(node: Node, bold: boolean, italic: boolean) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent ?? "";
      if (text !== "") {
        nodes.push({
          type: "text",
          text,
          ...(bold ? { bold: true } : {}),
          ...(italic ? { italic: true } : {}),
        });
      }
      return;
    }

    if (node.nodeType !== Node.ELEMENT_NODE) {
      return;
    }

    const element = node as HTMLElement;
    const token = allowTokens ? element.getAttribute(TOKEN_ATTRIBUTE) : null;

    if (token) {
      if (!getTokenDefinition(token)) {
        return;
      }

      const params = parseParams(element.getAttribute(TOKEN_PARAMS_ATTRIBUTE));
      nodes.push({
        type: "token",
        token,
        ...(params ? { params } : {}),
        ...(bold ? { bold: true } : {}),
        ...(italic ? { italic: true } : {}),
      });
      return;
    }

    if (element.tagName === "BR") {
      pushBreak();
      return;
    }

    if (DROPPED_TAGS.has(element.tagName)) {
      return;
    }

    if (BLOCK_TAGS.has(element.tagName) && element.previousSibling !== null) {
      pushBreak();
    }

    const nextBold = bold || BOLD_TAGS.has(element.tagName) || element.style.fontWeight === "bold";
    const nextItalic = italic || ITALIC_TAGS.has(element.tagName) || element.style.fontStyle === "italic";

    element.childNodes.forEach((child) => walk(child, nextBold, nextItalic));
  }

  root.childNodes.forEach((child) => walk(child, false, false));

  const merged = nodes.reduce<RichTextDocument>((accumulator, node) => {
    const previous = accumulator[accumulator.length - 1];

    if (
      previous &&
      previous.type === "text" &&
      node.type === "text" &&
      previous.bold === node.bold &&
      previous.italic === node.italic
    ) {
      previous.text += node.text;
      return accumulator;
    }

    accumulator.push(node);
    return accumulator;
  }, []);

  return merged.slice(0, maxNodes);
}
