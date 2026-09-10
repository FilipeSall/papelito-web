import {
  RICH_TEXT_MAX_NODES,
  serializeRichTextDom,
  TOKEN_ATTRIBUTE,
  TOKEN_PARAMS_ATTRIBUTE,
  type RichTextDocument,
} from "@/features/rich-text";

export { TOKEN_ATTRIBUTE, TOKEN_PARAMS_ATTRIBUTE };

/**
 * Fronteira de sanitização da faixa promocional: uma linha só, então `<br>` e limites de bloco são
 * descartados em vez de virarem quebra.
 */
export function serializeEditor(root: HTMLElement): RichTextDocument {
  return serializeRichTextDom(root, {
    allowBreaks: false,
    allowTokens: true,
    maxNodes: RICH_TEXT_MAX_NODES,
  });
}
