import {
  RICH_TEXT_MAX_NODES,
  type RichTextDocument,
  type RichTextNode,
} from "./types";

const LEGACY_FREE_SHIPPING_PLACEHOLDER = "{minimo_frete_gratis}";
const LEGACY_FREE_SHIPPING_TOKEN = "frete_gratis.minimo";

const MAX_PARAM_KEYS = 4;
const MAX_PARAM_LENGTH = 64;

function normalizeParams(value: unknown): Record<string, string> | undefined {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return undefined;
  }

  const entries = Object.entries(value)
    .filter(
      (entry): entry is [string, string | number] =>
        typeof entry[1] === "string" || typeof entry[1] === "number",
    )
    .slice(0, MAX_PARAM_KEYS)
    .map(([key, raw]) => [key, String(raw).slice(0, MAX_PARAM_LENGTH)] as const);

  return entries.length > 0 ? Object.fromEntries(entries) : undefined;
}

function normalizeNode(value: unknown): RichTextNode | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }

  const candidate = value as Record<string, unknown>;
  const bold = candidate.bold === true;
  const italic = candidate.italic === true;

  if (candidate.type === "token") {
    if (typeof candidate.token !== "string" || candidate.token.trim() === "") {
      return null;
    }

    const params = normalizeParams(candidate.params);
    return {
      type: "token",
      token: candidate.token.trim(),
      ...(params ? { params } : {}),
      ...(bold ? { bold: true } : {}),
      ...(italic ? { italic: true } : {}),
    };
  }

  if (candidate.type === "text" && typeof candidate.text === "string") {
    return {
      type: "text",
      text: candidate.text,
      ...(bold ? { bold: true } : {}),
      ...(italic ? { italic: true } : {}),
    };
  }

  return null;
}

/**
 * Converte o texto puro legado, incluindo o placeholder de frete grátis, no modelo de nós.
 * Mantém as faixas gravadas antes do editor funcionando sem migração obrigatória.
 */
export function documentFromPlainText(text: string): RichTextDocument {
  return text
    .split(LEGACY_FREE_SHIPPING_PLACEHOLDER)
    .flatMap<RichTextNode>((chunk, index) =>
      index === 0
        ? chunk === ""
          ? []
          : [{ type: "text", text: chunk }]
        : [
            { type: "token", token: LEGACY_FREE_SHIPPING_TOKEN },
            ...(chunk === "" ? [] : [{ type: "text" as const, text: chunk }]),
          ],
    );
}

export function normalizeRichTextDocument(value: unknown): RichTextDocument | null {
  if (!Array.isArray(value)) {
    return null;
  }

  const nodes = value
    .slice(0, RICH_TEXT_MAX_NODES)
    .map(normalizeNode)
    .filter((node): node is RichTextNode => node !== null)
    .filter((node) => node.type === "token" || node.text !== "");

  return nodes.length > 0 ? nodes : null;
}

/**
 * Fonte única do conteúdo de uma faixa: usa o documento estruturado quando existe e
 * é válido, senão deriva do texto puro persistido antes do editor.
 */
export function resolveRichTextSource(
  content: unknown,
  plainText: string,
): RichTextDocument {
  return normalizeRichTextDocument(content) ?? documentFromPlainText(plainText);
}

export function documentToPlainText(document: RichTextDocument): string {
  return document.map((node) => (node.type === "text" ? node.text : "")).join("");
}
