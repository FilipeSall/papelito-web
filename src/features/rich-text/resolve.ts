import { getTokenDefinition } from "./tokens/registry";
import type { RichTextResolutionContext } from "./tokens/context";
import type { ResolvedRichTextNode, RichTextDocument } from "./types";

function mergeAdjacent(nodes: ResolvedRichTextNode[]): ResolvedRichTextNode[] {
  return nodes.reduce<ResolvedRichTextNode[]>((accumulator, node) => {
    const previous = accumulator[accumulator.length - 1];

    if (previous && previous.bold === node.bold && previous.italic === node.italic) {
      previous.text += node.text;
      return accumulator;
    }

    accumulator.push({ ...node });
    return accumulator;
  }, []);
}

/**
 * Resolve os tokens contra o estado atual do marketplace.
 *
 * Devolve `null` quando algum token do documento não pode ser honrado — produto removido,
 * campanha expirada, configuração ausente ou token desconhecido. A superfície decide o que
 * fazer com isso; nenhum placeholder técnico chega ao usuário final.
 */
export function resolveRichTextDocument(
  document: RichTextDocument,
  context: RichTextResolutionContext,
): ResolvedRichTextNode[] | null {
  const resolved: ResolvedRichTextNode[] = [];

  for (const node of document) {
    if (node.type === "text") {
      resolved.push({ text: node.text, bold: node.bold === true, italic: node.italic === true });
      continue;
    }

    const definition = getTokenDefinition(node.token);

    if (!definition) {
      return null;
    }

    const value = definition.resolve(node.params, context);

    if (value === null || value === "") {
      return null;
    }

    resolved.push({ text: value, bold: node.bold === true, italic: node.italic === true });
  }

  const merged = mergeAdjacent(resolved).filter((node) => node.text !== "");
  return merged.length > 0 ? merged : null;
}

/**
 * Projeta o documento para exibição sem passar pelo registro de tokens.
 *
 * O chat não pode usar `resolveRichTextDocument`: ela devolve `null` quando qualquer token é
 * desconhecido e exige um contexto de resolução que uma mensagem não tem por que possuir. Aqui
 * nós de token são simplesmente descartados.
 */
export function projectRichTextForDisplay(document: RichTextDocument): ResolvedRichTextNode[] {
  const resolved = document
    .filter((node) => node.type === "text")
    .map((node) => ({
      text: node.type === "text" ? node.text : "",
      bold: node.bold === true,
      italic: node.italic === true,
    }));

  return mergeAdjacent(resolved).filter((node) => node.text !== "");
}

export function resolveRichTextToPlainText(
  document: RichTextDocument,
  context: RichTextResolutionContext,
): string | null {
  const resolved = resolveRichTextDocument(document, context);
  return resolved === null ? null : resolved.map((node) => node.text).join("");
}
